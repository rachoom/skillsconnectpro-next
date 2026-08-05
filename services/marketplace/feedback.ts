import { getSupabaseAdmin } from '../supabaseAdmin';
import {
  isCustomerCompletionConfirmation,
  verifiedReviewEligible,
} from './completionPolicy.js';
import { getProjectByAccessToken } from './projects';

export const COMPLAINT_CATEGORIES = [
  'no_show',
  'non_completion',
  'quality',
  'communication',
  'overcharging',
  'damage',
  'safety',
  'misconduct',
  'other',
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

type FeedbackMatchRow = {
  id: string;
  provider_id: number;
  status: string;
};

type ReviewRow = {
  id: string;
  overall_rating: number;
  review_text: string | null;
  moderation_status: string;
  created_at: string;
  updated_at: string;
};

type ComplaintRow = {
  id: string;
  category: ComplaintCategory;
  severity: string;
  description: string;
  status: string;
  resolution_outcome: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

type CompletionConfirmationRow = {
  event_type: string;
  actor_type: string;
  event_data: Record<string, unknown> | null;
};

function providerDisplayName(provider: {
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
} | null): string {
  if (!provider) return 'the selected provider';
  const businessName = provider.name?.trim();
  if (businessName) return businessName;
  const personalName = `${provider.first_name ?? ''} ${provider.last_name ?? ''}`.trim();
  return personalName || 'the selected provider';
}

function mapReview(row: ReviewRow | null) {
  return row
    ? {
        id: row.id,
        overallRating: row.overall_rating,
        reviewText: row.review_text,
        moderationStatus: row.moderation_status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    : null;
}

function mapComplaint(row: ComplaintRow | null) {
  return row
    ? {
        id: row.id,
        category: row.category,
        severity: row.severity,
        description: row.description,
        status: row.status,
        resolutionOutcome: row.resolution_outcome,
        adminNotes: row.admin_notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    : null;
}

async function loadFeedbackContext(projectId: string, accessToken: string) {
  const project = await getProjectByAccessToken(projectId, accessToken);
  if (!project) throw new Error('Project not found.');

  const supabase = getSupabaseAdmin();
  const { data: matchData, error: matchError } = await supabase
    .from('project_matches')
    .select('id, provider_id, status')
    .eq('project_id', projectId)
    .maybeSingle();

  if (matchError) throw new Error(`Unable to load selected provider: ${matchError.message}`);
  const match = (matchData as FeedbackMatchRow | null) ?? null;

  let provider: {
    id: number;
    name: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null = null;

  if (match) {
    const { data: providerData, error: providerError } = await supabase
      .from('artisans')
      .select('id, name, first_name, last_name')
      .eq('id', match.provider_id)
      .maybeSingle();

    if (providerError) {
      throw new Error(`Unable to load provider: ${providerError.message}`);
    }
    provider = providerData ?? null;
  }

  return { project, match, provider };
}

async function loadCustomerCompletionConfirmation(
  projectId: string,
): Promise<CompletionConfirmationRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('project_status_events')
    .select('event_type, actor_type, event_data')
    .eq('project_id', projectId)
    .eq('event_type', 'project_completed')
    .eq('actor_type', 'customer')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Unable to verify customer completion confirmation: ${error.message}`);
  return (data as CompletionConfirmationRow | null) ?? null;
}

export async function getProjectFeedbackState(projectId: string, accessToken: string) {
  const { project, match, provider } = await loadFeedbackContext(projectId, accessToken);
  const supabase = getSupabaseAdmin();

  const [reviewResult, complaintResult, customerCompletionEvent] = await Promise.all([
    supabase
      .from('marketplace_reviews')
      .select('id, overall_rating, review_text, moderation_status, created_at, updated_at')
      .eq('project_id', projectId)
      .maybeSingle(),
    supabase
      .from('marketplace_complaints')
      .select('id, category, severity, description, status, resolution_outcome, admin_notes, created_at, updated_at')
      .eq('project_id', projectId)
      .maybeSingle(),
    loadCustomerCompletionConfirmation(projectId),
  ]);

  if (reviewResult.error) {
    throw new Error(`Unable to load project review: ${reviewResult.error.message}`);
  }
  if (complaintResult.error) {
    throw new Error(`Unable to load complaint case: ${complaintResult.error.message}`);
  }

  const review = mapReview((reviewResult.data as ReviewRow | null) ?? null);
  const complaint = mapComplaint((complaintResult.data as ComplaintRow | null) ?? null);
  const hasSelectedProvider = Boolean(match);
  const confirmedByCustomer = isCustomerCompletionConfirmation(customerCompletionEvent);
  const reviewEligible = verifiedReviewEligible({
    hasSelectedProvider,
    projectStatus: project.status,
    customerCompletionEvent,
  });
  const complaintEligible =
    hasSelectedProvider &&
    ['provider_selected', 'contact_released', 'in_progress', 'completed', 'cancelled'].includes(project.status);

  return {
    projectId,
    projectTitle: project.title,
    projectStatus: project.status,
    providerId: match?.provider_id ?? null,
    providerName: providerDisplayName(provider),
    reviewEligible,
    complaintEligible,
    completionConfirmedByCustomer: confirmedByCustomer,
    review,
    complaint,
  };
}

export async function submitProjectReview(input: {
  projectId: string;
  accessToken: string;
  overallRating: number;
  reviewText?: string | null;
}) {
  if (!Number.isInteger(input.overallRating) || input.overallRating < 1 || input.overallRating > 5) {
    throw new Error('Choose a rating from one to five stars.');
  }

  const { project, match } = await loadFeedbackContext(input.projectId, input.accessToken);
  if (!match) throw new Error('A selected provider is required before feedback can be submitted.');
  if (project.status !== 'completed') {
    throw new Error('A verified rating can only be submitted after the job is completed.');
  }

  const customerCompletionEvent = await loadCustomerCompletionConfirmation(input.projectId);
  if (
    !verifiedReviewEligible({
      hasSelectedProvider: true,
      projectStatus: project.status,
      customerCompletionEvent,
    })
  ) {
    throw new Error('Confirm the provider completion report before submitting a verified rating.');
  }

  const reviewText = input.reviewText?.trim().slice(0, 2000) || null;
  const supabase = getSupabaseAdmin();
  const { data: existingReview, error: existingError } = await supabase
    .from('marketplace_reviews')
    .select('id')
    .eq('project_id', input.projectId)
    .maybeSingle();

  if (existingError) throw new Error(`Unable to check existing feedback: ${existingError.message}`);

  const { data, error } = await supabase
    .from('marketplace_reviews')
    .upsert(
      {
        project_id: input.projectId,
        match_id: match.id,
        provider_id: match.provider_id,
        overall_rating: input.overallRating,
        review_text: reviewText,
        moderation_status: 'published',
      },
      { onConflict: 'project_id' },
    )
    .select('id, overall_rating, review_text, moderation_status, created_at, updated_at')
    .single();

  if (error) throw new Error(`Unable to save review: ${error.message}`);

  const { error: eventError } = await supabase.from('project_status_events').insert({
    project_id: input.projectId,
    event_type: existingReview ? 'customer_review_updated' : 'customer_review_submitted',
    actor_type: 'customer',
    actor_id: project.customerId,
    message: existingReview
      ? 'The customer updated their verified job review.'
      : 'The customer submitted a verified job review.',
    event_data: {
      providerId: match.provider_id,
      overallRating: input.overallRating,
    },
  });

  if (eventError) console.error('Review saved but timeline event failed:', eventError.message);
  return mapReview(data as ReviewRow);
}

function complaintSeverity(category: ComplaintCategory): 'low' | 'medium' | 'high' | 'critical' {
  if (category === 'safety' || category === 'misconduct') return 'critical';
  if (category === 'damage' || category === 'non_completion' || category === 'overcharging') return 'high';
  if (category === 'communication') return 'low';
  return 'medium';
}

export async function submitProjectComplaint(input: {
  projectId: string;
  accessToken: string;
  category: ComplaintCategory;
  description: string;
}) {
  if (!COMPLAINT_CATEGORIES.includes(input.category)) {
    throw new Error('Select a valid problem category.');
  }

  const description = input.description.trim();
  if (description.length < 10) {
    throw new Error('Please describe what happened in a little more detail.');
  }

  const { project, match } = await loadFeedbackContext(input.projectId, input.accessToken);
  if (!match) throw new Error('A selected provider is required before a problem can be reported.');
  if (!['provider_selected', 'contact_released', 'in_progress', 'completed', 'cancelled'].includes(project.status)) {
    throw new Error('A problem can be reported after a provider has been selected.');
  }

  const supabase = getSupabaseAdmin();
  const { data: existingComplaint, error: existingError } = await supabase
    .from('marketplace_complaints')
    .select('id, status')
    .eq('project_id', input.projectId)
    .maybeSingle();

  if (existingError) throw new Error(`Unable to check existing complaint: ${existingError.message}`);
  if (existingComplaint) {
    throw new Error('A support case already exists for this project.');
  }

  const { data, error } = await supabase
    .from('marketplace_complaints')
    .insert({
      project_id: input.projectId,
      match_id: match.id,
      provider_id: match.provider_id,
      category: input.category,
      severity: complaintSeverity(input.category),
      description: description.slice(0, 4000),
      status: 'open',
    })
    .select('id, category, severity, description, status, resolution_outcome, admin_notes, created_at, updated_at')
    .single();

  if (error) throw new Error(`Unable to create support case: ${error.message}`);

  const { error: eventError } = await supabase.from('project_status_events').insert({
    project_id: input.projectId,
    event_type: 'customer_complaint_submitted',
    actor_type: 'customer',
    actor_id: project.customerId,
    message: 'The customer opened a job-linked support case for administrator review.',
    event_data: {
      providerId: match.provider_id,
      complaintId: data.id,
      category: input.category,
      severity: data.severity,
    },
  });

  if (eventError) console.error('Complaint saved but timeline event failed:', eventError.message);
  return mapComplaint(data as ComplaintRow);
}
