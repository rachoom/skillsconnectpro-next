import { getSupabaseAdmin } from '../supabaseAdmin';
import type { DeliveryChannel, ProjectUrgency } from '../../types/marketplace';
import { getInvitationResponseDeadline } from './routing';
import { createTokenPair } from './tokens';
import { projectStatusAfterInvitation } from './invitationStatusPolicy.js';
import { dispatchProviderInvitations } from './whatsappDelivery';
import { notifyAdminManualDispatchQueued } from './adminDispatchAlerts';

export interface ProviderInvitationTarget {
  providerId: number;
  deliveryChannel?: DeliveryChannel;
  deliveryAddress?: string | null;
  providerSnapshot?: Record<string, unknown>;
}

export interface CreatedProviderInvitation {
  invitationId: string;
  providerId: number;
  responseToken: string;
  responseDeadline: string;
  deliveryChannel: DeliveryChannel;
  deliveryAddress: string | null;
  deliveryStatus: 'manual' | 'sent' | 'failed';
  externalMessageId: string | null;
  deliveryReason: string | null;
}

type ProjectRoutingRow = {
  id: string;
  urgency: ProjectUrgency;
  status: string;
  consent_to_share: boolean;
  title: string;
  category: string;
  location_text: string;
};

type ProjectMatchRow = {
  provider_id: number;
  status: string;
  contact_released_at: string | null;
};

type ExistingInvitationRow = {
  provider_id: number;
  status: string;
};

const ROUTING_CLOSED_PROJECT_STATUSES = new Set([
  'provider_selected',
  'contact_released',
  'in_progress',
  'completed',
  'cancelled',
  'unfulfilled',
]);

const ROUTING_CLOSED_MATCH_STATUSES = new Set([
  'selected',
  'contact_released',
  'accepted',
  'in_progress',
  'completed',
]);

const RESPONSE_FINAL_INVITATION_STATUSES = new Set(['accepted', 'declined']);

function assertRoutingOpen(project: ProjectRoutingRow, match: ProjectMatchRow | null): void {
  if (ROUTING_CLOSED_PROJECT_STATUSES.has(project.status)) {
    throw new Error(
      `New provider invitations are closed because this project is ${project.status.replaceAll('_', ' ')}.`,
    );
  }

  if (
    match &&
    (match.contact_released_at !== null || ROUTING_CLOSED_MATCH_STATUSES.has(match.status))
  ) {
    throw new Error('New provider invitations are closed because a provider has already been selected.');
  }
}

