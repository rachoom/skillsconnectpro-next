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
  LockKeyhole,
  Menu,
  MessageCircle,
  Paintbrush,
  ShieldCheck,
  Sparkles,
  Star,
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

const whyPoints = [
  {
    number: '01',
    title: 'A guided project brief',
    text: 'Start with the result you need. We help turn the problem into a clearer project before providers respond.',
    icon: ShieldCheck,
  },
  {
    number: '02',
    title: 'Faster, clearer responses',
    text: 'Suitable providers respond to the same project context, making the next conversation easier to compare.',
    icon: Zap,
  },
  {
    number: '03',
    title: 'You stay in control',
    text: 'Review the responses and decide who you want to connect with. The choice remains yours.',
    icon: CheckCircle2,
  },
  {
    number: '04',
    title: 'Private by design',
    text: 'Your personal contact details stay protected while you review provider responses.',
    icon: LockKeyhole,
  },
  {
    number: '05',
    title: 'Context that stays together',
    text: 'Keep responses, project communication and completed-job feedback connected to the real work.',
    icon: Star,
  },
];

const whyStats = [
  { value: '1', label: 'Guided request' },
  { value: '3', label: 'Ways to describe the job' },
  { value: '0', label: 'Contact details shared before you choose' },
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

const HERO_IMAGE = 'https://images.unsplash.com/photo-1757359056339-22968344cce6?auto=format&fit=crop&w=2400&q=84';

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
            <a href="#services">Find services</a>
            <a href="#how-it-works">How it works</a>
            <Link href="/browse-providers">Browse providers</Link>
            <Link href="/join">For providers</Link>
            <a href="#support">Support</a>
          </div>

          <div className={styles.navActions}>
            <Link href="/join" className={styles.navCta}>Join as provider</Link>
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
            <a href="#services" onClick={closeMenu}>Find services</a>
            <a href="#how-it-works" onClick={closeMenu}>How it works</a>
            <Link href="/browse-providers" onClick={closeMenu}>Browse providers</Link>
            <Link href="/estimator" onClick={closeMenu}>Cost estimator</Link>
            <a href="#support" onClick={closeMenu}>Support</a>
            <Link href="/join" onClick={closeMenu}>Join as provider</Link>
          </div>
        )}
      </nav>

      <section className={styles.hero}>
        <img
          src={HERO_IMAGE}
          alt="A high-end modern home illuminated at dusk"
          className={styles.heroImage}
          loading="eager"
          fetchPriority="high"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = '/artisans/hero-welder.jpg';
          }}
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroGlow} />

        <div className={styles.heroContent}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}><Sparkles size={15} /> Trusted local skills. One guided connection.</div>
            <h1>Need the right service provider? <span>We&apos;ve got you.</span></h1>
            <p>
              Tell us what needs fixing, improving or building. We&apos;ll turn it into a clear project, connect you with
              suitable local providers, and help you compare responses with confidence.
            </p>

            <div className={styles.heroButtons}>
              <Link href="/get-help" className={styles.primaryButton}>
                Show us the job <ArrowRight size={19} />
              </Link>
              <a href="#how-it-works" className={styles.heroSecondaryButton}>
                Learn how it works <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <div data-home-why aria-labelledby="why-skills-connect-pro-title">
        <div data-home-why-heading>
          <span className={styles.sectionKicker}>Built around the project</span>
          <h2 id="why-skills-connect-pro-title">Why Skills Connect Pro?</h2>
          <p>More than a directory: a guided way to describe the work, protect your details and make a better-informed connection.</p>
        </div>

        <div data-home-why-grid>
          {whyPoints.map(({ number, title, text, icon: Icon }) => (
            <article key={number} data-home-why-card>
              <span data-home-why-icon><Icon size={27} /></span>
              <span data-home-why-number>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>

        <div data-home-why-proof>
          <div data-home-why-proof-copy>
            <strong>Built around the job—not just a listing.</strong>
            <span>Describe the work once, keep the context together and decide who you want to connect with.</span>
          </div>
          <div data-home-why-proof-stats>
            {whyStats.map((stat) => (
              <div key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

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
              <Image src={image} alt="" fill sizes="(max-width: 639px) 46vw, (max-width: 899px) 25vw, 19vw" />
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
            <div key={point}><CheckCircle2 size={25} /><span>{point}</span></div>
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