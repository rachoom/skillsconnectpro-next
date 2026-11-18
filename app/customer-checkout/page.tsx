import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, CreditCard, LockKeyhole, ShieldCheck } from 'lucide-react';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';
import { CustomerCheckoutForm } from './CustomerCheckoutForm';

export const dynamic = 'force-dynamic';

export default async function CustomerCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan: planCode } = await searchParams;
  const code = typeof planCode === 'string' ? planCode : '';
  if (!['basic_30', 'project_pass_90'].includes(code)) {
    redirect('/plans?audience=homeowners');
  }


  const { data: plan, error } = await getSupabaseAdmin()
    .from('plans')
    .select('code,name,price_cents,duration_days,active')
    .eq('code', code)
    .eq('active', true)
    .maybeSingle();

  if (error || !plan || !plan.duration_days || plan.price_cents <= 0) {
    redirect('/plans?audience=homeowners');
  }

  const price = new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(plan.price_cents / 100);

  return (
    <main className="min-h-screen bg-[#061008] px-4 py-8 text-[#f8f3e5] md:px-8 md:py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/plans?audience=homeowners" className="inline-flex items-center gap-2 text-sm font-bold text-[#ffe17a]">
          <ArrowLeft size={17} /> Back to homeowner plans
        </Link>

        <section className="mt-7 overflow-hidden rounded-[2rem] border border-[#ffd75f]/30 bg-[linear-gradient(145deg,rgba(20,30,22,.92),rgba(6,14,8,.98))] p-6 shadow-2xl shadow-black/35 md:p-9">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-[#ffd75f]/35 bg-[#ffd75f]/10 text-[#ffe17a]">
            <CreditCard size={23} />
          </div>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.15em] text-[#ffe17a]">Secure homeowner checkout</p>
          <h1 className="mt-3 text-3xl font-black text-white">{plan.name} · {price}</h1>
          <p className="mt-4 text-sm leading-7 text-white/68">
            This is a once-off {plan.duration_days}-day project pass. Continue straight to PayFast — no Skills Connect Pro account is required before payment.
          </p>

          <div className="mt-7 grid grid-cols-[1fr_auto] items-end gap-5 rounded-2xl border border-[#ffd75f]/22 bg-[#ffd75f]/[.07] p-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#ffe17a]">Order summary</p>
              <p className="mt-2 text-sm font-bold text-white">{plan.name}</p>
              <p className="mt-1 text-xs text-white/50">{plan.duration_days} days · once-off · no automatic renewal</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[.14em] text-white/45">Total today</p>
              <p className="mt-1 text-3xl font-black text-[#ffe17a]">{price}</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/12 bg-black/25 p-5 backdrop-blur-xl">
            <div className="flex gap-3">
              <LockKeyhole className="mt-0.5 shrink-0 text-[#ffe17a]" size={19} />
              <div>
                <h2 className="font-black text-white">What happens next</h2>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  PayFast handles the payment securely. If you are not signed in, you can secure the purchased plan to an account after payment — without blocking checkout first.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3 rounded-2xl border border-[#55d995]/20 bg-[#0b2a19] p-4 text-white">
            <ShieldCheck className="shrink-0 text-[#65f3a7]" size={19} />
            <p className="text-sm leading-6">Your card details are entered on PayFast and are not stored by Skills Connect Pro.</p>
          </div>

          <CustomerCheckoutForm planCode={plan.code} price={price} />
        </section>
      </div>
    </main>
  );
}
