import { getSupabaseAdmin } from '../supabaseAdmin';
import type { ProjectServiceLevel, ProjectUrgency } from '../../types/marketplace';
import {
  createProviderInvitations,
  type CreatedProviderInvitation,
} from './invitations';
import { getProviderCandidates } from './providerCandidates';
import {
  getInitialWaveSize,
  getMaximumResponseCount,
  shouldExpandProviderWave,
} from './routing';

type ProjectRoutingRow = {
  id: string;
  urgency: ProjectUrgency;
  service_level: ProjectServiceLevel;
  status: string;
  consent_to_share: boolean;
};

type InvitationRow = {
  id: string;
  provider_id: number;
  wave_number: number;
  status: string;
  sent_at: string | null;
  response_deadline: string | null;
};

type ProviderResponseRow = {
  response_type: string;
};

type ProjectMatchRow = {
  status: string;
  contact_released_at: string | null;
};

export type AutomaticRoutingAction =
  | 'initial_wave_queued'
  | 'expanded_wave_queued'
  | 'waiting_for_dispatch'
  | 'waiting_for_responses'
  | 'response_target_reached'
  | 'routing_closed'
  | 'consent_required'
  | 'invitation_cap_reached'
  | 'no_candidates';

export interface AutomaticRoutingResult {
  projectId: string;
  action: AutomaticRoutingAction;
  reason: string;
  waveNumber: number | null;
  invitationsQueued: number;
  totalInvitations: number;
  validResponses: number;
  targetResponses: number;
  invitationCap: number;
  nextCheckAt: string | null;
  invitations: CreatedProviderInvitation[];
}

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

const ACTIVE_INVITATION_STATUSES = new Set([
  'queued',
  'sent',
  'delivered',
  'viewed',
]);

function getInvitationCap(
  urgency: ProjectUrgency,
  serviceLevel: ProjectServiceLevel,
): number {
  if (urgency === 'emergency') {
    return serviceLevel === 'priority' || serviceLevel === 'managed' ? 12 : 10;
  }

  if (urgency === 'urgent') {
    return serviceLevel === 'free' ? 6 : 8;
  }

  if (urgency === 'large_project') {
    return serviceLevel === 'free' ? 6 : 8;
  }

  return serviceLevel === 'free' ? 5 : 7;
}

function getExpansionWaveSize(urgency: ProjectUrgency): number {
  if (urgency === 'emergency') return 3;
  if (urgency === 'urgent') return 2;
  return 2;
}

function isValidProviderResponse(responseType: string): boolean {
  return responseType !== 'declined';
}

function routingIsClosed(
  project: ProjectRoutingRow,
  match: ProjectMatchRow | null,
): boolean {
  if (ROUTING_CLOSED_PROJECT_STATUSES.has(project.status)) return true;

  return Boolean(
    match &&
      (match.contact_released_at !== null ||
        ROUTING_CLOSED_MATCH_STATUSES.has(match.status)),
  );
}

function earliestDeadline(invitations: InvitationRow[]): Date | null {
  const deadlines = invitations
    .map((invitation) => invitation.response_deadline)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((value) => Number.isFinite(value.getTime()))
    .sort((left, right) => left.getTime() - right.getTime());

  return deadlines[0] ?? null;
}

function result(input: Omit<AutomaticRoutingResult, 'invitations'> & {
  invitations?: CreatedProviderInvitation[];
}): AutomaticRoutingResult {
  return {
    ...input,
    invitations: input.invitations ?? [],
  };
}

