import Link from 'next/link';
import { FolderKanban, LayoutDashboard, Sparkles } from 'lucide-react';
import { ProjectWorkspace } from '../my-projects/[id]/project-workspace';
import { WorkspaceThemeToggle } from '../my-projects/workspace-theme-toggle';
import styles from '../my-projects/workspace.module.css';

export const metadata = { title: 'Customer Workspace Preview | Skills Connect Pro', robots: { index: false, follow: false } };
export default function CustomerWorkspacePreview() {
  return <main className={styles.page} data-workspace-shell>
    <nav className={styles.nav}><div className={styles.navInner}><Link href="/" className={styles.navLink}>Skills Connect Pro · Home</Link><div className={styles.navActions}><Link href="/project-overview-preview" className={styles.navLink}><LayoutDashboard size={17} />Dashboard preview</Link><WorkspaceThemeToggle /></div></div></nav>
    <div className={styles.shell}>
      <div className={styles.notice}>Sample workspace · explore the tabs. Changes and uploads are not saved.</div>
      <section className={styles.hero}><div><span className={styles.eyebrow}>Private project workspace · preview</span><h1>Interior wall painting</h1><p>Keep your project brief, materials, milestones, expenses and documents together.</p></div><Link href="/assistant" className={styles.primaryLink}><Sparkles size={18} />Plan a project</Link></section>
      <section className={styles.stats} aria-label="Sample project summary"><div className={styles.stat}><i className={styles.statIcon}><FolderKanban /></i><span>Materials planned</span><strong>R650</strong></div><div className={styles.stat}><i className={styles.statIcon}><LayoutDashboard /></i><span>Milestones complete</span><strong>1 of 2</strong></div></section>
      <ProjectWorkspace preview project={{ id:'sample-project', title:'Interior wall painting', customer_description:'Prepare and paint an interior wall. The homeowner will provide the materials.', likely_issue:'Surface preparation and two coats of paint.', estimated_min:1200, estimated_max:2000, estimate_currency:'ZAR', safety_notes:[], assessment_payload:{}, status:'matching', location_text:'Benoni' }}
        initialMaterials={[{id:'sample-material',name:'Interior paint',quantity:1,unit:'20 L',estimated_unit_price:650,estimated_total:650,actual_total:null,notes:'Sample item',status:'planned'}]}
        initialMilestones={[{id:'sample-step-1',title:'Confirm the wall size',description:null,status:'completed',due_at:null,sort_order:0},{id:'sample-step-2',title:'Prepare the surface',description:null,status:'pending',due_at:null,sort_order:1}]}
        initialExpenses={[{id:'sample-expense',description:'Paint and preparation materials',category:'materials',amount:650,currency:'ZAR',expense_date:'2026-11-18',notes:null}]}
        initialDocuments={[{id:'sample-document',file_name:'Painting-quote-example.pdf',storage_path:'sample-document',mime_type:'application/pdf',size_bytes:12288,document_type:'quote',created_at:'2026-11-18T08:00:00Z'}]} />
    </div>
  </main>;
}
