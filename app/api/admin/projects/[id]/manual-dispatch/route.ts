import { NextResponse } from 'next/server';
import { requireMarketplaceAdmin } from '@/services/marketplace/adminAuth';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';
import { processAutomaticRouting } from '@/services/marketplace/automaticRouting';
import {
  createProviderInvitations,
  type CreatedProviderInvitation,
  type ProviderInvitationTarget,
} from '@/services/marketplace/invitations';
import type { DeliveryChannel } from '@/types/marketplace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type QueuedInvitationRow = {
  provider_id: string | number;
  wave_number: number;
  delivery_channel: string;
  delivery_address: string | null;
  provider_snapshot: Record<string, unknown> | null;
};

function parseForce(body: unknown): boolean {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  return (body as Record<string, unknown>).force === true;
}

function withResponseUrls(
  origin: string,
  invitations: CreatedProviderInvitation[],
) {
  return invitations.map((invitation) => ({
    ...invitation,
    responseUrl: `${origin}/provider-opportunity/${invitation.responseToken}`,
  }));
}

async function refreshLatestQueuedManualWave(projectId: string): Promise<CreatedProviderInvitation[]> {
  const supabase = getSupabaseAdmin();
  const latestWaveResult = await supabase
    .from('lead_invitations')
    .select('wave_number')
    .eq('project_id', projectId)
    .eq('status', 'queued')
    .is('sent_at', null)
    .order('wave_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestWaveResult.error) {
    throw new Error(`Unable to load queued invitation wave: ${latestWaveResult.error.message}`);
  }
  if (!latestWaveResult.data) return [];

  const waveNumber = latestWaveResult.data.wave_number as number;
  const invitationResult = await supabase
    .from('lead_invitations')
    .select('provider_id, wave_number, delivery_channel, delivery_address, provider_snapshot')
    .eq('project_id', projectId)
    .eq('wave_number', waveNumber)
    .eq('status', 'queued')
    .is('sent_at', null)
    .order('created_at', { ascending: true });

  if (invitationResult.error) {
    throw new Error(`Unable to load queued invitations: ${invitationResult.error.message}`);
  }

  const rows = (invitationResult.data ?? []) as QueuedInvitationRow[];
  const targets: ProviderInvitationTarget[] = rows.map((row) => {
    const providerId = Number(row.provider_id);
    if (!Number.isInteger(providerId) || providerId < 1) {
      throw new Error(`Queued provider ${row.provider_id} does not have a numeric provider id.`);
    }

    return {
      providerId,
      deliveryChannel: row.delivery_channel as DeliveryChannel,
      deliveryAddress: row.delivery_address,
      providerSnapshot: row.provider_snapshot ?? {},
    };
  });

  if (targets.length === 0) return [];

  return createProviderInvitations({
    projectId,
    waveNumber,
    targets,
    notifyAdminDispatch: false,
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireMarketplaceAdmin(request);
    const { id: projectId } = await context.params;
    const origin = new URL(request.url).origin;

    let force = false;
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > 0) {
      force = parseForce(await request.json());
    }

    const routing = await processAutomaticRouting({ projectId, force });
    if (routing.invitations.length > 0) {
      return NextResponse.json({
        routing: {
          ...routing,
          manualDispatchReady: true,
          invitations: withResponseUrls(origin, routing.invitations),
        },
      });
    }

    if (routing.action === 'waiting_for_dispatch') {
      const refreshed = await refreshLatestQueuedManualWave(projectId);
      return NextResponse.json({
        routing: {
          ...routing,
          manualDispatchReady: refreshed.length > 0,
          invitationsQueued: refreshed.length,
          reason: refreshed.length > 0
            ? 'The automated provider wave is ready for manual WhatsApp delivery.'
            : routing.reason,
          invitations: withResponseUrls(origin, refreshed),
        },
      });
    }

    return NextResponse.json({
      routing: {
        ...routing,
        manualDispatchReady: false,
        invitations: [],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to prepare manual dispatch.';
    const unauthorised = error instanceof Error && error.name === 'UnauthorisedError';
    const configurationError = message.includes('MARKETPLACE_ADMIN_API_KEY') || message.includes('SUPABASE_');

    console.error('POST manual dispatch failed:', error);

    return NextResponse.json(
      {
        error: unauthorised
          ? 'Unauthorised.'
          : configurationError
            ? 'Marketplace service is not configured.'
            : message,
      },
      { status: unauthorised ? 401 : configurationError ? 503 : 400 },
    );
  }
}
