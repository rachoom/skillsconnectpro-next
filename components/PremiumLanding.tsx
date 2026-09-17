'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { ArrowRight, Camera, Car, Check, ChevronDown, MapPin, Menu, MessageCircle, Paintbrush, ShieldCheck, Sparkles, Wrench, X, Zap, House, Grid2X2 } from 'lucide-react';
import styles from './PremiumLanding.module.css';

const services = [
  { label: 'Plumbing', icon: Wrench, detail: 'Leaks, taps & pipes', image: '/artisans/Cards/Plumbing.png' },
  { label: 'Electrical', icon: Zap, detail: 'Power, lights & repairs', image: '/artisans/Cards/Electrician.png' },
  { label: 'Cleaning', icon: Sparkles, detail: 'A fresh start at home', image: '/artisans/Cards/Cleaners.png' },
  { label: 'Painting', icon: Paintbrush, detail: 'Inside & outside', image: '/artisans/Cards/Painter.png' },
  { label: 'Roofing', icon: House, detail: 'Repairs & maintenance', image: '/artisans/hero-welder.jpg' },
  { label: 'Tiling', icon: Grid2X2, detail: 'Floors & walls', image: '/artisans/Cards/Tilers.png' },
  { label: 'Mechanics', icon: Car, detail: 'Vehicle service & repairs', image: '/artisans/Cards/Mechanic.png' },
  { label: 'General maintenance', icon: Wrench, detail: 'The everyday fixes', image: '/artisans/Cards/General Artisan.png' },
];
const steps = [
  { title: 'Tell us what you need', text: 'A few words, a photo or your voice. We help turn the problem into a clear project brief.' },
  { title: 'Find the right fit', text: 'Suitable providers respond. Compare availability and preliminary estimates in one place.' },
  { title: 'Choose. Connect. Get it done.', text: 'You choose who to connect with, agree on the work and follow your project through to completion.' },
];
const questions = [
  ['Not sure which service you need?', 'Start with your own words. The guided form helps identify the likely trade and asks relevant follow-up questions.'],
  ['Who sets the final price?', 'You and your provider agree on the final scope and price. Estimates shown during planning are preliminary, not final quotations.'],
  ['When are my contact details shared?', 'Your contact details stay private until you choose a provider and confirm the connection.'],
  ['Can I browse providers first?', 'Yes. Browse provider profiles, then invite your preferred provider through a project request.'],
];

