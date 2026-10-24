'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2, ChevronDown, ChevronLeft, Clock3, MapPin, MessageCircle, ShieldCheck, Wrench, XCircle, Zap, Sun, CalendarDays, Moon } from 'lucide-react';

const options = [
  { value: 'available_now', en: 'Available now', zu: 'Ngiyatholakala manje', hint: 'Can attend immediately', hintZu: 'Ngingafika manje', icon: Zap },
  { value: 'available_today', en: 'Available today', zu: 'Ngiyatholakala namuhla', hint: 'Can attend later today', hintZu: 'Ngingafika namuhla', icon: Sun },
  { value: 'available_tomorrow', en: 'Available tomorrow', zu: 'Ngiyatholakala kusasa', hint: 'Can attend tomorrow', hintZu: 'Ngingafika kusasa', icon: CalendarClock },
  { value: 'available_this_week', en: 'Available this week', zu: 'Ngiyatholakala kuleli sonto', hint: 'Arrange a suitable day', hintZu: 'Hlela usuku olufanele', icon: CalendarDays },
];
const translations = {
  heading: ['New opportunity', 'Ithuba elisha lomsebenzi'],
  job: ['Kitchen tap leaking badly', 'Umpompi wasekhishini uyavuza kakhulu'],
  description: ['The kitchen tap is leaking continuously from the base. The customer would like it inspected and repaired as soon as possible.', 'Umpompi wasekhishini uvuza njalo ezansi. Ikhasimende lifuna uhlolwe futhi ulungiswe ngokushesha.'],
  overview: ['Job overview', 'Imininingwane yomsebenzi'],
  preferred: ['Preferred time', 'Isikhathi esithandwayo'],
  today: ['Today · Flexible', 'Namuhla · Kuyavumelana'],
  budget: ['Customer estimate', 'Isilinganiso sekhasimende'],
  unspecified: ['Not supplied', 'Akushiwongo'],
  assessment: ['View preliminary assessment', 'Buka ukuhlolwa kokuqala'],
  assessmentText: ['Likely tap fitting or seal failure. An on-site inspection is recommended before final quotation.', 'Kungenzeka inkinga isesixhumanisini noma esivalweni sompompi. Kunconywa ukuhlola endaweni ngaphambi kokunikeza intengo yokugcina.'],
  deadline: ['Reply within about 30 minutes', 'Phendula kungakapheli imizuzu engu-30'],
  availability: ['When are you available?', 'Utholakala nini?'],
  availabilityHelp: ['Select one option to continue.', 'Khetha okukodwa ukuze uqhubeke.'],
  decline: ['Not available for this job', 'Angitholakali kulo msebenzi'],
  arrival: ['Estimated arrival time', 'Isikhathi esilinganisiwe sokufika'],
  arrivalHelp: ['Choose a suitable arrival window.', 'Khetha isikhathi esifanele sokufika.'],
  pricing: ['Add pricing details', 'Faka imininingwane yentengo'],
  optional: ['Optional · Site visit fee or estimate', 'Ongakukhetha · Imali yokuvakasha noma isilinganiso'],
  message: ['Message to customer (optional)', 'Umlayezo ekhasimendeni (ongakukhetha)'],
  notePlaceholder: ['Add a quick note or question', 'Faka umlayezo noma umbuzo'],
  continue: ['Review response', 'Hlola impendulo'],
  review: ['Review your response', 'Hlola impendulo yakho'],
  reviewHelp: ['Confirm the details before sending.', 'Qinisekisa imininingwane ngaphambi kokuthumela.'],
  submit: ['Submit response', 'Thumela impendulo'],
  back: ['Back', 'Emuva'],
  step: ['Step', 'Isinyathelo'],
  privacy: ['Your contact details remain private until the customer selects you.', 'Imininingwane yakho yokuxhumana ihlala iyimfihlo kuze kube ikhasimende likukhetha.'],
  complete: ['Response captured', 'Impendulo yamukelwe'],
  preview: ['Interactive preview · No customer is notified.', 'Ukubuka kuqala · Alikho ikhasimende elaziswayo.'],
  reset: ['Try another response', 'Zama enye impendulo'],
  selected: ['Availability', 'Ukutholakala'],
  window: ['Arrival window', 'Isikhathi sokufika'],
  now: ['Within 1 hour', 'Kungakapheli ihora'],
  soon: ['1–3 hours', 'Amahora angu-1–3'],
  unsure: ['Not sure yet', 'Angikaqiniseki'],
  morning: ['Morning', 'Ekuseni'],
  afternoon: ['Afternoon', 'Ntambama'],
  evening: ['Evening', 'Kusihlwa'],
  schedule: ['Arrange with customer', 'Hlela nekhasimende'],
  declineConfirm: ['You will decline this opportunity.', 'Uzokwenqaba leli thuba.'],
  fee: ['Site visit fee (R)', 'Imali yokuvakashela indawo (R)'],
  min: ['Estimate from (R)', 'Isilinganiso sisuka ku (R)'],
  max: ['Estimate to (R)', 'Isilinganiso sifika ku (R)'],
} as const;

