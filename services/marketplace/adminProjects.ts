import { getSupabaseAdmin } from '../supabaseAdmin';

// Only projects that still require provider routing belong in the active queue.
// Once a customer selects a provider, the project remains available through its
// project/customer record, but it no longer occupies the matching workspace.
const OPEN_PROJECT_STATUSES = [
  'draft',
  'assessment_complete',
  'matching',
  'responses_received',
] as const;

export interface AdminProjectSummary {
  id: string;
  title: string;
  customerDescription: string;
  category: string;
  urgency: string;
  serviceLevel: string;
  status: string;
  locationText: string;
  suburb: string | null;
  city: string | null;
  guestName: string | null;
  guestPhone: string | null;
  responseTargetAt: string | null;
  createdAt: string;
  invitationsSent: number;
  validResponsesReceived: number;
  manualDispatchPending: number;
}

export async function getOpenProjectsForAdmin(): Promise<AdminProjectSummary[]> {
  const supabase = getSupabaseAdmin();
  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select(
      'id, title, customer_description, category, urgency, service_level, status, location_text, suburb, city, guest_name, guest_phone, response_target_at, created_at',
    )
    .in('status', [...OPEN_PROJECT_STATUSES])
    .order('created_at', { ascending: false })
    .limit(100);

  if (projectError) throw new Error(`Unable to load projects: ${projectError.message}`);

  const projects = projectData ?? [];
  if (projects.length === 0) return [];

  const projectIds = projects.map((project) => project.id);
  const [invitationResult, responseResult] = await Promise.all([
    supabase
      .from('lead_invitations')
      .select('project_id, status, sent_at')
      .in('project_id', projectIds),
    supabase
      .from('provider_responses')
      .select('project_id, response_type')
      .in('project_id', projectIds),
  ]);

  if (invitationResult.error) {
    throw new Error(`Unable to load invitation counts: ${invitationResult.error.message}`);
  }
  if (responseResult.error) {
    throw new Error(`Unable to load response counts: ${responseResult.error.message}`);
  }

  const invitationCounts = new Map<string, number>();
  const manualDispatchPendingCounts = new Map<string, number>();
  for (const row of invitationResult.data ?? []) {
    invitationCounts.set(row.project_id, (invitationCounts.get(row.project_id) ?? 0) + 1);
    if (row.status === 'queued' && row.sent_at === null) {
      manualDispatchPendingCounts.set(
        row.project_id,
        (manualDispatchPendingCounts.get(row.project_id) ?? 0) + 1,
      );
    }
  }

  const responseCounts = new Map<string, number>();
  for (const row of responseResult.data ?? []) {
    if (row.response_type === 'declined') continue;
    responseCounts.set(row.project_id, (responseCounts.get(row.project_id) ?? 0) + 1);
  }

  return projects.map((project) => ({
    id: project.id,
    title: project.title,
    customerDescription: project.customer_description,
    category: project.category,
    urgency: project.urgency,
    serviceLevel: project.service_level,
    status: project.status,
    locationText: project.location_text,
    suburb: project.suburb,
    city: project.city,
    guestName: project.guest_name,
    guestPhone: project.guest_phone,
    responseTargetAt: project.response_target_at,
    createdAt: project.created_at,
    invitationsSent: invitationCounts.get(project.id) ?? 0,
    validResponsesReceived: responseCounts.get(project.id) ?? 0,
    manualDispatchPending: manualDispatchPendingCounts.get(project.id) ?? 0,
  }));
}
