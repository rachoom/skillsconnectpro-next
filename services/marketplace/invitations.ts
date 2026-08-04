import { getSupabaseAdmin } from '../supabaseAdmin';
import type { DeliveryChannel, ProjectUrgency } from '../../types/marketplace';
import { getInvitationResponseDeadline } from './routing';
import { createTokenPair } from './tokens';

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
}

type ProjectRoutingRow = {
  id: string;
  urgency: ProjectUrgency;
  status: string;
  consent_to_share: boolean;
};

type ProjectMatchRow = {
  provider_id: number;
  status: string;
  contact_released_at: string | null;
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

  const supabase = getSupabaseAdmin();
  const [projectResult, matchResult] = await Promise.all([
    supabase
      .from('projects')
      .select('id, urgency, status, consent_to_share')
      .eq('id', input.projectId)
      .single(),
    supabase
      .from('project_matches')
      .select('provider_id, status, contact_released_at')
      .eq('project_id', input.projectId)
      .maybeSingle(),
  ]);

  if (projectResult.error) {
    throw new Error(`Unable to load project: ${projectResult.error.message}`);
  }
  if (!projectResult.data) throw new Error('Project not found.');
  if (matchResult.error) {
    throw new Error(`Unable to check current provider selection: ${matchResult.error.message}`);
  }

  const project = projectResult.data as ProjectRoutingRow;
  const match = (matchResult.data as ProjectMatchRow | null) ?? null;

  if (!project.consent_to_share) {
    throw new Error('Customer consent is required before the project can be shared with providers.');
  }

  assertRoutingOpen(project, match);

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

  // Upsert deliberately supports secure link regeneration while routing is open.
  // The newly generated token replaces the previous token hash, so an older URL
  // stops working immediately. Once a provider is selected, assertRoutingOpen
  // blocks this operation and preserves the selected provider's active link.
  const { data: invitationData, error: invitationError } = await supabase
    .from('lead_invitations')
    .upsert(prepared.map((item) => item.row), { onConflict: 'project_id,provider_id' })
    .select('id, provider_id, response_deadline, delivery_channel, delivery_address');

  if (invitationError) {
    throw new Error(`Unable to create provider invitations: ${invitationError.message}`);
  }

  const invitationRows = invitationData ?? [];
  const tokenByProviderId = new Map(prepared.map((item) => [item.row.provider_id, item.token]));

  const { error: projectUpdateError } = await supabase
    .from('projects')
    .update({ status: 'matching' })
    .eq('id', input.projectId)
    .in('status', ['draft', 'assessment_complete', 'matching', 'responses_received']);

  if (projectUpdateError) {
    console.error('Invitations created but project status update failed:', projectUpdateError.message);
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

  return invitationRows.map((row) => ({
    invitationId: row.id,
    providerId: row.provider_id,
    responseToken: tokenByProviderId.get(row.provider_id) ?? '',
    responseDeadline: row.response_deadline,
    deliveryChannel: row.delivery_channel,
    deliveryAddress: row.delivery_address,
  }));
}