export async function processAutomaticRouting(input: {
  projectId: string;
  force?: boolean;
}): Promise<AutomaticRoutingResult> {
  if (!input.projectId) throw new Error('projectId is required.');

  const supabase = getSupabaseAdmin();
  const [projectResult, invitationResult, responseResult, matchResult] = await Promise.all([
    supabase
      .from('projects')
      .select('id, urgency, service_level, status, consent_to_share')
      .eq('id', input.projectId)
      .single(),
    supabase
      .from('lead_invitations')
      .select('id, provider_id, wave_number, status, sent_at, response_deadline')
      .eq('project_id', input.projectId)
      .order('wave_number', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('provider_responses')
      .select('response_type')
      .eq('project_id', input.projectId),
    supabase
      .from('project_matches')
      .select('status, contact_released_at')
      .eq('project_id', input.projectId)
      .maybeSingle(),
  ]);

  if (projectResult.error) {
    throw new Error(`Unable to load routing project: ${projectResult.error.message}`);
  }
  if (!projectResult.data) throw new Error('Project not found.');
  if (invitationResult.error) {
    throw new Error(`Unable to load provider invitations: ${invitationResult.error.message}`);
  }
  if (responseResult.error) {
    throw new Error(`Unable to load provider responses: ${responseResult.error.message}`);
  }
  if (matchResult.error) {
    throw new Error(`Unable to load provider selection: ${matchResult.error.message}`);
  }

  const project = projectResult.data as ProjectRoutingRow;
  const invitations = (invitationResult.data ?? []) as InvitationRow[];
  const responses = (responseResult.data ?? []) as ProviderResponseRow[];
  const match = (matchResult.data as ProjectMatchRow | null) ?? null;
  const validResponses = responses.filter((response) =>
    isValidProviderResponse(response.response_type),
  ).length;
  const targetResponses = getMaximumResponseCount(
    project.urgency,
    project.service_level,
  );
  const invitationCap = getInvitationCap(project.urgency, project.service_level);
  const highestWaveNumber = invitations.reduce(
    (maximum, invitation) => Math.max(maximum, invitation.wave_number || 1),
    0,
  );

  const common = {
    projectId: project.id,
    waveNumber: null,
    invitationsQueued: 0,
    totalInvitations: invitations.length,
    validResponses,
    targetResponses,
    invitationCap,
    nextCheckAt: null,
  };

  if (!project.consent_to_share) {
    return result({
      ...common,
      action: 'consent_required',
      reason: 'Customer consent is required before provider routing can begin.',
    });
  }

  if (routingIsClosed(project, match)) {
    return result({
      ...common,
      action: 'routing_closed',
      reason: 'Provider routing is already closed for this project.',
    });
  }

  if (validResponses >= targetResponses) {
    return result({
      ...common,
      action: 'response_target_reached',
      reason: 'The project already has enough valid provider responses.',
    });
  }

  if (invitations.length >= invitationCap) {
    return result({
      ...common,
      action: 'invitation_cap_reached',
      reason: 'The controlled invitation cap has been reached. Admin review is required.',
    });
  }

  const latestWaveInvitations = invitations.filter(
    (invitation) => invitation.wave_number === highestWaveNumber,
  );
  const activeLatestWaveInvitations = latestWaveInvitations.filter((invitation) =>
    ACTIVE_INVITATION_STATUSES.has(invitation.status),
  );
  const dispatchedLatestWaveInvitations = activeLatestWaveInvitations.filter(
    (invitation) => invitation.sent_at !== null || invitation.status !== 'queued',
  );
  const queuedButUnsent = activeLatestWaveInvitations.filter(
    (invitation) => invitation.status === 'queued' && invitation.sent_at === null,
  );
  const outstandingDeadline = earliestDeadline(dispatchedLatestWaveInvitations);

  if (
    invitations.length > 0 &&
    queuedButUnsent.length > 0 &&
    dispatchedLatestWaveInvitations.length === 0 &&
    !input.force
  ) {
    return result({
      ...common,
      waveNumber: highestWaveNumber,
      action: 'waiting_for_dispatch',
      reason: 'The current provider wave is queued and must be dispatched before expansion.',
      nextCheckAt: earliestDeadline(queuedButUnsent)?.toISOString() ?? null,
    });
  }

  if (
    invitations.length > 0 &&
    !input.force &&
    !shouldExpandProviderWave({
      urgency: project.urgency,
      invitationsSent: dispatchedLatestWaveInvitations.length,
      validResponsesReceived: validResponses,
      maximumResponses: targetResponses,
      earliestOutstandingDeadline: outstandingDeadline,
    })
  ) {
    return result({
      ...common,
      waveNumber: highestWaveNumber,
      action: 'waiting_for_responses',
      reason: 'The current provider wave is still inside its response window.',
      nextCheckAt: outstandingDeadline?.toISOString() ?? null,
    });
  }

  const candidateResult = await getProviderCandidates(project.id);
  const availableCandidates = candidateResult.candidates.filter(
    (candidate) => !candidate.alreadyInvited,
  );

  if (availableCandidates.length === 0) {
    return result({
      ...common,
      action: 'no_candidates',
      reason: 'No additional eligible providers are available for this project.',
    });
  }

  const requestedWaveSize =
    invitations.length === 0
      ? getInitialWaveSize(project.urgency, project.service_level)
      : getExpansionWaveSize(project.urgency);
  const remainingCapacity = invitationCap - invitations.length;
  const selectedCandidates = availableCandidates.slice(
    0,
    Math.min(requestedWaveSize, remainingCapacity),
  );
  const waveNumber = highestWaveNumber + 1;

  const created = await createProviderInvitations({
    projectId: project.id,
    waveNumber,
    targets: selectedCandidates.map((candidate) => ({
      providerId: candidate.providerId,
      deliveryChannel: 'admin',
      deliveryAddress: candidate.phone,
      providerSnapshot: {
        displayName: candidate.displayName,
        category: candidate.category,
        location: candidate.location,
        phone: candidate.phone,
        imageUrl: candidate.imageUrl,
        verified: candidate.verified,
        rating: candidate.rating,
        claimed: candidate.claimed,
        availabilityStatus: candidate.availabilityStatus,
        acceptsEmergencyJobs: candidate.acceptsEmergencyJobs,
        score: candidate.score,
        scoreReasons: candidate.scoreReasons,
      },
    })),
  });

  const { error: eventError } = await supabase.from('project_status_events').insert({
    project_id: project.id,
    event_type: 'automatic_routing_wave_queued',
    actor_type: 'system',
    message: `Automatic routing queued ${created.length} provider invitation(s) in wave ${waveNumber}.`,
    event_data: {
      waveNumber,
      providerIds: created.map((invitation) => invitation.providerId),
      trigger: invitations.length === 0 ? 'project_created' : input.force ? 'admin_force' : 'response_window_elapsed',
      invitationCap,
      validResponses,
      targetResponses,
    },
  });

  if (eventError) {
    console.error('Automatic routing succeeded but timeline event failed:', eventError.message);
  }

  return result({
    ...common,
    action: invitations.length === 0 ? 'initial_wave_queued' : 'expanded_wave_queued',
    reason:
      invitations.length === 0
        ? 'The strongest eligible providers were queued for the first controlled wave.'
        : 'A further controlled provider wave was queued because more responses are needed.',
    waveNumber,
    invitationsQueued: created.length,
    totalInvitations: invitations.length + created.length,
    invitations: created,
  });
}
