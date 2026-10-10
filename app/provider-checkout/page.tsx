import Link from 'next/link';
import { ArrowLeft, CreditCard, LockKeyhole, ShieldCheck } from 'lucide-react';
import { getProviderPlan } from '../provider-plans/planCatalog';

export default async function ProviderCheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string }> }) {
  const { plan: slug } = await searchParams;
  const plan = slug ? getProviderPlan(slug) : undefined;

  return (
    <main className="min-h-screen bg-[#f8f3e5] px-4 py-8 text-[#172016] md:px-8 md:py-12"><div className="mx-auto max-w-2xl"><Link href={plan ? `/provider-plans/${plan.slug}` : '/provider-plans'} className="inline-flex items-center gap-2 text-sm font-bold text-[#685600]"><ArrowLeft size={17} /> Back to plan details</Link><section className="mt-7 rounded-[1.8rem] border border-[#d9d0aa] bg-white p-6 shadow-xl shadow-[#302609]/10 md:p-9"><div className="flex size-12 items-center justify-center rounded-2xl bg-[#ffe28b] text-[#5e4800]"><CreditCard size={23} /></div><p className="mt-6 text-xs font-black uppercase tracking-[0.15em] text-[#806400]">Secure provider checkout</p><h1 className="mt-3 text-3xl font-black">{plan ? `${plan.name} · ${plan.price}` : 'Choose your provider access'}</h1><p className="mt-4 text-sm leading-7 text-[#53604e]">The payment route is being connected to Payfast by Network, so monthly plans and one-off lead packs can activate provider access automatically after a verified payment.</p><div className="mt-7 rounded-2xl border border-[#e4d9b5] bg-[#fff9e8] p-5"><div className="flex gap-3"><LockKeyhole className="mt-0.5 shrink-0 text-[#957100]" size={19} /><div><h2 className="font-black">What happens at payment</h2><p className="mt-2 text-sm leading-6 text-[#625a42]">A secure payment session will create or renew the matching provider entitlement. We will use the payment confirmation, not a browser redirect, to unlock leads.</p></div></div></div><div className="mt-6 flex gap-3 rounded-2xl bg-[#17351f] p-4 text-[#f8f3e5]"><ShieldCheck className="shrink-0 text-[#ffe28b]" size={19} /><p className="text-sm leading-6">Your provider access is only changed after the payment gateway confirms the transaction.</p></div><Link href="/provider-plans" className="mt-7 flex w-full items-center justify-center rounded-xl bg-[#172016] px-4 py-4 text-sm font-black text-white">Review provider options</Link></section></div></main>
  );
}
