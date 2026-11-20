import { NextResponse } from 'next/server';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import {
  getProviderOpportunityForAccount,
  submitProviderResponseForAccount,
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

async function getProviderId() {
  const { supabase, user } = await getAuthenticatedAccount();
  if (!user) return { providerId: null, status: 401 as const };

  const { data, error } = await supabase
    .from('account_roles')
    .select('linked_artisan_id')
    .eq('user_id', user.id)
    .eq('role', 'artisan')
    .eq('status', 'active')
    .not('linked_artisan_id', 'is', null)
    .maybeSingle();

  if (error) {
    console.error('Unable to verify provider account role:', error.message);
    return { providerId: null, status: 500 as const };
  }

  const providerId = Number(data?.linked_artisan_id);
  if (!Number.isInteger(providerId) || providerId <= 0) {
    return { providerId: null, status: 403 as const };
  }

  return { providerId, status: 200 as const };
}

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
  return NextResponse.json(
    { error: message },
    {
      status: expired ? 410 : missing ? 404 : 400,
      headers: { 'Cache-Control': 'private, no-store' },
    },
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getProviderId();
  if (!auth.providerId) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Sign in to open this opportunity.' : 'Provider access required.' },
      { status: auth.status, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  try {
    const { id } = await context.params;
    const opportunity = await getProviderOpportunityForAccount(id, auth.providerId);
    if (!opportunity) {
      return NextResponse.json(
        { error: 'Provider opportunity not found.' },
        { status: 404, headers: { 'Cache-Control': 'private, no-store' } },
      );
    }
    return NextResponse.json(
      { opportunity },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getProviderId();
  if (!auth.providerId) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Sign in to respond.' : 'Provider access required.' },
      { status: auth.status, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  try {
    const { id } = await context.params;
    const input = parseProviderResponse(await request.json());
    const result = await submitProviderResponseForAccount(id, auth.providerId, input);
    return NextResponse.json(
      { result },
      { status: 201, headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
