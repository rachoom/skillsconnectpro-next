import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';
import { GROWTH_TEST_PROVIDER_ID, GROWTH_TEST_COOKIE, growthSandboxEnabled, growthSandboxSecret, growthTestReceipt, isValidGrowthTestToken } from '@/services/payments/sandboxGrowthTest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const noStore = { 'Cache-Control': 'private, no-store, max-age=0' };
const refPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

export async function GET(request: NextRequest) {
  if (!growthSandboxEnabled()) return new NextResponse('Not found', { status: 404 });
  const ref = request.nextUrl.searchParams.get('payment') || '';
  const cookie = request.cookies.get(GROWTH_TEST_COOKIE)?.value || '';
  const expectedReceipt = refPattern.test(ref) ? growthTestReceipt(ref, growthSandboxSecret()) : '';
  const token = cookie.slice(ref.length + 1);
  if (!refPattern.test(ref) || cookie !== ref + '.' + token || !isValidGrowthTestToken(token, expectedReceipt)) {
    return NextResponse.json({ error: 'This test session is unavailable. Use the original test checkout on this device.' }, { status: 403, headers: noStore });
  }

  try {
    const db = getSupabaseAdmin();
    const { data: payment, error } = await db.from('payment_transactions')
      .select('plan_code,processor_status')
      .eq('m_payment_id', ref).eq('provider_id', GROWTH_TEST_PROVIDER_ID)
      .eq('plan_code', 'growth_monthly').maybeSingle();
    if (error) throw error;
    if (!payment) return NextResponse.json({ error: 'Sandbox payment not found' }, { status: 404, headers: noStore });
    let status = 'processing', active = false;
    const processor = String(payment.processor_status || '').toUpperCase();
    if (processor === 'COMPLETE') {
      const [events, entitlements] = await Promise.all([
        db.from('payment_events').select('payfast_payment_id')
          .eq('m_payment_id', ref).limit(1).maybeSingle(),
        db.from('subscription_entitlements').select('qualified_leads_limit,qualified_leads_used,ends_at')
          .eq('subject_type', 'provider').eq('subject_id', String(GROWTH_TEST_PROVIDER_ID))
          .eq('plan_code', 'growth_monthly').eq('status', 'active')
          .gt('ends_at', new Date().toISOString()).limit(1).maybeSingle(),
      ]);
      if (events.error || entitlements.error) throw events.error || entitlements.error;
      if (events.data && entitlements.data) {
        status = 'confirmed';
        active = entitlements.data.qualified_leads_limit === 40;
      }
    } else if (processor === 'FAILED' || processor === 'CANCELLED') status = 'cancelled';
    return NextResponse.json({ status, active, plan: 'Growth', quota: active ? 40 : null }, { headers: noStore });
  } catch (err) {
    console.error('Growth sandbox status check failed', err instanceof Error ? err.message : 'unknown');
    return NextResponse.json({ error: 'Unable to confirm sandbox payment status' }, { status: 503, headers: noStore });
  }
}
