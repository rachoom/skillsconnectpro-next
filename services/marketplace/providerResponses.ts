import { getSupabaseAdmin } from '../supabaseAdmin';
import type { ProviderResponseType } from '../../types/marketplace';
import { hashOpaqueToken } from './tokens';
import { isContactAccessActive } from './contactAccessPolicy.js';
import { createProjectMediaSignedUrls } from './projectMedia';
import { buildProviderLeadAccess, parseFreeLeadLimit } from './providerLeadAccessPolicy.js';

type ProviderLeadAccess = {
  freeLeadLimit: number;
  freeLeadsUsed: number;
  freeLeadsRemaining: number;
  hasPaidAccess: boolean;
  locked: boolean;
  activePlan: {
    id?: string;
    code: string;
    type: 'subscription' | 'lead_pack';
    remaining?: number;
    qualifiedLeadsUsed?: number;
    qualifiedLeadsLimit?: number;
  } | null;
};

export interface ProviderOpportunity {
  invitationId: string;
  providerId: number;
  status: string;
  responseDeadline: string | null;
  leadAccess: ProviderLeadAccess;
  project: {
    id: string;
    title: string;
    customerDescription: string;
    aiSummary: string | null;
    likelyIssue: string | null;
    category: string;
    urgency: string;
    serviceLevel: string;
    serviceArea: string;
    preferredDate: string | null;
    estimatedMin: number | null;
    estimatedMax: number | null;
    estimateCurrency: string;
    safetyNotes: string[];
    materials: unknown[];
    media: Array<{ path: string; url?: string; type: 'image'; alt?: string; createdAt?: string }>;
    professionalInspectionRequired: boolean;
    status: string;
  };
  providerSnapshot: Record<string, unknown>;
  customerContact: {
    name: string;
    phone: string;
    email: string | null;
    location: string;
    suburb: string | null;
    city: string | null;
  } | null;
}

export interface SubmitProviderResponseInput {
  responseType: ProviderResponseType;
  arrivalWindowStart?: string | null;
  arrivalWindowEnd?: string | null;
  siteVisitFee?: number | null;
  estimateMin?: number | null;
  estimateMax?: number | null;
  estimateCurrency?: string;
  providerMessage?: string | null;
  validUntil?: string | null;
}

type InvitationTokenRow = {
  id: string;
  project_id: string;
  provider_id: number;
  status: string;
  response_deadline: string | null;
  response_token_expires_at: string | null;
  provider_snapshot: Record<string, unknown> | null;
};

type SubscriptionEntitlementRow = {
  id: string;
  plan_code: string;
  status: string;
  qualified_leads_used: number;
  qualified_leads_limit: number | null;
  starts_at: string;
  ends_at: string | null;
};

function ensureTokenActive(invitation: InvitationTokenRow): void {
  if (['cancelled', 'expired', 'failed'].includes(invitation.status)) {
    throw new Error(`This opportunity is ${invitation.status}.`);
  }

  if (
    invitation.response_token_expires_at &&
    new Date(invitation.response_token_expires_at).getTime() < Date.now()
  ) {
    throw new Error('This opportunity response link has expired.');
  }
}

async function findInvitationByToken(token: string): Promise<InvitationTokenRow | null> {
  if (!token || token.length < 20) return null;

  const supabase = getSupabaseAdmin();
  const tokenHash = hashOpaqueToken(token);
  const { data, error } = await supabase
    .from('lead_invitations')
    .select('id, project_id, provider_id, status, response_deadline, response_token_expires_at, provider_snapshot')
    .eq('response_token_hash', tokenHash)
    .maybeSingle();

  if (error) throw new Error(`Unable to load provider opportunity: ${error.message}`);
  return data as InvitationTokenRow | null;
}

