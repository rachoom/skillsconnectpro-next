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
    if (!paymentReference || !processorReference) return new NextResponse('Missing payment reference', { status: 400 });
    const supabase = getSupabaseAdmin();
    const { data: payment, error: paymentError } = await supabase.from('payment_transactions')
      .select('m_payment_id, amount_cents').eq('m_payment_id', paymentReference).maybeSingle();
    if (paymentError) throw new Error(`Unable to find payment: ${paymentError.message}`);
    if (!payment) return new NextResponse('Unknown payment', { status: 400 });
    const paidCents = Math.round(Number(fields.amount_gross) * 100);
    if (!Number.isFinite(paidCents) || paidCents !== Number(payment.amount_cents)) return new NextResponse('Payment amount does not match', { status: 400 });

    const { error: updateError } = await supabase.from('payment_transactions').update({
      processor_status: paymentStatus || 'UNKNOWN', payfast_payment_id: processorReference, subscription_token: fields.token || null,
      processor_payload: fields, updated_at: new Date().toISOString(),
    }).eq('m_payment_id', paymentReference);
    if (updateError) throw new Error(`Unable to record payment result: ${updateError.message}`);
    if (paymentStatus === 'COMPLETE') {
      const { error: entitlementError } = await supabase.rpc('grant_provider_payment_entitlement', { payment_ref: paymentReference, processor_ref: processorReference });
      if (entitlementError) throw new Error(`Unable to activate provider access: ${entitlementError.message}`);
    }
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Payfast ITN error:', error);
    return new NextResponse('Unable to process notification', { status: 500 });
  }
}
