import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { enforcePublicRequestLimit, publicRequestError, readBoundedJson } from '@/services/publicRequestGuard';
import { getPayfastConfig, normalisePayfastFields, payfastNotificationUrl, payfastSignature } from '@/services/payments/payfast';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CustomerPlan = { code: string; name: string; price_cents: number; duration_days: number | null };

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://www.skillsconnectpro.co.za').replace(/\/+$/, '');
}

function nameParts(name: string | null, email: string | null) {
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length) return { first: words[0], last: words.slice(1).join(' ') || 'Customer' };
  return { first: email?.split('@')[0] || 'Skills', last: 'Customer' };
}

export async function POST(request: Request) {
  try {
    const blocked = await enforcePublicRequestLimit(request, 'customer_payfast_checkout', 10);
    if (blocked) return blocked;
    const body = await readBoundedJson(request, 10_000) as Record<string, unknown>;
    const planCode = String(body.planCode || '');
    if (!['basic_30', 'project_pass_90'].includes(planCode)) return NextResponse.json({ error: 'Please choose a valid paid project plan.' }, { status: 400 });

    const { user } = await getAuthenticatedAccount();
    if (!user) return NextResponse.json({ error: 'Please sign in before starting checkout.' }, { status: 401 });
    const admin = getSupabaseAdmin();
    const [{ data: plan, error: planError }, { data: profile, error: profileError }] = await Promise.all([
      admin.from('plans').select('code,name,price_cents,duration_days').eq('code', planCode).eq('active', true).gt('price_cents', 0).maybeSingle(),
      admin.from('profiles').select('display_name').eq('id', user.id).maybeSingle(),
    ]);
    if (planError) throw new Error(`Unable to load plan: ${planError.message}`);
    if (profileError) throw new Error(`Unable to load customer account: ${profileError.message}`);
    const customerPlan = plan as CustomerPlan | null;
    if (!customerPlan || !customerPlan.duration_days || customerPlan.price_cents <= 0) return NextResponse.json({ error: 'That project plan is not currently available.' }, { status: 400 });

    const config = getPayfastConfig();
    const amount = customerPlan.price_cents / 100;
    const paymentReference = randomUUID();
    const baseUrl = siteUrl();
    const customerName = nameParts(profile?.display_name ?? user.name, user.email);
    const fields: Record<string, string | number | boolean | undefined> = {
      merchant_id: config.merchantId, merchant_key: config.merchantKey,
      return_url: `${baseUrl}/customer-payment-result?payment=${encodeURIComponent(paymentReference)}`,
      cancel_url: `${baseUrl}/customer-payment-result?payment=${encodeURIComponent(paymentReference)}&cancelled=1`,
      notify_url: payfastNotificationUrl(baseUrl, config.mode),
      name_first: customerName.first, name_last: customerName.last, email_address: user.email || undefined,
      m_payment_id: paymentReference, amount: amount.toFixed(2), item_name: `Skills Connect Pro ${customerPlan.name}`,
      item_description: `${customerPlan.name} project workspace access for ${customerPlan.duration_days} days`,
      custom_str1: user.id, custom_str2: customerPlan.code, custom_str3: 'customer_workspace', email_confirmation: 1,
    };
    const paymentFields = normalisePayfastFields(fields);
    const { error: insertError } = await admin.from('customer_payment_transactions').insert({
      m_payment_id: paymentReference, user_id: user.id, plan_code: customerPlan.code, amount_cents: customerPlan.price_cents,
      processor_status: 'INITIATED', metadata: { customer_email: user.email, payfast_mode: config.mode },
    });
    if (insertError) throw new Error(`Unable to start checkout: ${insertError.message}`);
    return NextResponse.json({ paymentUrl: config.processUrl, fields: { ...paymentFields, signature: payfastSignature(paymentFields, config.passphrase) } });
  } catch (error) {
    const invalid = publicRequestError(error);
    if (invalid) return invalid;
    console.error('Unable to create customer Payfast checkout:', error);
    const technicalMessage = error instanceof Error ? error.message : '';
    const publicMessage = technicalMessage.includes('Payfast is not configured')
      ? 'Secure checkout is temporarily unavailable while payment configuration is being restored. Please try again shortly.'
      : technicalMessage || 'Unable to start secure checkout.';
    return NextResponse.json({ error: publicMessage }, { status: technicalMessage.includes('Payfast is not configured') ? 503 : 500 });
  }
}
