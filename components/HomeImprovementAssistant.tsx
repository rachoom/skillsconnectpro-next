'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Camera,
  CheckCircle2,
  ClipboardList,
  Image as ImageIcon,
  Loader2,
  LockKeyhole,
  MapPin,
  Mic,
  Send,
  ShieldCheck,
  Sparkles,
  UserSearch,
} from 'lucide-react';
import styles from './HomeImprovementAssistant.module.css';

type AssistantIntent = 'plan' | 'photo' | 'estimate' | 'find';

type AssistantAction = {
  intent: AssistantIntent;
  label: string;
  detail: string;
  icon: typeof ClipboardList;
};

type SpeechResult = ArrayLike<{ transcript?: string }>;

type SpeechResultEvent = {
  results: ArrayLike<SpeechResult>;
};

type SpeechRecognitionConstructor = new () => {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

const actions: AssistantAction[] = [
  {
    intent: 'plan',
    label: 'Help me plan a project',
    detail: 'Clarify the work, likely trade and next steps.',
    icon: ClipboardList,
  },
  {
    intent: 'photo',
    label: 'Analyse a project photo',
    detail: 'Show the area or problem you want assessed.',
    icon: Camera,
  },
  {
    intent: 'estimate',
    label: 'Estimate my project',
    detail: 'Build a preliminary cost and materials estimate.',
    icon: Calculator,
  },
  {
    intent: 'find',
    label: 'Find a trusted local pro',
    detail: 'Create a tracked request for suitable providers.',
    icon: UserSearch,
  },
];

const normaliseIntent = (value: string): AssistantIntent | null => {
  const key = value.trim().toLowerCase();
  return actions.some((action) => action.intent === key) ? key as AssistantIntent : null;
};

const inferIntent = (prompt: string): AssistantIntent => {
  const text = prompt.toLowerCase();
  if (/(cost|price|estimate|budget|materials|how much|quotation|quote)/.test(text)) return 'estimate';
  if (/(photo|picture|image|camera|see this|look at)/.test(text)) return 'photo';
  if (/(find|provider|professional|artisan|contractor|plumber|electrician|builder|painter|tiler)/.test(text)) return 'find';
  return 'plan';
};

const destinationFor = (intent: AssistantIntent, prompt = '') => {
  const encodedPrompt = encodeURIComponent(prompt.trim());
  const description = encodedPrompt ? `&description=${encodedPrompt}` : '';

  if (intent === 'estimate') {
    return encodedPrompt ? `/estimator?description=${encodedPrompt}` : '/estimator';
  }

  if (intent === 'photo') return `/get-help?mode=photo${description}`;
  if (intent === 'find') return `/get-help?mode=match${description}`;
  return `/get-help?mode=plan${description}`;
};

export const HomeImprovementAssistant = ({
  initialPrompt = '',
  initialIntent = '',
}: {
  initialPrompt?: string;
  initialIntent?: string;
}) => {
  const router = useRouter();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [selectedIntent, setSelectedIntent] = useState<AssistantIntent | null>(() => normaliseIntent(initialIntent));
  const [isListening, setIsListening] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [status, setStatus] = useState('');

  const selectedAction = actions.find((action) => action.intent === selectedIntent) || null;

  const continueTo = (intent: AssistantIntent, currentPrompt = prompt) => {
    setSelectedIntent(intent);
    setStatus('Preparing the right next step…');
    setIsRouting(true);
    router.push(destinationFor(intent, currentPrompt));
  };

  const handleAction = (intent: AssistantIntent) => {
    if (intent === 'plan' && !prompt.trim()) {
      setSelectedIntent(intent);
      setStatus('Tell me what you want to repair, improve or build.');
      document.getElementById('assistant-project-description')?.focus();
      return;
    }

    continueTo(intent);
  };

  const handleSubmit = () => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      setStatus('Describe the project or choose one of the options above.');
      document.getElementById('assistant-project-description')?.focus();
      return;
    }

    continueTo(selectedIntent || inferIntent(cleanPrompt), cleanPrompt);
  };

  const handleVoiceInput = () => {
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      setStatus('Voice input is not supported by this browser. You can still type your project description.');
      return;
    }

    const recognition = new Recognition();
    recognition.lang = 'en-ZA';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event: SpeechResultEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
        .trim();
      if (transcript) setPrompt((current) => `${current}${current ? ' ' : ''}${transcript}`);
    };
    recognition.onerror = () => setStatus('I could not hear that clearly. Please try again or type your request.');
    recognition.onend = () => setIsListening(false);
    setStatus('Listening…');
    setIsListening(true);
    recognition.start();
  };

  return (
    <main className={styles.page}>
      <Image
        src="/calculator-planning-desk.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className={styles.backgroundImage}
      />
      <div className={styles.backdrop} aria-hidden="true" />
      <div className={styles.glow} aria-hidden="true" />

      <header className={styles.header}>
        <Link href="/" className={styles.logoLink} aria-label="Skills Connect Pro home">
          <Image src="/logo-new.svg" alt="Skills Connect Pro" width={220} height={58} priority />
        </Link>
        <div className={styles.headerActions}>
          <span className={styles.location}><MapPin size={15} /> East Rand</span>
          <Link href="/" className={styles.backLink}><ArrowLeft size={17} /> Home</Link>
        </div>
      </header>

      <section className={styles.shell}>
        <div className={styles.intro}>
          <span className={styles.eyebrow}><Sparkles size={15} /> Home improvement, made easier</span>
          <h1>Your AI <span>Home Improvement Assistant</span></h1>
          <p>
            Describe the job, show us a photo, or speak. Get practical guidance, a preliminary estimate,
            and a tracked route to suitable local professionals.
          </p>
          <div className={styles.introPoints}>
            <span><CheckCircle2 size={18} /> One guided project journey</span>
            <span><CheckCircle2 size={18} /> AI only when the task needs it</span>
            <span><CheckCircle2 size={18} /> You choose who to connect with</span>
          </div>
        </div>

        <div className={styles.assistantCard} aria-labelledby="assistant-heading">
          <div className={styles.assistantHeading}>
            <span className={styles.assistantMark}><Sparkles size={24} /></span>
            <div>
              <p>Skills Connect Pro</p>
              <h2 id="assistant-heading">Hi, I&apos;m your Home Improvement Assistant</h2>
              <span>How can I help today?</span>
            </div>
          </div>

          <div className={styles.actionList} aria-label="Assistant options">
            {actions.map(({ intent, label, detail, icon: Icon }) => {
              const selected = selectedIntent === intent;
              return (
                <button
                  key={intent}
                  type="button"
                  aria-pressed={selected}
                  className={`${styles.actionButton} ${selected ? styles.actionSelected : ''}`}
                  onClick={() => handleAction(intent)}
                  disabled={isRouting}
                >
                  <span className={styles.actionIcon}><Icon size={20} /></span>
                  <span className={styles.actionCopy}><strong>{label}</strong><small>{detail}</small></span>
                  <ArrowRight className={styles.actionArrow} size={19} />
                </button>
              );
            })}
          </div>

          <div className={styles.composer}>
            <label htmlFor="assistant-project-description">Describe what you need</label>
            <textarea
              id="assistant-project-description"
              rows={3}
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                if (status) setStatus('');
              }}
              onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') handleSubmit();
              }}
              placeholder="e.g., My bathroom tiles are cracked and I need to understand the likely work and cost…"
            />
            <div className={styles.composerTools}>
              <div className={styles.inputMethods}>
                <button type="button" onClick={() => continueTo('photo')} title="Take a project photo" aria-label="Take a project photo" disabled={isRouting}>
                  <Camera size={19} />
                </button>
                <button type="button" onClick={() => continueTo('photo')} title="Upload a project image" aria-label="Upload a project image" disabled={isRouting}>
                  <ImageIcon size={19} />
                </button>
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  title={isListening ? 'Listening' : 'Describe the project by voice'}
                  aria-label={isListening ? 'Listening for your project description' : 'Describe the project by voice'}
                  aria-pressed={isListening}
                  className={isListening ? styles.listening : ''}
                  disabled={isRouting}
                >
                  <Mic size={19} />
                </button>
              </div>
              <button
                type="button"
                className={styles.sendButton}
                onClick={handleSubmit}
                aria-label="Continue with this project"
                disabled={isRouting}
              >
                {isRouting ? <Loader2 size={20} className={styles.spinner} /> : <Send size={20} />}
              </button>
            </div>
          </div>

          <div className={styles.statusRow} aria-live="polite">
            <span>{status || (selectedAction ? `${selectedAction.label} selected` : 'Choose an option or describe the project in your own words.')}</span>
          </div>

          <div className={styles.assurances}>
            <span><LockKeyhole size={16} /> Private details</span>
            <span><Calculator size={16} /> Preliminary estimates</span>
            <span><ShieldCheck size={16} /> Tracked connections</span>
          </div>
        </div>
      </section>
    </main>
  );
};
