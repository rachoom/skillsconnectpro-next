import { NextResponse } from 'next/server';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';
import { cancelPayfastSubscription } from '@/services/payments/payfast';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The provider ID is always derived from the authenticated account role.
// A client cannot submit an arbitrary provider ID or subscription token.
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  let sameOrigin = false;
  try { sameOrigin = Boolean(origin && host && new URL(origin).host === host); } catch {}
  if (!sameOrigin) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }
  const { supabase, user } = await getAuthenticatedAccount();
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const { data: role, error: roleError } = await supabase.from('account_roles')
    .select('linked_artisan_id').eq('user_id', user.id)
    .eq('role', 'artisan').eq('status', 'active').maybeSingle();
  if (roleError || !role?.linked_artisan_id) {
    return NextResponse.json({ error: 'Approved artisan account required' }, { status: 403 });
  }
  const providerId = Number(role.linked_artisan_id);
  if (!Number.isInteger(providerId) || providerId <= 0) {
    return NextResponse.json({ error: 'Invalid provider linkage' }, { status: 403 });
  }
  const admin = getSupabaseAdmin();
  const entitlements = await admin.from('subscription_entitlements')
    .select('id,plan_code,status,metadata').eq('subject_type', 'provider')
    .eq('subject_id', String(providerId)).eq('status', 'active')
    .in('plan_code', ['starter_monthly','growth_monthly','pro_monthly'])
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (entitlements.error || !entitlements.data) {
    return NextResponse.json({ error: 'No active provider subscription found' }, { status: 404 });
  }
  const subscription = entitlements.data;
  if (subscription.metadata?.cancel_at_period_end === true) {
    return NextResponse.json({ ok: true, alreadyCancelled: true });
  }
  const payment = await admin.from('payment_transactions')
    .select('subscription_token').eq('provider_id', providerId)
    .eq('plan_code', subscription.plan_code).eq('processor_status', 'COMPLETE')
    .not('subscription_token', 'is', null)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (payment.error || !payment.data?.subscription_token) {
    return NextResponse.json({ error: 'Cancellation token unavailable. Contact support for assistance.' }, { status: 409 });
  }
  try {
    const cancelled = await cancelPayfastSubscription(payment.data.subscription_token);
    if (!cancelled) {
      return NextResponse.json({ error: 'Payfast did not confirm cancellation. Please contact support.' }, { status: 502 });
    }
    const result = await admin.rpc('record_provider_subscription_cancellation', {
      p_provider_id: providerId, p_plan_code: subscription.plan_code,
    });
    if (result.error || result.data !== true) {
      console.error('Subscription cancelled at Payfast but local reconciliation failed:', result.error?.message ?? 'no active entitlement');
      return NextResponse.json({ error: 'Payfast accepted cancellation; support must confirm the local update.' }, { status: 503 });
    }
    return NextResponse.json({ ok: true, message: 'Future recurring payments cancelled. Current access remains until the paid period ends.' });
  } catch (error) {
    console.error('Unable to cancel provider subscription:', error);
    return NextResponse.json({ error: 'Unable to contact Payfast. Try again or contact support.' }, { status: 502 });
  }
}
