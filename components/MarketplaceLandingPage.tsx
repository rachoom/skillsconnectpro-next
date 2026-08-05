'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  Calculator,
  Camera,
  CheckCircle2,
  ChevronDown,
  Hammer,
  Headphones,
  Menu,
  MessageCircle,
  Mic,
  Paintbrush,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
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
    text: 'Type, speak or add a photograph. Use ordinary language—our guided assistant asks the useful follow-up questions.',
  },
  {
    number: '02',
    title: 'Suitable providers respond',
    text: 'Skills Connect Pro prepares a clear brief and invites relevant local providers without exposing your private contact details.',
  },
  {
    number: '03',
    title: 'Compare and choose',
    text: 'Review availability, site-visit fees and preliminary estimates. You decide who you want to connect with.',
  },
  {
    number: '04',
    title: 'Manage the job',
    text: 'Track progress, confirm completion, preserve the job record, leave verified feedback or open a support case.',
  },
];

const trustPoints = [
  'Your contact details stay private until you choose',
  'Provider responses are attached to a real project',
  'Verified ratings come from completed marketplace jobs',
  'Support cases are reviewed before reputation is affected',
];

const faqs = [
  {
    question: 'Do I have to know which trade I need?',
    answer: 'No. Describe the result you want or the problem you can see. The guided intake helps identify the likely trade and asks job-specific questions.',
  },
  {
    question: 'Can I still choose a provider myself?',
    answer: 'Yes. You can browse controlled provider profiles and invite a provider through Skills Connect Pro. Their private contact details remain hidden until they respond and you confirm the connection.',
  },
  {
    question: 'Does Skills Connect Pro set the final price?',
    answer: 'No. Estimates shown during intake and provider responses are preliminary. The customer and provider agree on scope and final price directly after connection.',
  },
  {
    question: 'What happens if something goes wrong?',
    answer: 'The customer or provider can update the job record and open a project-linked support case. A complaint does not automatically penalise a provider; it is reviewed first.',
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
            <a href="#how-it-works">How it works</a>
            <Link href="/browse-providers">Browse providers</Link>
            <Link href="/estimator">Cost estimator</Link>
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
            <a href="#how-it-works" onClick={closeMenu}>How it works</a>
            <Link href="/browse-providers" onClick={closeMenu}>Browse providers</Link>
            <Link href="/estimator" onClick={closeMenu}>Cost estimator</Link>
            <a href="#support" onClick={closeMenu}>Support</a>
            <Link href="/get-help" onClick={closeMenu}>Start a job request</Link>
          </div>
        )}
      </nav>

      <section className={styles.hero}>
        <Image
          src="/artisans/hero-welder.jpg"
          alt="Local skilled professional at work"
          fill
          priority
          sizes="100vw"
          className={styles.heroImage}
        />
        <div className={styles.heroOverlay} />
        <div className={styles.heroGlow} />

        <div className={styles.heroContent}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}><Sparkles size={15} /> Your local home-services assistant</div>
            <h1>Tell us what needs doing. We’ll help you find the right local provider.</h1>
            <p>
              Describe the job, add a photo or use your voice. Skills Connect Pro creates a clear request,
              invites suitable providers and helps you manage the work from start to finish.
            </p>

            <div className={styles.heroButtons}>
              <Link href="/get-help" className={styles.primaryButton}>
                Show us the job <ArrowRight size={19} />
              </Link>
              <Link href="/browse-providers" className={styles.secondaryButton}>
                Browse and invite providers
              </Link>
            </div>

            <div className={styles.heroAssurances}>
              <span><ShieldCheck size={16} /> Private contact details</span>
              <span><CheckCircle2 size={16} /> You choose who to connect with</span>
            </div>
          </div>

          <div className={styles.assistantCard}>
            <div className={styles.assistantHeader}>
              <div>
                <span className={styles.smallLabel}>Skills Connect Assistant</span>
                <h2>How would you like to explain the job?</h2>
              </div>
              <div className={styles.assistantIcon}><Wrench size={23} /></div>
            </div>

            <Link href="/get-help?mode=text" className={styles.mainEntry}>
              <div>
                <strong>Type what you need</strong>
                <span>For example: “I want to build an extra room.”</span>
              </div>
              <ArrowRight size={20} />
            </Link>

            <div className={styles.entryGrid}>
              <Link href="/get-help?mode=photo" className={styles.entryOption}>
                <Camera size={23} />
                <strong>Add a photo</strong>
                <span>Camera or gallery</span>
              </Link>
              <Link href="/get-help?mode=voice" className={styles.entryOption}>
                <Mic size={23} />
                <strong>Use your voice</strong>
                <span>Speak naturally</span>
              </Link>
            </div>

            <Link href="/estimator" className={styles.estimatorLink}>
              <Calculator size={18} /> Planning first? Estimate project costs
            </Link>
          </div>
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
          <h2>From “I need help” to a verified job record.</h2>
          <p>The technology stays in the background. Customers and providers see clear, ordinary next steps.</p>
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

      <section className={`${styles.section} ${styles.tradeSection}`}>
        <div className={styles.sectionHeadingLeft}>
          <span className={styles.sectionKicker}>Common home services</span>
          <h2>What do you need help with?</h2>
          <p>Choose a service to begin a guided request. The category is only a starting point—the assistant still asks what the job actually involves.</p>
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
                <small>Start request</small>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <span className={styles.sectionKicker}>Useful ways to start</span>
          <h2>One assistant, several simple tools.</h2>
          <p>Photo and voice are not separate products—they are easier ways to create the same clear project request.</p>
        </div>

        <div className={styles.toolGrid}>
          <Link href="/get-help?mode=photo" className={styles.toolCard}>
            <Camera size={30} />
            <h3>Photo-assisted request</h3>
            <p>Photograph the visible problem or project area, then add a short explanation.</p>
            <span>Use camera <ArrowRight size={16} /></span>
          </Link>
          <Link href="/get-help?mode=voice" className={styles.toolCard}>
            <Mic size={30} />
            <h3>Voice description</h3>
            <p>Explain the job in your own words without typing a long message.</p>
            <span>Record description <ArrowRight size={16} /></span>
          </Link>
          <Link href="/estimator" className={styles.toolCard}>
            <Calculator size={30} />
            <h3>Project cost estimator</h3>
            <p>Get a preliminary planning range before you invite providers.</p>
            <span>Estimate costs <ArrowRight size={16} /></span>
          </Link>
        </div>
      </section>

      <section className={styles.discoverySection}>
        <div className={styles.discoveryImage}>
          <Image src="/artisans/Cards/builders.png" alt="Local building professional" fill sizes="(max-width: 900px) 100vw, 50vw" />
          <div className={styles.discoveryShade} />
        </div>
        <div className={styles.discoveryCopy}>
          <span className={styles.sectionKicker}>Customer-led discovery</span>
          <h2>Know who you want? Browse profiles and invite them through the marketplace.</h2>
          <p>
            View services, areas, verification and work history. Private phone and WhatsApp details stay hidden until the provider responds and you confirm the connection.
          </p>
          <ul>
            <li><Search size={18} /> Explore controlled provider profiles</li>
            <li><Users size={18} /> Invite one provider or let the system find alternatives</li>
            <li><ShieldCheck size={18} /> Keep every interaction attached to a project record</li>
          </ul>
          <Link href="/browse-providers" className={styles.primaryButton}>
            Browse and invite providers <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className={styles.providerSection}>
        <div>
          <span className={styles.sectionKicker}>For local service providers</span>
          <h2>Receive relevant opportunities. Build a verified marketplace record.</h2>
          <p>Respond to real local projects, protect your contact details until selection and grow trust through completed-job ratings.</p>
        </div>
        <Link href="/?claim=join" className={styles.secondaryButton}>Join Skills Connect Pro</Link>
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
          <Link href="/blog">Helpful guides</Link>
        </div>
        <p className={styles.footerNote}>Preliminary estimates are not final quotations. Customers choose and contract directly with independent providers.</p>
      </footer>
    </main>
  );
};
