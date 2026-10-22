import { enforcePublicRequestLimit, publicRequestError, readBoundedJson } from '@/services/publicRequestGuard';
import { NextResponse } from 'next/server';
import { processAutomaticRouting } from '@/services/marketplace/automaticRouting';
import {
  isLikelyStreetAddress,
  phoneValidationMessage,
} from '@/services/marketplace/intakePolicy.js';
import { createProviderInvitations } from '@/services/marketplace/invitations';
import { createProject, updateProjectMedia } from '@/services/marketplace/projects';
import { createProjectMediaSignedUrls, storeProjectImage } from '@/services/marketplace/projectMedia';
import { sendCustomerProjectConfirmation } from '@/services/marketplace/customerWhatsAppNotifications';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';
import { linkAiUsageToProject } from '@/services/aiUsageGuard';
import { isCustomerPlanLimitError } from '@/services/customerPlanUsage';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import type { CreateProjectInput } from '@/types/marketplace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function text(value: unknown, maximum = 4_000): string {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : '';
}

function optionalText(value: unknown, maximum = 4_000): string | null {
  const cleaned = text(value, maximum);
  return cleaned || null;
}

function optionalNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function positiveInteger(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function validEmail(value: string): boolean {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parsePublicIntake(body: unknown): CreateProjectInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Project information is missing.');
  }

  const value = body as Record<string, unknown>;
  const guestName = text(value.guestName, 120);
  const guestPhone = text(value.guestPhone, 40);
  const guestEmail = text(value.guestEmail, 200);
  const locationText = text(value.locationText, 120);
  const title = text(value.title, 120);
  const customerDescription = text(value.customerDescription, 4_000);
  const category = text(value.category, 100);

  if (!guestName) throw new Error('Your name is required.');
  const phoneError = phoneValidationMessage(guestPhone);
  if (phoneError) throw new Error(phoneError);
  if (!validEmail(guestEmail)) throw new Error('Enter a valid email address or leave the email field empty.');
  if (!locationText) throw new Error('Select or enter the suburb or town where the work is needed.');
  if (isLikelyStreetAddress(locationText)) {
    throw new Error('For privacy, enter only the suburb, town or service area—not a house number or street address.');
  }
  if (!title) throw new Error('The project title is missing. Please reassess the job.');
  if (!customerDescription) throw new Error('The project description is missing.');
  if (!category) throw new Error('The project category is missing. Please reassess the job.');
  if (value.consentToShare !== true) {
    throw new Error('Confirm that the project brief may be shared with suitable providers.');
  }

  const urgency = value.urgency === 'emergency'
    || value.urgency === 'urgent'
    || value.urgency === 'large_project'
    ? value.urgency
    : 'planned';

  return {
    guestName,
    guestPhone,
    guestEmail: guestEmail || null,
    title,
    customerDescription,
    aiSummary: optionalText(value.aiSummary, 1_500),
    likelyIssue: optionalText(value.likelyIssue, 500),
    category,
    urgency,
    serviceLevel: 'free',
    locationText,
    suburb: locationText,
    city: null,
    province: null,
    preferredDate: optionalText(value.preferredDate, 40),
    estimatedMin: optionalNumber(value.estimatedMin),
    estimatedMax: optionalNumber(value.estimatedMax),
    estimateCurrency: 'ZAR',
    confidence: optionalNumber(value.confidence),
    professionalInspectionRequired: value.professionalInspectionRequired !== false,
    safetyNotes: Array.isArray(value.safetyNotes)
      ? value.safetyNotes
          .map((item) => text(item, 300))
          .filter(Boolean)
          // Pricing/procurement disclaimers are not safety warnings and must
          // never appear under the customer's "Safety first" panel.
          .filter((note) => !/(hardware quotation|supplier pricing|procurement|quotation limit|installation scope should be checked before purchase)/i.test(note))
          .slice(0, 8)
      : [],
    materials: Array.isArray(value.materials)
      ? value.materials.slice(0, 20) as CreateProjectInput['materials']
      : [],
    assessmentPayload: value.assessmentPayload
      && typeof value.assessmentPayload === 'object'
      && !Array.isArray(value.assessmentPayload)
      ? {
          ...value.assessmentPayload as Record<string, unknown>,
          preferredProviderId: positiveInteger(value.preferredProviderId),
          preferredProviderName: optionalText(value.preferredProviderName, 160),
          intakeOrigin: positiveInteger(value.preferredProviderId)
            ? 'controlled_provider_browse'
            : 'guided_homepage',
        }
      : {
          preferredProviderId: positiveInteger(value.preferredProviderId),
          preferredProviderName: optionalText(value.preferredProviderName, 160),
          intakeOrigin: positiveInteger(value.preferredProviderId)
            ? 'controlled_provider_browse'
            : 'guided_homepage',
        },
    sourceChannel: 'web',
    consentToShare: true,
  };
}