export default function ProviderOpportunityPreviewPage() {
  const [lang, setLang] = useState<'en' | 'zu'>('en');
  const [dark, setDark] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState('');
  const [arrival, setArrival] = useState('');
  const [pricing, setPricing] = useState(false);
  const [fee, setFee] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);
  const [hint, setHint] = useState(-1);
  const tr = (key: keyof typeof translations) => translations[key][lang === 'en' ? 0 : 1];
  const isDecline = selected === 'declined';
  const picked = options.find(o => o.value === selected);
  const slots = selected === 'available_now' ? ['now', 'soon', 'unsure'] as const : selected === 'available_today' || selected === 'available_tomorrow' ? ['morning', 'afternoon', 'evening', 'unsure'] as const : ['schedule', 'unsure'] as const;
  useEffect(() => {
    if (step !== 1 || selected) return;
    const timer = window.setInterval(() => setHint(current => (current + 1) % options.length), 1700);
    return () => window.clearInterval(timer);
  }, [step, selected]);
  function choose(value: string) {
    setSelected(value);
    setArrival('');
    setStep(value === 'declined' ? 3 : 2);
  }
  const panel = dark ? 'bg-[#222725] text-[#F8F7F0] border-[#5C5B3C]' : 'bg-[#FFF9E9] text-[#292C25] border-[#E6C85C]';
  const muted = dark ? 'text-[#D5D7CE]' : 'text-[#5B6056]';
  return (
    <main className={`min-h-[100dvh] ${dark ? 'bg-[#141916] text-white' : 'bg-[#F7D54C] text-[#292C25]'} px-3 py-4 sm:px-5 sm:py-8 transition-colors`}>
      <div className="mx-auto max-w-[520px]">
        <header className={`rounded-3xl border p-4 shadow-sm ${panel}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2"><img src="/logo-new.svg" alt="" className="size-8 shrink-0 rounded-lg object-contain" /><strong className="text-sm font-black tracking-tight sm:text-base">Skills Connect Pro</strong></div>
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={() => setLang(lang === 'en' ? 'zu' : 'en')} className="rounded-full border border-[#CBA638] px-2.5 py-1.5 text-xs font-black" aria-label="Switch language">{lang === 'en' ? 'EN / ZU' : 'ZU / EN'}</button>
              <button type="button" onClick={() => setDark(!dark)} className="rounded-full border border-[#CBA638] p-1.5" aria-label="Toggle theme">{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
              <MessageCircle size={19} className="ml-1 text-[#B78B11]" aria-label="Chat" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2"><span className="rounded-full bg-[#F6CB42] px-3 py-1 text-[11px] font-black text-[#352800]">{tr('heading')}</span><span className={`flex items-center gap-1 text-[11px] font-bold ${muted}`}><Clock3 size={13}/>{tr('deadline')}</span></div>
          <h1 className="mt-3 text-xl font-black leading-tight sm:text-2xl">{tr('job')}</h1>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold"><span className="rounded-lg bg-[#E7E8DA] px-2.5 py-1.5 text-[#30352A]">Plumbing</span><span className="rounded-lg bg-[#F6CB42] px-2.5 py-1.5 text-[#352800]">Urgent</span><span className="flex items-center gap-1 rounded-lg bg-[#E7E8DA] px-2.5 py-1.5 text-[#30352A]"><MapPin size={12}/>Benoni</span></div>
          <details className={`mt-3 rounded-xl border px-3 py-2 ${dark ? 'border-white/20' : 'border-[#E5D9B3]'}`}><summary className="cursor-pointer text-xs font-black">{tr('overview')}</summary><p className={`mt-3 text-sm leading-6 ${muted}`}>{tr('description')}</p><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div><strong>{tr('preferred')}</strong><p>{tr('today')}</p></div><div><strong>{tr('budget')}</strong><p>{tr('unspecified')}</p></div></div><details className="mt-3"><summary className="cursor-pointer text-xs font-bold">{tr('assessment')}</summary><p className="mt-2 text-xs leading-5">{tr('assessmentText')}</p></details></details>
        </header>
        {done ? <section className={`mt-4 rounded-3xl border p-8 text-center ${panel}`}><CheckCircle2 className="mx-auto text-[#198858]" size={50}/><h2 className="mt-4 text-2xl font-black">{tr('complete')}</h2><p className={`mt-3 text-sm ${muted}`}>{tr('preview')}</p><button type="button" onClick={() => { setDone(false); setStep(1); setSelected(''); setArrival(''); }} className="mt-6 rounded-xl bg-[#F7C62B] px-5 py-3 font-black text-[#322700]">{tr('reset')}</button></section> :
        <section className={`mt-4 rounded-3xl border p-4 shadow-lg sm:p-5 ${panel}`}>
          <div className="flex items-center justify-between gap-2"><button type="button" disabled={step === 1} onClick={() => setStep(step === 3 && isDecline ? 1 : step === 3 ? 2 : 1)} className="flex items-center gap-1 text-xs font-bold disabled:opacity-25"><ChevronLeft size={16}/>{tr('back')}</button><span className="text-xs font-black">{tr('step')} {step} / 3</span></div>
          <div className="mt-3 flex gap-1.5">{[1,2,3].map(n => <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? 'bg-[#E6B01C]' : dark ? 'bg-white/20' : 'bg-[#E9E2CE]'}`}/>)}</div>
          <div key={step} className="animate-[fadeIn_.2s_ease-out]">
            <h2 className="mt-5 text-xl font-black">{step === 1 ? tr('availability') : step === 2 ? tr('arrival') : tr('review')}</h2>
            <p className={`mt-1 text-xs ${muted}`}>{step === 1 ? tr('availabilityHelp') : step === 2 ? tr('arrivalHelp') : tr('reviewHelp')}</p>
            {step === 1 && <div className="mt-5 space-y-2.5">
              {options.map((o, index) => { const Icon = o.icon; return <button key={o.value} type="button" onClick={() => choose(o.value)} className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-left text-[#2D2A18] transition-all duration-300 hover:-translate-y-0.5 ${hint === index ? 'scale-[1.012] border-[#B58100] bg-[#FFE16B] shadow-[0_0_0_3px_rgba(245,197,24,.3),0_0_22px_rgba(245,197,24,.6)]' : 'border-[#D9B64E] bg-[#FFEBA5]'}`}><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/60"><Icon size={21}/></span><span className="flex-1"><strong className="block text-sm">{lang === 'en' ? o.en : o.zu}</strong><span className="mt-0.5 block text-xs text-[#63583D]">{lang === 'en' ? o.hint : o.hintZu}</span></span><ChevronDown size={16} className="-rotate-90"/></button>; })}
              <button type="button" onClick={() => choose('declined')} className="flex w-full items-center gap-3 rounded-2xl border-2 border-[#E6B7BD] bg-[#FFE6E9] px-4 py-3 text-left text-[#783841]"><XCircle size={20}/><strong className="text-sm">{tr('decline')}</strong></button>
            </div>}
            {step === 2 && <div className="mt-5">
              <div className="grid gap-2">{slots.map(slot => <button key={slot} type="button" onClick={() => setArrival(slot)} className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-bold ${arrival === slot ? 'border-[#C39513] bg-[#F8D45C] text-[#302700]' : dark ? 'border-white/20 bg-white/10' : 'border-[#E6D8A9] bg-white'}`}>{tr(slot === 'now' ? 'now' : slot === 'soon' ? 'soon' : slot === 'morning' ? 'morning' : slot === 'afternoon' ? 'afternoon' : slot === 'evening' ? 'evening' : slot === 'schedule' ? 'schedule' : 'unsure')}</button>)}</div>
              <button type="button" onClick={() => setPricing(!pricing)} className={`mt-4 flex w-full items-center justify-between rounded-xl border p-3 text-left text-sm font-bold ${dark ? 'border-white/20' : 'border-[#E5D9B3]'}`}>{tr('pricing')} <ChevronDown size={17} className={pricing ? 'rotate-180' : ''}/></button>
              {pricing && <div className="mt-2 grid gap-2"><input inputMode="decimal" value={fee} onChange={e => setFee(e.target.value)} placeholder={tr('fee')} className="w-full rounded-xl border p-3 text-sm text-[#292C25]"/><div className="grid grid-cols-2 gap-2"><input inputMode="decimal" value={min} onChange={e => setMin(e.target.value)} placeholder={tr('min')} className="min-w-0 rounded-xl border p-3 text-sm text-[#292C25]"/><input inputMode="decimal" value={max} onChange={e => setMax(e.target.value)} placeholder={tr('max')} className="min-w-0 rounded-xl border p-3 text-sm text-[#292C25]"/></div></div>}
              <label className="mt-4 block text-xs font-bold">{tr('message')}<textarea value={note} onChange={e => setNote(e.target.value)} placeholder={tr('notePlaceholder')} className="mt-2 min-h-20 w-full rounded-xl border p-3 text-sm text-[#292C25]"/></label>
              <button type="button" onClick={() => setStep(3)} className="mt-4 w-full rounded-xl bg-[#F5C328] px-4 py-3.5 text-sm font-black text-[#302700]">{tr('continue')} →</button>
            </div>}
            {step === 3 && <div className="mt-5"><div className={`rounded-xl border p-4 text-sm ${dark ? 'border-white/20 bg-white/10' : 'border-[#E5D9B3] bg-white'}`}><p className="font-black">{tr('selected')}</p><p className="mt-1">{isDecline ? tr('decline') : lang === 'en' ? picked?.en : picked?.zu}</p>{!isDecline && <><p className="mt-4 font-black">{tr('window')}</p><p className="mt-1">{arrival ? tr(arrival === 'now' ? 'now' : arrival === 'soon' ? 'soon' : arrival === 'morning' ? 'morning' : arrival === 'afternoon' ? 'afternoon' : arrival === 'evening' ? 'evening' : arrival === 'schedule' ? 'schedule' : 'unsure') : tr('unsure')}</p>{fee && <p className="mt-3">{tr('fee')}: R{fee}</p>}{min && <p className="mt-2">{tr('min')}: R{min}</p>}{max && <p className="mt-2">{tr('max')}: R{max}</p>}{note && <p className="mt-3 whitespace-pre-wrap">{note}</p>}</>}{isDecline && <p className="mt-3 text-xs">{tr('declineConfirm')}</p>}</div><button type="button" onClick={() => setDone(true)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#C18A00] bg-[#F8C528] px-4 py-4 text-sm font-black text-[#302700] shadow-md"><CheckCircle2 size={19}/>{tr('submit')}</button></div>}
          </div>
        </section>}
        <p className={`mx-auto mt-4 max-w-sm text-center text-[11px] leading-5 ${muted}`}><ShieldCheck size={13} className="mr-1 inline"/>{tr('privacy')}</p>
      </div>
    </main>
  );
}
