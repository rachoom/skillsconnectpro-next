'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Hammer,
  Headphones,
  Menu,
  MessageCircle,
  Paintbrush,
  ShieldCheck,
  Sparkles,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import styles from './MarketplaceLandingPage.module.css';

const trades = [
  { label: 'Plumbing', image: '/artisans/Cards/Plumbing.png', icon: Wrench },
  { label: 'Electrical', image: '/artisans/Cards/Electrician.png', icon: Zap },
  { label: 'Building & renovations', image: '/artisans/Cards/builders.png', icon: Hammer },
  { label: 'Roofing', image: '/artisans/hero-welder.jpg', icon: ShieldCheck },
  { label: 'Painting', image: '/artisans/Cards/Painter.png', icon: Paintbrush },
  { label: 'Tiling', image: '/artisans/Cards/Tilers.png', icon: Sparkles },
  { label: 'Carpentry', image: '/artisans/Cards/Carpenter.png', icon: Wrench },
  { label: 'General maintenance', image: '/artisans/Cards/General Artisan.png', icon: Wrench },
];

const steps = [
  {
    number: '01',
    title: 'Show us the job',
    text: 'Describe it in your own words. Inside the form you can type, add a photograph or use your voice.',
  },
  {
    number: '02',
    title: 'Providers respond',
    text: 'We prepare a clear project brief and invite suitable local providers without exposing your private details.',
  },
  {
    number: '03',
    title: 'Compare and choose',
    text: 'Review availability, site-visit fees and preliminary estimates, then choose who you want to connect with.',
  },
  {
    number: '04',
    title: 'Manage the job',
    text: 'Track progress, confirm completion and keep the rating or support record attached to the real project.',
  },
];

const trustPoints = [
  'Your contact details stay private until you choose',
  'Provider responses remain attached to a real project',
  'Verified ratings come from customer-confirmed jobs',
];

const faqs = [
  {
    question: 'Do I need to know which trade I need?',
    answer: 'No. Describe the result you want or the problem you can see. The guided form helps identify the likely trade and asks relevant follow-up questions.',
  },
  {
    question: 'Can I choose a provider myself?',
    answer: 'Yes. You can browse controlled provider profiles and invite someone through Skills Connect Pro. Their private details stay hidden until they respond and you confirm the connection.',
  },
  {
    question: 'Does Skills Connect Pro set the final price?',
    answer: 'No. Intake estimates and provider responses are preliminary. The customer and provider agree on the final scope and price after connection.',
  },
  {
    question: 'What happens if something goes wrong?',
    answer: 'A project-linked support case can be opened. A complaint does not automatically penalise a provider; it is reviewed first.',
  },
];

