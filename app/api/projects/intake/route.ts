import { NextResponse } from 'next/server';
import { processAutomaticRouting } from '@/services/marketplace/automaticRouting';
import {
  isLikelyStreetAddress,
  phoneValidationMessage,
} from '@/services/marketplace/intakePolicy.js';
import { createProviderInvitations } from '@/services/marketplace/invitations';
import { createProject } from '@/services/marketplace/projects';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';
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
      ? value.safetyNotes.map((item) => text(item, 300)).filter(Boolean).slice(0, 8)
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
    return { requested: true, queued: false, reason: 'The selected provider was already included in the first wave.' };
  }

  const provider = providerResult.data;
  const displayName = provider.name?.trim()
    || `${provider.first_name || ''} ${provider.last_name || ''}`.trim()
    || `Provider ${provider.id}`;

  await createProviderInvitations({
    projectId: input.projectId,
    waveNumber: 1,
    targets: [{
      providerId: provider.id,
      deliveryChannel: 'admin',
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

  const { error: eventError } = await supabase.from('project_status_events').insert({
    project_id: input.projectId,
    event_type: 'customer_preferred_provider_queued',
    actor_type: 'customer',
    message: `${displayName} was added to the first invitation wave at the customer's request.`,
    event_data: {
      providerId: provider.id,
      providerName: displayName,
      waveNumber: 1,
    },
  });

  if (eventError) {
    console.error('Preferred provider queued but timeline event failed:', eventError.message);
  }

  return { requested: true, queued: true, reason: 'The customer-selected provider was added to the first invitation wave.' };
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > 1_000_000) {
      return NextResponse.json({ error: 'Project information is too large.' }, { status: 413 });
    }

    const body = await request.json();
    const preferredProviderId = body && typeof body === 'object' && !Array.isArray(body)
      ? positiveInteger((body as Record<string, unknown>).preferredProviderId)
      : null;
    const input = parsePublicIntake(body);
    const { project, accessToken } = await createProject(input);

    let routing: {
      action: string;
      waveNumber: number | null;
      providersQueued: number;
      totalInvitations: number;
      reason: string;
    } | null = null;

    if (process.env.MARKETPLACE_AUTOROUTING_ENABLED !== 'false') {
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
        if (preferredProvider.queued && routing) {
          routing.providersQueued += 1;
          routing.totalInvitations += 1;
          routing.reason = `${routing.reason} The customer-selected provider was also included.`;
        }
      } catch (preferredError) {
        console.error('Project created but preferred provider could not be queued:', preferredError);
        preferredProvider.reason = 'The project was created, but the preferred provider requires administrator review.';
      }
    }

    return NextResponse.json(
      {
        project: {
          ...project,
          guestPhone: undefined,
          guestEmail: undefined,
        },
        accessToken,
        routing,
        preferredProvider,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create the project.';
    const isServiceError = message.startsWith('Unable to create project:') || message.includes('SUPABASE_');
    console.error('POST /api/projects/intake failed:', error);
    return NextResponse.json(
      { error: isServiceError ? 'Project service is temporarily unavailable. Please try again.' : message },
      { status: isServiceError ? 503 : 400 },
    );
  }
}
