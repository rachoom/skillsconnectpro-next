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

function providerDisplayName(provider: {
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}): string {
  const businessName = provider.name?.trim();
  if (businessName) return businessName;
  const personalName = `${provider.first_name ?? ''} ${provider.last_name ?? ''}`.trim();
  return personalName || 'Service provider';
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

  // A declined response remains available to admin reporting and the activity
  // timeline, but it is never presented as a customer-selectable option.
  const actionableProviderResponses = providerResponses.filter(
    (response) => response.responseType !== 'declined',
  );

  const invitationCounts = invitations.reduce<Record<string, number>>((counts, invitation) => {
    counts[invitation.status] = (counts[invitation.status] ?? 0) + 1;
    return counts;
  }, {});

  let releasedProviderContact: {
    id: number;
    name: string;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
  } | null = null;

  if (matchResult.data?.contact_released_at) {
    const { data: providerData, error: providerError } = await supabase
      .from('artisans')
      .select('id, name, first_name, last_name, phone, whatsapp, email')
      .eq('id', matchResult.data.provider_id)
      .single();

    if (providerError) {
      throw new Error(`Unable to load released provider contact: ${providerError.message}`);
    }

    releasedProviderContact = {
      id: providerData.id,
      name: providerDisplayName(providerData),
      phone: providerData.phone?.trim() || null,
      whatsapp: providerData.whatsapp?.trim() || providerData.phone?.trim() || null,
      email: providerData.email?.trim() || null,
    };
  }

  return {
    project: {
      ...project,
      guestPhone: null,
      guestEmail: null,
    },
    matching: {
      invitationsSent: invitations.length,
      invitationCounts,
      validResponsesReceived: actionableProviderResponses.length,
      providersReviewing: invitations.filter((invitation) => invitation.status === 'viewed').length,
    },
    responses: actionableProviderResponses,
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
    releasedContact: releasedProviderContact
      ? {
          provider: releasedProviderContact,
        }
      : null,
    timeline,
  };
}
