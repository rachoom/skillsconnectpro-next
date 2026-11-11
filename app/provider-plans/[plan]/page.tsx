import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, CircleCheckBig, LockKeyhole, MapPin, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getProviderPlan, providerPlans } from '../planCatalog';
import { providerTheme } from '@/services/planPresentation';

export function generateStaticParams() {
  return providerPlans.map((plan) => ({ plan: plan.slug }));
}

export default async function ProviderPlanDetailPage({
  params, searchParams,
}: {
  params: Promise<{ plan: string }>;
  searchParams: Promise<{ provider?: string }>;
}) {
  const { plan: slug } = await params;
  const { provider } = await searchParams;
  const providerQuery = provider && /^\d+$/.test(provider) ? `&provider=${encodeURIComponent(provider)}` : '';
  const plan = getProviderPlan(slug);
  if (!plan) notFound();
  const isSubscription = plan.kind === 'subscription';
  const checkoutHref = `/provider-checkout?plan=${plan.slug}${providerQuery}`;
  const theme = providerTheme(plan.slug);

  return (
    <main className="min-h-screen overflow-hidden bg-[#090909] text-[#faf6ec]">
      <nav className="relative z-20 border-b border-[#bd9642]/20 bg-[#0b0b0b]/95 px-4 py-4 backdrop-blur-xl sm:px-7">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <Link href="/" aria-label="Skills Connect Pro home"><Image src="/logo-new.svg" alt="Skills Connect Pro" width={185} height={50} priority className="h-auto w-[158px] sm:w-[185px]" /></Link>
          <Link href="/provider-plans" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#f5c518]/35 px-3.5 text-xs font-black text-[#f7de98] transition hover:bg-[#f5c518]/10 sm:text-sm"><ArrowLeft size={16} /> All provider plans</Link>
        </div>
      </nav>

      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_80%_18%,rgba(245,197,24,.14),transparent_30rem)]" />
        <div className="mx-auto grid max-w-6xl gap-7 px-4 py-10 sm:px-7 sm:py-16 lg:grid-cols-[minmax(0,1.06fr)_minmax(340px,.94fr)] lg:items-center lg:gap-12">
          <div>
            <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[10px] font-black uppercase tracking-[.17em] ${theme.badge}`}><Sparkles size={14} /> {plan.audience}</div>
            <p className={`mt-7 text-[11px] font-black uppercase tracking-[.22em] ${theme.price}`}>Skills Connect Pro / Provider membership</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black leading-[1.025] tracking-[-.05em] text-white sm:text-5xl lg:text-6xl">{plan.headline}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#c9c2b3]">{plan.summary}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-xl border border-[#ab8b4d]/30 bg-white/[.04] px-4 py-3 text-xs font-bold text-[#ece0c3]"><MapPin size={17} className={theme.check} /> Starting in Ekurhuleni</span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-[#ab8b4d]/30 bg-white/[.04] px-4 py-3 text-xs font-bold text-[#ece0c3]"><UsersRound size={17} className={theme.check} /> You choose which jobs to pursue</span>
            </div>
          </div>

          <aside className={`relative isolate overflow-hidden rounded-[2rem] border shadow-[0_35px_100px_rgba(0,0,0,.48)] ${theme.card}`} aria-label={`${plan.name} complete plan benefits and price`}>
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 size-80 rounded-full bg-white/[.085] blur-3xl" />
            <div className="relative px-6 pb-7 pt-7 sm:px-8 sm:pt-9">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className={`text-[11px] font-black uppercase tracking-[.19em] ${theme.price}`}>{plan.name} {isSubscription ? 'monthly membership' : 'lead pack'}</span>
                <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[.1em] ${theme.badge}`}>{plan.slug === 'growth' ? 'Growing businesses' : plan.slug === 'pro' ? 'Maximum access' : plan.slug === 'starter' ? 'Start strong' : 'Flexible access'}</span>
              </div>
              <div className="mt-5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className={`text-[clamp(3.8rem,12vw,5.1rem)] font-black leading-none tracking-[-.07em] ${theme.price}`}>{plan.price}</span>
                <span className="text-base font-semibold text-white/80">{isSubscription ? '/ month' : 'once-off'}</span>
              </div>
              <p className="mt-4 max-w-md text-sm font-medium leading-6 text-white/80">{isSubscription ? 'Choose the right customer requests and keep your business ready for more work.' : 'Get extra response capacity without a monthly subscription.'}</p>

              <div className="mt-7 border-t border-white/20 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-[12px] font-black uppercase tracking-[.17em] text-white">Everything included</h2>
                  <span className={`text-xs font-bold ${theme.price}`}>{plan.included.length} plan benefits</span>
                </div>
                <ul className="mt-5 grid gap-3.5">
                  {plan.included.map((feature, index) => (
                    <li key={feature} className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-sm font-semibold leading-6 ${index === 0 ? 'border-white/25 bg-white/[.10] text-white' : 'border-white/[.09] bg-black/20 text-white/85'}`}>
                      <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/20 ${theme.check}`}><Check size={15} strokeWidth={3} aria-hidden="true" /></span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-xl border border-white/20 bg-black/30 px-4 py-4 text-xs leading-6 text-white/80">
                <ShieldCheck size={19} className={`mt-0.5 shrink-0 ${theme.check}`} aria-hidden="true" />
                <p>{isSubscription ? 'This plan renews automatically each month. Cancel future renewals in your Artisan Business Workspace.' : 'One-time purchase. No automatic renewal or monthly commitment.'}</p>
              </div>
              <Link href={checkoutHref} className={`mt-6 flex min-h-[58px] w-full items-center justify-center gap-3 rounded-2xl px-4 py-4 text-center text-base font-black shadow-[0_14px_35px_rgba(0,0,0,.24)] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-white ${theme.button}`}>
                Continue to secure checkout <ArrowRight size={20} aria-hidden="true" />
              </Link>
              <p className="mt-4 flex items-start gap-2 text-xs leading-6 text-white/70"><LockKeyhole size={16} className={`mt-1 shrink-0 ${theme.check}`} aria-hidden="true" /> Paid through PayFast. Access activates only after verified payment. Responding to an opportunity does not guarantee a job.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-7 sm:py-20">
        <div className="max-w-2xl">
          <p className={`text-[11px] font-black uppercase tracking-[.2em] ${theme.price}`}>Why choose {plan.name}?</p>
          <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-.04em] text-white sm:text-4xl">A professional way to pursue the work that fits.</h2>
          <p className="mt-4 text-sm leading-7 text-[#c2baaa]">Designed for real local service businesses, with clear terms and practical tools rather than vague promises.</p>
        </div>
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {plan.benefits.map((benefit, index) => (
            <article key={benefit.title} className="rounded-[1.55rem] border border-[#ae8d49]/30 bg-[linear-gradient(150deg,#1d1a14,#101010)] p-6 shadow-[0_16px_44px_rgba(0,0,0,.16)]">
              <span className={`grid size-11 place-items-center rounded-xl border text-sm font-black ${theme.badge}`}>0{index + 1}</span>
              <h3 className="mt-6 text-xl font-black leading-6 text-white">{benefit.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#c5bdad]">{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#ac8842]/20 bg-[#15120e] px-4 py-14 sm:px-7 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
          <div>
            <p className={`text-[11px] font-black uppercase tracking-[.2em] ${theme.price}`}>Plan details</p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-.04em] text-white sm:text-4xl">Know exactly what is included.</h2>
            <p className="mt-5 text-sm leading-7 text-[#c0b8aa]">Review opportunities and submit structured responses. Contact details are released only after the customer selects and confirms a provider connection.</p>
            <div className="relative mt-7 h-44 overflow-hidden rounded-[1.4rem] border border-[#b49457]/25 sm:h-52">
              <Image src="/artisans/hero-welder.jpg" alt="Local artisan working" fill className="object-cover object-center" sizes="(min-width:1024px) 35vw, 100vw" />
              <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(8,8,8,.45),transparent)]" />
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {plan.included.map((feature) => (
              <li key={feature} className="flex items-start gap-3 rounded-2xl border border-[#b1955c]/25 bg-[#201c16] px-4 py-4 text-sm font-semibold leading-6 text-[#f3ecdc]"><CircleCheckBig size={20} className={`mt-0.5 shrink-0 ${theme.check}`} />{feature}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-7 sm:py-16">
        <div className="grid gap-6 rounded-[1.8rem] border border-[#f5c518]/35 bg-[linear-gradient(125deg,#272114,#151310_65%,#111)] p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[.17em] text-[#f5c518]">Your next step</p>
            <h2 className="mt-3 text-2xl font-black leading-tight text-white sm:text-3xl">Put your skills forward with confidence.</h2>
            <p className="mt-3 text-sm leading-7 text-[#c8bfae]">You stay in control. View the details, decide whether to respond, and keep your opportunities organised.</p>
          </div>
          <Link href={checkoutHref} className={`inline-flex min-h-14 items-center justify-center gap-3 rounded-xl px-6 py-4 text-sm font-black transition hover:-translate-y-0.5 ${theme.button}`}>Choose {plan.name} <ArrowRight size={19} /></Link>
        </div>
        <div className="mt-8 flex flex-wrap gap-7 border-t border-white/10 pt-6 text-xs leading-6 text-[#b3aa99]">
          <span className="inline-flex items-center gap-2"><LockKeyhole size={17} className="text-[#f5c518]" /> Secure PayFast checkout</span>
          <span className="inline-flex items-center gap-2"><ShieldCheck size={17} className="text-[#f5c518]" /> Verified activation only</span>
          <span className="inline-flex items-center gap-2"><Check size={17} className="text-[#f5c518]" /> {isSubscription ? 'Recurring billing clearly disclosed' : 'No monthly commitment'}</span>
        </div>
      </section>
    </main>
  );
}