async function queuePreferredProvider(input: {
  projectId: string;
  providerId: number | null;
}) {
  if (!input.providerId) {
    return { requested: false, queued: false, reason: 'No preferred provider selected.' };
  }

  const supabase = getSupabaseAdmin();
  const [providerResult, invitationResult] = await Promise.all([
    supabase
      .from('artisans')
      .select('id, name, first_name, last_name, category, location, phone, image_url, verified, rating, status')
      .eq('id', input.providerId)
      .maybeSingle(),
    supabase
      .from('lead_invitations')
      .select('id')
      .eq('project_id', input.projectId)
      .eq('provider_id', input.providerId)
      .maybeSingle(),
  ]);

  if (providerResult.error) {
    throw new Error(`Unable to load the selected provider: ${providerResult.error.message}`);
  }
  if (invitationResult.error) {
    throw new Error(`Unable to check the selected provider invitation: ${invitationResult.error.message}`);
  }
  if (!providerResult.data) {
    return { requested: true, queued: false, reason: 'The selected provider profile is no longer available.' };
  }
  if (String(providerResult.data.status || '').toLowerCase() === 'inactive') {
    return { requested: true, queued: false, reason: 'The selected provider is currently inactive.' };
  }
  if (invitationResult.data) {
    return { requested: true, queued: false, reason: 'The selected provider already has an invitation for this project.' };
  }

  const provider = providerResult.data;
  const displayName = provider.name?.trim()
    || `${provider.first_name || ''} ${provider.last_name || ''}`.trim()
    || `Provider ${provider.id}`;

  const created = await createProviderInvitations({
    projectId: input.projectId,
    waveNumber: 1,
    targets: [{
      providerId: provider.id,
      deliveryChannel: 'whatsapp',
      deliveryAddress: provider.phone,
      providerSnapshot: {
        displayName,
        category: provider.category,
        location: provider.location,
        phone: provider.phone,
        imageUrl: provider.image_url,
        verified: Boolean(provider.verified),
        rating: Number(provider.rating || 0),
        customerPreferred: true,
      },
    }],
  });

  if (created.length === 0) return { requested: true, queued: false,
    reason: 'The selected provider requires review or could not be invited directly.' };

  const { error: eventError } = await supabase.from('project_status_events').insert({
    project_id: input.projectId,
    event_type: 'customer_preferred_provider_queued',
    actor_type: 'customer',
    message: `${displayName} was invited directly at the customer's request.`,
    event_data: {
      providerId: provider.id,
      providerName: displayName,
      waveNumber: 1,
    },
  });

  if (eventError) {
    console.error('Preferred provider queued but timeline event failed:', eventError.message);
  }

  return { requested: true, queued: true, reason: 'The customer-selected provider was invited directly.' };
}