async function loadProviderLeadAccess(
  providerId: string | number,
  currentInvitationId: string,
): Promise<ProviderLeadAccess> {
  const supabase = getSupabaseAdmin();
  const providerSubjectId = String(providerId);
  const [{ count, error: countError }, { data: entitlementData, error: entitlementError }] = await Promise.all([
    supabase
      .from('provider_responses')
      .select('id', { count: 'exact', head: true })
      .eq('provider_id', providerSubjectId)
      .neq('response_type', 'declined'),
    supabase
      .from('subscription_entitlements')
      .select('id, plan_code, status, qualified_leads_used, qualified_leads_limit, starts_at, ends_at')
      .eq('subject_type', 'provider')
      .eq('subject_id', providerSubjectId)
      .in('status', ['trial', 'active'])
      .order('created_at', { ascending: false }),
  ]);

  if (countError) throw new Error(`Unable to check provider lead access: ${countError.message}`);
  if (entitlementError) throw new Error(`Unable to check provider plan: ${entitlementError.message}`);

  return buildProviderLeadAccess({
    usedFreeLeads: count ?? 0,
    freeLeadLimit: parseFreeLeadLimit(process.env.PROVIDER_FREE_LEAD_LIMIT),
    entitlements: (entitlementData ?? []) as SubscriptionEntitlementRow[],
  }) as ProviderLeadAccess;
}


export async function getProviderOpportunity(token: string): Promise<ProviderOpportunity | null> {
  const invitation = await findInvitationByToken(token);
  if (!invitation) return null;

  const supabase = getSupabaseAdmin();
  const { data: matchData, error: matchError } = await supabase
    .from('project_matches')
    .select('provider_id, status, contact_released_at')
    .eq('project_id', invitation.project_id)
    .maybeSingle();

  if (matchError) throw new Error(`Unable to load provider selection: ${matchError.message}`);

  const selectedAndReleased = Boolean(
    matchData?.contact_released_at && matchData.provider_id === invitation.provider_id,
  );

  // The selected provider keeps controlled access to this link after contact
  // release. Every other provider remains subject to cancellation and expiry.
  if (!selectedAndReleased) ensureTokenActive(invitation);

  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select(
      'id, status, guest_name, guest_phone, guest_email, title, customer_description, ai_summary, likely_issue, category, urgency, service_level, location_text, suburb, city, preferred_date, estimated_min, estimated_max, estimate_currency, safety_notes, materials, media, professional_inspection_required',
    )
    .eq('id', invitation.project_id)
    .single();

  if (projectError) throw new Error(`Unable to load project brief: ${projectError.message}`);
  if (!projectData) return null;

  if (!selectedAndReleased && ['queued', 'sent', 'delivered'].includes(invitation.status)) {
    const { error: viewedError } = await supabase
      .from('lead_invitations')
      .update({ status: 'viewed', viewed_at: new Date().toISOString() })
      .eq('id', invitation.id);

    if (viewedError) {
      console.error('Unable to record provider opportunity view:', viewedError.message);
    }
  }

  const serviceArea = projectData.suburb || projectData.city || projectData.location_text;
  const customerPhone = projectData.guest_phone?.trim() || '';
  const leadAccess = selectedAndReleased
    ? {
        freeLeadLimit: parseFreeLeadLimit(process.env.PROVIDER_FREE_LEAD_LIMIT),
        freeLeadsUsed: 0,
        freeLeadsRemaining: 0,
        hasPaidAccess: true,
        locked: false,
        activePlan: null,
      }
    : await loadProviderLeadAccess(invitation.provider_id, invitation.id);
  const projectUnlocked = selectedAndReleased || !leadAccess.locked;
  const media = projectUnlocked
    ? await createProjectMediaSignedUrls(Array.isArray(projectData.media) ? projectData.media : [])
    : [];

  return {
    invitationId: invitation.id,
    providerId: invitation.provider_id,
    status: selectedAndReleased ? 'contact_released' : invitation.status,
    responseDeadline: invitation.response_deadline,
    leadAccess,
    providerSnapshot: invitation.provider_snapshot ?? {},
    customerContact: selectedAndReleased && isContactAccessActive(projectData.status, matchData?.contact_released_at) && customerPhone
      ? {
          name: projectData.guest_name?.trim() || 'Customer',
          phone: customerPhone,
          email: projectData.guest_email?.trim() || null,
          location: projectData.location_text,
          suburb: projectData.suburb,
          city: projectData.city,
        }
      : null,
    project: {
      id: projectData.id,
      title: projectData.title,
      customerDescription: projectUnlocked ? projectData.customer_description : 'Choose a provider plan to unlock the full job brief and respond to this customer.',
      aiSummary: projectUnlocked ? projectData.ai_summary : null,
      likelyIssue: projectUnlocked ? projectData.likely_issue : null,
      category: projectData.category,
      urgency: projectData.urgency,
      serviceLevel: projectData.service_level,
      serviceArea,
      preferredDate: projectUnlocked ? projectData.preferred_date : null,
      estimatedMin: projectUnlocked ? projectData.estimated_min : null,
      estimatedMax: projectUnlocked ? projectData.estimated_max : null,
      estimateCurrency: projectData.estimate_currency,
      safetyNotes: projectUnlocked ? projectData.safety_notes ?? [] : [],
      materials: projectUnlocked ? projectData.materials ?? [] : [],
      media,
      professionalInspectionRequired: projectData.professional_inspection_required,
      status: projectData.status,
    },
  };
}

