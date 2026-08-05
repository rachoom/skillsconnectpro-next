import { NextResponse } from 'next/server';
import { processAutomaticRouting } from '@/services/marketplace/automaticRouting';
import {
  isLikelyStreetAddress,
  phoneValidationMessage,
} from '@/services/marketplace/intakePolicy.js';
import { createProject } from '@/services/marketplace/projects';
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
      ? value.assessmentPayload as Record<string, unknown>
      : {},
    sourceChannel: 'web',
    consentToShare: true,
  };
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > 1_000_000) {
      return NextResponse.json({ error: 'Project information is too large.' }, { status: 413 });
    }

    const input = parsePublicIntake(await request.json());
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

    return NextResponse.json(
      {
        project: {
          ...project,
          guestPhone: undefined,
          guestEmail: undefined,
        },
        accessToken,
        routing,
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
