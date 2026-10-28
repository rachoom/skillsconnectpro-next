import { NextResponse } from 'next/server';
import { getPayfastConfig, payfastSignature, secureEqualHex } from '@/services/payments/payfast';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function validateWithPayfast(rawPayload: string, validationUrl: string): Promise<boolean> {
  const response = await fetch(validationUrl, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: rawPayload, cache: 'no-store' });
  return response.ok && (await response.text()).trim() === 'VALID';
}

export async function POST(request: Request) {
  try {
    const rawPayload = await request.text();
    const received = new URLSearchParams(rawPayload);
    const signature = received.get('signature');
    const fields: Record<string, string> = {};
    for (const [key, value] of received.entries()) if (key !== 'signature') fields[key] = value;
    const config = getPayfastConfig();
    if (fields.merchant_id !== config.merchantId) return new NextResponse('Unknown merchant', { status: 400 });
    if (!secureEqualHex(signature, payfastSignature(fields, config.passphrase))) return new NextResponse('Invalid signature', { status: 400 });
    if (!await validateWithPayfast(rawPayload, config.validateUrl)) return new NextResponse('Payment validation failed', { status: 400 });

    const paymentReference = fields.m_payment_id;
    const paymentStatus = String(fields.payment_status || '').toUpperCase();
    const processorReference = fields.pf_payment_id;
    const token = fields.token?.trim();
    if (!processorReference) return new NextResponse('Missing Payfast payment reference', { status: 400 });
    if (!['COMPLETE', 'CANCELLED'].includes(paymentStatus)) {
      return new NextResponse('OK', { status: 200 });
    }
    const supabase = getSupabaseAdmin();
    const providerColumns = 'm_payment_id,provider_id,plan_code,plan_kind,amount_cents,subscription_token,processor_status,metadata';
    let providerPayment = null as null | { m_payment_id: string; provider_id: number; plan_code: string; plan_kind: string; amount_cents: number; subscription_token: string | null; processor_status: string; metadata: Record<string, unknown> | null };
    if (paymentReference) {
      const result = await supabase.from('payment_transactions').select(providerColumns)
        .eq('m_payment_id', paymentReference).maybeSingle();
      if (result.error) throw new Error(`Provider lookup failed: ${result.error.message}`);
      providerPayment = result.data as typeof providerPayment;
    }
    // On later recurring cycles, Payfast may omit or change the original
    // merchant reference. A signed, Payfast-validated subscription token is
    // used only to find the original verified subscription (never a lead pack).
    if (!providerPayment && token) {
      const result = await supabase.from('payment_transactions').select(providerColumns)
        .eq('subscription_token', token).eq('plan_kind', 'subscription')
        .eq('processor_status', 'COMPLETE').order('created_at', { ascending: false })
        .limit(1).maybeSingle();
      if (result.error) throw new Error(`Renewal token lookup failed: ${result.error.message}`);
      providerPayment = result.data as typeof providerPayment;
    }
    const { data: customerPayment, error: customerPaymentError } = providerPayment || !paymentReference
      ? { data: null, error: null }
      : await supabase.from('customer_payment_transactions')
          .select('m_payment_id, amount_cents').eq('m_payment_id', paymentReference).maybeSingle();
    if (customerPaymentError) throw new Error(`Customer payment lookup failed: ${customerPaymentError.message}`);
    if (!providerPayment && !customerPayment) return new NextResponse('Unknown payment', { status: 400 });

    if (providerPayment?.plan_kind === 'subscription' && providerPayment.subscription_token &&
        token !== providerPayment.subscription_token) {
      return new NextResponse('Subscription token does not match', { status: 400 });
    }
    if (providerPayment?.plan_kind === 'lead_pack' && token) {
      return new NextResponse('Unexpected recurring token on lead pack', { status: 400 });
    }
    if (paymentStatus === 'CANCELLED') {
      if (!providerPayment || providerPayment.plan_kind !== 'subscription' || !token ||
          token !== providerPayment.subscription_token) {
        return new NextResponse('Unrecognised subscription cancellation', { status: 400 });
      }
      const cancellation = await supabase.rpc('record_provider_subscription_cancellation', {
        p_provider_id: providerPayment.provider_id, p_plan_code: providerPayment.plan_code,
      });
      if (cancellation.error) throw new Error(`Cancellation could not be recorded: ${cancellation.error.message}`);
      return new NextResponse('OK', { status: 200 });
    }

    const payment = providerPayment ?? customerPayment;
    const paidCents = Math.round(Number(fields.amount_gross) * 100);
    if (!Number.isFinite(paidCents) || paidCents !== Number(payment!.amount_cents)) {
      return new NextResponse('Payment amount does not match', { status: 400 });
    }
    const referenceForGrant = providerPayment?.m_payment_id ?? customerPayment!.m_payment_id;
    const target = providerPayment ? 'payment_transactions' : 'customer_payment_transactions';
    const update = providerPayment
      ? { processor_status: 'COMPLETE', payfast_payment_id: processorReference,
          subscription_token: token || providerPayment.subscription_token, processor_payload: fields,
          updated_at: new Date().toISOString() }
      : { processor_status: 'COMPLETE', payfast_payment_id: processorReference,
          processor_payload: fields, updated_at: new Date().toISOString() };
    const saved = await supabase.from(target).update(update).eq('m_payment_id', referenceForGrant);
    if (saved.error) throw new Error(`Unable to record payment: ${saved.error.message}`);
    const entitlement = await supabase.rpc(providerPayment
      ? 'grant_provider_payment_entitlement' : 'grant_customer_payment_entitlement',
      { payment_ref: referenceForGrant, processor_ref: processorReference });
    if (entitlement.error) throw new Error(`Unable to activate verified payment: ${entitlement.error.message}`);
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Payfast ITN error:', error);
    return new NextResponse('Unable to process notification', { status: 500 });
  }
}
