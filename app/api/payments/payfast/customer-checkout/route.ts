import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { enforcePublicRequestLimit, publicRequestError, readBoundedJson } from '@/services/publicRequestGuard';
import { getPayfastConfig, normalisePayfastFields, payfastSignature } from '@/services/payments/payfast';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://www.skillsconnectpro.co.za').replace(/\/+$/, '');
}

function tokenHash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export async function POST(request: Request) {
  try {
    const blocked = await enforcePublicRequestLimit(request, 'customer_payfast_checkout', 10);
    if (blocked) return blocked;

    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    let sameOrigin = false;
    try { sameOrigin = Boolean(origin && host && new URL(origin).host === host); } catch {}
    if (!sameOrigin) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });

    const { user } = await getAuthenticatedAccount();
    const body = await readBoundedJson(request, 4_000) as Record<string, unknown>;
    const planCode = String(body.plan || '');
    if (!['basic_30', 'project_pass_90'].includes(planCode)) {
      return NextResponse.json({ error: 'Please choose a valid homeowner plan.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('code,name,price_cents,duration_days,active')
      .eq('code', planCode)
      .eq('active', true)
      .maybeSingle();

    if (planError) throw new Error(`Unable to load plan: ${planError.message}`);
    if (!plan || !plan.duration_days || plan.price_cents <= 0) {
      return NextResponse.json({ error: 'That homeowner plan is not available.' }, { status: 400 });
    }

    const config = getPayfastConfig();
    const paymentReference = randomUUID();
    const baseUrl = siteUrl();
    const claimToken = user ? '' : randomBytes(32).toString('base64url');
    const claimQuery = claimToken ? `&claim=${encodeURIComponent(claimToken)}` : '';
    const fullName = (user?.name || '').trim().split(/\s+/).filter(Boolean);

    const fields: Record<string, string | number | boolean | undefined> = {
      merchant_id: config.merchantId,
      merchant_key: config.merchantKey,
      return_url: `${baseUrl}/customer-payment-result?payment=${encodeURIComponent(paymentReference)}${claimQuery}`,
      cancel_url: `${baseUrl}/customer-payment-result?payment=${encodeURIComponent(paymentReference)}&cancelled=1${claimQuery}`,
      notify_url: `${baseUrl}/api/payments/payfast/itn`,
      name_first: user ? (fullName[0] || 'Skills Connect') : undefined,
      name_last: user ? (fullName.slice(1).join(' ') || 'Customer') : undefined,
      email_address: user?.email || undefined,
      m_payment_id: paymentReference,
      amount: (plan.price_cents / 100).toFixed(2),
      item_name: `Skills Connect Pro ${plan.name}`,
      item_description: `${plan.name} once-off homeowner project pass`,
      custom_str1: user?.id || undefined,
      custom_str2: plan.code,
      custom_str3: 'customer_project_pass',
    };

    const paymentFields = normalisePayfastFields(fields);
    const { error: insertError } = await supabase.from('customer_payment_transactions').insert({
      m_payment_id: paymentReference,
      user_id: user?.id ?? null,
      plan_code: plan.code,
      amount_cents: plan.price_cents,
      processor_status: 'INITIATED',
      claim_token_hash: claimToken ? tokenHash(claimToken) : null,
      claim_expires_at: claimToken ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
      metadata: {
        payfast_mode: config.mode,
        duration_days: plan.duration_days,
        guest_checkout: !user,
      },
    });
    if (insertError) throw new Error(`Unable to start checkout: ${insertError.message}`);

    return NextResponse.json({
      paymentUrl: config.processUrl,
      fields: { ...paymentFields, signature: payfastSignature(paymentFields, config.passphrase) },
    });
  } catch (error) {
    const invalid = publicRequestError(error);
    if (invalid) return invalid;
    console.error('Unable to create customer PayFast checkout:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to start secure checkout.' }, { status: 500 });
  }
}
