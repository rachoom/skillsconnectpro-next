import {
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock3,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Wrench,
  XCircle,
  Zap,
  Sun,
  CalendarDays,
} from 'lucide-react';
import polish from '../provider-opportunity/[token]/provider-opportunity-polish.module.css';

const options = [
  { title: 'Available now', helper: 'Can attend immediately', icon: Zap, className: 'border-[#D6A524] bg-[#FFD166]' },
  { title: 'Available today', helper: 'Can attend later today', icon: Sun, className: 'border-[#D8B43D] bg-[#FFE58A]' },
  { title: 'Available tomorrow', helper: 'Can attend tomorrow', icon: CalendarClock, className: 'border-[#79ADD0] bg-[#BDE0FE]' },
  { title: 'Available this week', helper: 'Arrange a suitable day', icon: CalendarDays, className: 'border-[#90B77C] bg-[#DDF0D1]' },
];

export default function ProviderOpportunityPreviewPage() {
  return (
    <main className={`${polish.scope} min-h-screen bg-[#9FCB8A] px-4 py-5 text-[#203020] md:px-8 md:py-8`}>
      <div className="mx-auto max-w-4xl">
        <header data-provider-header className="mb-4 rounded-[1.75rem] border-2 border-[#D3A826] bg-[#FFF0A8] p-5 shadow-xl shadow-[#355332]/20 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#5B4300]">
              <ShieldCheck size={15} /> Skills Connect Pro
            </div>
            <span className="rounded-full border border-[#D3A826] bg-[#FFE067] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#4A3600]">
              Preview · provider view
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-black leading-tight md:text-4xl">Kitchen tap leaking badly</h1>
          <p className="mt-2 text-sm leading-6 text-[#4F5D4A]">Hi Thabo. Can you assist with this job?</p>
          <div data-opportunity-meta className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wider">
            <span className="rounded-xl bg-[#FFFFFF]/80 px-3 py-2">Plumbing</span>
            <span className="rounded-xl bg-[#FFD45C] px-3 py-2 text-[#4A3500]">Urgent</span>
            <span className="flex items-center gap-1 rounded-xl bg-[#FFFFFF]/80 px-3 py-2"><MapPin size={13} /> Benoni</span>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_390px]">
          <section className="space-y-4">
            <article data-provider-job-card className="rounded-[1.75rem] border-2 border-[#7CAD6E] bg-[#FFF9E8] p-5 shadow-lg shadow-[#355332]/15 md:p-6">
              <div className="flex items-center gap-3"><Wrench className="text-[#B07800]" size={19} /><h2 className="text-lg font-black">Job overview</h2></div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#3E493A]">
                The kitchen tap is leaking continuously from the base and the customer would like it inspected and repaired as soon as possible.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div data-job-fact className="rounded-2xl bg-[#EAF3DE] p-3.5">
                  <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#60705A]"><CalendarClock size={13} /> Preferred time</p>
                  <p className="mt-1.5 text-sm font-bold">Today · Flexible</p>
                </div>
                <div data-job-fact className="rounded-2xl bg-[#EAF3DE] p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#60705A]">Customer estimate</p>
                  <p className="mt-1.5 text-sm font-bold">Not supplied</p>
                </div>
              </div>
              <details className="mt-4 rounded-2xl border border-[#B8CFAE] bg-[#F3F8ED] p-4">
                <summary className="cursor-pointer text-xs font-black uppercase tracking-wider text-[#52644E]">View preliminary assessment</summary>
                <p className="mt-3 text-sm leading-6 text-[#3E493A]">Likely tap fitting or seal failure. An on-site inspection is recommended before final quotation.</p>
              </details>
              <p className="mt-4 flex items-center gap-2 text-xs text-[#65735E]"><Clock3 size={14} /> Reply within about 30 minutes</p>
            </article>
          </section>

          <form data-provider-response-form className="h-fit rounded-[1.75rem] border-2 border-[#D1A93C] bg-[#FFF2C7] p-5 shadow-xl shadow-[#355332]/20 lg:sticky lg:top-5">
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="text-xl font-black">Respond to this opportunity</h2><p className="mt-1 text-xs leading-5 text-[#6E765F]">Choose your availability. Pricing and a note are optional.</p></div>
              <MessageCircle className="mt-1 text-[#B07800]" size={21} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {options.map((option, index) => {
                const Icon = option.icon;
                return (
                  <button data-provider-option={index === 0 ? "available_now" : index === 1 ? "available_today" : index === 2 ? "available_tomorrow" : "available_this_week"} data-selected={index === 0 ? "true" : "false"} type="button" key={option.title} className={`relative rounded-2xl border-2 p-3 text-left text-[#203020] shadow-sm transition ${option.className} ${index === 0 ? '-translate-y-0.5 ring-4 ring-[#203020]/20' : ''}`}>
                    {index === 0 && <CheckCircle2 className="absolute right-2.5 top-2.5" size={17} />}
                    <Icon size={18} />
                    <span className="mt-2 block pr-4 text-sm font-black leading-tight">{option.title}</span>
                    <span className="mt-1 block text-[10px] leading-4 text-[#4D5949]">{option.helper}</span>
                  </button>
                );
              })}
            </div>

            <button data-provider-decline data-selected="false" type="button" className="mt-2 flex w-full items-center justify-between rounded-2xl border-2 border-[#D7A5AD] bg-[#FFE5E9] px-4 py-3 text-left text-[#74404A]">
              <span className="flex items-center gap-2 text-sm font-bold"><XCircle size={17} /> Not available for this job</span>
              <span className="text-[10px] uppercase tracking-wider">Decline</span>
            </button>

            <div className="mt-5">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#66725F]">Estimated arrival window</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button data-provider-time data-selected="true" type="button" className="rounded-full border-2 border-[#C89A18] bg-[#FFD75F] px-3 py-2 text-xs font-bold text-[#3F2D00]">Within 1 hour</button>
                <button data-provider-time data-selected="false" type="button" className="rounded-full border-2 border-[#9DBA8F] bg-[#FFFFFF]/75 px-3 py-2 text-xs font-bold text-[#3E493A]">1–3 hours</button>
                <button data-provider-time data-selected="false" type="button" className="rounded-full border-2 border-[#9DBA8F] bg-[#FFFFFF]/75 px-3 py-2 text-xs font-bold text-[#3E493A]">Not sure</button>
              </div>
            </div>

            <button data-provider-pricing type="button" className="mt-5 flex w-full items-center justify-between rounded-xl border-2 border-[#B7CBAE] bg-[#FFFDF5] px-4 py-3 text-left">
              <span><span className="block text-xs font-black text-[#293829]">Add pricing details</span><span className="mt-0.5 block text-[10px] text-[#6E765F]">Optional — site visit fee or preliminary range</span></span>
              <ChevronDown className="text-[#60705A]" size={17} />
            </button>

            <label className="mt-4 block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#60705A]">Message to customer — optional</span>
              <textarea readOnly placeholder="Add a quick note or question" className="mt-1.5 min-h-20 w-full rounded-xl border-2 border-[#BDD0B5] bg-white px-3 py-3 text-sm outline-none" />
            </label>

            <button type="button" className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#C18A00] bg-[#FFC21A] px-4 py-3.5 text-sm font-black uppercase tracking-wider shadow-md">
              <CheckCircle2 size={17} /> Submit response
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
