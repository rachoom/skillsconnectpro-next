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
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select('id, urgency, status, consent_to_share')
    .eq('id', input.projectId)
    .single();

  if (projectError) throw new Error(`Unable to load project: ${projectError.message}`);
  if (!projectData) throw new Error('Project not found.');

  const project = projectData as ProjectRoutingRow;
  if (!project.consent_to_share) {
    throw new Error('Customer consent is required before the project can be shared with providers.');
  }

  if (['completed', 'cancelled', 'unfulfilled'].includes(project.status)) {
    throw new Error(`Providers cannot be invited while the project is ${project.status}.`);
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
        response_deadline: deadline,
        response_token_hash: tokenPair.hash,
        response_token_expires_at: deadline,
        provider_snapshot: target.providerSnapshot ?? {},
      },
    };
  });

  const { data: invitationData, error: invitationError } = await supabase
    .from('lead_invitations')
    .insert(prepared.map((item) => item.row))
    .select('id, provider_id, response_deadline, delivery_channel, delivery_address');

  if (invitationError) {
    throw new Error(`Unable to create provider invitations: ${invitationError.message}`);
  }

  const invitationRows = invitationData ?? [];
  const tokenByProviderId = new Map(prepared.map((item) => [item.row.provider_id, item.token]));

  const { error: projectUpdateError } = await supabase
    .from('projects')
    .update({ status: 'matching' })
    .eq('id', input.projectId);

  if (projectUpdateError) {
    console.error('Invitations created but project status update failed:', projectUpdateError.message);
  }

  const { error: eventError } = await supabase.from('project_status_events').insert({
    project_id: input.projectId,
    event_type: 'providers_invited',
    actor_type: 'admin',
    message: `${invitationRows.length} provider invitation(s) created in wave ${waveNumber}.`,
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