export async function POST(request: Request) {
  try {
    const blocked = await enforcePublicRequestLimit(request, 'project_intake', 5);
    if (blocked) return blocked;
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > 4_000_000) {
      return NextResponse.json({ error: 'Project information is too large.' }, { status: 413 });
    }

    const body = await readBoundedJson(request, 4_000_000);
    const preferredProviderId = body && typeof body === 'object' && !Array.isArray(body)
      ? positiveInteger((body as Record<string, unknown>).preferredProviderId)
      : null;
    const parsedInput = parsePublicIntake(body);
    const { user } = await getAuthenticatedAccount();
    const input: CreateProjectInput = {
      ...parsedInput,
      // Account ownership is derived from the verified Supabase session. Never
      // accept a customer id from the public request body.
      customerId: user?.id ?? null,
    };
    const imageData = body && typeof body === 'object' && !Array.isArray(body)
      ? text((body as Record<string, unknown>).image, 3_000_000)
      : '';
    const { project: createdProject, accessToken } = await createProject(input);
    let project = createdProject;
    let mediaWarning: string | null = null;

    // This is non-blocking product evidence: it tells us whether a guided AI
    // project became a genuine marketplace lead without storing raw IP/session data.
    await linkAiUsageToProject(request, project.id);

    if (imageData) {
      try {
        const storedMedia = await storeProjectImage(
          project.id,
          imageData,
          `Customer reference image for ${project.title}`,
        );
        if (storedMedia) {
          project = await updateProjectMedia(project.id, [storedMedia]);
        }
      } catch (imageError) {
        mediaWarning = 'The project was created, but the reference image could not be saved.';
        console.error('Project created but reference image storage failed:', imageError);
      }
    }

    try {
      const customerNotification = await sendCustomerProjectConfirmation({
        projectId: project.id,
        accessToken,
        customerName: project.guestName,
        customerPhone: project.guestPhone,
        projectTitle: project.title,
      });

      if (customerNotification.status === 'failed') {
        console.error('Customer WhatsApp confirmation failed:', customerNotification.reason);
      }
    } catch (notificationError) {
      console.error('Customer WhatsApp confirmation failed:', notificationError);
    }

    let routing: {
      action: string;
      waveNumber: number | null;
      providersQueued: number;
      totalInvitations: number;
      reason: string;
    } | null = null;

    let preferredProvider = {
      requested: Boolean(preferredProviderId),
      queued: false,
      reason: preferredProviderId
        ? 'The selected provider could not yet be added.'
        : 'No preferred provider selected.',
    };

    if (preferredProviderId) {
      try {
        preferredProvider = await queuePreferredProvider({
          projectId: project.id,
          providerId: preferredProviderId,
        });
        routing = {
          action: preferredProvider.queued ? 'waiting_for_responses' : 'no_candidates',
          waveNumber: preferredProvider.queued ? 1 : null,
          providersQueued: preferredProvider.queued ? 1 : 0,
          totalInvitations: preferredProvider.queued ? 1 : 0,
          reason: preferredProvider.queued
            ? 'The customer selected a specific provider, so only that provider was invited.'
            : preferredProvider.reason,
        };
      } catch (preferredError) {
        console.error('Project created but preferred provider could not be queued:', preferredError);
        preferredProvider.reason = 'The project was created, but the preferred provider requires administrator review.';
        routing = {
          action: 'no_candidates',
          waveNumber: null,
          providersQueued: 0,
          totalInvitations: 0,
          reason: preferredProvider.reason,
        };
      }
    } else if (process.env.MARKETPLACE_AUTOROUTING_ENABLED !== 'false') {
      try {
        const result = await processAutomaticRouting({ projectId: project.id });
        routing = {
          action: result.action,
          waveNumber: result.waveNumber,
          providersQueued: result.invitationsQueued,
          totalInvitations: result.totalInvitations,
          reason: result.reason,
        };
      } catch (routingError) {
        console.error('Public intake project created but automatic routing failed:', routingError);
      }
    }

    const projectForResponse = {
      ...project,
      media: await createProjectMediaSignedUrls(project.media),
    };

    return NextResponse.json(
      {
        project: {
          ...projectForResponse,
          guestPhone: undefined,
          guestEmail: undefined,
        },
        accessToken,
        mediaStored: projectForResponse.media.length > 0,
        mediaWarning,
        routing,
        preferredProvider,
      },
      { status: 201 },
    );
  } catch (error) {
    const invalid = publicRequestError(error);
    if (invalid) return invalid;
    if (isCustomerPlanLimitError(error, 'ACTIVE_PROJECTS')) {
      return NextResponse.json({
        error: 'You already have the active projects included with your current plan. Choose a project plan to keep more projects moving at once.',
        code: 'ACTIVE_PROJECT_LIMIT',
        upgradeUrl: '/plans#homeowners',
      }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : 'Unable to create the project.';
    const isServiceError = message.startsWith('Unable to create project:') || message.includes('SUPABASE_');
    console.error('POST /api/projects/intake failed:', error);
    return NextResponse.json(
      { error: isServiceError ? 'Project service is temporarily unavailable. Please try again.' : message },
      { status: isServiceError ? 503 : 400 },
    );
  }
}
