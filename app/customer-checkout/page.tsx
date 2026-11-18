import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, CreditCard, LockKeyhole, ShieldCheck } from 'lucide-react';
import { getAuthenticatedAccount } from '@/services/supabase/server';
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

  const { user } = await getAuthenticatedAccount();
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(`/customer-checkout?plan=${code}`)}`);
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
            This is a once-off {plan.duration_days}-day project pass. Your access activates after PayFast confirms the payment.
          </p>

          <div className="mt-7 rounded-2xl border border-white/12 bg-black/25 p-5 backdrop-blur-xl">
            <div className="flex gap-3">
              <LockKeyhole className="mt-0.5 shrink-0 text-[#ffe17a]" size={19} />
              <div>
                <h2 className="font-black text-white">What happens next</h2>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  PayFast handles the payment securely. Skills Connect Pro activates the matching project-plan limits only after the payment notification is verified.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3 rounded-2xl border border-[#55d995]/20 bg-[#0b2a19] p-4 text-white">
            <ShieldCheck className="shrink-0 text-[#65f3a7]" size={19} />
            <p className="text-sm leading-6">Your card details are entered on PayFast and are not stored by Skills Connect Pro.</p>
          </div>

          <CustomerCheckoutForm planCode={plan.code} />
        </section>
      </div>
    </main>
  );
}
