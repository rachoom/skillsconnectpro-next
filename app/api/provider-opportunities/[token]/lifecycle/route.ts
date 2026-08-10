import { NextResponse } from 'next/server';
import {
  getProviderLifecycleState,
  updateProviderLifecycle,
  type LifecycleAction,
} from '@/services/marketplace/lifecycle';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ACTIONS: LifecycleAction[] = [
  'start_work',
  'report_completion',
  'report_issue',
];

function parseBody(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Request body must be a JSON object.');
  }

  const value = body as Record<string, unknown>;
  if (typeof value.action !== 'string' || !ACTIONS.includes(value.action as LifecycleAction)) {
    throw new Error(`action must be one of: ${ACTIONS.join(', ')}.`);
  }

  const finalPrice = value.finalPrice === null || value.finalPrice === undefined
    ? null
    : typeof value.finalPrice === 'number'
      ? value.finalPrice
      : Number(value.finalPrice);

  return {
    action: value.action as LifecycleAction,
    note: typeof value.note === 'string' ? value.note : null,
    finalPrice: finalPrice !== null && Number.isFinite(finalPrice) ? finalPrice : null,
  };
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Provider lifecycle service failed.';
  const missing = message.toLowerCase().includes('not found');
  const unavailable = message.toLowerCase().includes('after the customer selects');
  const configurationError = message.includes('SUPABASE_');

  console.error('Provider lifecycle API failed:', error);
  return NextResponse.json(
    { error: configurationError ? 'Provider lifecycle service is not configured.' : message },
    { status: configurationError ? 503 : missing ? 404 : unavailable ? 409 : 400 },
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const lifecycle = await getProviderLifecycleState(token);
    return NextResponse.json({ lifecycle });
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
    const input = parseBody(await request.json());
    const lifecycle = await updateProviderLifecycle({ token, ...input });
    return NextResponse.json({ lifecycle });
  } catch (error) {
    return errorResponse(error);
  }
}