export function PremiumLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeMenu = () => setMenuOpen(false);
  return <main className={styles.page}>
    <a className={styles.skip} href="#start-project">Skip to start your project</a>
    <nav className={styles.nav} aria-label="Primary navigation" onKeyDown={(event) => {
      if (event.key === 'Escape') { closeMenu(); menuButton.current?.focus(); }
    }}>
      <div className={styles.navInner}>
        <Link href="/" className={styles.brand} aria-label="Skills Connect Pro home"><Image src="/logo-new.svg" alt="Skills Connect Pro" width={220} height={58} priority /></Link>
        <div className={styles.desktopNav}><a href="#services">Services</a><a href="#how-it-works">How it works</a><Link href="/browse-providers">Find a provider</Link><a href="#support">Help</a></div>
        <div className={styles.navActions}>
          <Link href="/join" className={styles.join}>Join as provider <ArrowRight size={15} /></Link>
          <button ref={menuButton} type="button" className={styles.menuButton} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="landing-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
      </div>
      {menuOpen && <div id="landing-navigation" className={styles.mobileMenu}>
        <a href="#services" onClick={closeMenu}>Explore services</a><a href="#how-it-works" onClick={closeMenu}>How it works</a><Link href="/browse-providers" onClick={closeMenu}>Find a provider</Link><Link href="/assistant" onClick={closeMenu}>Home Improvement Assistant</Link><Link href="/estimator" onClick={closeMenu}>Project estimator</Link><a href="#support" onClick={closeMenu}>Help & support</a>
      </div>}
    </nav>
    <section className={styles.spotlight} aria-labelledby="home-heading">
      <Image src="https://images.unsplash.com/photo-1757359056339-22968344cce6?auto=format&fit=crop&w=2000&q=85" alt="Modern home illuminated at dusk" fill priority sizes="100vw" className={styles.houseImage} />
      <div className={styles.scrim} />
      <div className={styles.spotlightInner}>
        <div className={styles.pitch}>
          <span className={styles.location}><MapPin size={14} /> Local expertise. East Rand.</span>
          <h1 id="home-heading">A better home.<br /><span>A simpler start.</span></h1>
          <p>From the small fix to the next big project. Plan the work, explore costs and connect with local professionals—all in one place.</p>
          <div className={styles.pitchLinks}><a href="#start-project">Let’s start your project <ArrowRight size={18} /></a><a href="#how-it-works">See how it works</a></div>
          <div className={styles.assurance}><ShieldCheck size={19} /><span>Your details stay private. You choose who to hire.</span></div>
        </div>
        <div id="start-project" className={styles.launchpad}>
          <div className={styles.panelLabel}><span><Sparkles size={15} /> YOUR PROJECT STARTS HERE</span><span>01 / 03</span></div>
          <h2>What can we help with?</h2><p>Start wherever you are. We’ll guide the next step.</p>
          <Link href="/get-help" className={styles.mainAction}><Wrench size={23} /><span><strong>I need a job done</strong><small>Describe it. Find suitable local providers.</small></span><ArrowRight size={20} /></Link>
          <Link href="/assistant" className={styles.altAction}><Sparkles size={23} /><span><strong>Help me plan my project</strong><small>Explore the work and a preliminary budget.</small></span><ArrowRight size={20} /></Link>
          <div className={styles.shortcuts}><Link href="/get-help?mode=photo"><Camera size={18} /> Start with a photo</Link><Link href="/browse-providers">Browse providers <ArrowRight size={16} /></Link></div>
          <div className={styles.panelFoot}><Check size={15} /> A guided request. Your choice of provider.</div>
        </div>
      </div>
      <div className={styles.journey}><span><b>01</b> Tell us about it</span><ArrowRight size={16} /><span><b>02</b> Compare responses</span><ArrowRight size={16} /><span><b>03</b> Connect & get it done</span></div>
    </section>
    <section id="services" className={styles.section}>
      <div className={styles.headingRow}><div><span className={styles.kicker}>THE RIGHT SKILLS, CLOSE TO HOME</span><h2>What’s on your to-do list?</h2></div><Link href="/get-help">Not sure? Describe the job <ArrowRight size={17} /></Link></div>
      <div className={styles.serviceGrid}>{services.map(({ label, icon: Icon, detail, image }) => <Link key={label} href={`/get-help?service=${encodeURIComponent(label)}`} className={styles.serviceTile}>
        <Image src={image} alt="" fill sizes="(max-width: 760px) 50vw, (max-width: 1240px) 25vw, 290px" className={styles.serviceImage} />
        <span className={styles.serviceShade} aria-hidden="true" />
        <Icon size={24} className={styles.serviceIcon} /><strong>{label}</strong><small>{detail}</small><ArrowRight size={17} className={styles.tileArrow} />
      </Link>)}</div>
    </section>
    <section id="how-it-works" className={`${styles.section} ${styles.process}`}>
      <div className={styles.headingRow}><div><span className={styles.kicker}>LESS BACK-AND-FORTH. MORE PROGRESS.</span><h2>A clear path from idea to done.</h2></div><p>One project. Everything stays together.</p></div>
      <div className={styles.stepGrid}>{steps.map((step, index) => <article key={step.title}><span className={styles.stepNumber}>0{index + 1}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
    </section>
    <section className={styles.planning}>
      <div className={styles.planningImage}><Image src="/calculator-planning-desk.jpg" alt="Tools and plans for a home improvement project" fill sizes="(max-width: 760px) 100vw, 45vw" /></div>
      <div className={styles.planningCopy}><span className={styles.kicker}><Sparkles size={15} /> A LITTLE GUIDANCE GOES A LONG WAY</span><h2>Big ideas.<br />Clear next steps.</h2><p>Not ready to invite a provider? Use the Home Improvement Assistant to work through your idea and explore a preliminary estimate.</p><Link href="/assistant" className={styles.primary}>Explore with the assistant <ArrowRight size={18} /></Link><small>Estimates guide your planning. Final prices are agreed with your provider.</small></div>
    </section>
    <section id="support" className={styles.section}>
      <div className={styles.headingRow}><div><span className={styles.kicker}>GOOD TO KNOW</span><h2>A little clarity before you start.</h2></div></div>
      <div className={styles.faqs}>{questions.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={19} /></summary><p>{answer}</p></details>)}</div>
      <div className={styles.support}><div><MessageCircle size={24} /><span><strong>Prefer a human?</strong><small>We can help you find your next step.</small></span></div><a href="https://wa.me/27697026088" target="_blank" rel="noreferrer">WhatsApp support <ArrowRight size={18} /></a></div>
    </section>
    <section className={styles.provider}><div><h2>Good at what you do?</h2><p>Join the local provider network and put your skills to work.</p></div><Link href="/join" className={styles.primary}>Join as provider <ArrowRight size={18} /></Link></section>
    <footer className={styles.footer}><Link href="/" className={styles.brand} aria-label="Skills Connect Pro home"><Image src="/logo-new.svg" alt="Skills Connect Pro" width={220} height={58} /></Link><div><Link href="/get-help">Start a project</Link><Link href="/browse-providers">Find a provider</Link><Link href="/estimator">Project estimator</Link></div><p>Local skills. Real connections. Customers contract directly with independent providers.</p></footer>
  </main>;
}
