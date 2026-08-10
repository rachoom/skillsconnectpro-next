'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Loader2,
  MapPin,
  Mic,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';

type ProjectUrgency = 'emergency' | 'urgent' | 'planned' | 'large_project';

type IntakeMaterial = {
  name: string;
  quantity?: number;
  unit?: string;
  estimatedUnitPrice?: number;
  estimatedTotal?: number;
  notes?: string;
};

type IntakeQuestion = {
  id: string;
  question: string;
  options: string[];
  required: boolean;
};

type IntakeAssessment = {
  title: string;
  summary: string;
  likelyIssue: string;
  category: string;
  urgency: ProjectUrgency;
  confidence: number;
  professionalInspectionRequired: boolean;
  safetyNotes: string[];
  estimatedMin: number | null;
  estimatedMax: number | null;
  materials: IntakeMaterial[];
  clarifyingQuestions: IntakeQuestion[];
  estimateType: 'standardized' | 'refined';
  model: string;
};

type SpeechResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const AREAS = [
  'Alberton', 'Benoni', 'Boksburg', 'Brakpan', 'Daveyton', 'Duduza',
  'Germiston', 'Johannesburg', 'Katlehong', 'Kempton Park', 'Kwa-Thema',
  'Nigel', 'Springs', 'Tembisa', 'Tsakane', 'Vosloorus',
];

const URGENCY_OPTIONS: Array<{ value: ProjectUrgency; label: string; detail: string }> = [
  { value: 'emergency', label: 'Emergency', detail: 'Immediate danger or severe damage' },
  { value: 'urgent', label: 'Urgent', detail: 'Needs attention today' },
  { value: 'planned', label: 'Planned', detail: 'Can be scheduled normally' },
  { value: 'large_project', label: 'Larger project', detail: 'Renovation or multi-day work' },
];

const fieldClass = 'w-full rounded-xl border-2 border-[#c8c7bb] bg-white px-4 py-3 outline-none transition focus:border-[#667764]';

function formatMoney(value: number | null): string {
  if (value === null) return 'Not available';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(value);
}

function compressImage(file: File): Promise<{ data: string; preview: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read the image.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Unable to open the image.'));
      image.onload = () => {
        const scale = Math.min(1, 720 / image.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context) return reject(new Error('Image processing is unavailable.'));
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const preview = canvas.toDataURL('image/jpeg', 0.62);
        resolve({ preview, data: preview.split(',')[1] ?? '' });
      };
      image.src = String(reader.result ?? '');
    };
    reader.readAsDataURL(file);
  });
}

