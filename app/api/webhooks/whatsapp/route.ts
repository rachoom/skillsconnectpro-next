import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function signatureIsValid(rawBody: string, suppliedSignature: string | null): boolean {
  const appSecret = process.env.META_WHATSAPP_APP_SECRET;
  if (!appSecret || !suppliedSignature?.startsWith('sha256=')) return false;

  const expected = `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(suppliedSignature);
  if (expectedBuffer.length !== suppliedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const verifyToken = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (
    mode === 'subscribe' &&
    verifyToken &&
    challenge &&
    verifyToken === process.env.META_WHATSAPP_WEBHOOK_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Webhook verification failed.' }, { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!signatureIsValid(rawBody, request.headers.get('x-hub-signature-256'))) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as {
    entry?: Array<{
      changes?: Array<{
        value?: {
          statuses?: Array<{
            id?: string;
            status?: 'sent' | 'delivered' | 'read' | 'failed';
            timestamp?: string;
            errors?: Array<{ code?: number; title?: string; message?: string }>;
          }>;
        };
      }>;
    }>;
  };

  const statuses = (payload.entry ?? [])
    .flatMap((entry) => entry.changes ?? [])
    .flatMap((change) => change.value?.statuses ?? [])
    .filter((status) => status.id && status.status);

  const supabase = getSupabaseAdmin();
  for (const update of statuses) {
    const occurredAt = update.timestamp
      ? new Date(Number(update.timestamp) * 1_000).toISOString()
      : new Date().toISOString();
    const error = update.errors?.[0];
    const errorMessage = error?.message || error?.title || null;

    await supabase
      .from('lead_invitation_delivery_attempts')
      .update({
        status: update.status,
        error_code: error?.code ? String(error.code) : null,
        error_message: errorMessage,
        updated_at: occurredAt,
      })
      .eq('external_message_id', update.id);

    const invitationUpdate: Record<string, unknown> = {
      delivery_provider: 'meta_cloud_api',
    };

    if (update.status === 'sent') {
      invitationUpdate.status = 'sent';
      invitationUpdate.sent_at = occurredAt;
    } else if (update.status === 'delivered') {
      invitationUpdate.status = 'delivered';
      invitationUpdate.delivered_at = occurredAt;
    } else if (update.status === 'failed') {
      invitationUpdate.status = 'failed';
      invitationUpdate.failure_reason = errorMessage || 'WhatsApp delivery failed.';
    }

    if (Object.keys(invitationUpdate).length > 1) {
      await supabase
        .from('lead_invitations')
        .update(invitationUpdate)
        .eq('external_message_id', update.id);
    }
  }

  return NextResponse.json({ received: true, statusesProcessed: statuses.length });
}
