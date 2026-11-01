import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getProviderPlan } from '@/app/provider-plans/planCatalog';
import { enforcePublicRequestLimit, publicRequestError, readBoundedJson } from '@/services/publicRequestGuard';
import { getPayfastConfig, normalisePayfastFields, payfastNotificationUrl, payfastSignature } from '@/services/payments/payfast';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';

import { getAuthenticatedAccount } from '@/services/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Provider = { id: number; first_name: string | null; last_name: string | null; email: string | null; phone: string | null };

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://www.skillsconnectpro.co.za').replace(/\/+$/, '');
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedAccount();
    if (!user) return NextResponse.json({ error: 'Sign in to your artisan account to continue.' }, { status: 401 });
    const blocked = await enforcePublicRequestLimit(request, 'payfast_checkout', 10);
    if (blocked) return blocked;
    const body = await readBoundedJson(request, 10_000) as Record<string, unknown>;
    const plan = getProviderPlan(String(body.plan || ''));
    if (!plan) return NextResponse.json({ error: 'Please choose a valid provider plan.' }, { status: 400 });

    // Identity is derived exclusively from a trusted account-role linkage.
    // Ignore all browser-supplied provider IDs, email addresses and phone numbers.
    const { data: role, error: roleError } = await supabase.from('account_roles')
      .select('linked_artisan_id').eq('user_id', user.id)
      .eq('role', 'artisan').eq('status', 'active').maybeSingle();
    const providerId = Number(role?.linked_artisan_id);
    if (roleError || !Number.isInteger(providerId) || providerId <= 0) {
      return NextResponse.json({ error: 'An approved, linked artisan account is required. Open your Artisan Business Workspace or contact support.' }, { status: 403 });
    }
    const { data, error: providerError } = await getSupabaseAdmin().from('artisans')
      .select('id, first_name, last_name, email, phone').eq('id', providerId).maybeSingle();
    if (providerError) throw providerError;
    const provider = data as Provider | null;
    if (!provider) return NextResponse.json({ error: 'Your artisan account is unavailable. Contact support.' }, { status: 403 });
    // Prevent an artisan from unintentionally paying for two automatically
    // renewing monthly plans. Changing tiers is available once the current
    // paid period ends, after the old recurring subscription is cancelled.
    if (plan.kind === 'subscription') {
      const existing = await getSupabaseAdmin().from('subscription_entitlements')
        .select('plan_code,ends_at').eq('subject_type', 'provider')
        .eq('subject_id', String(provider.id)).eq('status', 'active')
        .in('plan_code', ['starter_monthly','growth_monthly','pro_monthly'])
        .gt('ends_at', new Date().toISOString()).limit(1).maybeSingle();
      if (existing.error) throw new Error('Unable to verify existing provider subscriptions.');
      if (existing.data) {
        return NextResponse.json({
          error: 'You already have an active monthly plan. Cancel its future renewals from your Artisan Business Workspace and choose a new tier when the current paid period ends.',
          currentPlan: existing.data.plan_code,
        }, { status: 409 });
      }
    }
    const config = getPayfastConfig();
    const amount = Number(plan.price.replace(/[^\d.]/g, ''));
    if (!Number.isFinite(amount) || amount < 5) throw new Error('This plan has an invalid payment amount.');

    const paymentReference = randomUUID();
    const baseUrl = siteUrl();
    const fields: Record<string, string | number | boolean | undefined> = {
      merchant_id: config.merchantId, merchant_key: config.merchantKey,
      return_url: `${baseUrl}/provider-payment-result?payment=${encodeURIComponent(paymentReference)}`,
      cancel_url: `${baseUrl}/provider-payment-result?payment=${encodeURIComponent(paymentReference)}&cancelled=1`,
      notify_url: payfastNotificationUrl(baseUrl, config.mode),
      name_first: provider.first_name || 'Skills Connect', name_last: provider.last_name || 'Provider', email_address: provider.email || undefined,
      m_payment_id: paymentReference, amount: amount.toFixed(2), item_name: `Skills Connect Pro ${plan.name}`,
      item_description: plan.kind === 'subscription' ? `${plan.name} monthly provider access` : `${plan.name} once-off provider lead pack`,
      custom_str1: String(provider.id), custom_str2: plan.code, custom_str3: plan.kind, email_confirmation: 1,
    };
    // Keep recurring fields in Payfast's documented order; card selection is handled by Payfast.
    if (plan.kind === 'subscription') Object.assign(fields, {
      subscription_type: 1, recurring_amount: amount.toFixed(2), frequency: 3, cycles: 0,
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
    const technicalMessage = error instanceof Error ? error.message : '';
    const publicMessage = technicalMessage.includes('Payfast is not configured')
      ? 'Secure checkout is temporarily unavailable while payment configuration is being restored. Please try again shortly.'
      : 'Unable to start secure checkout. Please try again shortly.';
    return NextResponse.json({ error: publicMessage }, { status: technicalMessage.includes('Payfast is not configured') ? 503 : 500 });
  }
}
