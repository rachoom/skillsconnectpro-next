import Link from 'next/link';
import { CheckCircle2, Clock3, MapPin, ShieldCheck, Users } from 'lucide-react';
import { CustomerProjectJourney } from '@/components/CustomerProjectJourney';
import { customerProjectPresentation } from '@/services/marketplace/customerProjectPresentation';
import styles from '../project/[id]/project-overview.module.css';

export const metadata = { title: 'Customer Dashboard Preview | Skills Connect Pro', robots: { index: false, follow: false } };
const scenarios = {
  preparing: { status: 'assessed', invited: 0, reviewing: 0, responses: 0, selected: false, connected: false },
  matching: { status: 'matching', invited: 3, reviewing: 1, responses: 0, selected: false, connected: false },
  responses: { status: 'matching', invited: 3, reviewing: 0, responses: 2, selected: false, connected: false },
  selected: { status: 'provider_selected', invited: 3, reviewing: 0, responses: 2, selected: true, connected: false },
  connected: { status: 'contact_released', invited: 3, reviewing: 0, responses: 2, selected: true, connected: true },
  working: { status: 'in_progress', invited: 3, reviewing: 0, responses: 2, selected: true, connected: true },
  completed: { status: 'completed', invited: 3, reviewing: 0, responses: 2, selected: true, connected: true },
  cancelled: { status: 'cancelled', invited: 3, reviewing: 1, responses: 2, selected: false, connected: false },
  unfulfilled: { status: 'unfulfilled', invited: 3, reviewing: 0, responses: 0, selected: false, connected: false },
};
export default async function ProjectOverviewPreviewPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state = 'matching' } = await searchParams;
  const sample = scenarios[state as keyof typeof scenarios] ?? scenarios.matching;
  const view = customerProjectPresentation(sample);
  return <main className={styles.page} data-project-closed={view.closed}><div className={styles.shell}>
    <div className={styles.overviewBar}><div><span>Design preview · sample data</span><strong>Customer dashboard</strong></div><Link href="/" className={styles.overviewHome}>Home</Link></div>
    <nav aria-label="Sample project states" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>{Object.keys(scenarios).map(key => <Link key={key} href={`?state=${key}`} aria-current={key === state ? 'page' : undefined} className={styles.overviewHome} style={{ background: key === state ? '#54431a' : undefined }}>{key[0].toUpperCase() + key.slice(1)}</Link>)}</nav>
    <header className={styles.projectHero}><div className={styles.heroGrid}><div className={styles.heroCopy}>
      <div className={styles.heroEyebrow}><span><ShieldCheck size={17} /></span>{view.label}</div>
      <h1>Interior wall painting</h1><p>Sample project: prepare and paint an interior wall. The homeowner will provide the materials.</p>
      <div className={styles.projectMeta}><span>Painting</span><span>Planned</span><span><MapPin size={14} /> Benoni</span></div>
      <div className={styles.heroFoot}><span>Illustrative project · no invitations or messages are sent</span></div>
    </div><aside className={styles.matchingPanel}><div className={styles.customerScene} aria-hidden="true" /><div className={styles.matchingOrb}><span>{view.closed ? <ShieldCheck size={25} /> : <Users size={25} />}</span></div><p className={styles.matchingKicker}>{view.label}</p><strong>{view.headline}</strong><p className={styles.matchingCopy}>{view.copy}</p></aside></div></header>
    <CustomerProjectJourney stage={view.stage} closed={view.closed} next={view.next} tone={view.tone} />
    <section className={styles.metricsGrid} aria-label="Sample project matching status">{[{ label: 'Providers invited', value: sample.invited, icon: Users }, { label: view.closed ? 'Recorded invitation views' : 'Viewed · awaiting reply', value: sample.reviewing, icon: Clock3 }, { label: 'Responses received', value: sample.responses, icon: CheckCircle2 }].map(({ label, value, icon: Icon }) => <article key={label} className={styles.metricCard}><div className={styles.metricTop}><span className={styles.metricIcon}><Icon size={20} /></span></div><strong>{value}</strong><h2>{label}</h2><p>Sample figures for this preview.</p></article>)}</section>
    <section className={styles.responsesSection}><div className={styles.sectionHeading}><div><span>{view.closed ? 'Project record' : 'Provider responses'}</span><h2>{view.closed ? 'Recorded provider responses' : 'Compare your provider options'}</h2><p>Availability, fees and messages stay grouped together.</p></div></div>{sample.responses > 0 ? <div className={styles.providerGrid}>{['Example provider A', 'Example provider B'].map((name, index) => <article key={name} className={styles.providerCard}><div className={styles.providerHeader}><div><h3>{name}</h3><p className={styles.providerCategory}>Painting · sample profile</p></div></div><div className={styles.providerDetailGrid}><div><span>Availability</span><strong>{index === 0 ? 'Available tomorrow' : 'Site visit requested'}</strong></div><div><span>Site visit fee</span><strong>{index === 0 ? 'Not supplied' : 'R150 · sample'}</strong></div></div><div className={styles.providerMessage}><span>Provider message</span><p>{index === 0 ? 'Please confirm the wall size and condition.' : 'I would like to inspect the wall before quoting.'}</p></div><button disabled className={styles.selectProviderButton}>{view.closed ? 'Project closed' : 'Preview only'}</button></article>)}</div> : <div className={styles.emptyState}><h3>{view.closed ? 'No provider responses recorded' : view.headline}</h3><p>{view.copy}</p></div>}</section>
  </div></main>;
}
