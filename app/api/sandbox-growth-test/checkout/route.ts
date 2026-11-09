import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getProviderPlan } from '@/app/provider-plans/planCatalog';
import { getPayfastConfig, normalisePayfastFields, payfastNotificationUrl, payfastSignature } from '@/services/payments/payfast';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FAKE_GROWTH_PROVIDER_ID = 900000002;
const STAGING_PROJECT = 'bvzsbcpoxdvuvpskavho';
const TEST_COOKIE = 'scp_growth_sandbox_receipt';

function enabled() {
  const configured = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serverUrl = process.env.SUPABASE_URL || configured;
  return process.env.VERCEL_ENV === 'preview'
    && process.env.PAYFAST_MODE === 'sandbox'
    && configured.includes(STAGING_PROJECT)
    && serverUrl.includes(STAGING_PROJECT)
    && Boolean(process.env.SCP_SANDBOX_GROWTH_TEST_TOKEN);
}
function testSecret() {
  const secret = process.env.SCP_SANDBOX_GROWTH_TEST_TOKEN || '';
  if (!/^[a-f0-9]{64}$/.test(secret)) throw new Error('Sandbox authorization unavailable');
  return secret;
}
function safeEqual(candidate: string, expected: string) {
  if (!/^[a-f0-9]{64}$/.test(candidate)) return false;
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
}
function receipt(ref: string, secret: string) {
  return createHmac('sha256', secret).update('growth-sandbox:' + ref).digest('hex');
}
export { enabled, receipt, TEST_COOKIE };

export async function POST(request: Request) {
  if (!enabled()) return new NextResponse('Not found', { status: 404 });
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  if (!origin || origin !== url.origin) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') return NextResponse.json({ error: 'Invalid request format' }, { status: 415 });

  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 2048) return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid body');
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  let secret: string;
  try { secret = testSecret(); } catch { return NextResponse.json({ error: 'Test checkout unavailable' }, { status: 503 }); }
  if (!safeEqual(String(body.testToken ?? ''), secret)) return NextResponse.json({ error: 'Invalid or expired test link' }, { status: 403 });

  try {
    const admin = getSupabaseAdmin();
    const { data: existing, error: existingError } = await admin.from('subscription_entitlements')
      .select('id').eq('subject_type', 'provider').eq('subject_id', String(FAKE_GROWTH_PROVIDER_ID))
      .eq('plan_code', 'growth_monthly').eq('status', 'active').gt('ends_at', new Date().toISOString()).limit(1).maybeSingle();
    if (existingError) throw existingError;
    if (existing) return NextResponse.json({ error: 'The Growth sandbox test already activated. Please inspect the staging entitlement before paying again.' }, { status: 409 });

    const { data: provider, error: providerError } = await admin.from('artisans')
      .select('id,first_name,last_name,email').eq('id', FAKE_GROWTH_PROVIDER_ID).maybeSingle();
    if (providerError || !provider) throw new Error('The staging-only Growth test provider is missing');

    const plan = getProviderPlan('growth');
    const config = getPayfastConfig();
    if (!plan || config.mode !== 'sandbox') throw new Error('Sandbox payment is unavailable');
    const ref = randomUUID();
    const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/$/, '');
    const target = new URL(siteOrigin);
    if (target.protocol !== 'https:' || !target.hostname.endsWith('.vercel.app'))
      throw new Error('Sandbox site origin is unsafe');

    const fields = normalisePayfastFields({
      merchant_id: config.merchantId, merchant_key: config.merchantKey,
      return_url: siteOrigin + '/sandbox-growth-test/return?payment=' + encodeURIComponent(ref),
      cancel_url: siteOrigin + '/sandbox-growth-test/return?payment=' + encodeURIComponent(ref) + '&cancelled=1',
      notify_url: payfastNotificationUrl(siteOrigin, config.mode),
      name_first: provider.first_name || 'Sandbox', name_last: provider.last_name || 'Growth',
      email_address: provider.email || undefined,
      m_payment_id: ref, amount: '99.00',
      item_name: 'Skills Connect Pro Growth SANDBOX TEST',
      item_description: 'Simulated R99 Growth recurring subscription - not a real payment',
      custom_str1: String(FAKE_GROWTH_PROVIDER_ID), custom_str2: plan.code, custom_str3: plan.kind,
      subscription_type: 1, recurring_amount: '99.00', frequency: 3, cycles: 0,
    });

    const { error: insertError } = await admin.from('payment_transactions').insert({
      m_payment_id: ref, provider_id: FAKE_GROWTH_PROVIDER_ID, plan_code: 'growth_monthly',
      plan_kind: 'subscription', amount_cents: 9900, processor_status: 'INITIATED',
      metadata: { payfast_mode: 'sandbox', purpose: 'isolated_growth_checkout_test' },
    });
    if (insertError) throw insertError;

    const response = NextResponse.json({
      paymentUrl: config.processUrl,
      fields: { ...fields, signature: payfastSignature(fields, config.passphrase) },
    }, { headers: { 'Cache-Control': 'no-store' } });
    response.cookies.set(TEST_COOKIE, ref + '.' + receipt(ref, secret), {
      httpOnly: true, secure: true, sameSite: 'lax', path: '/api/sandbox-growth-test',
      maxAge: 3600,
    });
    return response;
  } catch (error) {
    console.error('Growth sandbox checkout failed:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Unable to open sandbox checkout. No payment was initiated.' }, { status: 503 });
  }
}
