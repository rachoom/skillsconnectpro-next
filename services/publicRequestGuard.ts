import { createHmac } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from './supabaseAdmin';

export class PublicRequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function readBoundedJson(request: Request, maximum = 1_600_000): Promise<Record<string, unknown>> {
  if (!request.body) throw new PublicRequestError('A JSON request body is required.', 400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maximum) {
      await reader.cancel();
      throw new PublicRequestError('Request payload is too large.', 413);
    }
    chunks.push(value);
  }
  let body: unknown;
  try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new PublicRequestError('Invalid JSON request.', 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new PublicRequestError('Request body must be a JSON object.', 400);
  }
  return body as Record<string, unknown>;
}

export function publicRequestError(error: unknown): NextResponse | null {
  return error instanceof PublicRequestError
    ? NextResponse.json({ error: error.message }, { status: error.status }) : null;
}

export async function enforcePublicRequestLimit(request: Request, bucket: string, limit: number, windowSeconds = 3_600) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: 'Cross-origin requests are not allowed.' }, { status: 403 });
  }
  try {
    // Vercel overwrites this header with the incoming client's address.
    const ip = request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')?.trim() || 'unknown';
    const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secret) throw new Error('Request limit configuration is missing.');
    const key = createHmac('sha256', secret).update(ip).digest('hex');
    const { data, error } = await getSupabaseAdmin().rpc('consume_public_request_limit', {
      p_bucket: bucket, p_key_hash: key, p_limit: limit, p_window_seconds: windowSeconds,
    });
    if (error) throw error;
    if (data !== true) return NextResponse.json({ error: 'Too many requests. Please try again later.' }, {
      status: 429, headers: { 'Retry-After': String(windowSeconds) },
    });
    return null;
  } catch {
    console.error('Public request limiter is unavailable.');
    return NextResponse.json({ error: 'Service temporarily unavailable. Please try again.' }, { status: 503 });
  }
}
