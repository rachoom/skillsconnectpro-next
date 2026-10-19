import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, CreditCard, LockKeyhole, ShieldCheck } from 'lucide-react';
import { CustomerCheckoutForm } from './CustomerCheckoutForm';
import { getAuthenticatedAccount } from '@/services/supabase/server';

type Props = { searchParams: Promise<{ plan?: string }> };
type Plan = { code: string; name: string; price_cents: number; duration_days: number | null; features: string[] };

function money(value: number) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(value / 100);
}

export default async function CustomerCheckoutPage({ searchParams }: Props) {
  const { plan: requestedPlan } = await searchParams;
  const planCode = requestedPlan === 'basic_30' || requestedPlan === 'project_pass_90' ? requestedPlan : '';
  if (!planCode) redirect('/plans');

  const { supabase, user } = await getAuthenticatedAccount();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/customer-checkout?plan=${planCode}`)}`);

  const { data } = await supabase
    .from('plans')
    .select('code,name,price_cents,duration_days,features')
    .eq('code', planCode)
    .eq('active', true)
    .gt('price_cents', 0)
    .maybeSingle();
  const plan = data as Plan | null;
  if (!plan || !plan.duration_days) redirect('/plans');

  return <main className="min-h-screen bg-[#f8f3e5] px-4 py-8 text-[#172016] md:px-8 md:py-12"><div className="mx-auto max-w-2xl">
    <Link href="/plans#homeowners" className="inline-flex items-center gap-2 text-sm font-bold text-[#685600]"><ArrowLeft size={17} /> Back to project plans</Link>
    <section className="mt-7 rounded-[1.8rem] border border-[#d9d0aa] bg-white p-6 shadow-xl shadow-[#302609]/10 md:p-9">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-[#ffe28b] text-[#5e4800]"><CreditCard size={23} /></div>
      <p className="mt-6 text-xs font-black uppercase tracking-[0.15em] text-[#806400]">Secure project-plan checkout</p>
      <h1 className="mt-3 text-3xl font-black">{plan.name} · {money(plan.price_cents)}</h1>
      <p className="mt-4 text-sm leading-7 text-[#53604e]">Unlock your private project workspace for {plan.duration_days} days. Payfast processes the payment securely; Skills Connect Pro never sees or stores your card details.</p>
      <div className="mt-7 rounded-2xl border border-[#e4d9b5] bg-[#fff9e8] p-5"><div className="flex gap-3"><LockKeyhole className="mt-0.5 shrink-0 text-[#957100]" size={19} /><div><h2 className="font-black">What happens after payment</h2><p className="mt-2 text-sm leading-6 text-[#625a42]">Payfast sends a verified confirmation to Skills Connect Pro. Only then does your account receive this plan, its expiry date and the matching workspace allowance.</p></div></div></div>
      <div className="mt-6 flex gap-3 rounded-2xl bg-[#17351f] p-4 text-[#f8f3e5]"><ShieldCheck className="shrink-0 text-[#ffe28b]" size={19} /><p className="text-sm leading-6">Signed in as {user.email ?? 'your private account'}. The project plan will attach to this account only.</p></div>
      <CustomerCheckoutForm plan={{ code: plan.code, name: plan.name, priceCents: plan.price_cents, durationDays: plan.duration_days }} />
    </section>
  </div></main>;
}
