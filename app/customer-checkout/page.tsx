import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, CalendarDays, Check, CreditCard, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { CustomerCheckoutForm } from './CustomerCheckoutForm';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { customerPlanBenefits, customerTheme } from '@/services/planPresentation';

type Props = { searchParams: Promise<{ plan?: string }> };
type Plan = { code: string; name: string; price_cents: number; duration_days: number | null; features: string[] };

function money(value: number) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(value / 100);
}

const planStories = {
  basic_30: {
    eyebrow: '30 days of expanded project limits',
    heading: 'Do more with your project for R29.',
    detail: 'Keep the tools you already know, with two photo analyses, 20 document slots and more room for quotes, receipts and project photos.',
    moments: ['2 project photo analyses', '20 project document slots', '200 MB project storage'],
  },
  project_pass_90: {
    eyebrow: 'Your 90-day project command centre',
    heading: 'Keep a bigger project moving with confidence.',
    detail: 'Manage up to three projects, store more documents and track milestones, with 90 days of expanded capacity.',
    moments: ['Up to 3 active projects', 'Milestone management', '500 MB project document storage'],
  },
} as const;

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

  const story = planStories[plan.code as keyof typeof planStories];
  const theme = customerTheme(plan.code);
  const benefits = customerPlanBenefits[plan.code] ?? plan.features;

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#071009] px-4 py-5 text-[#fff8e8] md:px-8 md:py-8">
      <Image src="/calculator-planning-desk.jpg" alt="Project planning desk with plans and calculator" fill priority className="-z-20 object-cover object-center opacity-40" sizes="100vw" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,rgba(4,11,7,.98),rgba(5,13,8,.90)_48%,rgba(5,12,7,.78))]" />
      <div className="absolute right-[-10rem] top-12 -z-10 size-[32rem] rounded-full bg-[#ffd75f]/10 blur-3xl" />

      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 py-2">
        <Link href="/plans#homeowners" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[.05] px-3.5 py-2.5 text-sm font-bold text-white/85 backdrop-blur-xl transition hover:border-[#ffd75f]/70 hover:text-[#ffe17a]"><ArrowLeft size={17} /> Project plans</Link>
        <Link href="/" className="text-xs font-black uppercase tracking-[0.16em] text-[#ffe17a]">Skills Connect Pro</Link>
      </nav>

      <div className="mx-auto grid max-w-6xl gap-6 py-8 lg:grid-cols-[1.08fr_.92fr] lg:py-14">
        <section className="rounded-[2rem] border border-white/20 bg-white/[.075] p-5 shadow-2xl shadow-black/35 backdrop-blur-2xl md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className={`flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[.16em] ${theme.badge}`}><Sparkles size={13} /> Secure project access</div>
              <p className="mt-5 text-xs font-black uppercase tracking-[0.15em] text-white/50">{story.eyebrow}</p>
              <h1 className="mt-3 max-w-xl text-3xl font-black leading-tight tracking-[-.035em] text-[#fff8e8] md:text-5xl">{story.heading}</h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/70 md:text-base">{story.detail}</p>
            </div>
            <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl border shadow-lg ${theme.panel}`}><CreditCard size={22} /></span>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {story.moments.map((moment, index) => <div key={moment} className="rounded-2xl border border-white/12 bg-black/20 p-4"><span className="text-[10px] font-black uppercase tracking-[.15em] text-[#ffe17a]">0{index + 1}</span><p className="mt-2 text-sm font-bold leading-5 text-white">{moment}</p></div>)}
          </div>

          <div className="mt-7 border-t border-white/12 pt-7">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-white/50">Everything included in {plan.name}</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {benefits.map((benefit) => <li key={benefit} className="flex gap-2.5 rounded-xl border border-white/10 bg-black/20 px-3.5 py-3 text-sm leading-5 text-white/82"><Check className={`mt-0.5 shrink-0 ${theme.check}`} size={16} />{benefit}</li>)}
            </ul>
          </div>
          <div className="mt-7 border-t border-white/12 pt-7">
            <CustomerCheckoutForm plan={{ code: plan.code, name: plan.name, priceCents: plan.price_cents, durationDays: plan.duration_days }} />
          </div>
        </section>

        <aside className="space-y-4">
          <div className="overflow-hidden rounded-[2rem] border border-white/20 bg-[#11190f]/85 shadow-2xl shadow-black/30 backdrop-blur-2xl">
            <div className={`border-b border-white/12 p-6 ${theme.panel}`}>
              <p className="text-[10px] font-black uppercase tracking-[.17em] text-[#664900]">Your project plan</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-.03em]">{plan.name}</h2>
              <p className="mt-3 text-4xl font-black">{money(plan.price_cents)} <span className="text-sm font-bold">once-off</span></p>
            </div>
            <div className="p-6"><div className="flex items-center justify-between gap-4 text-sm"><span className="text-white/60">Private workspace access</span><span className="font-black text-white">{plan.duration_days} days</span></div><div className="mt-4 flex items-center justify-between gap-4 text-sm"><span className="text-white/60">Renewal</span><span className={`font-black ${theme.price}`}>Not automatic</span></div><div className="mt-5 h-px bg-white/12" /><p className="mt-5 text-sm leading-6 text-white/65">One payment, one defined access period. There is no hidden recurring homeowner card subscription.</p></div>
          </div>

          <div className="rounded-[1.6rem] border border-white/15 bg-white/[.055] p-5 backdrop-blur-xl"><div className="flex gap-3"><LockKeyhole className="mt-0.5 shrink-0 text-[#ffe17a]" size={20} /><div><h2 className="font-black text-white">Payment stays protected</h2><p className="mt-2 text-sm leading-6 text-white/65">Payfast handles your card details. Skills Connect Pro receives only the verified result needed to activate your pass.</p></div></div></div>
          <div className="rounded-[1.6rem] border border-white/15 bg-white/[.055] p-5 backdrop-blur-xl">
            <div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-[#ffe17a]" size={20} /><div className="min-w-0 flex-1">
              <p className="text-sm leading-6 text-white/70"><strong className="block text-white">Attached to your account</strong>Signed in as {user.email ?? 'your private account'}.</p>
              <form action="/auth/sign-out" method="post" className="mt-3">
                <button type="submit" className="inline-flex min-h-10 items-center rounded-lg border border-[#ffe17a]/45 px-3 py-2 text-xs font-bold text-[#ffe17a] transition hover:bg-[#ffe17a]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffe17a]">
                  Sign out / switch account
                </button>
              </form>
              <p className="mt-2 text-xs leading-5 text-white/55">You'll return to the homepage. Sign in with a different email to test the purchase under a separate customer account.</p>
            </div></div>
          </div>
          <div className="flex items-center gap-3 px-2 text-xs leading-5 text-white/50"><CalendarDays className="shrink-0 text-[#ffe17a]" size={17} /> Your access period begins only after Payfast verifies payment.</div>
        </aside>
      </div>
    </main>
  );
}