export async function createProviderInvitations(input: {
  projectId: string;
  targets: ProviderInvitationTarget[];
  waveNumber?: number;
  notifyAdminDispatch?: boolean;
}): Promise<CreatedProviderInvitation[]> {
  if (!input.projectId) throw new Error('projectId is required.');
  if (!Array.isArray(input.targets) || input.targets.length === 0) {
    throw new Error('At least one provider target is required.');
  }
  if (input.targets.length > 10) {
    throw new Error('A maximum of 10 providers may be invited in one wave.');
  }

  const uniqueProviderIds = new Set<number>();
  for (const target of input.targets) {
    if (!Number.isInteger(target.providerId) || target.providerId < 1) {
      throw new Error('Every provider target needs a positive integer providerId.');
    }
    if (uniqueProviderIds.has(target.providerId)) {
      throw new Error(`Provider ${target.providerId} appears more than once.`);
    }
    uniqueProviderIds.add(target.providerId);
  }

  const providerIds = [...uniqueProviderIds];
  const supabase = getSupabaseAdmin();
  const [projectResult, matchResult, existingInvitationResult] = await Promise.all([
    supabase
      .from('projects')
      .select('id, urgency, status, consent_to_share, title, category, location_text')
      .eq('id', input.projectId)
      .single(),
    supabase
      .from('project_matches')
      .select('provider_id, status, contact_released_at')
      .eq('project_id', input.projectId)
      .maybeSingle(),
    supabase
      .from('lead_invitations')
      .select('provider_id, status')
      .eq('project_id', input.projectId)
      .in('provider_id', providerIds),
  ]);

  if (projectResult.error) {
    throw new Error(`Unable to load project: ${projectResult.error.message}`);
  }
  if (!projectResult.data) throw new Error('Project not found.');
  if (matchResult.error) {
    throw new Error(`Unable to check current provider selection: ${matchResult.error.message}`);
  }
  if (existingInvitationResult.error) {
    throw new Error(`Unable to check existing invitations: ${existingInvitationResult.error.message}`);
  }

  const project = projectResult.data as ProjectRoutingRow;
  const match = (matchResult.data as ProjectMatchRow | null) ?? null;
  const existingInvitations = (existingInvitationResult.data ?? []) as ExistingInvitationRow[];

  if (!project.consent_to_share) {
    throw new Error('Customer consent is required before the project can be shared with providers.');
  }

  assertRoutingOpen(project, match);

  const finalInvitation = existingInvitations.find((invitation) =>
    RESPONSE_FINAL_INVITATION_STATUSES.has(invitation.status),
  );
  if (finalInvitation) {
    throw new Error(
      `Provider ${finalInvitation.provider_id} has already responded. Their secure link cannot be regenerated.`,
    );
  }

  const deadline = getInvitationResponseDeadline(project.urgency).toISOString();
  const waveNumber = input.waveNumber ?? 1;

  const prepared = input.targets.map((target) => {
    const tokenPair = createTokenPair();
    const deliveryChannel = target.deliveryChannel ?? 'web';

    return {
      token: tokenPair.token,
      row: {
        project_id: input.projectId,
        provider_id: target.providerId,
        wave_number: waveNumber,
        status: 'queued',
        delivery_channel: deliveryChannel,
        delivery_address: target.deliveryAddress?.trim() || null,
        sent_at: null,
        delivered_at: null,
        viewed_at: null,
        response_deadline: deadline,
        response_token_hash: tokenPair.hash,
        response_token_expires_at: deadline,
        provider_snapshot: target.providerSnapshot ?? {},
        failure_reason: null,
      },
    };
  });

  // Upsert deliberately supports secure link regeneration only while a provider
  // has not yet responded. A refreshed token replaces the previous token hash,
  // so the older URL stops working immediately. Once a response exists or a
  // provider is selected, the active provider link is preserved.
  const { data: invitationData, error: invitationError } = await supabase
    .from('lead_invitations')
    .upsert(prepared.map((item) => item.row), { onConflict: 'project_id,provider_id' })
    .select('id, provider_id, response_deadline, delivery_channel, delivery_address');

  if (invitationError) {
    throw new Error(`Unable to create provider invitations: ${invitationError.message}`);
  }

  const invitationRows = invitationData ?? [];
  const tokenByProviderId = new Map(prepared.map((item) => [item.row.provider_id, item.token]));

  const nextProjectStatus = projectStatusAfterInvitation(project.status);
  if (nextProjectStatus !== project.status) {
    const { error: projectUpdateError } = await supabase
      .from('projects')
      .update({ status: nextProjectStatus })
      .eq('id', input.projectId)
      .eq('status', project.status);

    if (projectUpdateError) {
      console.error('Invitations created but project status update failed:', projectUpdateError.message);
    }
  }

  const { error: eventError } = await supabase.from('project_status_events').insert({
    project_id: input.projectId,
    event_type: 'providers_invited',
    actor_type: 'admin',
    message: `${invitationRows.length} provider invitation(s) created or refreshed in wave ${waveNumber}.`,
    event_data: {
      waveNumber,
      providerIds: invitationRows.map((row) => row.provider_id),
      responseDeadline: deadline,
    },
  });

  if (eventError) {
    console.error('Provider invitations created but timeline event failed:', eventError.message);
  }

  const targetByProviderId = new Map(
    input.targets.map((target) => [target.providerId, target]),
  );
  const createdInvitations = invitationRows.map((row) => ({
    invitationId: row.id,
    providerId: row.provider_id,
    responseToken: tokenByProviderId.get(row.provider_id) ?? '',
    responseDeadline: row.response_deadline,
    deliveryChannel: row.delivery_channel,
    deliveryAddress: row.delivery_address,
  }));
  const deliveryResults = await dispatchProviderInvitations({
    project: {
      title: project.title,
      category: project.category,
      location: project.location_text,
    },
    invitations: createdInvitations.map((invitation) => {
      const target = targetByProviderId.get(invitation.providerId);
      const snapshot = target?.providerSnapshot ?? {};
      const providerName =
        (typeof snapshot.displayName === 'string' && snapshot.displayName.trim())
        || (typeof snapshot.name === 'string' && snapshot.name.trim())
        || 'Service provider';

      return {
        ...invitation,
        providerName,
      };
    }),
  });
  const deliveryByInvitationId = new Map(
    deliveryResults.map((delivery) => [delivery.invitationId, delivery]),
  );
  const manualInvitationCount = deliveryResults.filter((delivery) => delivery.status === 'manual').length;

  if (manualInvitationCount > 0 && input.notifyAdminDispatch !== false) {
    try {
      const alertResult = await notifyAdminManualDispatchQueued({
        projectId: input.projectId,
        projectTitle: project.title,
        manualInvitationCount,
      });

      if (alertResult.status === 'failed') {
        console.error('Admin WhatsApp dispatch alert failed:', alertResult.reason);
      }
    } catch (alertError) {
      console.error('Admin WhatsApp dispatch alert failed:', alertError);
    }
  }

  return createdInvitations.map((invitation) => {
    const delivery = deliveryByInvitationId.get(invitation.invitationId);
    return {
      ...invitation,
      deliveryStatus: delivery?.status ?? 'manual',
      externalMessageId: delivery?.externalMessageId ?? null,
      deliveryReason: delivery?.reason ?? null,
    };
  });
}
