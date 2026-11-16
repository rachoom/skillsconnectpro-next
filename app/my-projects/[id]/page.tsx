import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';
import { ProjectWorkspace } from './project-workspace';
import styles from '../workspace.module.css';
import { WorkspaceThemeToggle } from '../workspace-theme-toggle';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Project Workspace | Skills Connect Pro' };

type Props = { params: Promise<{ id: string }> };

export default async function ProjectWorkspacePage({ params }: Props) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedAccount();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/my-projects/${id}`)}`);

  const projectResult = await supabase
    .from('projects')
    .select('id,title,customer_description,ai_summary,likely_issue,category,urgency,status,location_text,estimated_min,estimated_max,estimate_currency,safety_notes,materials,assessment_payload,created_at,updated_at')
    .eq('id', id)
    .maybeSingle();

  if (!projectResult.data || projectResult.error) notFound();

  // Access to the parent project is proven by the signed-in user's RLS-protected
  // query above. Load child workspace records server-side after that check so a
  // transient child-table session/read issue can never make persisted records
  // appear to vanish after a reload.
  const admin = getSupabaseAdmin();
  const [materialsResult, documentsResult, expensesResult, milestonesResult] = await Promise.all([
    admin.from('project_materials').select('*').eq('project_id', id).neq('status', 'removed').order('created_at'),
    admin.from('project_documents').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    admin.from('project_expenses').select('*').eq('project_id', id).order('expense_date', { ascending: false }),
    admin.from('project_milestones').select('*').eq('project_id', id).order('sort_order').order('created_at'),
  ]);

  const workspaceReadError = [
    materialsResult.error,
    documentsResult.error,
    expensesResult.error,
    milestonesResult.error,
  ].find(Boolean);
  const project = {
    ...projectResult.data,
    safety_notes: (projectResult.data.safety_notes ?? []).filter(
      (note: string) => !/(hardware quotation|supplier pricing|procurement|quotation limit|installation scope should be checked before purchase)/i.test(note),
    ),
  };

  return (
    <main className={styles.page} data-workspace-shell>
      <nav className={styles.nav}><div className={styles.navInner}>
        <Link href="/"><Image src="/logo-new.svg" alt="Skills Connect Pro" width={210} height={56} priority /></Link>
        <div className={styles.navActions}><Link href="/my-projects" className={styles.navLink}>My Projects</Link><WorkspaceThemeToggle /><form action="/auth/sign-out" method="post"><button className={styles.signOut}><span>Sign out</span></button></form></div>
      </div></nav>
      <div className={styles.shell}>
        <div className={styles.backRow}><Link href="/my-projects" className={styles.back}><ArrowLeft size={18} /> All projects</Link><span className={styles.status}>{project.status.replaceAll('_', ' ')}</span></div>
        <header className={styles.projectHeader}>
          <div><span className={styles.eyebrow}>{project.category} · {project.location_text}</span><h1>{project.title}</h1><p>{project.ai_summary || project.customer_description}</p></div>
          <div className={styles.estimate}><span>Preliminary project range</span><strong>{formatRange(project.estimated_min, project.estimated_max, project.estimate_currency)}</strong></div>
        </header>
        {workspaceReadError && <div className={styles.error}>Some saved project records could not be loaded. Please refresh the page.</div>}
        <ProjectWorkspace
          project={project}
          initialMaterials={materialsResult.data ?? []}
          initialDocuments={documentsResult.data ?? []}
          initialExpenses={expensesResult.data ?? []}
          initialMilestones={milestonesResult.data ?? []}
        />
      </div>
    </main>
  );
}

function formatRange(min: number | null, max: number | null, currency: string) {
  const format = (value: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: currency || 'ZAR', maximumFractionDigits: 0 }).format(value);
  if (min !== null && max !== null) return `${format(min)} – ${format(max)}`;
  if (min !== null || max !== null) return format((min ?? max) as number);
  return 'To be confirmed';
}
