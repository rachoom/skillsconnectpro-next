'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import {
  ArrowRight,
  Camera,
  Car,
  Check,
  ChevronDown,
  Grid2X2,
  House,
  MapPin,
  Menu,
  MessageCircle,
  Mic,
  Paintbrush,
  ShieldCheck,
  Sparkles,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import styles from './PremiumLanding.module.css';

const services = [
  { label: 'Mechanics', icon: Car, detail: 'Vehicle service & repairs', image: '/artisans/Cards/Mechanic.png' },
  { label: 'Plumbing', icon: Wrench, detail: 'Leaks, taps & pipes', image: '/artisans/Cards/Plumbing.png' },
  { label: 'Electrical', icon: Zap, detail: 'Power, lights & repairs', image: '/artisans/Cards/Electrician.png' },
  { label: 'Cleaning', icon: Sparkles, detail: 'Homes, offices & once-offs', image: '/artisans/Cards/Cleaners.png' },
  { label: 'Painting', icon: Paintbrush, detail: 'Inside & outside', image: '/artisans/Cards/Painter.png' },
  { label: 'Tiling', icon: Grid2X2, detail: 'Floors & walls', image: '/artisans/Cards/Tilers.png' },
  { label: 'Roofing', icon: House, detail: 'Repairs & maintenance', image: '/artisans/hero-welder.jpg' },
  { label: 'General maintenance', icon: Wrench, detail: 'The everyday fixes', image: '/artisans/Cards/General Artisan.png' },
];

const steps = [
  {
    title: 'Show us what you need',
    text: 'Type it, say it or attach a photo. Our guided flow turns the need into a clear service request.',
  },
  {
    title: 'Compare suitable responses',
    text: 'See relevant providers, availability, site-visit fees and preliminary estimates in one place.',
  },
  {
    title: 'Choose. Connect. Get it done.',
    text: 'You decide who to connect with, agree on the work and keep the next steps together.',
  },
];

const questions = [
  ['What services can I request?', 'You can currently request mechanics, plumbing, electrical work, cleaning, painting, tiling, roofing and general maintenance. The local service network will continue to grow.'],
  ['What if I do not know which provider I need?', 'Start in your own words. The guided form helps identify the likely service and asks only the follow-up questions needed for a clearer request.'],
  ['Who sets the final price?', 'You and your provider agree on the final scope and price. Estimates shown during planning are preliminary, not final quotations.'],
  ['When are my contact details shared?', 'Your contact details stay private until you choose a provider and confirm the connection.'],
];

