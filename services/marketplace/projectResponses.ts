import { getSupabaseAdmin } from '../supabaseAdmin';
import { getProjectByAccessToken, getProjectTimeline } from './projects';

const SAFE_PROVIDER_SNAPSHOT_FIELDS = [
  'name',
  'business_name',
  'first_name',
  'last_name',
  'category',
  'location',
  'image_url',
  'verified',
  'rating',
  'review_count',
  'years_experience',
  'referral_source',
] as const;

function sanitiseProviderSnapshot(
  snapshot: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  if (!snapshot) return safe;

  for (const field of SAFE_PROVIDER_SNAPSHOT_FIELDS) {
    if (snapshot[field] !== undefined) safe[field] = snapshot[field];
  }

  return safe;
}

export async function getCustomerProjectResponseFeed(
  projectId: string,
  accessToken: string,
) {
  const project = await getProjectByAccessToken(projectId, accessToken);
  if (!project) return null;

  const supabase = getSupabaseAdmin();
  const [invitationResult, responseResult, matchResult, timeline] = await Promise.all([
    supabase
      .from('lead_invitations')
      .select(
        'id, provider_id, wave_number, status, sent_at, delivered_at, viewed_at, response_deadline, provider_snapshot, created_at',
      )
      .eq('project_id', projectId)
      .order('created_at', { ascending: true }),
    supabase
      .from('provider_responses')
      .select(
        'id, lead_invitation_id, provider_id, response_type, arrival_window_start, arrival_window_end, site_visit_fee, estimate_min, estimate_max, estimate_currency, provider_message, valid_until, created_at',
      )
      .eq('project_id', projectId)
      .order('created_at', { ascending: true }),
    supabase
      .from('project_matches')
      .select(
        'id, provider_id, provider_response_id, status, selected_at, contact_released_at, completion_reported_at, final_price, final_price_currency',
      )
      .eq('project_id', projectId)
      .maybeSingle(),
    getProjectTimeline(projectId),
  ]);

  if (invitationResult.error) {
    throw new Error(`Unable to load provider invitations: ${invitationResult.error.message}`);
  }
  if (responseResult.error) {
    throw new Error(`Unable to load provider responses: ${responseResult.error.message}`);
  }
  if (matchResult.error) {
    throw new Error(`Unable to load project match: ${matchResult.error.message}`);
  }

  const invitations = invitationResult.data ?? [];
  const responses = responseResult.data ?? [];
  const invitationById = new Map(invitations.map((invitation) => [invitation.id, invitation]));

  const providerResponses = responses.map((response) => {
    const invitation = invitationById.get(response.lead_invitation_id);

    return {
      id: response.id,
      providerId: response.provider_id,
      provider: sanitiseProviderSnapshot(invitation?.provider_snapshot),
      responseType: response.response_type,
      arrivalWindowStart: response.arrival_window_start,
      arrivalWindowEnd: response.arrival_window_end,
      siteVisitFee: response.site_visit_fee,
      estimateMin: response.estimate_min,
      estimateMax: response.estimate_max,
      estimateCurrency: response.estimate_currency,
      providerMessage: response.provider_message,
      validUntil: response.valid_until,
      createdAt: response.created_at,
    };
  });

  const invitationCounts = invitations.reduce<Record<string, number>>((counts, invitation) => {
    counts[invitation.status] = (counts[invitation.status] ?? 0) + 1;
    return counts;
  }, {});

  return {
    project: {
      ...project,
      guestPhone: null,
      guestEmail: null,
    },
    matching: {
      invitationsSent: invitations.length,
      invitationCounts,
      validResponsesReceived: providerResponses.filter(
        (response) => response.responseType !== 'declined',
      ).length,
      providersReviewing: invitations.filter((invitation) => invitation.status === 'viewed').length,
    },
    responses: providerResponses,
    match: matchResult.data
      ? {
          id: matchResult.data.id,
          providerId: matchResult.data.provider_id,
          providerResponseId: matchResult.data.provider_response_id,
          status: matchResult.data.status,
          selectedAt: matchResult.data.selected_at,
          contactReleasedAt: matchResult.data.contact_released_at,
          completionReportedAt: matchResult.data.completion_reported_at,
          finalPrice: matchResult.data.final_price,
          finalPriceCurrency: matchResult.data.final_price_currency,
        }
      : null,
    timeline,
  };
}