function assertOptionalMoney(value: number | null | undefined, field: string): void {
  if (value === undefined || value === null) return;
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a non-negative finite number.`);
  }
}

export async function submitProviderResponse(
  token: string,
  input: SubmitProviderResponseInput,
): Promise<{ responseId: string; projectId: string; invitationStatus: string }> {
  const invitation = await findInvitationByToken(token);
  if (!invitation) throw new Error('Provider opportunity not found.');
  ensureTokenActive(invitation);

  if (!input.responseType) throw new Error('responseType is required.');
  assertOptionalMoney(input.siteVisitFee, 'siteVisitFee');
  assertOptionalMoney(input.estimateMin, 'estimateMin');
  assertOptionalMoney(input.estimateMax, 'estimateMax');

  if (
    input.estimateMin !== undefined &&
    input.estimateMin !== null &&
    input.estimateMax !== undefined &&
    input.estimateMax !== null &&
    input.estimateMin > input.estimateMax
  ) {
    throw new Error('estimateMin cannot be greater than estimateMax.');
  }

  // The invitation was resolved from an opaque token above; only service_role
  // can call this RPC. The RPC rechecks project and link state under row locks
  // and atomically saves the response, invitation, event and lead usage.
  const { data, error } = await getSupabaseAdmin().rpc('submit_provider_response_billed', {
    p_invitation_id: invitation.id,
    p_response_type: input.responseType,
    p_arrival_window_start: input.arrivalWindowStart ?? null,
    p_arrival_window_end: input.arrivalWindowEnd ?? null,
    p_site_visit_fee: input.siteVisitFee ?? null,
    p_estimate_min: input.estimateMin ?? null,
    p_estimate_max: input.estimateMax ?? null,
    p_estimate_currency: input.estimateCurrency ?? 'ZAR',
    p_provider_message: input.providerMessage?.trim() || null,
    p_valid_until: input.validUntil ?? null,
  });

  if (error) {
    if (error.message.includes('PROVIDER_RESPONSE_LIMIT')) {
      throw new Error('Your response allowance is used up. Choose a provider plan or lead pack to continue.');
    }
    throw new Error(`Unable to submit your response: ${error.message}`);
  }
  if (!data?.responseId || !data.projectId) throw new Error('Provider response was not confirmed.');
  return {
    responseId: String(data.responseId),
    projectId: String(data.projectId),
    invitationStatus: String(data.invitationStatus),
  };
}
