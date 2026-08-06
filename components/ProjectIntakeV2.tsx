'use client';

import NextImage from 'next/image';
import Link from 'next/link';
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
  Home,
  Loader2,
  MapPin,
  Mic,
  RotateCcw,
  ShieldCheck,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';
import {
  isLikelyStreetAddress,
  phoneValidationMessage,
} from '../services/marketplace/intakePolicy.js';

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

type IntakeAnswer = {
  question: string;
  answer: string;
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

type QuestionProgress = {
  asked: number;
  answered: number;
  normalTarget: number;
  hardLimit: number;
};

type FieldErrors = Partial<Record<'location' | 'name' | 'phone' | 'email' | 'consent', string>>;

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
  { value: 'large_project', label: 'Larger project', detail: 'Renovation, construction or multi-day work' },
];

const fieldClass = 'w-full rounded-xl border-2 border-[#c8c7bb] bg-white px-4 py-3 outline-none transition focus:border-[#667764]';
const errorFieldClass = 'border-red-500 bg-red-50 focus:border-red-600';

function formatMoney(value: number | null): string {
  if (value === null) return 'Not available';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(value);
}

function validEmail(value: string): boolean {
  return !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function mergeAnswerHistory(existing: IntakeAnswer[], additions: IntakeAnswer[]): IntakeAnswer[] {
  const merged = new Map<string, IntakeAnswer>();
  [...existing, ...additions].forEach((item) => {
    const key = item.question.trim().toLowerCase();
    if (key && item.answer.trim()) merged.set(key, { question: item.question, answer: item.answer.trim() });
  });
  return Array.from(merged.values()).slice(0, 9);
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

function focusField(id: string) {
  window.setTimeout(() => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (element instanceof HTMLElement) element.focus({ preventScroll: true });
  }, 50);
}

export const ProjectIntakeV2: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const [step, setStep] = useState<'describe' | 'clarify' | 'confirm' | 'done'>('describe');
  const [description, setDescription] = useState('');
  const [imageData, setImageData] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [assessment, setAssessment] = useState<IntakeAssessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answerHistory, setAnswerHistory] = useState<IntakeAnswer[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [questionProgress, setQuestionProgress] = useState<QuestionProgress | null>(null);
  const [questionErrors, setQuestionErrors] = useState<Record<string, string>>({});
  const [location, setLocation] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isListening, setIsListening] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState('');
  const [usedFallback, setUsedFallback] = useState(false);
  const [customerUrl, setCustomerUrl] = useState('');
  const [createdTitle, setCreatedTitle] = useState('');

  const resolvedLocation = customLocation.trim() || location;
  const requiredAnsweredCount = useMemo(() => {
    if (!assessment) return 0;
    return assessment.clarifyingQuestions.filter((question) => Boolean(answers[question.id]?.trim())).length;
  }, [answers, assessment]);

  const activeQuestion = assessment?.clarifyingQuestions[activeQuestionIndex] ?? null;
  const activeQuestionAnswered = Boolean(activeQuestion && answers[activeQuestion.id]?.trim());
  const clarificationProgress = assessment?.clarifyingQuestions.length
    ? Math.round(((activeQuestionIndex + 1) / assessment.clarifyingQuestions.length) * 100)
    : 0;

  const assessProject = async (includeCurrentAnswers: boolean) => {
    setError('');
    setQuestionErrors({});

    if (description.trim().length < 10) {
      setError('Please describe the job in a little more detail before continuing.');
      focusField('job-description');
      return;
    }

    let collectedAnswers = answerHistory;
    let questionsAskedForRequest = questionCount;

    if (includeCurrentAnswers && assessment) {
      const missing: Record<string, string> = {};
      assessment.clarifyingQuestions.forEach((question) => {
        if (question.required && !answers[question.id]?.trim()) {
          missing[question.id] = 'Please choose or type an answer to continue.';
        }
      });

      if (Object.keys(missing).length > 0) {
        const firstMissingId = Object.keys(missing)[0];
        const firstMissingIndex = assessment.clarifyingQuestions.findIndex((question) => question.id === firstMissingId);
        if (firstMissingIndex >= 0) setActiveQuestionIndex(firstMissingIndex);
        setQuestionErrors(missing);
        setError('Please answer the highlighted clarification question(s).');
        focusField(`question-${firstMissingId}`);
        return;
      }

      const currentAnswers = assessment.clarifyingQuestions
        .map((question) => ({
          question: question.question,
          answer: answers[question.id]?.trim() || '',
        }))
        .filter((item) => item.answer);
      collectedAnswers = mergeAnswerHistory(answerHistory, currentAnswers);
    } else {
      collectedAnswers = [];
      questionsAskedForRequest = 0;
      setAnswerHistory([]);
      setQuestionCount(0);
      setQuestionProgress(null);
    }

    setIsWorking(true);
    try {
      const response = await fetch('/api/project-intake/assess-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          image: imageData,
          answers: collectedAnswers,
          questionsAsked: questionsAskedForRequest,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.assessment) {
        throw new Error(payload.error || 'We could not prepare the project brief.');
      }

      const next = payload.assessment as IntakeAssessment;
      const progress = payload.questionProgress as QuestionProgress | undefined;
      setAssessment(next);
      setUsedFallback(Boolean(payload.usedFallback));
      setAnswerHistory(collectedAnswers);
      setQuestionCount(progress?.asked ?? questionsAskedForRequest + next.clarifyingQuestions.length);
      setQuestionProgress(progress ?? null);
      setAnswers({});
      setActiveQuestionIndex(0);
      setStep(next.clarifyingQuestions.length ? 'clarify' : 'confirm');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      if (transcript) setDescription((current) => `${current}${current.trim() ? ' ' : ''}${transcript}`);
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

    const nextErrors: FieldErrors = {};
    if (!resolvedLocation) {
      nextErrors.location = 'Select your suburb or enter a town/service area.';
    } else if (isLikelyStreetAddress(resolvedLocation)) {
      nextErrors.location = 'For privacy, enter only the suburb or town—not a house number or street address.';
    }
    if (customerName.trim().length < 2) nextErrors.name = 'Your name is required.';
    const phoneError = phoneValidationMessage(phone);
    if (phoneError) nextErrors.phone = phoneError;
    if (!validEmail(email)) nextErrors.email = 'Enter a valid email address or leave this field empty.';
    if (!consent) nextErrors.consent = 'Please confirm permission to share the project brief with suitable providers.';

    setFieldErrors(nextErrors);
    const firstInvalid = (['location', 'name', 'phone', 'email', 'consent'] as const)
      .find((field) => Boolean(nextErrors[field]));
    if (firstInvalid) {
      setError('Please correct the highlighted information before submitting.');
      focusField(`intake-${firstInvalid}`);
      return;
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    setIsWorking(true);
    try {
      const response = await fetch('/api/projects/intake', {
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
          locationText: resolvedLocation,
          preferredDate: preferredDate || null,
          estimatedMin: assessment.estimatedMin,
          estimatedMax: assessment.estimatedMax,
          confidence: assessment.confidence,
          professionalInspectionRequired: assessment.professionalInspectionRequired,
          safetyNotes: assessment.safetyNotes,
          materials: assessment.materials,
          assessmentPayload: {
            clarifyingAnswers: answerHistory,
            questionsAsked: questionCount,
            estimateType: assessment.estimateType,
            model: assessment.model,
            photoUsed: Boolean(imageData),
            intakeVersion: 'guided-web-v2',
          },
          consentToShare: true,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.project?.id || !payload.accessToken) {
        throw new Error(payload.error || 'We could not create the project.');
      }

      setCreatedTitle(payload.project.title || assessment.title);
      setCustomerUrl(`/project/${payload.project.id}?token=${encodeURIComponent(payload.accessToken)}`);
      setStep('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to create the project.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    setActiveQuestionIndex(0);
    setAnswerHistory([]);
    setQuestionCount(0);
    setQuestionProgress(null);
    setQuestionErrors({});
    setLocation('');
    setCustomLocation('');
    setPreferredDate('');
    setCustomerName('');
    setPhone('');
    setEmail('');
    setConsent(false);
    setFieldErrors({});
    setError('');
    setUsedFallback(false);
    setCustomerUrl('');
  };

  const progress = step === 'describe' ? 0 : step === 'clarify' ? 1 : 2;

  return (
    <main className="min-h-screen bg-[#172119] text-[#182019]">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-6 flex items-center justify-between rounded-2xl border border-black/10 bg-[#f4f0e4] px-4 py-3 shadow-xl sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-black">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f5c518]"><Wrench size={19} /></span>
            Skills Connect Pro
          </Link>
          <span className="hidden rounded-full bg-[#dfe8d6] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#435446] sm:block">Guided request</span>
        </header>

        {step !== 'done' && (
          <div data-intake-progress className="mb-6 grid grid-cols-3 gap-2" aria-label={`Step ${progress + 1} of 3`}>
            {['Describe', 'Clarify', 'Submit'].map((label, index) => (
              <div key={label} data-active={index === progress} data-complete={index < progress} aria-current={index === progress ? 'step' : undefined} className={`rounded-xl px-3 py-3 text-center ${index <= progress ? 'bg-[#f5c518]' : 'bg-white/10 text-white/45'}`}>
                <div className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest"><span className="flex h-5 w-5 items-center justify-center rounded-full border border-current">{index < progress ? <Check size={12} /> : index + 1}</span><span>Step {index + 1}</span></div>
                <div className="mt-1 text-xs font-black">{label}</div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">
            <AlertTriangle className="mt-0.5 shrink-0" size={19} /> {error}
          </div>
        )}

        {step === 'describe' && (
          <section data-intake-stage="describe" className="overflow-hidden rounded-[2rem] bg-[#f4f0e4] shadow-2xl">
            <div className="bg-[#f5c518] p-6 sm:p-9">
              <Home size={28} />
              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">What do you need done?</h1>
              <p className="mt-3 max-w-2xl font-semibold leading-6 text-black/65">Tell us in your own words. We’ll turn it into a clear project request and ask only the questions that matter.</p>
            </div>
            <div className="space-y-5 p-5 sm:p-8">
              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-widest text-[#59655a]">Describe the job</span>
                <textarea
                  id="job-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={6}
                  maxLength={4_000}
                  placeholder="For example: I want to build an additional bedroom attached to my house, including electricity and a finished ceiling."
                  className="w-full resize-none rounded-2xl border-2 border-[#c8c7bb] bg-white p-4 text-base leading-7 outline-none focus:border-[#667764]"
                />
                <p className="mt-2 text-xs leading-5 text-[#667064]">Include the result you want, what currently exists and anything that may affect the work.</p>
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
                  <NextImage src={imagePreview} alt="Project issue" width={1200} height={624} unoptimized className="h-52 w-full rounded-xl object-cover" />
                  <button type="button" onClick={() => { setImageData(''); setImagePreview(''); }} className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-black text-white" aria-label="Remove image"><X size={18} /></button>
                </div>
              )}

              <p className="rounded-2xl bg-[#e8eee2] p-4 text-xs leading-5 text-[#526052]"><strong>Preliminary only:</strong> this is not a final diagnosis, approved building plan or quotation. A suitable provider may need to inspect the site.</p>
              <button type="button" disabled={isWorking} onClick={() => void assessProject(false)} className="flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#f5c518] font-black shadow-[0_8px_0_#a57f00] disabled:opacity-45">
                {isWorking ? <Loader2 className="animate-spin" size={21} /> : <ArrowRight size={21} />}
                {isWorking ? 'Understanding the job…' : 'Continue to job questions'}
              </button>
            </div>
          </section>
        )}

        {step === 'clarify' && assessment && (
          <section data-intake-stage="clarify" className="rounded-[2rem] bg-[#f4f0e4] p-5 shadow-2xl sm:p-8">
            <button type="button" onClick={() => setStep('describe')} className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#59655a]"><ArrowLeft size={16} /> Back</button>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-black">Tell us a little more.</h1>
                <p className="mt-2 text-sm leading-6 text-[#667064]">These questions are based on the job you described—not a generic fault checklist.</p>
              </div>
              <span className="self-start rounded-full bg-[#dfe8d6] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#435446]">
                Question {activeQuestionIndex + 1} of {assessment.clarifyingQuestions.length}
              </span>
            </div>

            <div className="mt-6" aria-label={`${clarificationProgress}% through clarification`}>
              <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em]"><span>Project details</span><span>{clarificationProgress}%</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-[#f5c518] transition-[width] duration-300" style={{ width: `${clarificationProgress}%` }} /></div>
            </div>

            {usedFallback && (
              <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs font-bold leading-5 text-amber-900">
                Live AI assessment was unavailable, so a structured {assessment.category.toLowerCase()} checklist is being used instead.
              </div>
            )}

            {activeQuestion && (() => {
              const questionError = questionErrors[activeQuestion.id];
              const isLastQuestion = activeQuestionIndex === assessment.clarifyingQuestions.length - 1;
              return (
                <div className="mt-6">
                  <fieldset key={activeQuestion.id} id={`question-${activeQuestion.id}`} data-intake-question tabIndex={-1} className={`rounded-2xl border-2 bg-white p-5 outline-none sm:p-6 ${questionError ? 'border-red-400' : 'border-[#c8c7bb]'}`}>
                    <legend className="sr-only">{activeQuestion.question}</legend>
                    <div className="mb-5 flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f5c518] text-xs font-black text-black">{activeQuestionIndex + 1}</span>
                      <div><p className="text-lg font-black leading-snug">{activeQuestion.question}</p>{!activeQuestion.required && <small className="mt-1 block">Optional</small>}</div>
                    </div>
                    {activeQuestion.options.length ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {activeQuestion.options.map((option) => {
                          const selected = answers[activeQuestion.id] === option;
                          return (
                            <button key={option} type="button" aria-pressed={selected} data-selected={selected} onClick={() => {
                              setAnswers((current) => ({ ...current, [activeQuestion.id]: option }));
                              setQuestionErrors((current) => ({ ...current, [activeQuestion.id]: '' }));
                            }} className={`flex min-h-14 items-center justify-between rounded-xl border-2 px-4 text-left text-sm font-bold transition ${selected ? 'border-[#667764] bg-[#dfe8d6]' : 'border-[#d9d8cf] bg-[#faf9f4]'}`}>
                              <span>{option}</span><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current">{selected && <Check size={15} />}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <input value={answers[activeQuestion.id] ?? ''} onChange={(event) => {
                        setAnswers((current) => ({ ...current, [activeQuestion.id]: event.target.value }));
                        setQuestionErrors((current) => ({ ...current, [activeQuestion.id]: '' }));
                      }} placeholder="Type your answer" className={`${fieldClass} ${questionError ? errorFieldClass : ''}`} />
                    )}
                    {questionError && <p className="mt-3 text-xs font-bold text-red-700">{questionError}</p>}
                  </fieldset>

                  <div className="mt-5 flex items-center gap-3">
                    {activeQuestionIndex > 0 && <button type="button" onClick={() => setActiveQuestionIndex((current) => Math.max(0, current - 1))} className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-white/20 px-5 text-sm font-black"><ArrowLeft size={18} /> Previous</button>}
                    {isLastQuestion ? (
                      <button type="button" disabled={isWorking || (activeQuestion.required && !activeQuestionAnswered)} onClick={() => void assessProject(true)} className="flex min-h-14 flex-1 items-center justify-center gap-3 rounded-xl bg-[#f5c518] px-5 font-black disabled:opacity-45">
                        {isWorking ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}{isWorking ? 'Building your brief…' : 'Create my project brief'}
                      </button>
                    ) : (
                      <button type="button" disabled={activeQuestion.required && !activeQuestionAnswered} onClick={() => setActiveQuestionIndex((current) => Math.min(assessment.clarifyingQuestions.length - 1, current + 1))} className="flex min-h-14 flex-1 items-center justify-center gap-3 rounded-xl bg-[#f5c518] px-5 font-black disabled:opacity-45">Next question <ArrowRight size={20} /></button>
                    )}
                  </div>

                  <p className="mt-4 text-center text-xs leading-5">{requiredAnsweredCount} of {assessment.clarifyingQuestions.length} answered{questionProgress ? ` · up to ${questionProgress.hardLimit} questions maximum` : ''}</p>
                </div>
              );
            })()}
          </section>
        )}

        {step === 'confirm' && assessment && (
          <section data-intake-stage="confirm" className="space-y-5">
            <div data-intake-card="brief" className="rounded-[2rem] bg-[#f4f0e4] p-5 shadow-2xl sm:p-8">
              <button type="button" onClick={() => setStep('describe')} className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#59655a]"><ArrowLeft size={16} /> Change description</button>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#667764]">Your project brief</p>
              <h1 className="mt-2 text-3xl font-black sm:text-4xl">{assessment.title}</h1>
              <p className="mt-3 text-sm leading-6 text-[#59655a]">{assessment.summary}</p>
              <span className="mt-4 inline-flex rounded-full bg-[#dfe8d6] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#435446]">{assessment.category}</span>

              {usedFallback && <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-900">A structured trade checklist was used because live AI assessment was unavailable.</div>}
              {assessment.safetyNotes.length > 0 && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><strong className="flex items-center gap-2"><AlertTriangle size={18} /> Safety first</strong>{assessment.safetyNotes.map((note) => <p key={note} className="mt-2">• {note}</p>)}</div>}

              <div data-intake-summary className="mt-6 grid gap-3 sm:grid-cols-3">
                <SummaryCard icon={<Clock3 size={20} />} label="Urgency" value={assessment.urgency.replace('_', ' ')} />
                <SummaryCard icon={<CircleDollarSign size={20} />} label="Preliminary range" value={`${formatMoney(assessment.estimatedMin)} – ${formatMoney(assessment.estimatedMax)}`} />
                <SummaryCard icon={<ShieldCheck size={20} />} label="Context collected" value={`${answerHistory.length} clarification answers`} />
              </div>
              <div className="mt-5 rounded-2xl border border-[#c8c7bb] bg-white p-5"><p className="text-[10px] font-black uppercase tracking-widest text-[#667064]">Preliminary scope or likely issue</p><p className="mt-2 text-sm leading-6">{assessment.likelyIssue}</p></div>

              <p className="mb-3 mt-6 text-xs font-black uppercase tracking-widest text-[#667064]">Confirm urgency</p>
              <div data-intake-choice-grid className="grid gap-2 sm:grid-cols-2">
                {URGENCY_OPTIONS.map((option) => {
                  const selected = assessment.urgency === option.value;
                  return (
                    <button key={option.value} type="button" onClick={() => setAssessment((current) => current ? { ...current, urgency: option.value } : current)} className={`rounded-xl border-2 p-3 text-left ${selected ? 'border-[#667764] bg-[#dfe8d6]' : 'border-[#d9d8cf] bg-[#faf9f4]'}`}>
                      <span className="flex justify-between text-sm font-black">{option.label}{selected && <Check size={17} />}</span>
                      <small className="text-[#667064]">{option.detail}</small>
                    </button>
                  );
                })}
              </div>
            </div>

            <FormCard icon={<MapPin size={21} />} title="Where and when?" description="Only the suburb, town or service area is shown on job cards before you select a provider.">
              <div id="intake-location" tabIndex={-1} className="outline-none">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <FieldLabel>Suburb or town</FieldLabel>
                    <select
                      value={location}
                      onChange={(event) => {
                        setLocation(event.target.value);
                        if (event.target.value) setCustomLocation('');
                        setFieldErrors((current) => ({ ...current, location: '' }));
                      }}
                      className={`${fieldClass} ${fieldErrors.location ? errorFieldClass : ''}`}
                    >
                      <option value="">Select your area</option>
                      {AREAS.map((area) => <option key={area}>{area}</option>)}
                    </select>
                  </label>
                  <label><FieldLabel>Preferred date — optional</FieldLabel><input type="date" value={preferredDate} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setPreferredDate(event.target.value)} className={fieldClass} /></label>
                </div>
                <label className="mt-4 block">
                  <FieldLabel>Different suburb, town or service area</FieldLabel>
                  <input
                    name="service-area-only"
                    autoComplete="off"
                    value={customLocation}
                    onChange={(event) => {
                      setCustomLocation(event.target.value);
                      if (event.target.value) setLocation('');
                      setFieldErrors((current) => ({ ...current, location: '' }));
                    }}
                    placeholder="For example: Northdene or Kempton Park"
                    className={`${fieldClass} ${fieldErrors.location ? errorFieldClass : ''}`}
                  />
                </label>
                <p className="mt-2 text-xs leading-5 text-[#667064]"><strong>Privacy:</strong> do not enter your house number or street address here. Exact contact details are released only after you select a provider.</p>
                <FieldError message={fieldErrors.location} />
              </div>
            </FormCard>

            <FormCard icon={<UserRound size={21} />} title="How should we reach you?" description="Your contact details remain private until you select and connect with a provider.">
              <div className="grid gap-4 sm:grid-cols-2">
                <label id="intake-name" tabIndex={-1} className="outline-none">
                  <FieldLabel>Name</FieldLabel>
                  <input autoComplete="name" value={customerName} onChange={(event) => { setCustomerName(event.target.value); setFieldErrors((current) => ({ ...current, name: '' })); }} placeholder="Your name" className={`${fieldClass} ${fieldErrors.name ? errorFieldClass : ''}`} />
                  <FieldError message={fieldErrors.name} />
                </label>
                <label id="intake-phone" tabIndex={-1} className="outline-none">
                  <FieldLabel>Phone or WhatsApp</FieldLabel>
                  <input type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => { setPhone(event.target.value); setFieldErrors((current) => ({ ...current, phone: '' })); }} placeholder="082 123 4567" className={`${fieldClass} ${fieldErrors.phone ? errorFieldClass : ''}`} />
                  <FieldError message={fieldErrors.phone} />
                </label>
              </div>
              <label id="intake-email" tabIndex={-1} className="mt-4 block outline-none">
                <FieldLabel>Email — optional</FieldLabel>
                <input type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setFieldErrors((current) => ({ ...current, email: '' })); }} placeholder="name@example.com" className={`${fieldClass} ${fieldErrors.email ? errorFieldClass : ''}`} />
                <FieldError message={fieldErrors.email} />
              </label>
              <div id="intake-consent" tabIndex={-1} className="mt-5 outline-none">
                <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 bg-[#e8eee2] p-4 ${fieldErrors.consent ? 'border-red-500' : 'border-[#c8c7bb]'}`}>
                  <input type="checkbox" checked={consent} onChange={(event) => { setConsent(event.target.checked); setFieldErrors((current) => ({ ...current, consent: '' })); }} className="mt-1 h-5 w-5 accent-[#667764]" />
                  <span className="text-sm leading-6 text-[#526052]">I confirm this information is accurate and allow Skills Connect Pro to share the project brief—but not my contact details—with suitable providers.</span>
                </label>
                <FieldError message={fieldErrors.consent} />
              </div>
              <button type="button" disabled={isWorking} onClick={() => void submitProject()} className="mt-6 flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#f5c518] font-black shadow-[0_8px_0_#a57f00] disabled:opacity-45">
                {isWorking ? <Loader2 className="animate-spin" size={21} /> : <CheckCircle2 size={21} />}
                {isWorking ? 'Creating your project…' : 'Submit project request'}
              </button>
            </FormCard>
          </section>
        )}

        {step === 'done' && (
          <section data-intake-stage="done" className="rounded-[2rem] border border-[#43a67b] bg-[#e9f5e8] p-7 text-center shadow-2xl sm:p-10">
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
  <div data-intake-summary-card className="rounded-2xl bg-[#e8eee2] p-4"><span className="text-[#667764]">{icon}</span><div className="mt-3 text-[10px] font-black uppercase tracking-widest text-[#667064]">{label}</div><div className="mt-1 text-sm font-black capitalize">{value}</div></div>
);

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[#667064]">{children}</span>
);

const FieldError: React.FC<{ message?: string }> = ({ message }) => (
  message ? <p className="mt-2 text-xs font-bold leading-5 text-red-700">{message}</p> : null
);

const FormCard: React.FC<{ icon: React.ReactNode; title: string; description: string; children: React.ReactNode }> = ({ icon, title, description, children }) => (
  <div data-intake-card="form" className="rounded-[2rem] bg-[#f4f0e4] p-5 shadow-2xl sm:p-8">
    <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5c518]">{icon}</span><div><h2 className="text-xl font-black">{title}</h2><p className="text-xs leading-5 text-[#667064]">{description}</p></div></div>
    <div className="mt-5">{children}</div>
  </div>
);
