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
  FileText,
  Loader2,
  MapPin,
  Mic,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Upload,
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

type SpeechRecognitionEventLike = Event & {
  results: ArrayLike<{
    0: { transcript: string };
  }>;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const AREAS = [
  'Alberton',
  'Benoni',
  'Boksburg',
  'Brakpan',
  'Daveyton',
  'Duduza',
  'Germiston',
  'Johannesburg',
  'Katlehong',
  'Kempton Park',
  'Kwa-Thema',
  'Nigel',
  'Springs',
  'Tembisa',
  'Tsakane',
  'Vosloorus',
];

const URGENCY_OPTIONS: Array<{
  value: ProjectUrgency;
  label: string;
  detail: string;
}> = [
  { value: 'emergency', label: 'Emergency', detail: 'Immediate danger or severe damage' },
  { value: 'urgent', label: 'Urgent', detail: 'Needs attention today' },
  { value: 'planned', label: 'Planned', detail: 'Can be scheduled normally' },
  { value: 'large_project', label: 'Larger project', detail: 'Renovation or multi-day work' },
];

function formatMoney(value: number | null): string {
  if (value === null) return 'Not available yet';
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
        const maximumWidth = 720;
        const scale = Math.min(1, maximumWidth / image.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Image processing is not supported on this device.'));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const preview = canvas.toDataURL('image/jpeg', 0.62);
        resolve({ data: preview.split(',')[1] ?? '', preview });
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
  const [createdProjectTitle, setCreatedProjectTitle] = useState('');

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
      setError('Please tell us a little more about what is wrong.');
      return;
    }

    setIsWorking(true);
    try {
      const answerPayload = includeAnswers && assessment
        ? assessment.clarifyingQuestions
            .map((question) => ({
              question: question.question,
              answer: answers[question.id] ?? '',
            }))
            .filter((item) => item.answer.trim())
        : [];

      const response = await fetch('/api/project-intake/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          image: imageData,
          answers: answerPayload,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.assessment) {
        throw new Error(payload.error || 'We could not prepare the project brief.');
      }

      const nextAssessment = payload.assessment as IntakeAssessment;
      setAssessment(nextAssessment);
      setUsedFallback(Boolean(payload.usedFallback));
      setAnswers({});
      setStep(nextAssessment.clarifyingQuestions.length > 0 ? 'clarify' : 'confirm');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Something went wrong. Please try again.');
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

    setError('');
    setIsWorking(true);
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

    const Constructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Constructor) {
      setError('Voice input is not supported by this browser. You can type the problem instead.');
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
    recognition.onerror = () => setError('We could not hear that clearly. Please try again or type the problem.');
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const submitProject = async () => {
    if (!assessment) return;
    setError('');

    const normalisedPhone = phone.replace(/[^0-9+]/g, '');
    if (!resolvedLocation) {
      setError('Please select or enter the project location.');
      return;
    }
    if (!customerName.trim()) {
      setError('Please enter the customer name.');
      return;
    }
    if (normalisedPhone.replace(/\D/g, '').length < 9) {
      setError('Please enter a valid phone or WhatsApp number.');
      return;
    }
    if (!consent) {
      setError('Please confirm that the project brief may be shared with suitable providers.');
      return;
    }

    setIsWorking(true);
    try {
      const clarifiedAnswers = Object.entries(answers).map(([id, answer]) => ({ id, answer }));
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: customerName.trim(),
          guestPhone: normalisedPhone,
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
            clarifyingAnswers: clarifiedAnswers,
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

      setCreatedProjectTitle(payload.project.title || assessment.title);
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

  return (
    <main className="min-h-screen bg-[#172119] text-[#182019]">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-6 flex items-center justify-between rounded-2xl border border-black/10 bg-[#f4f0e4] px-4 py-3 shadow-[0_12px_35px_rgba(0,0,0,0.12)] sm:px-6">
          <a href="/" className="flex items-center gap-2 text-sm font-black">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5c518]">
              <Wrench size={19} />
            </span>
            Skills Connect Pro
          </a>
          <span className="hidden rounded-full bg-[#dfe8d6] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#435446] sm:block">
            Guided project request
          </span>
        </header>

        {step !== 'done' && (
          <div className="mb-6 grid grid-cols-3 gap-2">
            {[
              ['1', 'Describe'],
              ['2', 'Confirm'],
              ['3', 'Submit'],
            ].map(([number, label], index) => {
              const activeIndex = step === 'describe' ? 0 : step === 'clarify' ? 1 : 2;
              const active = index <= activeIndex;
              return (
                <div key={number} className={`rounded-xl px-3 py-3 text-center ${active ? 'bg-[#f5c518] text-black' : 'bg-white/10 text-white/45'}`}>
                  <div className="text-[9px] font-black uppercase tracking-widest">Step {number}</div>
                  <div className="mt-1 text-xs font-black">{label}</div>
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">
            <AlertTriangle className="mt-0.5 shrink-0" size={19} />
            <span>{error}</span>
          </div>
        )}

        {step === 'describe' && (
          <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-[#f4f0e4] shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
            <div className="bg-[#f5c518] p-6 sm:p-9">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/10">
                <Sparkles size={25} />
              </div>
              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">Show us the job.</h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-black/65 sm:text-base">
                Type it, say it, or add a photograph. We will turn it into a clear project brief and a preliminary cost range.
              </p>
            </div>

            <div className="space-y-5 p-5 sm:p-8">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-widest text-[#59655a]">
                  What needs attention?
                </span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={6}
                  maxLength={4_000}
                  placeholder="For example: Water is leaking underneath my kitchen sink and gets worse when I open the tap."
                  className="w-full resize-none rounded-2xl border-2 border-[#c8c7bb] bg-white p-4 text-base leading-7 outline-none transition focus:border-[#667764]"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`flex min-h-20 items-center gap-4 rounded-2xl border-2 p-4 text-left transition ${isListening ? 'border-red-400 bg-red-50' : 'border-[#aeb9a9] bg-[#e8eee2] hover:border-[#667764]'}`}
                >
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isListening ? 'bg-red-500 text-white' : 'bg-[#667764] text-white'}`}>
                    <Mic size={21} />
                  </span>
                  <span>
                    <span className="block text-sm font-black">{isListening ? 'Listening…' : 'Speak instead'}</span>
                    <span className="mt-1 block text-xs text-[#667064]">Use your own words</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-20 items-center gap-4 rounded-2xl border-2 border-[#aeb9a9] bg-[#e8eee2] p-4 text-left transition hover:border-[#667764]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#667764] text-white">
                    <Camera size={21} />
                  </span>
                  <span>
                    <span className="block text-sm font-black">Add a photograph</span>
                    <span className="mt-1 block text-xs text-[#667064]">Camera or gallery</span>
                  </span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImage}
                className="hidden"
              />

              {imagePreview && (
                <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-[#dfe8d6] p-3">
                  <img src={imagePreview} alt="Project issue preview" className="h-52 w-full rounded-xl object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageData('');
                      setImagePreview('');
                    }}
                    className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-black text-white"
                    aria-label="Remove photograph"
                  >
                    <X size={18} />
                  </button>
                  <div className="mt-3 flex items-center gap-2 px-1 text-xs font-bold text-[#526052]">
                    <Upload size={15} /> Photograph ready for assessment
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-[#e8eee2] p-4 text-xs leading-5 text-[#526052]">
                <strong>Important:</strong> this is a preliminary assessment, not a final diagnosis or quotation. Dangerous situations should be handled by the appropriate emergency service.
              </div>

              <button
                type="button"
                disabled={isWorking || description.trim().length < 10}
                onClick={() => assessProject(false)}
                className="flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#f5c518] px-5 text-base font-black shadow-[0_8px_0_#a57f00] transition active:translate-y-1 active:shadow-[0_4px_0_#a57f00] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isWorking ? <Loader2 className="animate-spin" size={21} /> : <Sparkles size={21} />}
                {isWorking ? 'Preparing your brief…' : 'Understand this job'}
              </button>
            </div>
          </section>
        )}

        {step === 'clarify' && assessment && (
          <section className="rounded-[2rem] border border-black/10 bg-[#f4f0e4] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.2)] sm:p-8">
            <button type="button" onClick={() => setStep('describe')} className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#59655a]">
              <ArrowLeft size={16} /> Back
            </button>

            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f5c518]">
                <FileText size={23} />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#667764]">A few quick details</p>
                <h1 className="mt-1 text-2xl font-black sm:text-3xl">Help us sharpen the brief.</h1>
                <p className="mt-2 text-sm leading-6 text-[#667064]">Tap the closest answer. This should take less than a minute.</p>
              </div>
            </div>

            <div className="mt-7 space-y-6">
              {assessment.clarifyingQuestions.map((question, index) => (
                <div key={question.id} className="rounded-2xl border border-[#c8c7bb] bg-white p-4 sm:p-5">
                  <p className="text-sm font-black"><span className="mr-2 text-[#a57f00]">{index + 1}.</span>{question.question}</p>
                  {question.options.length > 0 ? (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {question.options.map((option) => {
                        const selected = answers[question.id] === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setAnswers((current) => ({ ...current, [question.id]: option }))}
                            className={`flex min-h-12 items-center justify-between rounded-xl border-2 px-4 text-left text-sm font-bold transition ${selected ? 'border-[#667764] bg-[#dfe8d6]' : 'border-[#d9d8cf] bg-[#faf9f4]'}`}
                          >
                            {option}
                            {selected && <Check size={17} />}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <input
                      value={answers[question.id] ?? ''}
                      onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                      placeholder="Type your answer"
                      className="mt-4 w-full rounded-xl border-2 border-[#d9d8cf] bg-[#faf9f4] px-4 py-3 outline-none focus:border-[#667764]"
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={isWorking || !requiredQuestionsAnswered}
              onClick={() => assessProject(true)}
              className="mt-7 flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#f5c518] px-5 text-base font-black shadow-[0_8px_0_#a57f00] transition active:translate-y-1 active:shadow-[0_4px_0_#a57f00] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isWorking ? <Loader2 className="animate-spin" size={21} /> : <ArrowRight size={21} />}
              {isWorking ? 'Updating the brief…' : 'Create my project brief'}
            </button>
          </section>
        )}

        {step === 'confirm' && assessment && (
          <section className="space-y-5">
            <div className="rounded-[2rem] border border-black/10 bg-[#f4f0e4] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.2)] sm:p-8">
              <button type="button" onClick={() => setStep('describe')} className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#59655a]">
                <ArrowLeft size={16} /> Change description
              </button>

              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#667764]">Your project brief</p>
                  <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{assessment.title}</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#59655a]">{assessment.summary}</p>
                </div>
                <span className="w-fit rounded-full bg-[#dfe8d6] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#435446]">
                  {assessment.category}
                </span>
              </div>

              {usedFallback && (
                <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-900">
                  A conservative standard brief was used because live AI assessment was unavailable. A professional inspection is required.
                </div>
              )}

              {assessment.safetyNotes.length > 0 && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-black text-red-800">
                    <AlertTriangle size={18} /> Safety first
                  </div>
                  <ul className="mt-2 space-y-1 text-sm leading-6 text-red-700">
                    {assessment.safetyNotes.map((note) => <li key={note}>• {note}</li>)}
                  </ul>
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-[#e8eee2] p-4">
                  <Clock3 className="text-[#667764]" size={20} />
                  <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-[#667064]">Urgency</div>
                  <div className="mt-1 text-sm font-black capitalize">{assessment.urgency.replace('_', ' ')}</div>
                </div>
                <div className="rounded-2xl bg-[#e8eee2] p-4">
                  <CircleDollarSign className="text-[#667764]" size={20} />
                  <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-[#667064]">Preliminary range</div>
                  <div className="mt-1 text-sm font-black">{formatMoney(assessment.estimatedMin)} – {formatMoney(assessment.estimatedMax)}</div>
                </div>
                <div className="rounded-2xl bg-[#e8eee2] p-4">
                  <ShieldCheck className="text-[#667764]" size={20} />
                  <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-[#667064]">Confidence</div>
                  <div className="mt-1 text-sm font-black">{Math.round(assessment.confidence * 100)}% preliminary</div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-[#c8c7bb] bg-white p-4 sm:p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#667064]">Likely issue</p>
                <p className="mt-2 text-sm leading-6">{assessment.likelyIssue}</p>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-xs font-black uppercase tracking-widest text-[#667064]">Confirm urgency</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {URGENCY_OPTIONS.map((option) => {
                    const selected = assessment.urgency === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setAssessment((current) => current ? { ...current, urgency: option.value } : current)}
                        className={`rounded-xl border-2 p-3 text-left transition ${selected ? 'border-[#667764] bg-[#dfe8d6]' : 'border-[#d9d8cf] bg-[#faf9f4]'}`}
                      >
                        <span className="flex items-center justify-between text-sm font-black">
                          {option.label}
                          {selected && <Check size={17} />}
                        </span>
                        <span className="mt-1 block text-xs text-[#667064]">{option.detail}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/10 bg-[#f4f0e4] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.2)] sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5c518]">
                  <MapPin size={21} />
                </span>
                <div>
                  <h2 className="text-xl font-black">Where and when?</h2>
                  <p className="text-xs text-[#667064]">This helps us find providers who can actually reach you.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[#667064]">Area</span>
                  <select
                    value={location}
                    onChange={(event) => {
                      setLocation(event.target.value);
                      if (event.target.value) setCustomLocation('');
                    }}
                    className="w-full rounded-xl border-2 border-[#c8c7bb] bg-white px-4 py-3 outline-none focus:border-[#667764]"
                  >
                    <option value="">Select your area</option>
                    {AREAS.map((area) => <option key={area} value={area}>{area}</option>)}
                  </select>
                </label>
                <label>
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[#667064]">Preferred date — optional</span>
                  <input
                    type="date"
                    value={preferredDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(event) => setPreferredDate(event.target.value)}
                    className="w-full rounded-xl border-2 border-[#c8c7bb] bg-white px-4 py-3 outline-none focus:border-[#667764]"
                  />
                </label>
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[#667064]">Different area or address</span>
                <input
                  value={customLocation}
                  onChange={(event) => {
                    setCustomLocation(event.target.value);
                    if (event.target.value) setLocation('');
                  }}
                  placeholder="Type suburb or area"
                  className="w-full rounded-xl border-2 border-[#c8c7bb] bg-white px-4 py-3 outline-none focus:border-[#667764]"
                />
              </label>
            </div>

            <div className="rounded-[2rem] border border-black/10 bg-[#f4f0e4] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.2)] sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5c518]">
                  <UserRound size={21} />
                </span>
                <div>
                  <h2 className="text-xl font-black">How should providers reach you?</h2>
                  <p className="text-xs text-[#667064]">Contact details stay private until you select a provider.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[#667064]">Name</span>
                  <input
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-xl border-2 border-[#c8c7bb] bg-white px-4 py-3 outline-none focus:border-[#667764]"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[#667064]">Phone or WhatsApp</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="082 123 4567"
                    className="w-full rounded-xl border-2 border-[#c8c7bb] bg-white px-4 py-3 outline-none focus:border-[#667764]"
                  />
                </label>
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[#667064]">Email — optional</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border-2 border-[#c8c7bb] bg-white px-4 py-3 outline-none focus:border-[#667764]"
                />
              </label>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-[#c8c7bb] bg-[#e8eee2] p-4">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  className="mt-1 h-5 w-5 accent-[#667764]"
                />
                <span className="text-sm leading-6 text-[#526052]">
                  I confirm this information is accurate and allow Skills Connect Pro to share the project brief—but not my contact details—with suitable providers.
                </span>
              </label>

              <button
                type="button"
                disabled={isWorking}
                onClick={submitProject}
                className="mt-6 flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#f5c518] px-5 text-base font-black shadow-[0_8px_0_#a57f00] transition active:translate-y-1 active:shadow-[0_4px_0_#a57f00] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isWorking ? <Loader2 className="animate-spin" size={21} /> : <CheckCircle2 size={21} />}
                {isWorking ? 'Creating your project…' : 'Submit project request'}
              </button>
            </div>
          </section>
        )}

        {step === 'done' && (
          <section className="rounded-[2rem] border border-[#43a67b] bg-[#e9f5e8] p-6 text-center shadow-[0_18px_50px_rgba(0,0,0,0.2)] sm:p-10">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#167451] text-white">
              <CheckCircle2 size={34} />
            </span>
            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.24em] text-[#167451]">Project created</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{createdProjectTitle}</h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#526052]">
              Your private project dashboard is ready. Provider responses will appear there as they arrive, and your contact details remain protected until you select someone.
            </p>

            <a
              href={customerUrl}
              className="mt-7 flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#f5c518] px-5 text-base font-black text-black shadow-[0_8px_0_#a57f00] transition active:translate-y-1 active:shadow-[0_4px_0_#a57f00]"
            >
              Open my project dashboard <ArrowRight size={21} />
            </a>

            <button
              type="button"
              onClick={restart}
              className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#526052]"
            >
              <RotateCcw size={16} /> Create another project
            </button>
          </section>
        )}
      </div>
    </main>
  );
};
