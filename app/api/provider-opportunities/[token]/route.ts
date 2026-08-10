import { NextResponse } from 'next/server';
import {
  getProviderOpportunity,
  submitProviderResponse,
  type SubmitProviderResponseInput,
} from '@/services/marketplace/providerResponses';
import type { ProviderResponseType } from '@/types/marketplace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RESPONSE_TYPES: ProviderResponseType[] = [
  'available_now',
  'available_today',
  'available_tomorrow',
  'available_this_week',
  'available_next_week',
  'site_visit',
  'estimate',
  'need_information',
  'declined',
];

function optionalString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === 'string' ? value : undefined;
}

function optionalNumber(value: unknown): number | null | undefined {
  if (value === null) return null;
  return typeof value === 'number' ? value : undefined;
}

function parseProviderResponse(body: unknown): SubmitProviderResponseInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Request body must be a JSON object.');
  }

  const value = body as Record<string, unknown>;
  if (
    typeof value.responseType !== 'string' ||
    !RESPONSE_TYPES.includes(value.responseType as ProviderResponseType)
  ) {
    throw new Error(`responseType must be one of: ${RESPONSE_TYPES.join(', ')}.`);
  }

  return {
    responseType: value.responseType as ProviderResponseType,
    arrivalWindowStart: optionalString(value.arrivalWindowStart),
    arrivalWindowEnd: optionalString(value.arrivalWindowEnd),
    siteVisitFee: optionalNumber(value.siteVisitFee),
    estimateMin: optionalNumber(value.estimateMin),
    estimateMax: optionalNumber(value.estimateMax),
    estimateCurrency: optionalString(value.estimateCurrency) ?? undefined,
    providerMessage: optionalString(value.providerMessage),
    validUntil: optionalString(value.validUntil),
  };
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Provider opportunity service failed.';
  const expired = message.toLowerCase().includes('expired');
  const missing = message.toLowerCase().includes('not found');
  const configurationError = message.includes('SUPABASE_');

  console.error('Provider opportunity API failed:', error);

  return NextResponse.json(
    {
      error: configurationError ? 'Provider opportunity service is not configured.' : message,
    },
    { status: configurationError ? 503 : expired ? 410 : missing ? 404 : 400 },
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const opportunity = await getProviderOpportunity(token);

    if (!opportunity) {
      return NextResponse.json({ error: 'Provider opportunity not found.' }, { status: 404 });
    }

    return NextResponse.json({ opportunity });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const input = parseProviderResponse(await request.json());
    const result = await submitProviderResponse(token, input);

    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
