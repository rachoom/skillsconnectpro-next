import { getSupabaseAdmin } from '../supabaseAdmin';
import type {
  CreateProjectInput,
  Project,
  ProjectMaterial,
  ProjectStatusEvent,
} from '../../types/marketplace';
import { getProjectResponseTarget } from './routing';

type ProjectRow = {
  id: string;
  customer_id: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  title: string;
  customer_description: string;
  ai_summary: string | null;
  likely_issue: string | null;
  category: string;
  urgency: Project['urgency'];
  service_level: Project['serviceLevel'];
  status: Project['status'];
  location_text: string;
  suburb: string | null;
  city: string | null;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
  preferred_date: string | null;
  response_target_at: string | null;
  estimated_min: number | null;
  estimated_max: number | null;
  estimate_currency: string;
  confidence: number | null;
  professional_inspection_required: boolean;
  safety_notes: string[];
  materials: ProjectMaterial[];
  assessment_payload: Record<string, unknown>;
  source_channel: Project['sourceChannel'];
  consent_to_share: boolean;
  created_at: string;
  updated_at: string;
};

function cleanOptionalText(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
}

function assertFiniteOptionalNumber(value: number | null | undefined, field: string): void {
  if (value === null || value === undefined) return;
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a non-negative finite number.`);
  }
}

export function validateCreateProjectInput(input: CreateProjectInput): void {
  if (!input.title?.trim()) throw new Error('Project title is required.');
  if (!input.customerDescription?.trim()) throw new Error('Project description is required.');
  if (!input.category?.trim()) throw new Error('Project category is required.');
  if (!input.locationText?.trim()) throw new Error('Project location is required.');

  if (input.confidence !== undefined && input.confidence !== null) {
    if (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1) {
      throw new Error('Confidence must be between 0 and 1.');
    }
  }

  assertFiniteOptionalNumber(input.estimatedMin, 'estimatedMin');
  assertFiniteOptionalNumber(input.estimatedMax, 'estimatedMax');

  if (
    input.estimatedMin !== undefined &&
    input.estimatedMin !== null &&
    input.estimatedMax !== undefined &&
    input.estimatedMax !== null &&
    input.estimatedMin > input.estimatedMax
  ) {
    throw new Error('estimatedMin cannot be greater than estimatedMax.');
  }
}

export function mapProjectRow(row: ProjectRow): Project {
  return {
    id: row.id,
    customerId: row.customer_id,
    guestName: row.guest_name,
    guestPhone: row.guest_phone,
    guestEmail: row.guest_email,
    title: row.title,
    customerDescription: row.customer_description,
    aiSummary: row.ai_summary,
    likelyIssue: row.likely_issue,
    category: row.category,
    urgency: row.urgency,
    serviceLevel: row.service_level,
    status: row.status,
    locationText: row.location_text,
    suburb: row.suburb,
    city: row.city,
    province: row.province,
    latitude: row.latitude,
    longitude: row.longitude,
    preferredDate: row.preferred_date,
    responseTargetAt: row.response_target_at,
    estimatedMin: row.estimated_min,
    estimatedMax: row.estimated_max,
    estimateCurrency: row.estimate_currency,
    confidence: row.confidence,
    professionalInspectionRequired: row.professional_inspection_required,
    safetyNotes: row.safety_notes ?? [],
    materials: row.materials ?? [],
    assessmentPayload: row.assessment_payload ?? {},
    sourceChannel: row.source_channel,
    consentToShare: row.consent_to_share,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  validateCreateProjectInput(input);

  const supabase = getSupabaseAdmin();
  const urgency = input.urgency ?? 'planned';
  const responseTargetAt = getProjectResponseTarget(urgency).toISOString();

  const row = {
    customer_id: input.customerId ?? null,
    guest_name: cleanOptionalText(input.guestName),
    guest_phone: cleanOptionalText(input.guestPhone),
    guest_email: cleanOptionalText(input.guestEmail),
    title: input.title.trim(),
    customer_description: input.customerDescription.trim(),
    ai_summary: cleanOptionalText(input.aiSummary),
    likely_issue: cleanOptionalText(input.likelyIssue),
    category: input.category.trim(),
    urgency,
    service_level: input.serviceLevel ?? 'free',
    status: 'assessment_complete' as const,
    location_text: input.locationText.trim(),
    suburb: cleanOptionalText(input.suburb),
    city: cleanOptionalText(input.city),
    province: cleanOptionalText(input.province),
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    preferred_date: input.preferredDate ?? null,
    response_target_at: responseTargetAt,
    estimated_min: input.estimatedMin ?? null,
    estimated_max: input.estimatedMax ?? null,
    estimate_currency: input.estimateCurrency ?? 'ZAR',
    confidence: input.confidence ?? null,
    professional_inspection_required: input.professionalInspectionRequired ?? true,
    safety_notes: input.safetyNotes ?? [],
    materials: input.materials ?? [],
    assessment_payload: input.assessmentPayload ?? {},
    source_channel: input.sourceChannel ?? 'web',
    consent_to_share: input.consentToShare ?? false,
  };

  const { data, error } = await supabase
    .from('projects')
    .insert(row)
    .select('*')
    .single<ProjectRow>();

  if (error) throw new Error(`Unable to create project: ${error.message}`);

  const { error: eventError } = await supabase.from('project_status_events').insert({
    project_id: data.id,
    event_type: 'assessment_completed',
    actor_type: input.customerId ? 'customer' : 'system',
    actor_id: input.customerId ?? null,
    message: 'Project assessment created and is ready for matching.',
    event_data: {
      urgency,
      serviceLevel: input.serviceLevel ?? 'free',
      sourceChannel: input.sourceChannel ?? 'web',
    },
  });

  if (eventError) {
    console.error('Project created but timeline event failed:', eventError.message);
  }

  return mapProjectRow(data);
}

export async function getProjectTimeline(projectId: string): Promise<ProjectStatusEvent[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('project_status_events')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Unable to load project timeline: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    projectId: row.project_id,
    eventType: row.event_type,
    actorType: row.actor_type,
    actorId: row.actor_id,
    message: row.message,
    eventData: row.event_data ?? {},
    createdAt: row.created_at,
  }));
}
