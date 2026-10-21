import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, BriefcaseBusiness, CalendarDays, FolderKanban, MapPin, PackageOpen, PackageSearch, Plus, Sparkles } from 'lucide-react';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import styles from './workspace.module.css';
import { hardwareQuotesEnabled } from '@/services/hardwareFeature';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Projects | Skills Connect Pro',
  description: 'Reopen and manage your Skills Connect Pro project briefs, materials, estimates and documents.',
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function money(min: number | null, max: number | null) {
  if (min === null && max === null) return 'Estimate pending';
  const format = (value: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(value);
  if (min !== null && max !== null) return `${format(min)} – ${format(max)}`;
  return format((min ?? max) as number);
}

export default async function MyProjectsPage({ searchParams }: Props) {
  const params = await searchParams;
  const showHardwareQuotes = hardwareQuotesEnabled();
  const { supabase, user } = await getAuthenticatedAccount();
  if (!user) redirect('/sign-in?next=/my-projects');

  const [{ data: projects, error }, { data: roles }, { data: subscriptions }] = await Promise.all([
    supabase.from('projects').select('id,title,customer_description,category,status,location_text,estimated_min,estimated_max,estimate_currency,created_at,updated_at').order('updated_at', { ascending: false }),
    supabase.from('account_roles').select('role,status,is_primary').eq('user_id', user.id),
    supabase.from('account_subscriptions').select('plan_code,ends_at,starts_at').eq('user_id', user.id).eq('status', 'active').order('starts_at', { ascending: false }).limit(1),
  ]);

  const activeProjects = (projects ?? []).filter((project) => !['completed', 'cancelled'].includes(project.status)).length;
  const roleLabels = (roles ?? []).filter((role) => role.status === 'active').map((role) => role.role.replaceAll('_', ' '));
  const activePlan = (subscriptions ?? []).find((subscription) => !subscription.ends_at || new Date(subscription.ends_at).getTime() > Date.now()) ?? null;
  const activePlanLabel = activePlan?.plan_code === 'project_pass_90' ? 'Home Project Pass' : activePlan?.plan_code === 'basic_30' ? 'Basic' : 'Free';
  const claimState = Array.isArray(params.claim) ? params.claim[0] : params.claim;

  return (
    <main className={styles.page}>
      <AccountNav />
      <div className={styles.shell}>
        {claimState === 'saved' && <div className={styles.notice}>Project saved. You can now reopen it from any device.</div>}
        {claimState === 'failed' && <div className={styles.error}>We could not attach that guest project. Its original secure project link still works.</div>}
        {error && <div className={styles.error}>Your workspace could not be loaded: {error.message}</div>}

        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>Private project workspace</span>
            <h1>My Projects</h1>
            <p>Keep project briefs, preliminary estimates, materials, milestones and documents together—separate from any public service-provider profile.</p>
          </div>
          <Link href="/assistant" className={styles.primaryLink}><Sparkles size={17} /> Start with the AI Assistant</Link>
        </section>

        <section className={styles.stats} aria-label="Account summary">
          <div className={styles.stat}><span>Total projects</span><strong>{projects?.length ?? 0}</strong></div>
          <div className={styles.stat}><span>Active projects</span><strong>{activeProjects}</strong></div>
          <div className={styles.stat}><span>Current plan</span><strong style={{ fontSize: '1.05rem' }}>{activePlanLabel}</strong>{activePlan?.ends_at && <small style={{ display: 'block', marginTop: 7, color: '#aaa' }}>Until {new Date(activePlan.ends_at).toLocaleDateString('en-ZA', { dateStyle: 'medium' })}</small>}</div>
          <div className={styles.stat}><span>Account access</span><strong style={{ fontSize: '1.05rem', textTransform: 'capitalize' }}>{roleLabels.join(' · ') || 'Customer'}</strong></div>
        </section>

        <section className={styles.grid} aria-label="Workspace shortcuts" style={{ marginBottom: 28 }}>
          <Link href="/artisan-business" className={styles.projectCard}>
            <div className={styles.cardTop}>
              <span className={styles.category}>Business tools</span>
            </div>
            <BriefcaseBusiness size={28} />
            <h2>Artisan Business Workspace</h2>
            <p className={styles.description}>Manage customer jobs, project materials, expenses and supplier quotations. Activate the workspace here even if your public provider profile is not linked yet.</p>
            <div className={styles.open}><span>Open artisan workspace</span><ArrowRight size={19} /></div>
          </Link>

          <Link href="/materials" className={styles.projectCard}>
            <div className={styles.cardTop}>
              <span className={styles.category}>Project materials</span>
            </div>
            <PackageOpen size={28} />
            <h2>Materials & Procurement</h2>
            <p className={styles.description}>See material lists across your projects. Materials are created and edited inside each project, then collected here for quick access.</p>
            <div className={styles.open}><span>Open materials workspace</span><ArrowRight size={19} /></div>
          </Link>

          {showHardwareQuotes && (          <Link href="/hardware-quotations" className={styles.projectCard}>
            <div className={styles.cardTop}>
              <span className={styles.category}>Procurement</span>
            </div>
            <PackageSearch size={28} />
            <h2>Hardware Quotations</h2>
            <p className={styles.description}>See material-price requests and compare quotations sent back by participating hardware suppliers.</p>
            <div className={styles.open}><span>Open hardware quotations</span><ArrowRight size={19} /></div>
          </Link>)}
        </section>

        <section className={styles.grid} aria-label="Saved projects">
          {(projects ?? []).map((project) => (
            <Link href={`/my-projects/${project.id}`} className={styles.projectCard} key={project.id}>
              <div className={styles.cardTop}>
                <span className={styles.category}>{project.category}</span>
                <span className={styles.status}>{project.status.replaceAll('_', ' ')}</span>
              </div>
              <h2>{project.title}</h2>
              <p className={styles.description}>{project.customer_description}</p>
              <div className={styles.meta}>
                <span><MapPin size={15} /> {project.location_text}</span>
                <span><CalendarDays size={15} /> {new Date(project.updated_at).toLocaleDateString('en-ZA', { dateStyle: 'medium' })}</span>
              </div>
              <div className={styles.open}><span>{money(project.estimated_min, project.estimated_max)}</span><ArrowRight size={19} /></div>
            </Link>
          ))}
          {!projects?.length && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><FolderKanban size={30} /></div>
              <h2>Your first workspace is ready when you are.</h2>
              <p>Use the AI Project Assistant to clarify a job, build a preliminary estimate and save it as a project.</p>
              <Link href="/assistant" className={styles.primaryLink} style={{ display: 'inline-flex' }}><Plus size={17} /> Plan a project</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function AccountNav() {
  return (
    <nav className={styles.nav} aria-label="Account navigation"><div className={styles.navInner}>
      <Link href="/"><Image src="/logo-new.svg" alt="Skills Connect Pro" width={210} height={56} priority /></Link>
      <div className={styles.navActions}>
        <Link href="/" className={styles.navLink}>Home</Link>
        <Link href="/artisan-business" className={styles.navLink}>Artisan Business</Link>
        <Link href="/materials" className={styles.navLink}>Materials</Link>
        {hardwareQuotesEnabled() && (        <Link href="/hardware-quotations" className={styles.navLink}>Hardware Quotes</Link>)}
        <Link href="/plans" className={styles.navLink}>Plans</Link>
        <form action="/auth/sign-out" method="post"><button className={styles.signOut}><span>Sign out</span></button></form>
      </div>
    </div></nav>
  );
}
