import { NextResponse } from 'next/server';
import {
  getCustomerLifecycleState,
  updateCustomerLifecycle,
  type LifecycleAction,
} from '@/services/marketplace/lifecycle';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ACTIONS: LifecycleAction[] = [
  'start_work',
  'confirm_completion',
  'cancel_project',
  'report_issue',
];

function accessToken(request: Request): string {
  return request.headers.get('x-project-access-token')?.trim() ?? '';
}

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
  const message = error instanceof Error ? error.message : 'Project lifecycle service failed.';
  const missing = message.toLowerCase().includes('not found');
  const configurationError = message.includes('SUPABASE_');

  console.error('Customer lifecycle API failed:', error);
  return NextResponse.json(
    { error: configurationError ? 'Project lifecycle service is not configured.' : message },
    { status: configurationError ? 503 : missing ? 404 : 400 },
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = accessToken(request);
    if (!token) return NextResponse.json({ error: 'Secure project access token is required.' }, { status: 401 });

    const { id } = await context.params;
    const lifecycle = await getCustomerLifecycleState(id, token);
    return NextResponse.json({ lifecycle });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const token = accessToken(request);
    if (!token) return NextResponse.json({ error: 'Secure project access token is required.' }, { status: 401 });

    const { id } = await context.params;
    const input = parseBody(await request.json());
    const lifecycle = await updateCustomerLifecycle({
      projectId: id,
      accessToken: token,
      ...input,
    });

    return NextResponse.json({ lifecycle });
  } catch (error) {
    return errorResponse(error);
  }
}
