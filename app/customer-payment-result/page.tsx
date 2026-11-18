import { createHash } from 'node:crypto';
import Link from 'next/link';
import { CheckCircle2, Clock3, LockKeyhole, XCircle } from 'lucide-react';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';

export const dynamic = 'force-dynamic';

function tokenHash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export default async function CustomerPaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string; cancelled?: string; claim?: string }>;
}) {
  const params = await searchParams;
  const paymentReference = typeof params.payment === 'string' ? params.payment : '';
  const claimToken = typeof params.claim === 'string' ? params.claim : '';
  const cancelled = params.cancelled === '1';
  const { user } = await getAuthenticatedAccount();
  const supabase = getSupabaseAdmin();

  let { data: payment } = paymentReference
    ? await supabase
        .from('customer_payment_transactions')
        .select('m_payment_id,user_id,plan_code,processor_status,amount_cents,payfast_payment_id,claim_token_hash,claim_expires_at,claimed_at,updated_at')
        .eq('m_payment_id', paymentReference)
        .maybeSingle()
    : { data: null };

  const suppliedClaimHash = claimToken ? tokenHash(claimToken) : '';
  const claimValid = Boolean(
    payment &&
    payment.claim_token_hash &&
    suppliedClaimHash &&
    payment.claim_token_hash === suppliedClaimHash &&
    payment.claim_expires_at &&
    new Date(payment.claim_expires_at).getTime() > Date.now()
  );

  // Do not reveal a guest payment status unless the visitor holds its one-time
  // claim token. Signed-in owners can always view their own payment.
  if (payment && !payment.user_id && !claimValid) payment = null;
  if (payment?.user_id && (!user || payment.user_id !== user.id)) payment = null;

  // A guest can pay first and attach the purchase only after authenticating.
  if (payment && user && !payment.user_id && claimValid) {
    const { data: claimedPayment, error: claimError } = await supabase
      .from('customer_payment_transactions')
      .update({
        user_id: user.id,
        claimed_at: new Date().toISOString(),
      })
      .eq('m_payment_id', payment.m_payment_id)
      .is('user_id', null)
      .eq('claim_token_hash', suppliedClaimHash)
      .select('m_payment_id,user_id,plan_code,processor_status,amount_cents,payfast_payment_id,claim_token_hash,claim_expires_at,claimed_at,updated_at')
      .maybeSingle();

    if (!claimError && claimedPayment) {
      payment = claimedPayment;
      if (payment.processor_status === 'COMPLETE' && payment.payfast_payment_id) {
        await supabase.rpc('grant_customer_payment_entitlement', {
          payment_ref: payment.m_payment_id,
          processor_ref: payment.payfast_payment_id,
        });
      }
    }
  }

  const complete = payment?.processor_status === 'COMPLETE';
  const owned = Boolean(payment && user && payment.user_id === user.id);
  const guestPaid = Boolean(payment && complete && !payment.user_id && claimValid);
  const title = cancelled
    ? 'Payment cancelled'
    : complete
      ? owned ? 'Your plan is active' : 'Payment received'
      : 'Payment confirmation pending';
  const Icon = cancelled ? XCircle : complete ? CheckCircle2 : Clock3;

  const nextPath = `/customer-payment-result?payment=${encodeURIComponent(paymentReference)}${claimToken ? `&claim=${encodeURIComponent(claimToken)}` : ''}`;

  return (
    <main className="min-h-screen bg-[#061008] px-4 py-12 text-[#f8f3e5]">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-white/12 bg-white/[.045] p-7 text-center shadow-2xl shadow-black/30 backdrop-blur-xl md:p-10">
        <Icon className={cancelled ? 'mx-auto text-[#ff8c7f]' : complete ? 'mx-auto text-[#65f3a7]' : 'mx-auto text-[#ffe17a]'} size={48} />
        <h1 className="mt-5 text-3xl font-black text-white">{title}</h1>
        <p className="mt-4 text-sm leading-7 text-white/65">
          {!payment
            ? 'We could not verify this payment link. Return to the plans page and reopen your checkout.'
            : cancelled
              ? 'No homeowner-plan access has been activated.'
              : owned && complete
                ? 'PayFast confirmed the payment and Skills Connect Pro has activated your homeowner plan.'
                : guestPaid
                  ? 'PayFast confirmed your payment. Your purchase is safe. Secure it to a Skills Connect Pro account whenever you are ready so you can reopen it on another device.'
                  : 'PayFast may return you to the site before its secure payment notification arrives. Refresh this page shortly to see the confirmed status.'}
        </p>

        {guestPaid && !user && (
          <div className="mt-6 rounded-2xl border border-[#ffd75f]/25 bg-[#ffd75f]/[.07] p-5 text-left">
            <div className="flex gap-3">
              <LockKeyhole className="mt-0.5 shrink-0 text-[#ffe17a]" size={20} />
              <div>
                <h2 className="font-black text-white">Secure your purchased plan</h2>
                <p className="mt-2 text-sm leading-6 text-white/62">Payment is already complete. Signing in now only protects access to the plan; it was not required to pay.</p>
              </div>
            </div>
            <Link href={`/sign-in?next=${encodeURIComponent(nextPath)}`} className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#ffd75f] px-4 py-3.5 text-sm font-black text-[#211800]">
              Secure my access
            </Link>
          </div>
        )}

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Link href="/plans?audience=homeowners" className="rounded-xl border border-white/15 px-4 py-3.5 text-sm font-black text-white">Back to plans</Link>
          {owned ? (
            <Link href="/my-projects" className="rounded-xl bg-[#ffd75f] px-4 py-3.5 text-sm font-black text-[#211800]">Open My Projects</Link>
          ) : (
            <Link href="/" className="rounded-xl border border-white/15 px-4 py-3.5 text-sm font-black text-white">Home</Link>
          )}
        </div>
      </section>
    </main>
  );
}
