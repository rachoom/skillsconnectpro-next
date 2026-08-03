import { NextResponse } from 'next/server';
import {
  PROJECT_SERVICE_LEVELS,
  PROJECT_URGENCIES,
  type CreateProjectInput,
  type ProjectServiceLevel,
  type ProjectUrgency,
} from '../../../types/marketplace';
import { createProject } from '../../../services/marketplace/projects';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isProjectUrgency(value: unknown): value is ProjectUrgency {
  return typeof value === 'string' && PROJECT_URGENCIES.includes(value as ProjectUrgency);
}

function isProjectServiceLevel(value: unknown): value is ProjectServiceLevel {
  return typeof value === 'string' && PROJECT_SERVICE_LEVELS.includes(value as ProjectServiceLevel);
}

function optionalString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === 'string' ? value : undefined;
}

function optionalNumber(value: unknown): number | null | undefined {
  if (value === null) return null;
  return typeof value === 'number' ? value : undefined;
}

function parseCreateProjectInput(body: unknown): CreateProjectInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Request body must be a JSON object.');
  }

  const value = body as Record<string, unknown>;

  if (typeof value.title !== 'string') throw new Error('title is required.');
  if (typeof value.customerDescription !== 'string') {
    throw new Error('customerDescription is required.');
  }
  if (typeof value.category !== 'string') throw new Error('category is required.');
  if (typeof value.locationText !== 'string') throw new Error('locationText is required.');

  if (value.urgency !== undefined && !isProjectUrgency(value.urgency)) {
    throw new Error(`urgency must be one of: ${PROJECT_URGENCIES.join(', ')}.`);
  }

  if (value.serviceLevel !== undefined && !isProjectServiceLevel(value.serviceLevel)) {
    throw new Error(`serviceLevel must be one of: ${PROJECT_SERVICE_LEVELS.join(', ')}.`);
  }

  if (value.materials !== undefined && !Array.isArray(value.materials)) {
    throw new Error('materials must be an array.');
  }

  if (value.safetyNotes !== undefined) {
    if (!Array.isArray(value.safetyNotes) || !value.safetyNotes.every((item) => typeof item === 'string')) {
      throw new Error('safetyNotes must be an array of strings.');
    }
  }

  if (
    value.assessmentPayload !== undefined &&
    (!value.assessmentPayload || typeof value.assessmentPayload !== 'object' || Array.isArray(value.assessmentPayload))
  ) {
    throw new Error('assessmentPayload must be an object.');
  }

  return {
    customerId: optionalString(value.customerId),
    guestName: optionalString(value.guestName),
    guestPhone: optionalString(value.guestPhone),
    guestEmail: optionalString(value.guestEmail),
    title: value.title,
    customerDescription: value.customerDescription,
    aiSummary: optionalString(value.aiSummary),
    likelyIssue: optionalString(value.likelyIssue),
    category: value.category,
    urgency: value.urgency as ProjectUrgency | undefined,
    serviceLevel: value.serviceLevel as ProjectServiceLevel | undefined,
    locationText: value.locationText,
    suburb: optionalString(value.suburb),
    city: optionalString(value.city),
    province: optionalString(value.province),
    latitude: optionalNumber(value.latitude),
    longitude: optionalNumber(value.longitude),
    preferredDate: optionalString(value.preferredDate),
    estimatedMin: optionalNumber(value.estimatedMin),
    estimatedMax: optionalNumber(value.estimatedMax),
    estimateCurrency: optionalString(value.estimateCurrency) ?? undefined,
    confidence: optionalNumber(value.confidence),
    professionalInspectionRequired:
      typeof value.professionalInspectionRequired === 'boolean'
        ? value.professionalInspectionRequired
        : undefined,
    safetyNotes: value.safetyNotes as string[] | undefined,
    materials: value.materials as CreateProjectInput['materials'],
    assessmentPayload: value.assessmentPayload as CreateProjectInput['assessmentPayload'],
    sourceChannel:
      value.sourceChannel === 'web' ||
      value.sourceChannel === 'whatsapp' ||
      value.sourceChannel === 'admin' ||
      value.sourceChannel === 'partner' ||
      value.sourceChannel === 'api'
        ? value.sourceChannel
        : 'web',
    consentToShare: typeof value.consentToShare === 'boolean' ? value.consentToShare : false,
  };
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > 1_000_000) {
      return NextResponse.json(
        { error: 'Project payload is too large. Upload media separately.' },
        { status: 413 },
      );
    }

    const input = parseCreateProjectInput(await request.json());
    const { project, accessToken } = await createProject(input);

    return NextResponse.json(
      {
        project: {
          ...project,
          guestPhone: undefined,
          guestEmail: undefined,
        },
        accessToken,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create project.';
    const isConfigurationError = message.includes('SUPABASE_');
    const isDatabaseError = message.startsWith('Unable to create project:');

    console.error('POST /api/projects failed:', error);

    return NextResponse.json(
      { error: isConfigurationError || isDatabaseError ? 'Project service is not available.' : message },
      { status: isConfigurationError || isDatabaseError ? 503 : 400 },
    );
  }
}
