import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';

export const dynamic = 'force-dynamic';

export default async function CustomerPaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string; cancelled?: string }>;
}) {
  const params = await searchParams;
  const paymentReference = typeof params.payment === 'string' ? params.payment : '';
  const cancelled = params.cancelled === '1';
  const { user } = await getAuthenticatedAccount();

  if (!user) {
    const next = `/customer-payment-result?payment=${encodeURIComponent(paymentReference)}${cancelled ? '&cancelled=1' : ''}`;
    redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  }

  const { data: payment } = paymentReference
    ? await getSupabaseAdmin()
        .from('customer_payment_transactions')
        .select('m_payment_id,plan_code,processor_status,amount_cents,updated_at')
        .eq('m_payment_id', paymentReference)
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null };

  const complete = payment?.processor_status === 'COMPLETE';
  const title = cancelled ? 'Payment cancelled' : complete ? 'Your plan is active' : 'Payment confirmation pending';
  const Icon = cancelled ? XCircle : complete ? CheckCircle2 : Clock3;

  return (
    <main className="min-h-screen bg-[#061008] px-4 py-12 text-[#f8f3e5]">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-white/12 bg-white/[.045] p-7 text-center shadow-2xl shadow-black/30 backdrop-blur-xl md:p-10">
        <Icon className={cancelled ? 'mx-auto text-[#ff8c7f]' : complete ? 'mx-auto text-[#65f3a7]' : 'mx-auto text-[#ffe17a]'} size={48} />
        <h1 className="mt-5 text-3xl font-black text-white">{title}</h1>
        <p className="mt-4 text-sm leading-7 text-white/65">
          {cancelled
            ? 'No homeowner-plan access has been activated.'
            : complete
              ? 'PayFast confirmed the payment and Skills Connect Pro has activated your homeowner plan.'
              : 'PayFast may return you to the site before its secure payment notification arrives. Refresh shortly to see the confirmed status.'}
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Link href="/plans?audience=homeowners" className="rounded-xl border border-white/15 px-4 py-3.5 text-sm font-black text-white">Back to plans</Link>
          <Link href="/my-projects" className="rounded-xl bg-[#ffd75f] px-4 py-3.5 text-sm font-black text-[#211800]">Open My Projects</Link>
        </div>
      </section>
    </main>
  );
}
