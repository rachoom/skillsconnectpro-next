import { NextResponse } from 'next/server';
import { requireMarketplaceAdmin } from '@/services/marketplace/adminAuth';
import {
  createProviderInvitations,
  type ProviderInvitationTarget,
} from '@/services/marketplace/invitations';
import type { DeliveryChannel } from '@/types/marketplace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DELIVERY_CHANNELS: DeliveryChannel[] = [
  'web',
  'whatsapp',
  'sms',
  'email',
  'phone',
  'admin',
];

function parseTargets(body: unknown): { targets: ProviderInvitationTarget[]; waveNumber?: number } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Request body must be a JSON object.');
  }

  const value = body as Record<string, unknown>;
  if (!Array.isArray(value.targets) || value.targets.length === 0) {
    throw new Error('targets must be a non-empty array.');
  }

  const targets = value.targets.map((target, index): ProviderInvitationTarget => {
    if (!target || typeof target !== 'object' || Array.isArray(target)) {
      throw new Error(`targets[${index}] must be an object.`);
    }

    const item = target as Record<string, unknown>;
    if (!Number.isInteger(item.providerId) || (item.providerId as number) < 1) {
      throw new Error(`targets[${index}].providerId must be a positive integer.`);
    }

    const deliveryChannel = item.deliveryChannel ?? 'web';
    if (
      typeof deliveryChannel !== 'string' ||
      !DELIVERY_CHANNELS.includes(deliveryChannel as DeliveryChannel)
    ) {
      throw new Error(`targets[${index}].deliveryChannel is invalid.`);
    }

    if (
      item.providerSnapshot !== undefined &&
      (!item.providerSnapshot ||
        typeof item.providerSnapshot !== 'object' ||
        Array.isArray(item.providerSnapshot))
    ) {
      throw new Error(`targets[${index}].providerSnapshot must be an object.`);
    }

    return {
      providerId: item.providerId as number,
      deliveryChannel: deliveryChannel as DeliveryChannel,
      deliveryAddress: typeof item.deliveryAddress === 'string' ? item.deliveryAddress : null,
      providerSnapshot: (item.providerSnapshot as Record<string, unknown> | undefined) ?? {},
    };
  });

  const waveNumber = value.waveNumber;
  if (
    waveNumber !== undefined &&
    (!Number.isInteger(waveNumber) || (waveNumber as number) < 1)
  ) {
    throw new Error('waveNumber must be a positive integer.');
  }

  return { targets, waveNumber: waveNumber as number | undefined };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireMarketplaceAdmin(request);
    const { id: projectId } = await context.params;
    const { targets, waveNumber } = parseTargets(await request.json());

    const invitations = await createProviderInvitations({
      projectId,
      targets,
      waveNumber,
    });

    const origin = new URL(request.url).origin;

    return NextResponse.json(
      {
        invitations: invitations.map((invitation) => ({
          ...invitation,
          responseUrl: `${origin}/provider-opportunity/${invitation.responseToken}`,
        })),
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to invite providers.';
    const unauthorised = error instanceof Error && error.name === 'UnauthorisedError';
    const configurationError = message.includes('MARKETPLACE_ADMIN_API_KEY') || message.includes('SUPABASE_');

    console.error('POST project invitations failed:', error);

    return NextResponse.json(
      { error: unauthorised ? 'Unauthorised.' : configurationError ? 'Marketplace service is not configured.' : message },
      { status: unauthorised ? 401 : configurationError ? 503 : 400 },
    );
  }
}
