'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Camera, CheckCircle2, Clock3, Loader2, MapPin, Search, ShieldCheck, Wrench, X } from 'lucide-react';

type Timing = 'now' | 'today' | 'later';
type SubmitResult = {
  project?: { id?: string; title?: string };
  accessToken?: string;
  error?: string;
  upgradeUrl?: string;
  routing?: { action?: string; providersQueued?: number; reason?: string } | null;
  preferredProvider?: { requested: boolean; queued: boolean; reason: string };
};

const AREAS = [
  'Alberton', 'Benoni', 'Boksburg', 'Brakpan', 'Daveyton', 'Duduza', 'Germiston',
  'Johannesburg', 'Katlehong', 'Kempton Park', 'Kwa-Thema', 'Nigel', 'Springs', 'Tembisa', 'Tsakane', 'Vosloorus',
];

const SERVICES: Array<{ value: string; label: string }> = [
  { value: 'Plumbing', label: 'Plumber' },
  { value: 'Electrical', label: 'Electrician' },
  { value: 'Mechanics', label: 'Mechanic' },
  { value: 'Cleaning', label: 'Cleaner' },
  { value: 'Painting', label: 'Painter' },
  { value: 'General Contractor', label: 'General contractor' },
  { value: 'Other', label: 'Other professional' },
];

const JOBS: Record<string, string[]> = {
  plumbing: ['Burst pipe / flooding', 'Blocked drain', 'Leaking geyser', 'Leaking tap', 'Other plumbing problem'],
  electrical: ['No power', 'Exposed wires / sparks', 'Tripping power', 'Faulty lights', 'Other electrical problem'],
  mechanics: ['Car will not start', 'Vehicle breakdown', 'Brake problem', 'Engine overheating', 'Other mechanical problem'],
};

function issueOptions(service: string): string[] {
  const key = service.toLowerCase();
  if (key.includes('plumb')) return JOBS.plumbing;
  if (key.includes('electri')) return JOBS.electrical;
  if (key.includes('mechanic')) return JOBS.mechanics;
  return ['Service or repair', 'Urgent assistance', 'Inspection / assessment', 'Other'];
}

function quickImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      reject(new Error('Use a JPG, PNG or WebP photo.'));
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      reject(new Error('Please choose a photo smaller than 12 MB.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not open the photo.'));
    reader.onload = () => {
      const image = new window.Image();
      image.onerror = () => reject(new Error('Could not prepare the photo.'));
      image.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context) return reject(new Error('Photo processing is unavailable.'));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL('image/jpeg', .72);
        if (data.length > 2_700_000) return reject(new Error('Please choose a smaller image.'));
        resolve(data);
      };
      image.src = String(reader.result ?? '');
    };
    reader.readAsDataURL(file);
  });
}

const RECENT_REQUEST_STORAGE_KEY = 'scp-quick-request-recent-v1';
const RECOVERY_AGE_MS = 24 * 60 * 60 * 1000;
type RecentQuickRequest = { url: string; createdAt: number; pendingRedirect: boolean };
function safeTrackingUrl(value: unknown): value is string {
  return typeof value === 'string' && /^\/project\/[0-9a-f-]{36}\?token=[A-Za-z0-9_-]+$/i.test(value);
}

const inputClass = 'mt-2 min-h-12 w-full rounded-xl border border-[#a6ad9b] bg-white px-3 py-3 text-base text-[#182019] outline-none focus:border-[#d3a314] focus:ring-2 focus:ring-[#eeb82a]/40';

