import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getProviderPlan } from '@/app/provider-plans/planCatalog';
import { enforcePublicRequestLimit, publicRequestError, readBoundedJson } from '@/services/publicRequestGuard';
import { getPayfastConfig, normalisePayfastFields, payfastSignature } from '@/services/payments/payfast';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Provider = { id: number; first_name: string | null; last_name: string | null; email: string | null; phone: string | null };

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://www.skillsconnectpro.co.za').replace(/\/+$/, '');
}

function normalisePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('0') ? `27${digits.slice(1)}` : digits;
}

async function findProvider(body: Record<string, unknown>): Promise<Provider | null> {
  const supabase = getSupabaseAdmin();
  const providerId = Number(body.providerId);
  if (Number.isInteger(providerId) && providerId > 0) {
    const { data, error } = await supabase.from('artisans').select('id, first_name, last_name, email, phone').eq('id', providerId).maybeSingle();
    if (error) throw new Error(`Unable to find provider: ${error.message}`);
    return data as Provider | null;
  }

  const identity = String(body.providerIdentity || '').trim();
  if (!identity) return null;
  if (identity.includes('@')) {
    const { data, error } = await supabase.from('artisans').select('id, first_name, last_name, email, phone').ilike('email', identity).maybeSingle();
    if (error) throw new Error(`Unable to find provider: ${error.message}`);
    return data as Provider | null;
  }
  const normalisedIdentity = normalisePhone(identity);
  const { data, error } = await supabase
    .from('artisans').select('id, first_name, last_name, email, phone')
    .or(`phone.eq.${identity},phone.eq.${normalisedIdentity},phone.eq.+${normalisedIdentity}`).maybeSingle();
  if (error) throw new Error(`Unable to find provider: ${error.message}`);
  return data as Provider | null;
}

export async function POST(request: Request) {
  try {
    const blocked = await enforcePublicRequestLimit(request, 'payfast_checkout', 10);
    if (blocked) return blocked;
    const body = await readBoundedJson(request, 10_000) as Record<string, unknown>;
    const plan = getProviderPlan(String(body.plan || ''));
    if (!plan) return NextResponse.json({ error: 'Please choose a valid provider plan.' }, { status: 400 });

    const provider = await findProvider(body);
    if (!provider) return NextResponse.json({ error: 'We could not find that provider account. Use the email address or mobile number you used when joining Skills Connect Pro.' }, { status: 404 });
    const config = getPayfastConfig();
    const amount = Number(plan.price.replace(/[^\d.]/g, ''));
    if (!Number.isFinite(amount) || amount < 5) throw new Error('This plan has an invalid payment amount.');

    const paymentReference = randomUUID();
    const baseUrl = siteUrl();
    const fields: Record<string, string | number | boolean | undefined> = {
      merchant_id: config.merchantId, merchant_key: config.merchantKey,
      return_url: `${baseUrl}/provider-payment-result?payment=${encodeURIComponent(paymentReference)}`,
      cancel_url: `${baseUrl}/provider-payment-result?payment=${encodeURIComponent(paymentReference)}&cancelled=1`,
      notify_url: `${baseUrl}/api/payments/payfast/itn`,
      name_first: provider.first_name || 'Skills Connect', name_last: provider.last_name || 'Provider', email_address: provider.email || undefined,
      m_payment_id: paymentReference, amount: amount.toFixed(2), item_name: `Skills Connect Pro ${plan.name}`,
      item_description: plan.kind === 'subscription' ? `${plan.name} monthly provider access` : `${plan.name} once-off provider lead pack`,
      custom_str1: String(provider.id), custom_str2: plan.code, custom_str3: plan.kind, email_confirmation: 1,
    };
    if (plan.kind === 'subscription') Object.assign(fields, {
      subscription_type: 1, recurring_amount: amount.toFixed(2), frequency: 3, cycles: 0, payment_method: 'cc',
      subscription_notify_email: true, subscription_notify_buyer: true,
    });
    const paymentFields = normalisePayfastFields(fields);
    const { error: insertError } = await getSupabaseAdmin().from('payment_transactions').insert({
      m_payment_id: paymentReference, provider_id: provider.id, plan_code: plan.code, plan_kind: plan.kind,
      amount_cents: Math.round(amount * 100), processor_status: 'INITIATED',
      metadata: { provider_name: `${provider.first_name || ''} ${provider.last_name || ''}`.trim(), payfast_mode: config.mode },
    });
    if (insertError) throw new Error(`Unable to start checkout: ${insertError.message}`);
    return NextResponse.json({ paymentUrl: config.processUrl, fields: { ...paymentFields, signature: payfastSignature(paymentFields, config.passphrase) } });
  } catch (error) {
    const invalid = publicRequestError(error);
    if (invalid) return invalid;
    console.error('Unable to create Payfast checkout:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to start secure checkout.' }, { status: 500 });
  }
}
