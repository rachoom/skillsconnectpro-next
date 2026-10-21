import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BriefcaseBusiness, ChevronRight, FolderKanban, Hammer, PackageSearch, Plus, ShieldCheck } from 'lucide-react';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { ActivateArtisanWorkspace } from './activate-artisan-workspace';
import styles from '../my-projects/workspace.module.css';
import { hardwareQuotesEnabled } from '@/services/hardwareFeature';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Artisan Business Workspace | Skills Connect Pro',
  description: 'Plan jobs, manage project materials, expenses and customer work.',
};

export default async function ArtisanBusinessPage() {
  const showHardwareQuotes = hardwareQuotesEnabled();
  const { supabase, user } = await getAuthenticatedAccount();
  if (!user) redirect('/sign-in?next=/artisan-business');

  const [{ data: roles }, { data: projects }, { data: quoteRequests }] = await Promise.all([
    supabase.from('account_roles').select('role,status,linked_artisan_id').eq('user_id', user.id),
    supabase.from('projects').select('id,title,category,status,location_text,updated_at').order('updated_at', { ascending: false }).limit(20),
    supabase.from('material_quote_requests').select('id,project_id,request_title,status,delivery_area,created_at').order('created_at', { ascending: false }).limit(20),
  ]);

  const artisanRole = (roles ?? []).find((role) => role.role === 'artisan' && role.status === 'active');
  const linkedProfile = artisanRole?.linked_artisan_id ?? null;
  const activeProjects = (projects ?? []).filter((project) => !['completed', 'cancelled'].includes(project.status)).length;
  const openRequests = (quoteRequests ?? []).filter((request) => request.status === 'open').length;

  return (
    <main className={styles.page}>
      <nav className={styles.nav}><div className={styles.navInner}>
        <Link href="/"><Image src="/logo-new.svg" alt="Skills Connect Pro" width={210} height={56} priority /></Link>
        <div className={styles.navActions}>
          <Link href="/my-projects" className={styles.navLink}>My Projects</Link>
          <Link href="/plans" className={styles.navLink}>Plans</Link>
          <form action="/auth/sign-out" method="post"><button className={styles.signOut}><span>Sign out</span></button></form>
        </div>
      </div></nav>

      <div className={styles.shell}>
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>Artisan business tools</span>
            <h1>Manage the work, not just the lead.</h1>
            <p>Plan customer jobs, keep materials, expenses and documents together, and manage the work from the same project workspace.</p>
          </div>
          <Link href="/assistant" className={styles.primaryLink}><Plus size={17} /> Start a customer project</Link>
        </section>

        {!artisanRole ? (
          <section className={styles.panel}>
            <BriefcaseBusiness size={30} />
            <h2>Activate your private artisan workspace</h2>
            <p className={styles.subtle}>This creates business tools for your account. It does not claim or change any public provider profile. Existing public listings are linked only after verification.</p>
            <ActivateArtisanWorkspace />
          </section>
        ) : (
          <>
            <section className={styles.stats} aria-label="Business workspace summary">
              <div className={styles.stat}><span>Projects</span><strong>{projects?.length ?? 0}</strong></div>
              <div className={styles.stat}><span>Active jobs</span><strong>{activeProjects}</strong></div>
              {showHardwareQuotes && <div className={styles.stat}><span>Open hardware requests</span><strong>{openRequests}</strong></div>}
              <div className={styles.stat}><span>Public profile</span><strong style={{ fontSize: '1.05rem' }}>{linkedProfile ? 'Verified link' : 'Not linked yet'}</strong></div>
            </section>

            {!linkedProfile && (
              <div className={styles.notice}>
                <ShieldCheck size={17} style={{ display: 'inline', marginRight: 8 }} />
                Your business workspace is active. Your existing public provider profile remains separate until Skills Connect Pro verifies and links it.
              </div>
            )}

            <section className={styles.panelGrid}>
              <div className={styles.panel}>
                <span className={styles.eyebrow}>My work</span>
                <h2>Customer & business projects</h2>
                <div className={styles.list}>
                  {(projects ?? []).map((project) => (
                    <Link key={project.id} href={`/my-projects/${project.id}`} className={styles.row}>
                      <div><strong>{project.title}</strong><small>{project.category} · {project.location_text} · {project.status.replaceAll('_', ' ')}</small></div>
                      <ChevronRight size={18} />
                    </Link>
                  ))}
                  {!projects?.length && <p className={styles.subtle}>Create a project for your next customer and use the same tools available to homeowners.</p>}
                </div>
                <Link href="/assistant" className={styles.primaryLink} style={{ display: 'inline-flex', marginTop: 18 }}><FolderKanban size={17} /> Create project</Link>
              </div>

              <aside className={styles.sidePanel}>
                <Hammer />
                <h2>Business toolkit</h2>
                <p className={styles.subtle}>Use each project to calculate materials, track spend, save documents and keep the customer job organised.</p>
                <Link href="/my-projects" className={styles.action}>Open project manager</Link>
              </aside>
            </section>

            {showHardwareQuotes && (            <section className={styles.panel} style={{ marginTop: 22 }}>
              <span className={styles.eyebrow}>Hardware procurement</span>
              <h2>Material quotation requests</h2>
              <div className={styles.list}>
                {(quoteRequests ?? []).map((request) => (
                  <Link key={request.id} href={`/hardware-quotations/${request.id}`} className={styles.row}>
                    <div><strong>{request.request_title}</strong><small>{request.delivery_area} · {request.status}</small></div>
                    <PackageSearch size={18} />
                  </Link>
                ))}
                {!quoteRequests?.length && <p className={styles.subtle}>No hardware quotation requests yet. Open a project, go to Materials and request prices.</p>}
              </div>
            </section>)}
          </>
        )}
      </div>
    </main>
  );
}