export function PremiumLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeMenu = () => setMenuOpen(false);

  return (
    <main className={styles.page} data-design="premium-2026">
      <a className={styles.skip} href="#start-request">Skip to request a service</a>

      <nav
        className={styles.nav}
        aria-label="Primary navigation"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            closeMenu();
            menuButton.current?.focus();
          }
        }}
      >
        <div className={styles.navStripe} aria-hidden="true" />
        <div className={styles.navInner}>
          <Link href="/" className={styles.brand} aria-label="Skills Connect Pro home">
            <Image src="/logo-new.svg" alt="Skills Connect Pro" width={220} height={58} priority />
          </Link>
          <div className={styles.desktopNav}>
            <a href="#services">Services</a>
            <a href="#how-it-works">How it works</a>
            <Link href="/assistant">AI Project Assistant</Link>
            <Link href="/browse-providers">Find a provider</Link>
          </div>
          <div className={styles.navActions}>
            <Link href="/join" className={styles.join}>Join as provider <ArrowRight size={15} /></Link>
            <button
              ref={menuButton}
              type="button"
              className={styles.menuButton}
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={menuOpen}
              aria-controls="landing-navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div id="landing-navigation" className={styles.mobileMenu}>
            <a href="#services" onClick={closeMenu}>Explore services</a>
            <a href="#how-it-works" onClick={closeMenu}>How it works</a>
            <Link href="/browse-providers" onClick={closeMenu}>Find a provider</Link>
            <Link href="/assistant" onClick={closeMenu}>AI Project Assistant</Link>
            <Link href="/estimator" onClick={closeMenu}>Project estimator</Link>
            <a href="#support" onClick={closeMenu}>Help & support</a>
          </div>
        )}
      </nav>

      <section className={styles.spotlight} aria-labelledby="home-heading">
        <Image
          src="/mzansi-services-hero-v2.webp"
          alt="Mechanics, electricians, plumbers, builders and cleaners representing local skills"
          fill priority sizes="100vw" className={styles.heroImage}
        />
        <div className={styles.scrim} aria-hidden="true" />
        <div className={styles.spotlightInner}>
          <div className={styles.pitch}>
            <span className={styles.location}><MapPin size={14} aria-hidden="true" /> STARTING IN EKURHULENI. BUILT FOR MZANSI.</span>
            <h1 id="home-heading">The right skills.<br /><span>For the job at hand.</span></h1>
            <p>Car trouble. A leaking tap. A home that needs care. Connect with suitable local service providers through one simple request.</p>
            <div id="start-request" className={styles.requestHub}>
              <span className={styles.requestLabel}>WHAT DO YOU NEED DONE?</span>
              <Link href="/get-help" className={styles.commandBar}>
                <span className={styles.commandIcon}><Wrench size={22} aria-hidden="true" /></span>
                <span><strong>Describe your job</strong><small>Type, speak or add a photo in the next step</small></span>
                <ArrowRight size={22} aria-hidden="true" />
              </Link>
              <div className={styles.inputHint} aria-hidden="true"><Camera size={14} /><span>Photo</span><Mic size={14} /><span>Voice</span><span className={styles.hintDivider} />Start in your own words</div>
            </div>
            <Link href="/browse-providers" className={styles.secondary}>Prefer to explore? Browse providers <ArrowRight size={16} aria-hidden="true" /></Link>
            <div className={styles.heroProof} aria-label="Marketplace benefits">
              <span><ShieldCheck size={16} aria-hidden="true" /> Private until you choose</span>
              <span><Check size={16} aria-hidden="true" /> You control the connection</span>
            </div>
          </div>
          <aside className={styles.connectionCard} aria-label="How your request works">
            <span className={styles.cardEyebrow}><span className={styles.liveDot} aria-hidden="true" /> LOCAL SKILLS. ONE CONNECTION.</span>
            <strong>A clear path to<br />getting it done.</strong>
            <div className={styles.connectionSteps}>
              <span><b>01</b> Describe the job</span>
              <span><b>02</b> Compare responses</span>
              <span><b>03</b> Choose your provider</span>
            </div>
          </aside>
        </div>
        <div className={styles.journey} aria-label="Available service categories">
          <span>MECHANICS</span><span>HOME & PROPERTY</span><span>CLEANING</span><span>EVERYDAY MAINTENANCE</span>
          <a href="#services">Explore services <ArrowRight size={14} aria-hidden="true" /></a>
        </div>
      </section>

      <section className={styles.assistantBand} aria-labelledby="assistant-heading">
        <div className={styles.assistantBandInner}>
          <span className={styles.aiMark}><Sparkles size={24} aria-hidden="true" /></span>
          <div><span className={styles.kicker}>A LITTLE CLARITY BEFORE YOU START</span><h2 id="assistant-heading">Big idea? Start with a smarter plan.</h2><p>Explore your home project with the AI Project Assistant.</p></div>
          <Link href="/assistant" className={styles.outlineButton}>Try the AI Project Assistant <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
      </section>

      <section className={styles.mzansiStatement} aria-labelledby="mzansi-heading">
        <div className={styles.mzansiCopy}>
          <span className={styles.greenKicker}>MZANSI CONNECT · STARTING IN EKURHULENI</span>
          <h2 id="mzansi-heading">Great local skills.<br />A better way to connect.</h2>
          <p>
            Skills Connect Pro brings local skill into one guided digital marketplace—making service providers
            easier to discover and giving customers a clearer, safer way to start. Built in Ekurhuleni, with a model designed to grow across Mzansi.
          </p>
          <div className={styles.mzansiPoints}>
            <span><Check size={16} /> Local skills made visible</span>
            <span><Check size={16} /> Requests organised intelligently</span>
            <span><Check size={16} /> Connections controlled by the customer</span>
          </div>
        </div>
        <div className={styles.mzansiVisual}>
          <Image src="/artisans/autorep.png" alt="Vehicle repair workshop representing local service businesses" fill sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 1280px) 48vw, 584px" />
          <div className={styles.networkCard}>
            <span><span className={styles.liveDot} /> LOCAL NETWORK</span>
            <strong>Rooted in Mzansi.<br />Built around you.</strong>
          </div>
        </div>
      </section>

      <section id="services" className={styles.section}>
        <div className={styles.headingRow}>
          <div><span className={styles.kicker}>THE RIGHT SKILLS, CLOSER TO YOU</span><h2>What can we connect you with?</h2></div>
          <Link href="/get-help">Not sure? Describe the job <ArrowRight size={17} /></Link>
        </div>
        <div className={styles.serviceGrid}>
          {services.map(({ label, icon: Icon, detail, image }) => (
            <Link key={label} href={`/get-help?service=${encodeURIComponent(label)}`} className={styles.serviceTile}>
              <Image src={image} alt="" fill sizes="(max-width: 640px) calc((100vw - 52px) / 2), (max-width: 900px) calc((100vw - 80px) / 2), (max-width: 1280px) calc((100vw - 112px) / 4), 292px" className={styles.serviceImage} />
              <span className={styles.serviceShade} aria-hidden="true" />
              <Icon size={24} className={styles.serviceIcon} />
              <strong>{label}</strong>
              <small>{detail}</small>
              <ArrowRight size={17} className={styles.tileArrow} />
            </Link>
          ))}
        </div>
      </section>

      <section id="how-it-works" className={`${styles.section} ${styles.process}`}>
        <div className={styles.headingRow}>
          <div><span className={styles.kicker}>LESS SEARCHING. MORE PROGRESS.</span><h2>A smarter route from need to done.</h2></div>
          <p>Describe it. Compare. Choose. We keep the steps together.</p>
        </div>
        <div className={styles.stepGrid}>
          {steps.map((step, index) => (
            <article key={step.title}>
              <span className={styles.stepNumber}>0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.planning}>
        <div className={styles.planningImage}>
          <Image src="/calculator-planning-desk.jpg" alt="Tools and plans for a home improvement project" fill sizes="(max-width: 640px) calc(100vw - 40px), (max-width: 1280px) 48vw, 584px" />
          <span className={styles.imageTag}><Sparkles size={14} /> AI-ASSISTED PLANNING</span>
        </div>
        <div className={styles.planningCopy}>
          <span className={styles.kicker}><Sparkles size={15} /> SPECIALIST TOOL · HOME IMPROVEMENT</span>
          <h2>Plan the job before you price the job.</h2>
          <p>
            Use the AI Project Assistant to clarify the work, analyse a project photo and explore a
            preliminary estimate—then move into the provider marketplace when you are ready.
          </p>
          <Link href="/assistant" className={styles.primary}>Explore the AI Project Assistant <ArrowRight size={18} /></Link>
          <small>Planning guidance and estimates are preliminary. Final prices are agreed directly with your provider.</small>
        </div>
      </section>

      <section id="support" className={styles.section}>
        <div className={styles.headingRow}>
          <div><span className={styles.kicker}>GOOD TO KNOW</span><h2>A little clarity before you connect.</h2></div>
        </div>
        <div className={styles.faqs}>
          {questions.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}<ChevronDown size={19} /></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
        <div className={styles.support}>
          <div><MessageCircle size={24} /><span><strong>Prefer a human?</strong><small>We can help you find the right next step.</small></span></div>
          <a href="https://wa.me/27697026088" target="_blank" rel="noreferrer">WhatsApp support <ArrowRight size={18} /></a>
        </div>
      </section>

      <section className={styles.provider}>
        <div><span className={styles.greenKicker}>FOR MZANSI&apos;S SKILLED PROFESSIONALS</span><h2>Good at what you do?</h2><p>Join the local provider network and put your skills where customers can find them.</p></div>
        <Link href="/join" className={styles.primary}>Join as provider <ArrowRight size={18} /></Link>
      </section>

      <footer className={styles.footer}>
        <Link href="/" className={styles.brand} aria-label="Skills Connect Pro home"><Image src="/logo-new.svg" alt="Skills Connect Pro" width={220} height={58} /></Link>
        <div><Link href="/get-help">Request a service</Link><Link href="/browse-providers">Find a provider</Link><Link href="/assistant">AI Project Assistant</Link></div>
        <p>Starting in Ekurhuleni. Built to grow across Mzansi. Customers contract directly with independent providers.</p>
      </footer>
    </main>
  );
}
