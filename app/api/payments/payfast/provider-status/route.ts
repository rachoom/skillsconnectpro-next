import { NextResponse } from 'next/server';
import { enforcePublicRequestLimit } from '@/services/publicRequestGuard';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { providerPlans } from '@/app/provider-plans/planCatalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const noCache = { 'Cache-Control': 'private, no-store, max-age=0' };
const referencePattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

// Require both an unguessable reference and authenticated provider ownership.
// Never expose private contact details or processor subscription tokens.
export async function GET(request: Request) {
  const { supabase, user } = await getAuthenticatedAccount();
  if (!user) return NextResponse.json({ error: 'Sign in to check your payment.' }, { status: 401, headers: noCache });
  const { data: role, error: roleError } = await supabase.from('account_roles')
    .select('linked_artisan_id').eq('user_id', user.id).eq('role', 'artisan').eq('status', 'active').maybeSingle();
  if (roleError || !role?.linked_artisan_id) return NextResponse.json({ error: 'Approved artisan account required.' }, { status: 403, headers: noCache });
  const rateLimit = await enforcePublicRequestLimit(request, 'provider_payment_status', 90, 3_600);
  if (rateLimit) return rateLimit;

  const ref = new URL(request.url).searchParams.get('payment') ?? '';
  if (!referencePattern.test(ref)) {
    return NextResponse.json({ error: 'Invalid payment reference.' }, { status: 400, headers: noCache });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data: payment, error } = await admin.from('payment_transactions')
      .select('provider_id,plan_code,plan_kind,processor_status')
      .eq('m_payment_id', ref).eq('provider_id', role.linked_artisan_id).maybeSingle();
    if (error) throw error;
    if (!payment) return NextResponse.json({ error: 'Payment reference not found.' },
      { status: 404, headers: noCache });

    const plan = providerPlans.find((p) => p.code === payment.plan_code);
    const planLabel = plan?.name ?? 'Provider plan';
    let status: 'processing' | 'confirmed' | 'cancelled' = 'processing';
    let accessActive = false;
    const processorStatus = String(payment.processor_status || '').toUpperCase();

    if (processorStatus === 'CANCELLED' || processorStatus === 'FAILED') {
      status = 'cancelled';
    } else if (processorStatus === 'COMPLETE') {
      const event = await admin.from('payment_events').select('payfast_payment_id')
        .eq('m_payment_id', ref).limit(1).maybeSingle();
      if (event.error) throw event.error;
      // A Payfast browser redirect is never proof of entitlement. Only a
      // verified ITN followed by successful entitlement activation is enough.
      const { data: entitlement, error: entitlementError } = await admin
        .from('subscription_entitlements')
        .select('id')
        .eq('subject_type', 'provider')
        .eq('subject_id', String(payment.provider_id))
        .eq('plan_code', payment.plan_code)
        .eq('status', 'active')
        .lte('starts_at', new Date().toISOString())
        .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`)
        .limit(1).maybeSingle();
      if (entitlementError) throw entitlementError;
      if (event.data) {
        status = 'confirmed';
        accessActive = Boolean(entitlement);
      }
    }

    return NextResponse.json({
      status, accessActive, planName: planLabel, planPrice: plan?.price ?? null,
      kind: payment.plan_kind === 'subscription' ? 'subscription' : 'lead_pack',
      verified: status === 'confirmed',
    }, { headers: noCache });
  } catch (error) {
    console.error('Provider payment status lookup failed:',
      error instanceof Error ? error.message : 'Unknown database error');
    return NextResponse.json({ error: 'Payment status is temporarily unavailable.' },
      { status: 503, headers: noCache });
  }
}
