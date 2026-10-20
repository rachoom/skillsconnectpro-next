import { NextResponse } from 'next/server';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: quoteId } = await params;
  const { supabase, user } = await getAuthenticatedAccount();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const { data: quote } = await supabase
    .from('supplier_quotes')
    .select('id,request_id,partner_id,status,total')
    .eq('id', quoteId)
    .maybeSingle();

  if (!quote || !['submitted', 'accepted'].includes(quote.status)) {
    return NextResponse.json({ error: 'Quotation not found or unavailable.' }, { status: 404 });
  }

  const { data: requestRow } = await supabase
    .from('material_quote_requests')
    .select('id,project_id,status,selected_quote_id')
    .eq('id', quote.request_id)
    .maybeSingle();

  if (!requestRow || !['open', 'awarded'].includes(requestRow.status)) {
    return NextResponse.json({ error: 'This quotation request can no longer be awarded.' }, { status: 409 });
  }
  if (requestRow.selected_quote_id && requestRow.selected_quote_id !== quoteId) {
    return NextResponse.json({ error: 'Another quotation has already been selected.' }, { status: 409 });
  }

  const admin = getSupabaseAdmin();
  const { data: partner } = await admin.from('hardware_partners').select('commission_rate').eq('id', quote.partner_id).single();
  const total = Number(quote.total ?? 0);
  const rate = Number(partner?.commission_rate ?? 0);
  const commission = Math.round(total * rate * 100) / 100;

  const { data: order, error: orderError } = await admin.from('hardware_orders').upsert({
    project_id: requestRow.project_id,
    request_id: requestRow.id,
    quote_id: quoteId,
    partner_id: quote.partner_id,
    customer_id: user.id,
    status: 'accepted',
    payment_status: 'not_reported',
    order_total: total,
    commission_rate: rate,
    commission_amount: commission,
  }, { onConflict: 'quote_id' }).select('id').single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Unable to create the supplier order.' }, { status: 500 });
  }

  await Promise.all([
    admin.from('material_quote_requests').update({ status: 'awarded', selected_quote_id: quoteId }).eq('id', requestRow.id),
    admin.from('supplier_quotes').update({ status: 'accepted' }).eq('id', quoteId),
    admin.from('supplier_quotes').update({ status: 'declined' }).eq('request_id', requestRow.id).neq('id', quoteId).eq('status', 'submitted'),
    admin.from('hardware_commission_ledger').upsert({
      order_id: order.id,
      partner_id: quote.partner_id,
      amount: commission,
      status: 'pending',
      metadata: { source: 'hardware_quote_acceptance' },
    }, { onConflict: 'order_id' }),
  ]);

  return NextResponse.json({ accepted: true, orderId: order.id });
}