export function QuickProviderRequest() {
  const params = useSearchParams();
  const providerId = Number(params.get('providerId'));
  const chosenProviderId = Number.isInteger(providerId) && providerId > 0 ? providerId : null;
  const providerName = String(params.get('providerName') || '').trim().slice(0, 100);
  const selectedService = String(params.get('service') || '').trim().slice(0, 100);
  const mode = params.get('mode') === 'emergency' ? 'emergency' : 'direct';
  const [category, setCategory] = useState(selectedService || 'Plumbing');
  const [problem, setProblem] = useState('');
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [timing, setTiming] = useState<Timing>(mode === 'emergency' ? 'now' : 'today');
  const [fallback, setFallback] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [imageData, setImageData] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState('');
  const [upgradeUrl, setUpgradeUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const submittingRef = useRef(false);
  const [recoveryUrl, setRecoveryUrl] = useState('');
  const [submitted, setSubmitted] = useState<{ url: string; queued: boolean; reason: string } | null>(null);
  const options = useMemo(() => issueOptions(category), [category]);
  const effectiveLocation = customLocation.trim() || location;
  const urgency = timing === 'now' ? 'emergency' : timing === 'today' ? 'urgent' : 'planned';

  // This access token is only returned when a project is created; the server
  // stores its hash. Keep a tab-scoped recovery link if redirect is interrupted.
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(RECENT_REQUEST_STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as RecentQuickRequest;
      if (!safeTrackingUrl(saved.url) || !Number.isFinite(saved.createdAt)
        || saved.createdAt > Date.now() || Date.now() - saved.createdAt > RECOVERY_AGE_MS) {
        window.sessionStorage.removeItem(RECENT_REQUEST_STORAGE_KEY);
        return;
      }
      setRecoveryUrl(saved.url);
      if (saved.pendingRedirect && Date.now() - saved.createdAt < 5 * 60 * 1000) {
        window.sessionStorage.setItem(RECENT_REQUEST_STORAGE_KEY,
          JSON.stringify({ ...saved, pendingRedirect: false }));
        window.location.replace(saved.url);
      }
    } catch {
      // Storage may be disabled; successful submissions still navigate directly.
    }
  }, []);

  const clearRecovery = () => {
    try { window.sessionStorage.removeItem(RECENT_REQUEST_STORAGE_KEY); } catch { /* disabled storage */ }
    setRecoveryUrl('');
  };

  async function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const photo = event.target.files?.[0];
    event.target.value = '';
    if (!photo) return;
    setPhotoBusy(true);
    setError('');
    try {
      setImageData(await quickImage(photo));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not add photo.');
    } finally {
      setPhotoBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || submitted) return;
    setError('');
    setUpgradeUrl('');
    if (!effectiveLocation || !name.trim() || !phone.trim() || !consent) {
      setError('Please enter your suburb, name, phone number and consent.');
      return;
    }
    if (!problem && details.trim().length < 8) {
      setError('Choose the type of problem or describe it briefly.');
      return;
    }
    const jobDescription = [problem, details.trim()].filter(Boolean).join('. ').slice(0, 3000);
    submittingRef.current = true;
    setBusy(true);
    try {
      const response = await fetch('/api/projects/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: name.trim(),
          guestPhone: phone.trim(),
          guestEmail: null,
          title: (problem || 'Assistance needed') + ' — ' + category,
          customerDescription: jobDescription,
          aiSummary: jobDescription,
          likelyIssue: null,
          category,
          urgency,
          locationText: effectiveLocation,
          preferredDate: null,
          estimatedMin: null,
          estimatedMax: null,
          confidence: null,
          professionalInspectionRequired: true,
          safetyNotes: [],
          materials: [],
          image: imageData || null,
          assessmentPayload: {
            intakeVersion: 'quick-request-v1',
            intakeOrigin: chosenProviderId ? 'controlled_provider_browse' : 'fast_connect',
            questionsAsked: 0,
            model: 'no-ai',
          },
          preferredProviderId: chosenProviderId,
          preferredProviderName: chosenProviderId ? providerName : null,
          allowAlternativeProviders: Boolean(chosenProviderId && fallback && timing !== 'later'),
          consentToShare: true,
        }),
      });
      const payload = await response.json().catch(() => ({})) as SubmitResult;
      if (!response.ok || !payload.project?.id || !payload.accessToken) {
        if (typeof payload.upgradeUrl === 'string') setUpgradeUrl(payload.upgradeUrl);
        throw new Error(payload.error || 'Could not send your request.');
      }
      const queued = chosenProviderId ? Boolean(payload.preferredProvider?.queued) : Boolean(payload.routing?.providersQueued);
      const trackingUrl = '/project/' + encodeURIComponent(payload.project.id) + '?token=' + encodeURIComponent(payload.accessToken);
      // Do not require a second submission if the browser refreshes after success.
      try {
        window.sessionStorage.setItem(RECENT_REQUEST_STORAGE_KEY, JSON.stringify({
          url: trackingUrl, createdAt: Date.now(), pendingRedirect: true,
        } satisfies RecentQuickRequest));
      } catch { /* Continue without tab recovery when storage is disabled. */ }

      setRecoveryUrl(trackingUrl);
      setSubmitted({
        url: trackingUrl,
        queued,
        reason: chosenProviderId ? payload.preferredProvider?.reason || '' : payload.routing?.reason || '',
      });
      // The previous implementation stopped at a volatile React success panel.
      // Open the established dashboard with its secure project access token.
      try { window.location.replace(trackingUrl); } catch { /* The manual link remains visible. */ }
    } catch (reason) {
      submittingRef.current = false;
      setError(reason instanceof Error ? reason.message : 'Could not send your request.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#111712] px-3 py-5 text-[#F9F6E8] sm:px-6 sm:py-8">
      <div className="mx-auto max-w-[660px]">
        <header className="mb-5 flex items-center justify-between gap-2">
          <Link href={chosenProviderId ? '/browse-providers' : '/'} className="flex items-center gap-1 text-sm font-bold text-[#e2e3d9]"><ArrowLeft size={18}/> Back</Link>
          <Link href="/" aria-label="Skills Connect Pro home" className="flex items-center"><Image src="/logo-new.svg" width={160} height={58} alt="Skills Connect Pro" className="h-11 w-auto max-w-[160px] object-contain"/></Link>
        </header>
        <div className="rounded-3xl border border-[#6e632c] bg-[#20281f] px-5 py-6 shadow-xl sm:px-7">
          {submitted ? (
            <section aria-live="polite" className="text-center">
              <CheckCircle2 className="mx-auto text-[#edc342]" size={52}/>
              <h1 className="mt-4 text-2xl font-black">Your request is created</h1>
              <p className="mt-3 text-sm leading-6 text-[#e1dec7]">{submitted.queued ? 'An invitation has been queued. A provider has not yet confirmed availability.' : 'Your request is saved, but provider dispatch has not yet been confirmed.'}</p>
              <p className="mt-2 text-xs text-[#c3bea1]">{submitted.reason}</p>
              <Link href={submitted.url} className="mt-6 flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#F8CE39] px-5 font-black text-[#211c06]">Track provider responses <ArrowRight size={20}/></Link>
              <p className="mt-3 text-xs text-[#c7c6ba]">Keep this link to check responses. Availability and arrival times are not guaranteed.</p>
            </section>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#F8CE39] px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-[#302600]"><Clock3 size={15}/> No AI questionnaire</div>
              <h1 className="mt-3 text-3xl font-black tracking-tight">{chosenProviderId ? 'Send a quick request' : 'Get help quickly'}</h1>
              <p className="mt-2 text-sm leading-6 text-[#D2D4C9]">{chosenProviderId ? 'Your selected provider is already attached. Just share the essentials.' : 'Tell us what you need and where. We will seek responses from suitable local providers.'}</p>
              {chosenProviderId && <div className="mt-4 rounded-xl border border-[#ebc54c]/50 bg-[#F8CE39]/10 p-3 text-sm"><CheckCircle2 size={16} className="mr-2 inline text-[#F8CE39]"/>Selected provider: <strong>{providerName || 'Your chosen provider'}</strong></div>}
              {recoveryUrl && <div role="status" className="mt-4 rounded-xl border border-[#eac448]/60 bg-[#f8ce39]/10 p-4 text-sm leading-6">
                <strong className="block">You have a recently submitted request.</strong>
                <p className="text-[#dedbc5]">You do not need to send it again.</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <Link href={recoveryUrl} className="rounded-lg bg-[#f8ce39] px-3 py-2 font-black text-[#211c06]">Open tracking dashboard →</Link>
                  <button type="button" className="text-xs underline underline-offset-4" onClick={clearRecovery}>Start a different request</button>
                </div>
              </div>}
              <form onSubmit={submit} className="mt-6 space-y-5">
                <section className="rounded-2xl bg-[#F4F1E8] p-4 text-[#182019]">
                  <h2 className="flex items-center gap-2 text-base font-black"><Wrench size={19}/> 1. What do you need?</h2>
                  {!chosenProviderId && <label className="mt-3 block text-sm font-bold">Service
                    <select value={category} onChange={event => {setCategory(event.target.value); setProblem('');}} className={inputClass}>
                      {SERVICES.map(service => <option key={service.value} value={service.value}>{service.label}</option>)}
                    </select>
                  </label>}
                  {chosenProviderId && <p className="mt-2 text-sm">Service: <strong>{category}</strong></p>}
                  <label className="mt-3 block text-sm font-bold">Problem
                    <select value={problem} onChange={event => setProblem(event.target.value)} className={inputClass}>
                      <option value="">Choose a problem (optional)</option>
                      {options.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                  <label className="mt-3 block text-sm font-bold">Short description (optional if selected above)
                    <textarea value={details} onChange={event => setDetails(event.target.value)} maxLength={2000} rows={2} placeholder="e.g. Water coming through kitchen wall" className={inputClass}/>
                  </label>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#a9a99e] px-3 text-xs font-black"><Camera size={17}/> {photoBusy ? 'Preparing photo…' : imageData ? 'Change photo' : 'Add photo (optional)'}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={chooseImage} disabled={photoBusy || busy}/></label>
                    {imageData && <button type="button" onClick={() => setImageData('')} className="flex items-center gap-1 text-xs font-bold"><X size={16}/> Remove photo</button>}
                  </div>
                </section>

                <section className="rounded-2xl bg-[#F4F1E8] p-4 text-[#182019]">
                  <h2 className="flex items-center gap-2 text-base font-black"><MapPin size={19}/> 2. Where do you need help?</h2>
                  <label className="mt-3 block text-sm font-bold">Suburb or town
                    <select value={location} onChange={event => {setLocation(event.target.value); setCustomLocation('');}} className={inputClass}>
                      <option value="">Select an area</option>
                      {AREAS.map(area => <option key={area}>{area}</option>)}
                      <option value="Other">Another area</option>
                    </select>
                  </label>
                  {(location === 'Other' || !location) && <label className="mt-3 block text-sm font-bold">Or enter another suburb or town
                    <input value={customLocation} onChange={event => setCustomLocation(event.target.value)} maxLength={100} placeholder="Suburb or town, not street address" className={inputClass}/>
                  </label>}
                </section>

                <section className="rounded-2xl bg-[#F4F1E8] p-4 text-[#182019]">
                  <h2 className="flex items-center gap-2 text-base font-black"><Clock3 size={19}/> 3. When do you need assistance?</h2>
                  <div className="mt-3 grid gap-2">
                    {([{value:'now',label:'Emergency — right now',detail:'Severe damage or immediate danger'}, {value:'today',label:'Today',detail:'Urgent, but safe to wait briefly'}, {value:'later',label:'Schedule later',detail:'Normal request'}] as const).map(option =>
                      <label key={option.value} className={'flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 ' + (timing === option.value ? 'border-[#ae8010] bg-[#ffe28b]' : 'border-[#ddd9c9] bg-white')}>
                        <input type="radio" name="timing" value={option.value} checked={timing === option.value} onChange={() => setTiming(option.value)} className="accent-[#9b7414]"/>
                        <span><strong className="block text-sm">{option.label}</strong><small className="text-[#5b5d52]">{option.detail}</small></span>
                      </label>
                    )}
                  </div>
                  {timing === 'now' && <p className="mt-3 flex items-start gap-2 rounded-xl bg-[#fff0c5] p-3 text-xs leading-5"><AlertTriangle size={16} className="mt-0.5 shrink-0"/>If there is immediate danger to life, fire or exposed electricity, contact emergency services. For a burst pipe, shut off the water at the mains if safe. We cannot guarantee a provider will respond.</p>}
                  {chosenProviderId && timing !== 'later' && <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-[#d6bd66] bg-[#fff7df] p-3 text-xs leading-5">
                    <input type="checkbox" checked={fallback} onChange={event => setFallback(event.target.checked)} className="mt-1 accent-[#9b7414]"/>
                    <span><strong className="block text-sm">Find alternatives if no response</strong>Allow Skills Connect Pro to invite other suitable professionals after the selected provider's response window expires. Otherwise only this provider is contacted.</span>
                  </label>}
                </section>

                <section className="rounded-2xl bg-[#F4F1E8] p-4 text-[#182019]">
                  <h2 className="flex items-center gap-2 text-base font-black"><ShieldCheck size={19}/> 4. How can we reach you?</h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="text-sm font-bold">Your name
                      <input autoComplete="name" value={name} onChange={event => setName(event.target.value)} maxLength={120} placeholder="Name" required className={inputClass}/>
                    </label>
                    <label className="text-sm font-bold">Mobile / WhatsApp
                      <input autoComplete="tel" inputMode="tel" type="tel" value={phone} onChange={event => setPhone(event.target.value)} maxLength={40} placeholder="07…" required className={inputClass}/>
                    </label>
                  </div>
                  <label className="mt-4 flex cursor-pointer items-start gap-2 text-xs leading-5">
                    <input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} required className="mt-1 accent-[#b78d14]"/>
                    <span>I agree to share this job brief with invited professionals. My phone number stays private until I confirm a connection.</span>
                  </label>
                </section>

                {error && <div role="alert" className="rounded-xl border border-[#d78080] bg-[#541b1b] p-3 text-sm text-white">{error}{upgradeUrl && <Link href={upgradeUrl} className="ml-2 underline">View plans</Link>}</div>}
                <button type="submit" disabled={busy || photoBusy} className="flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#F8CE39] px-5 text-base font-black text-[#211c06] shadow-[0_9px_24px_rgba(0,0,0,.2)] disabled:opacity-50">
                  {busy ? <><Loader2 size={22} className="animate-spin"/> Sending request…</> : <>Send Request Now <ArrowRight size={22}/></>}
                </button>
                <p className="text-center text-xs leading-5 text-[#c9c9be]">Invitations are tracked through Skills Connect Pro. A request does not guarantee an available professional or a specific response time.</p>
              </form>
            </>
          )}
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#a6b5a8]"><Search size={14}/><Link href="/browse-providers" className="underline">Browse providers instead</Link></div>
      </div>
    </main>
  );
}