export const MarketplaceLandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <main className={styles.page}>
      <nav className={styles.nav} aria-label="Primary navigation">
        <div className={styles.navInner}>
          <Link href="/" className={styles.brand} aria-label="Skills Connect Pro home">
            <Image src="/logo-new.svg" alt="Skills Connect Pro" width={220} height={58} priority />
          </Link>

          <div className={styles.desktopNav}>
            <a href="#services">Services</a>
            <a href="#how-it-works">How it works</a>
            <Link href="/browse-providers">Browse providers</Link>
            <a href="#support">Support</a>
          </div>

          <div className={styles.navActions}>
            <Link href="/get-help" className={styles.navCta}>Show us the job</Link>
            <button
              type="button"
              className={styles.menuButton}
              onClick={() => setMenuOpen((current) => !current)}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className={styles.mobileMenu}>
            <a href="#services" onClick={closeMenu}>Services</a>
            <a href="#how-it-works" onClick={closeMenu}>How it works</a>
            <Link href="/browse-providers" onClick={closeMenu}>Browse providers</Link>
            <Link href="/estimator" onClick={closeMenu}>Cost estimator</Link>
            <a href="#support" onClick={closeMenu}>Support</a>
            <Link href="/get-help" onClick={closeMenu}>Show us the job</Link>
          </div>
        )}
      </nav>

      <section className={styles.hero}>
        <Image
          src="/artisans/hero-welder.jpg"
          alt="Skilled local service provider at work"
          fill
          priority
          sizes="100vw"
          className={styles.heroImage}
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroGlow} />

        <div className={styles.heroContent}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}><Sparkles size={15} /> Trusted local skills. One guided connection.</div>
            <h1>Need the right service provider? <span>We&apos;ve got you.</span></h1>
            <p>
              Tell us what you need. We&apos;ll turn it into a clear project, connect you with suitable local providers,
              and help you compare responses with confidence.
            </p>

            <div className={styles.heroButtons}>
              <Link href="/get-help" className={styles.primaryButton}>
                Find a service provider <ArrowRight size={19} />
              </Link>
              <Link href="/join" className={styles.heroSecondaryButton}>Join as a provider</Link>
            </div>

            <p className={styles.inputNote}>
              Typing, photographs and voice input are all available inside the same guided form.
            </p>

            <div className={styles.heroAssurances}>
              <span><ShieldCheck size={16} /> Private contact details</span>
              <span><CheckCircle2 size={16} /> You choose who to connect with</span>
            </div>
          </div>
        </div>

        <div className={styles.heroJourney} aria-label="How Skills Connect Pro works">
          <div><strong>01</strong><span><b>Find</b><small>Tell us what you need</small></span></div>
          <ArrowRight aria-hidden="true" />
          <div><strong>02</strong><span><b>Connect</b><small>Compare suitable providers</small></span></div>
          <ArrowRight aria-hidden="true" />
          <div><strong>03</strong><span><b>Grow</b><small>Complete work with confidence</small></span></div>
        </div>
      </section>

      <section id="services" className={`${styles.section} ${styles.tradeSection}`}>
        <div className={styles.sectionHeadingLeft}>
          <span className={styles.sectionKicker}>Start with a service</span>
          <h2>What service do you need?</h2>
          <p>Choose the closest category, or use Show us the job when you are not sure. Both routes enter the same guided project form.</p>
        </div>

        <div className={styles.tradeGrid}>
          {trades.map(({ label, image, icon: Icon }) => (
            <Link
              key={label}
              href={`/get-help?service=${encodeURIComponent(label)}`}
              className={styles.tradeCard}
            >
              <Image src={image} alt="" fill sizes="(max-width: 700px) 50vw, 25vw" />
              <div className={styles.tradeShade} />
              <div className={styles.tradeContent}>
                <span><Icon size={18} /></span>
                <strong>{label}</strong>
                <small>Show us the job</small>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.trustStrip} aria-label="Marketplace protections">
        <div className={styles.trustGrid}>
          {trustPoints.map((point) => (
            <div key={point}><CheckCircle2 size={18} /><span>{point}</span></div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className={styles.section}>
        <div className={styles.sectionHeading}>
          <span className={styles.sectionKicker}>One guided flow</span>
          <h2>One request. Clear next steps.</h2>
          <p>The customer does not have to choose between separate assistants. Every entry point leads into one managed job journey.</p>
        </div>

        <div className={styles.stepsGrid}>
          {steps.map((step) => (
            <article key={step.number} className={styles.stepCard}>
              <span className={styles.stepNumber}>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.choiceSection}>
        <div>
          <span className={styles.sectionKicker}>Already know who you want?</span>
          <h2>Browse provider profiles without exposing private contact details.</h2>
          <p>Choose a provider and invite them through a real project request so the interaction remains recorded and protected.</p>
        </div>
        <Link href="/browse-providers" className={styles.secondaryButton}>
          Browse providers <ArrowRight size={18} />
        </Link>
      </section>

      <section className={styles.providerSection}>
        <div>
          <span className={styles.sectionKicker}>For local service providers</span>
          <h2>Receive relevant opportunities and build a verified work record.</h2>
          <p>Join the provider network, respond to suitable projects and build trust through completed-job ratings.</p>
        </div>
        <Link href="/join" className={styles.secondaryButton}>Join Skills Connect Pro</Link>
      </section>

      <section id="support" className={styles.section}>
        <div className={styles.sectionHeadingLeft}>
          <span className={styles.sectionKicker}>Questions before you begin?</span>
          <h2>Clear answers, no technical language.</h2>
        </div>
        <div className={styles.faqGrid}>
          {faqs.map((faq) => (
            <details key={faq.question} className={styles.faqCard}>
              <summary>{faq.question}<ChevronDown size={18} /></summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
        <div className={styles.supportCard}>
          <Headphones size={25} />
          <div>
            <strong>Need help using the service?</strong>
            <span>Contact Skills Connect Pro support and we will guide you through the next step.</span>
          </div>
          <a href="https://wa.me/27697026088" target="_blank" rel="noreferrer">
            <MessageCircle size={18} /> WhatsApp support
          </a>
        </div>
      </section>

      <footer className={styles.footer}>
        <div>
          <Image src="/logo-new.svg" alt="Skills Connect Pro" width={190} height={52} />
          <p>A guided local home-services marketplace.</p>
        </div>
        <div className={styles.footerLinks}>
          <Link href="/get-help">Show us the job</Link>
          <Link href="/browse-providers">Browse providers</Link>
          <Link href="/estimator">Cost estimator</Link>
          <Link href="/join">Join as a provider</Link>
        </div>
        <p className={styles.footerNote}>Preliminary estimates are not final quotations. Customers choose and contract directly with independent providers.</p>
      </footer>
    </main>
  );
};