export const ProjectIntake: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const [step, setStep] = useState<'describe' | 'clarify' | 'confirm' | 'done'>('describe');
  const [description, setDescription] = useState('');
  const [imageData, setImageData] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [assessment, setAssessment] = useState<IntakeAssessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [location, setLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState('');
  const [usedFallback, setUsedFallback] = useState(false);
  const [customerUrl, setCustomerUrl] = useState('');
  const [createdTitle, setCreatedTitle] = useState('');

  const resolvedLocation = customLocation.trim() || location;
  const requiredQuestionsAnswered = useMemo(() => {
    if (!assessment) return false;
    return assessment.clarifyingQuestions
      .filter((question) => question.required)
      .every((question) => Boolean(answers[question.id]?.trim()));
  }, [answers, assessment]);

  const assessProject = async (includeAnswers: boolean) => {
    setError('');
    if (description.trim().length < 10) {
      setError('Please describe the problem in a little more detail.');
      return;
    }

    setIsWorking(true);
    try {
      const response = await fetch('/api/project-intake/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          image: imageData,
          answers: includeAnswers && assessment
            ? assessment.clarifyingQuestions.map((question) => ({
                question: question.question,
                answer: answers[question.id] ?? '',
              })).filter((item) => item.answer.trim())
            : [],
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.assessment) {
        throw new Error(payload.error || 'We could not prepare the project brief.');
      }

      const next = payload.assessment as IntakeAssessment;
      setAssessment(next);
      setUsedFallback(Boolean(payload.usedFallback));
      setAnswers({});
      setStep(next.clarifyingQuestions.length ? 'clarify' : 'confirm');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Please try again.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose a photograph or image.');
      return;
    }

    setIsWorking(true);
    setError('');
    try {
      const compressed = await compressImage(file);
      setImageData(compressed.data);
      setImagePreview(compressed.preview);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to prepare the image.');
    } finally {
      setIsWorking(false);
      event.target.value = '';
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const speechWindow = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Constructor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Constructor) {
      setError('Voice input is unavailable in this browser. You can type instead.');
      return;
    }

    setError('');
    const recognition = new Constructor();
    recognition.lang = 'en-ZA';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) {
        setDescription((current) => `${current}${current.trim() ? ' ' : ''}${transcript}`);
      }
    };
    recognition.onerror = () => setError('We could not hear that clearly. Please try again or type.');
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const submitProject = async () => {
    if (!assessment) return;
    setError('');
    const cleanPhone = phone.replace(/[^0-9+]/g, '');

    if (!resolvedLocation) return setError('Please select or enter the project location.');
    if (!customerName.trim()) return setError('Please enter your name.');
    if (cleanPhone.replace(/\D/g, '').length < 9) return setError('Please enter a valid phone or WhatsApp number.');
    if (!consent) return setError('Please confirm that the brief may be shared with suitable providers.');

    setIsWorking(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: customerName.trim(),
          guestPhone: cleanPhone,
          guestEmail: email.trim() || null,
          title: assessment.title,
          customerDescription: description.trim(),
          aiSummary: assessment.summary,
          likelyIssue: assessment.likelyIssue,
          category: assessment.category,
          urgency: assessment.urgency,
          serviceLevel: 'free',
          locationText: resolvedLocation,
          suburb: resolvedLocation,
          preferredDate: preferredDate || null,
          estimatedMin: assessment.estimatedMin,
          estimatedMax: assessment.estimatedMax,
          estimateCurrency: 'ZAR',
          confidence: assessment.confidence,
          professionalInspectionRequired: assessment.professionalInspectionRequired,
          safetyNotes: assessment.safetyNotes,
          materials: assessment.materials,
          assessmentPayload: {
            recommendedQuestions: assessment.clarifyingQuestions.map((question) => question.question),
            clarifyingAnswers: Object.entries(answers).map(([id, answer]) => ({ id, answer })),
            estimateType: assessment.estimateType,
            model: assessment.model,
            photoUsed: Boolean(imageData),
            intakeVersion: 'guided-web-v1',
          },
          sourceChannel: 'web',
          consentToShare: true,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.project?.id || !payload.accessToken) {
        throw new Error(payload.error || 'We could not create the project.');
      }

      setCreatedTitle(payload.project.title || assessment.title);
      setCustomerUrl(`/project/${payload.project.id}?token=${encodeURIComponent(payload.accessToken)}`);
      setStep('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to create the project.');
    } finally {
      setIsWorking(false);
    }
  };

  const restart = () => {
    recognitionRef.current?.stop();
    setStep('describe');
    setDescription('');
    setImageData('');
    setImagePreview('');
    setAssessment(null);
    setAnswers({});
    setLocation('');
    setCustomLocation('');
    setPreferredDate('');
    setCustomerName('');
    setPhone('');
    setEmail('');
    setConsent(false);
    setError('');
    setUsedFallback(false);
    setCustomerUrl('');
  };

  const progress = step === 'describe' ? 0 : step === 'clarify' ? 1 : 2;

  return (
    <main className="min-h-screen bg-[#172119] text-[#182019]">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-6 flex items-center justify-between rounded-2xl border border-black/10 bg-[#f4f0e4] px-4 py-3 shadow-xl sm:px-6">
          <a href="/" className="flex items-center gap-2 text-sm font-black">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5c518]"><Wrench size={19} /></span>
            Skills Connect Pro
          </a>
          <span className="hidden rounded-full bg-[#dfe8d6] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#435446] sm:block">Guided request</span>
        </header>

        {step !== 'done' && (
          <div className="mb-6 grid grid-cols-3 gap-2">
            {['Describe', 'Confirm', 'Submit'].map((label, index) => (
              <div key={label} className={`rounded-xl px-3 py-3 text-center ${index <= progress ? 'bg-[#f5c518]' : 'bg-white/10 text-white/45'}`}>
                <div className="text-[9px] font-black uppercase tracking-widest">Step {index + 1}</div>
                <div className="mt-1 text-xs font-black">{label}</div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">
            <AlertTriangle className="mt-0.5 shrink-0" size={19} /> {error}
          </div>
        )}

        {step === 'describe' && (
          <section className="overflow-hidden rounded-[2rem] bg-[#f4f0e4] shadow-2xl">
            <div className="bg-[#f5c518] p-6 sm:p-9">
              <Sparkles size={28} />
              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">Show us the job.</h1>
              <p className="mt-3 max-w-2xl font-semibold leading-6 text-black/65">Type it, say it, or add a photograph. We will turn it into a clear project brief and preliminary cost range.</p>
            </div>
            <div className="space-y-5 p-5 sm:p-8">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-widest text-[#59655a]">What needs attention?</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={6}
                  maxLength={4_000}
                  placeholder="For example: Water is leaking underneath my kitchen sink and gets worse when I open the tap."
                  className="w-full resize-none rounded-2xl border-2 border-[#c8c7bb] bg-white p-4 text-base leading-7 outline-none focus:border-[#667764]"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={toggleListening} className={`flex min-h-20 items-center gap-4 rounded-2xl border-2 p-4 text-left ${isListening ? 'border-red-400 bg-red-50' : 'border-[#aeb9a9] bg-[#e8eee2]'}`}>
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${isListening ? 'bg-red-500 text-white' : 'bg-[#667764] text-white'}`}><Mic size={21} /></span>
                  <span><strong className="block text-sm">{isListening ? 'Listening…' : 'Speak instead'}</strong><small className="text-[#667064]">Use your own words</small></span>
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex min-h-20 items-center gap-4 rounded-2xl border-2 border-[#aeb9a9] bg-[#e8eee2] p-4 text-left">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#667764] text-white"><Camera size={21} /></span>
                  <span><strong className="block text-sm">Add a photograph</strong><small className="text-[#667064]">Camera or gallery</small></span>
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImage} className="hidden" />

              {imagePreview && (
                <div className="relative rounded-2xl bg-[#dfe8d6] p-3">
                  <img src={imagePreview} alt="Project issue" className="h-52 w-full rounded-xl object-cover" />
                  <button type="button" onClick={() => { setImageData(''); setImagePreview(''); }} className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-black text-white" aria-label="Remove image"><X size={18} /></button>
                </div>
              )}

              <p className="rounded-2xl bg-[#e8eee2] p-4 text-xs leading-5 text-[#526052]"><strong>Preliminary only:</strong> this is not a final diagnosis or quotation. Dangerous situations should be handled by the appropriate emergency service.</p>
              <button type="button" disabled={isWorking || description.trim().length < 10} onClick={() => assessProject(false)} className="flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#f5c518] font-black shadow-[0_8px_0_#a57f00] disabled:opacity-45">
                {isWorking ? <Loader2 className="animate-spin" size={21} /> : <Sparkles size={21} />}
                {isWorking ? 'Preparing your brief…' : 'Understand this job'}
              </button>
            </div>
          </section>
        )}

        {step === 'clarify' && assessment && (
          <section className="rounded-[2rem] bg-[#f4f0e4] p-5 shadow-2xl sm:p-8">
            <button type="button" onClick={() => setStep('describe')} className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#59655a]"><ArrowLeft size={16} /> Back</button>
            <h1 className="text-3xl font-black">A few quick details.</h1>
            <p className="mt-2 text-sm text-[#667064]">Tap the closest answer. This should take less than a minute.</p>
            <div className="mt-7 space-y-5">
              {assessment.clarifyingQuestions.map((question, index) => (
                <div key={question.id} className="rounded-2xl border border-[#c8c7bb] bg-white p-5">
                  <p className="text-sm font-black"><span className="mr-2 text-[#a57f00]">{index + 1}.</span>{question.question}</p>
                  {question.options.length ? (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {question.options.map((option) => {
                        const selected = answers[question.id] === option;
                        return <button key={option} type="button" onClick={() => setAnswers((current) => ({ ...current, [question.id]: option }))} className={`flex min-h-12 items-center justify-between rounded-xl border-2 px-4 text-left text-sm font-bold ${selected ? 'border-[#667764] bg-[#dfe8d6]' : 'border-[#d9d8cf] bg-[#faf9f4]'}`}>{option}{selected && <Check size={17} />}</button>;
                      })}
                    </div>
                  ) : (
                    <input value={answers[question.id] ?? ''} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} placeholder="Type your answer" className={`${fieldClass} mt-4`} />
                  )}
                </div>
              ))}
            </div>
            <button type="button" disabled={isWorking || !requiredQuestionsAnswered} onClick={() => assessProject(true)} className="mt-7 flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#f5c518] font-black shadow-[0_8px_0_#a57f00] disabled:opacity-45">
              {isWorking ? <Loader2 className="animate-spin" size={21} /> : <ArrowRight size={21} />}
              {isWorking ? 'Updating the brief…' : 'Create my project brief'}
            </button>
          </section>
        )}

        {step === 'confirm' && assessment && (
          <section className="space-y-5">
            <div className="rounded-[2rem] bg-[#f4f0e4] p-5 shadow-2xl sm:p-8">
              <button type="button" onClick={() => setStep('describe')} className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#59655a]"><ArrowLeft size={16} /> Change description</button>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#667764]">Your project brief</p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">{assessment.title}</h1>
              <p className="mt-3 text-sm leading-6 text-[#59655a]">{assessment.summary}</p>
              <span className="mt-4 inline-flex rounded-full bg-[#dfe8d6] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#435446]">{assessment.category}</span>

              {usedFallback && <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-900">A conservative standard brief was used because live AI assessment was unavailable.</div>}
              {assessment.safetyNotes.length > 0 && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><strong className="flex items-center gap-2"><AlertTriangle size={18} /> Safety first</strong>{assessment.safetyNotes.map((note) => <p key={note} className="mt-2">• {note}</p>)}</div>}

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <SummaryCard icon={<Clock3 size={20} />} label="Urgency" value={assessment.urgency.replace('_', ' ')} />
                <SummaryCard icon={<CircleDollarSign size={20} />} label="Preliminary range" value={`${formatMoney(assessment.estimatedMin)} – ${formatMoney(assessment.estimatedMax)}`} />
                <SummaryCard icon={<ShieldCheck size={20} />} label="Confidence" value={`${Math.round(assessment.confidence * 100)}% preliminary`} />
              </div>
              <div className="mt-5 rounded-2xl border border-[#c8c7bb] bg-white p-5"><p className="text-[10px] font-black uppercase tracking-widest text-[#667064]">Likely issue</p><p className="mt-2 text-sm leading-6">{assessment.likelyIssue}</p></div>

              <p className="mb-3 mt-6 text-xs font-black uppercase tracking-widest text-[#667064]">Confirm urgency</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {URGENCY_OPTIONS.map((option) => {
                  const selected = assessment.urgency === option.value;
                  return <button key={option.value} type="button" onClick={() => setAssessment((current) => current ? { ...current, urgency: option.value } : current)} className={`rounded-xl border-2 p-3 text-left ${selected ? 'border-[#667764] bg-[#dfe8d6]' : 'border-[#d9d8cf] bg-[#faf9f4]'}`}><span className="flex justify-between text-sm font-black">{option.label}{selected && <Check size={17} />}</span><small className="text-[#667064]">{option.detail}</small></button>;
                })}
              </div>
            </div>

            <FormCard icon={<MapPin size={21} />} title="Where and when?" description="This helps us find providers who can actually reach you.">
              <div className="grid gap-4 sm:grid-cols-2">
                <label><FieldLabel>Area</FieldLabel><select value={location} onChange={(event) => { setLocation(event.target.value); if (event.target.value) setCustomLocation(''); }} className={fieldClass}><option value="">Select your area</option>{AREAS.map((area) => <option key={area}>{area}</option>)}</select></label>
                <label><FieldLabel>Preferred date — optional</FieldLabel><input type="date" value={preferredDate} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setPreferredDate(event.target.value)} className={fieldClass} /></label>
              </div>
              <label className="mt-4 block"><FieldLabel>Different area or address</FieldLabel><input value={customLocation} onChange={(event) => { setCustomLocation(event.target.value); if (event.target.value) setLocation(''); }} placeholder="Type suburb or area" className={fieldClass} /></label>
            </FormCard>

            <FormCard icon={<UserRound size={21} />} title="How should providers reach you?" description="Your contact details remain private until you select a provider.">
              <div className="grid gap-4 sm:grid-cols-2">
                <label><FieldLabel>Name</FieldLabel><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Your name" className={fieldClass} /></label>
                <label><FieldLabel>Phone or WhatsApp</FieldLabel><input type="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="082 123 4567" className={fieldClass} /></label>
              </div>
              <label className="mt-4 block"><FieldLabel>Email — optional</FieldLabel><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className={fieldClass} /></label>
              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-[#c8c7bb] bg-[#e8eee2] p-4"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-5 w-5 accent-[#667764]" /><span className="text-sm leading-6 text-[#526052]">I confirm this information is accurate and allow Skills Connect Pro to share the project brief—but not my contact details—with suitable providers.</span></label>
              <button type="button" disabled={isWorking} onClick={submitProject} className="mt-6 flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#f5c518] font-black shadow-[0_8px_0_#a57f00] disabled:opacity-45">{isWorking ? <Loader2 className="animate-spin" size={21} /> : <CheckCircle2 size={21} />}{isWorking ? 'Creating your project…' : 'Submit project request'}</button>
            </FormCard>
          </section>
        )}

        {step === 'done' && (
          <section className="rounded-[2rem] border border-[#43a67b] bg-[#e9f5e8] p-7 text-center shadow-2xl sm:p-10">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#167451] text-white"><CheckCircle2 size={34} /></span>
            <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-[#167451]">Project created</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">{createdTitle}</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#526052]">Your private dashboard is ready. Provider responses will appear there, and your contact details remain protected until you select someone.</p>
            <a href={customerUrl} className="mt-7 flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#f5c518] font-black text-black shadow-[0_8px_0_#a57f00]">Open my project dashboard <ArrowRight size={21} /></a>
            <button type="button" onClick={restart} className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#526052]"><RotateCcw size={16} /> Create another project</button>
          </section>
        )}
      </div>
    </main>
  );
};

const SummaryCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="rounded-2xl bg-[#e8eee2] p-4"><span className="text-[#667764]">{icon}</span><div className="mt-3 text-[10px] font-black uppercase tracking-widest text-[#667064]">{label}</div><div className="mt-1 text-sm font-black capitalize">{value}</div></div>
);

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[#667064]">{children}</span>
);

const FormCard: React.FC<{ icon: React.ReactNode; title: string; description: string; children: React.ReactNode }> = ({ icon, title, description, children }) => (
  <div className="rounded-[2rem] bg-[#f4f0e4] p-5 shadow-2xl sm:p-8">
    <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5c518]">{icon}</span><div><h2 className="text-xl font-black">{title}</h2><p className="text-xs text-[#667064]">{description}</p></div></div>
    <div className="mt-5">{children}</div>
  </div>
);
