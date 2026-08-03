export const PROJECT_URGENCIES = [
  'emergency',
  'urgent',
  'planned',
  'large_project',
] as const;

export type ProjectUrgency = (typeof PROJECT_URGENCIES)[number];

export const PROJECT_SERVICE_LEVELS = [
  'free',
  'assisted',
  'priority',
  'managed',
] as const;

export type ProjectServiceLevel = (typeof PROJECT_SERVICE_LEVELS)[number];

export const PROJECT_STATUSES = [
  'draft',
  'assessment_complete',
  'matching',
  'responses_received',
  'provider_selected',
  'contact_released',
  'in_progress',
  'completed',
  'cancelled',
  'unfulfilled',
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type ProjectSourceChannel = 'web' | 'whatsapp' | 'admin' | 'partner' | 'api';

export interface ProjectMaterial {
  name: string;
  quantity?: number;
  unit?: string;
  estimatedUnitPrice?: number;
  estimatedTotal?: number;
  notes?: string;
}

export interface ProjectAssessmentPayload {
  alternateIssues?: Array<{
    issue: string;
    confidence?: number;
  }>;
  safetyClassification?: 'safe_to_wait' | 'urgent_attention' | 'emergency';
  recommendedQuestions?: string[];
  model?: string;
  modelVersion?: string;
  [key: string]: unknown;
}

export interface Project {
  id: string;
  customerId: string | null;
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
  title: string;
  customerDescription: string;
  aiSummary: string | null;
  likelyIssue: string | null;
  category: string;
  urgency: ProjectUrgency;
  serviceLevel: ProjectServiceLevel;
  status: ProjectStatus;
  locationText: string;
  suburb: string | null;
  city: string | null;
  province: string | null;
  latitude: number | null;
  longitude: number | null;
  preferredDate: string | null;
  responseTargetAt: string | null;
  estimatedMin: number | null;
  estimatedMax: number | null;
  estimateCurrency: string;
  confidence: number | null;
  professionalInspectionRequired: boolean;
  safetyNotes: string[];
  materials: ProjectMaterial[];
  assessmentPayload: ProjectAssessmentPayload;
  sourceChannel: ProjectSourceChannel;
  consentToShare: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  customerId?: string | null;
  guestName?: string | null;
  guestPhone?: string | null;
  guestEmail?: string | null;
  title: string;
  customerDescription: string;
  aiSummary?: string | null;
  likelyIssue?: string | null;
  category: string;
  urgency?: ProjectUrgency;
  serviceLevel?: ProjectServiceLevel;
  locationText: string;
  suburb?: string | null;
  city?: string | null;
  province?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  preferredDate?: string | null;
  estimatedMin?: number | null;
  estimatedMax?: number | null;
  estimateCurrency?: string;
  confidence?: number | null;
  professionalInspectionRequired?: boolean;
  safetyNotes?: string[];
  materials?: ProjectMaterial[];
  assessmentPayload?: ProjectAssessmentPayload;
  sourceChannel?: ProjectSourceChannel;
  consentToShare?: boolean;
}

export type ProviderAvailabilityStatus =
  | 'available_now'
  | 'available_today'
  | 'available_later'
  | 'unavailable'
  | 'unknown';

export interface ProviderAvailability {
  providerId: number;
  availabilityStatus: ProviderAvailabilityStatus;
  availableFrom: string | null;
  availableUntil: string | null;
  acceptsEmergencyJobs: boolean;
  acceptsPlannedWork: boolean;
  maximumTravelKm: number | null;
  serviceAreas: string[];
  categories: string[];
  minimumJobValue: number | null;
  maximumActiveLeads: number;
  lastConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type LeadInvitationStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'viewed'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'cancelled'
  | 'failed';

export type DeliveryChannel = 'web' | 'whatsapp' | 'sms' | 'email' | 'phone' | 'admin';

export interface LeadInvitation {
  id: string;
  projectId: string;
  providerId: number;
  waveNumber: number;
  status: LeadInvitationStatus;
  deliveryChannel: DeliveryChannel;
  deliveryAddress: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  viewedAt: string | null;
  responseDeadline: string | null;
  providerSnapshot: Record<string, unknown>;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ProviderResponseType =
  | 'available_now'
  | 'available_today'
  | 'available_tomorrow'
  | 'site_visit'
  | 'estimate'
  | 'need_information'
  | 'declined';

export interface ProviderResponse {
  id: string;
  leadInvitationId: string;
  projectId: string;
  providerId: number;
  responseType: ProviderResponseType;
  arrivalWindowStart: string | null;
  arrivalWindowEnd: string | null;
  siteVisitFee: number | null;
  estimateMin: number | null;
  estimateMax: number | null;
  estimateCurrency: string;
  providerMessage: string | null;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ProjectMatchStatus =
  | 'selected'
  | 'contact_released'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export interface ProjectMatch {
  id: string;
  projectId: string;
  providerId: number;
  providerResponseId: string | null;
  status: ProjectMatchStatus;
  selectedAt: string;
  contactReleasedAt: string | null;
  completionReportedAt: string | null;
  finalPrice: number | null;
  finalPriceCurrency: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStatusEvent {
  id: number;
  projectId: string;
  eventType: string;
  actorType: 'customer' | 'provider' | 'admin' | 'system' | 'partner';
  actorId: string | null;
  message: string | null;
  eventData: Record<string, unknown>;
  createdAt: string;
}

export interface ProjectResponseSummary {
  project: Project;
  invitations: LeadInvitation[];
  responses: ProviderResponse[];
  match: ProjectMatch | null;
  timeline: ProjectStatusEvent[];
}
