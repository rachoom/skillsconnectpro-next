import { NextResponse } from 'next/server';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';
import { enforcePublicRequestLimit } from '@/services/publicRequestGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const noCache = { 'Cache-Control': 'private, no-store, max-age=0' };
const referencePattern = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

export async function GET(request: Request) {
  try {
    const { user } = await getAuthenticatedAccount();
    if (!user) return NextResponse.json({ error: 'Sign in to check your payment.' }, { status: 401, headers: noCache });
    const blocked = await enforcePublicRequestLimit(request, 'customer_payment_status', 90, 3600);
    if (blocked) return blocked;
    const reference = new URL(request.url).searchParams.get('payment') || '';
    if (!referencePattern.test(reference)) return NextResponse.json({ error: 'Invalid payment reference.' }, { status: 400, headers: noCache });
    const admin = getSupabaseAdmin();
    const result = await admin.from('customer_payment_transactions')
      .select('processor_status,plan_code').eq('m_payment_id', reference).eq('user_id', user.id).maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) return NextResponse.json({ error: 'Payment not found for this account.' }, { status: 404, headers: noCache });
    let status = 'processing';
    let accessActive = false;
    const processorStatus = String(result.data.processor_status || '').toUpperCase();
    if (['FAILED', 'CANCELLED'].includes(processorStatus)) status = 'cancelled';
    if (processorStatus === 'COMPLETE') {
      // This row is created atomically with entitlement activation. COMPLETE
      // alone can precede a failed grant, so never use it as proof of access.
      const subscription = await admin.from('account_subscriptions')
        .select('status,starts_at,ends_at').eq('user_id', user.id)
        .eq('payment_reference', reference).limit(1).maybeSingle();
      if (subscription.error) throw subscription.error;
      if (subscription.data) {
        status = 'confirmed';
        const now = Date.now();
        accessActive = subscription.data.status === 'active'
          && new Date(subscription.data.starts_at).getTime() <= now
          && (!subscription.data.ends_at || new Date(subscription.data.ends_at).getTime() > now);
      }
    }
    return NextResponse.json({ status, accessActive, verified: status === 'confirmed' }, { headers: noCache });
  } catch (error) {
    console.error('Customer payment status lookup failed:', error);
    return NextResponse.json({ error: 'Payment status is temporarily unavailable.' }, { status: 503, headers: noCache });
  }
}
