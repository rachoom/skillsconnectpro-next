import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, PackageOpen, PackageSearch } from 'lucide-react';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import styles from '../my-projects/workspace.module.css';
import { hardwareQuotesEnabled } from '@/services/hardwareFeature';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Materials & Procurement | Skills Connect Pro',
  description: 'Review materials across projects and keep project costs organised.',
};

function money(value: number | string | null) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(Number(value ?? 0));
}

export default async function MaterialsPage() {
  const showHardwareQuotes = hardwareQuotesEnabled();
  const { supabase, user } = await getAuthenticatedAccount();
  if (!user) redirect('/sign-in?next=/materials');

  const [{ data: projects }, { data: materials }] = await Promise.all([
    supabase.from('projects').select('id,title,status,location_text,updated_at').order('updated_at', { ascending: false }),
    supabase.from('project_materials').select('id,project_id,name,quantity,unit,estimated_total,actual_total,status').neq('status', 'removed').order('created_at'),
  ]);

  const projectMap = new Map((projects ?? []).map((project) => [project.id, project]));
  const grouped = new Map<string, typeof materials>();
  for (const item of materials ?? []) {
    const list = grouped.get(item.project_id) ?? [];
    list.push(item);
    grouped.set(item.project_id, list);
  }

  return (
    <main className={styles.page}>
      <nav className={styles.nav}><div className={styles.navInner}>
        <Link href="/"><Image src="/logo-new.svg" alt="Skills Connect Pro" width={210} height={56} priority /></Link>
        <div className={styles.navActions}>
          <Link href="/my-projects" className={styles.navLink}>My Projects</Link>
          <Link href="/artisan-business" className={styles.navLink}>Artisan Business</Link>
          {showHardwareQuotes && <Link href="/hardware-quotations" className={styles.navLink}>Hardware Quotes</Link>}
          <form action="/auth/sign-out" method="post"><button className={styles.signOut}><span>Sign out</span></button></form>
        </div>
      </div></nav>

      <div className={styles.shell}>
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>Project materials</span>
            <h1>Materials & Procurement</h1>
            <p>Material lists remain attached to their projects, while this page gives you one place to review quantities, planned costs and recorded purchases.</p>
          </div>
          {showHardwareQuotes && <Link href="/hardware-quotations" className={styles.primaryLink}><PackageSearch size={17} /> Hardware quotations</Link>}
        </section>

        <section className={styles.grid}>
          {(projects ?? []).map((project) => {
            const rows = grouped.get(project.id) ?? [];
            const total = rows.reduce((sum, item) => sum + Number(item.actual_total ?? item.estimated_total ?? 0), 0);
            return (
              <Link href={`/my-projects/${project.id}`} className={styles.projectCard} key={project.id}>
                <div className={styles.cardTop}>
                  <span className={styles.category}>{project.location_text}</span>
                  <span className={styles.status}>{project.status.replaceAll('_', ' ')}</span>
                </div>
                <PackageOpen size={28} />
                <h2>{project.title}</h2>
                <p className={styles.description}>{rows.length} material item{rows.length === 1 ? '' : 's'} · {money(total)} planned/recorded</p>
                <div className={styles.open}><span>Open Materials tab</span><ArrowRight size={19} /></div>
              </Link>
            );
          })}

          {!projects?.length && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><PackageOpen size={30} /></div>
              <h2>No project materials yet.</h2>
              <p>Your account currently has no saved projects. Start a project with the AI Assistant; after it is saved, open that project and choose <strong>Materials</strong>. The same material list will then appear here.</p>
              <Link href="/assistant" className={styles.primaryLink} style={{ display: 'inline-flex' }}>Start with the AI Assistant</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
