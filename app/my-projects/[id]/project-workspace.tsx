'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, FileDown, FileText, Loader2, PackagePlus, Plus, ReceiptText, Trash2, Upload } from 'lucide-react';
import { HardwareQuoteRequestButton } from './hardware-quote-request';
import styles from '../workspace.module.css';
import { hardwareQuotesEnabled } from '@/services/hardwareFeature';

type Project = {
  id: string;
  title: string;
  customer_description: string;
  likely_issue: string | null;
  estimated_min: number | null;
  estimated_max: number | null;
  estimate_currency: string;
  safety_notes: string[];
  assessment_payload: Record<string, unknown>;
  location_text?: string | null;
};

type Material = { id: string; name: string; quantity: number | null; unit: string | null; estimated_unit_price: number | null; estimated_total: number | null; actual_total: number | null; notes: string | null; status: string };
type DocumentRow = { id: string; file_name: string; storage_path: string; mime_type: string | null; size_bytes: number | null; document_type: string; created_at: string };
type Expense = { id: string; description: string; category: string; amount: number; currency: string; expense_date: string; notes: string | null };
type Milestone = { id: string; title: string; description: string | null; status: string; due_at: string | null; sort_order: number };

type Props = {
  project: Project;
  initialMaterials: Material[];
  initialDocuments: DocumentRow[];
  initialExpenses: Expense[];
  initialMilestones: Milestone[];
};

type Tab = 'overview' | 'materials' | 'milestones' | 'expenses' | 'documents';

function rand(value: number | null | undefined) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(value ?? 0);
}

export function ProjectWorkspace({ project, initialMaterials, initialDocuments, initialExpenses, initialMilestones }: Props) {
  const showHardwareQuotes = hardwareQuotesEnabled();
  const [tab, setTab] = useState<Tab>('overview');
  const [materials, setMaterials] = useState(initialMaterials);
  const [documents, setDocuments] = useState(initialDocuments);
  const [expenses, setExpenses] = useState(initialExpenses);
  const [milestones, setMilestones] = useState(initialMilestones);
  const [estimateMin, setEstimateMin] = useState(project.estimated_min?.toString() ?? '');
  const [estimateMax, setEstimateMax] = useState(project.estimated_max?.toString() ?? '');
  const [materialName, setMaterialName] = useState('');
  const [materialQuantity, setMaterialQuantity] = useState('1');
  const [materialPrice, setMaterialPrice] = useState('');
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [working, setWorking] = useState('');
  const [message, setMessage] = useState('');
  const [upgradeHref, setUpgradeHref] = useState('');

  const materialsTotal = materials.reduce((sum, item) => sum + Number(item.actual_total ?? item.estimated_total ?? 0), 0);
  const expensesTotal = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const report = (value: string, href = '') => {
    setMessage(value);
    setUpgradeHref(href);
    window.setTimeout(() => { setMessage(''); setUpgradeHref(''); }, 5000);
  };

  const reportWorkspaceLimit = (value: string) => {
    if (value.includes('SCP_PLAN_LIMIT_MILESTONES')) {
      report('Milestones are included with the Home Project Pass. Upgrade to plan this project from first step to handover.', '/plans#homeowners');
      return;
    }
    if (value.includes('DOCUMENT_COUNT_LIMIT') || value.includes('number of documents included')) {
      report('You have reached the document limit for this project. Upgrade to store more project files.', '/plans#homeowners');
      return;
    }
    if (value.includes('DOCUMENT_FILE_SIZE_LIMIT') || value.includes('larger than the size allowed')) {
      report('That file is larger than your plan allows. Free supports up to 5 MB per file; paid project plans support up to 10 MB.', '/plans#homeowners');
      return;
    }
    if (value.includes('DOCUMENT_PROJECT_STORAGE_LIMIT') || value.includes('project has reached the document storage')) {
      report('This project has used its document storage allowance. Upgrade to keep more project records together.', '/plans#homeowners');
      return;
    }
    if (value.includes('SCP_PLAN_LIMIT_DOCUMENT_STORAGE') || value.includes('total document storage included')) {
      report('You have used the document storage included with your plan. Upgrade to keep more project records together.', '/plans#homeowners');
      return;
    }
    report(value);
  };

  const workspaceRequest = async (body: Record<string, unknown>) => {
    const response = await fetch(`/api/account/projects/${project.id}/workspace`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({})) as { error?: string; item?: unknown; ok?: boolean };
    if (!response.ok) throw new Error(payload.error || 'Unable to update this project.');
    return payload;
  };

  const updateEstimate = async () => {
    const min = estimateMin ? Number(estimateMin) : null;
    const max = estimateMax ? Number(estimateMax) : null;
    if ((min !== null && (!Number.isFinite(min) || min < 0)) || (max !== null && (!Number.isFinite(max) || max < 0)) || (min !== null && max !== null && min > max)) {
      report('Enter a valid range. The minimum cannot be higher than the maximum.');
      return;
    }
    setWorking('estimate');
    try {
      await workspaceRequest({ action: 'update_estimate', min, max });
      report('Project range updated.');
    } catch (error) {
      report(error instanceof Error ? error.message : 'Unable to update the project range.');
    } finally {
      setWorking('');
    }
  };

  const addMaterial = async (event: React.FormEvent) => {
    event.preventDefault();
    const quantity = Number(materialQuantity || 0);
    const unitPrice = materialPrice ? Number(materialPrice) : null;
    if (!materialName.trim() || !Number.isFinite(quantity) || quantity <= 0 || (unitPrice !== null && (!Number.isFinite(unitPrice) || unitPrice < 0))) {
      report('Add a material name and valid quantity.');
      return;
    }
    setWorking('material');
    try {
      const payload = await workspaceRequest({
        action: 'add_material',
        name: materialName.trim(),
        quantity,
        unitPrice,
      });
      if (!payload.item) throw new Error('Unable to add material.');
      setMaterials((current) => [...current, payload.item as Material]);
      setMaterialName(''); setMaterialQuantity('1'); setMaterialPrice('');
      report('Material added.');
    } catch (error) {
      report(error instanceof Error ? error.message : 'Unable to add material.');
    } finally {
      setWorking('');
    }
  };

  const removeMaterial = async (id: string) => {
    setWorking(id);
    try {
      await workspaceRequest({ action: 'remove_material', itemId: id });
      setMaterials((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      report(error instanceof Error ? error.message : 'Unable to remove material.');
    } finally {
      setWorking('');
    }
  };

  const addMilestone = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!milestoneTitle.trim()) return;
    setWorking('milestone');
    try {
      const payload = await workspaceRequest({
        action: 'add_milestone',
        title: milestoneTitle.trim(),
        sortOrder: milestones.length,
      });
      if (!payload.item) throw new Error('Unable to add milestone.');
      setMilestones((current) => [...current, payload.item as Milestone]);
      setMilestoneTitle('');
      report('Milestone added.');
    } catch (error) {
      reportWorkspaceLimit(error instanceof Error ? error.message : 'Unable to add milestone.');
    } finally {
      setWorking('');
    }
  };

  const toggleMilestone = async (item: Milestone) => {
    const completed = item.status === 'completed';
    const nextStatus = completed ? 'not_started' : 'completed';
    setWorking(item.id);
    try {
      await workspaceRequest({ action: 'toggle_milestone', itemId: item.id, status: nextStatus });
      setMilestones((current) => current.map((row) => row.id === item.id ? { ...row, status: nextStatus } : row));
    } catch (error) {
      reportWorkspaceLimit(error instanceof Error ? error.message : 'Unable to update milestone.');
    } finally {
      setWorking('');
    }
  };

  const addExpense = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(expenseAmount);
    if (!expenseDescription.trim() || !Number.isFinite(amount) || amount < 0) {
      report('Add an expense description and valid amount.');
      return;
    }
    setWorking('expense');
    try {
      const payload = await workspaceRequest({
        action: 'add_expense',
        description: expenseDescription.trim(),
        amount,
      });
      if (!payload.item) throw new Error('Unable to add expense.');
      setExpenses((current) => [payload.item as Expense, ...current]);
      setExpenseDescription(''); setExpenseAmount('');
      report('Expense added.');
    } catch (error) {
      report(error instanceof Error ? error.message : 'Unable to add expense.');
    } finally {
      setWorking('');
    }
  };

  const uploadDocument = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { report('Documents must be 10 MB or smaller.'); return; }

    const form = new FormData();
    form.set('file', file);
    setWorking('document');
    try {
      const response = await fetch(`/api/account/projects/${project.id}/documents`, { method: 'POST', body: form });
      const payload = await response.json().catch(() => ({})) as { error?: string; code?: string; item?: DocumentRow };
      if (!response.ok || !payload.item) throw new Error(payload.code ? `${payload.code}: ${payload.error || ''}` : payload.error || 'Unable to save document.');
      setDocuments((current) => [payload.item as DocumentRow, ...current]);
      report('Document uploaded.');
    } catch (error) {
      reportWorkspaceLimit(error instanceof Error ? error.message : 'Unable to save document.');
    } finally {
      setWorking('');
    }
  };

  const openDocument = async (path: string) => {
    try {
      const response = await fetch(`/api/account/projects/${project.id}/documents?path=${encodeURIComponent(path)}`);
      const payload = await response.json().catch(() => ({})) as { error?: string; url?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error || 'Unable to open document.');
      window.open(payload.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      report(error instanceof Error ? error.message : 'Unable to open document.');
    }
  };

  const removeDocument = async (document: DocumentRow) => {
    setWorking(document.id);
    try {
      const response = await fetch(`/api/account/projects/${project.id}/documents`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: document.id, storagePath: document.storage_path }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Unable to remove document.');
      setDocuments((current) => current.filter((item) => item.id !== document.id));
    } catch (error) {
      report(error instanceof Error ? error.message : 'Unable to remove document.');
    } finally {
      setWorking('');
    }
  };

  return (
    <>
      <div className={styles.tabs} role="tablist" aria-label="Project workspace sections">
        {(['overview', 'materials', 'milestones', 'expenses', 'documents'] as Tab[]).map((item) => <button key={item} role="tab" data-active={tab === item} onClick={() => setTab(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}
      </div>
      {message && <div className={styles.notice} role="status"><span>{message}</span>{upgradeHref && <Link href={upgradeHref} className={styles.noticeLink}>Compare project plans →</Link>}</div>}

      {tab === 'overview' && <div className={styles.panelGrid}>
        <section className={styles.panel}><span className={styles.eyebrow}>Project brief</span><h2>What is being done</h2><p className={styles.subtle}>{project.customer_description}</p>{project.likely_issue && <><h2 style={{ marginTop: 24 }}>Likely scope or issue</h2><p className={styles.subtle}>{project.likely_issue}</p></>}{project.safety_notes?.length > 0 && <div className={styles.error} style={{ marginTop: 22, marginBottom: 0 }}><strong>Safety first</strong>{project.safety_notes.map((note) => <div key={note}>• {note}</div>)}</div>}</section>
        <aside className={styles.sidePanel}><span className={styles.eyebrow}>Working budget</span><h2>Update the range</h2><p className={styles.subtle}>Keep the preliminary amount current as quotations arrive.</p><div className={styles.form}><input className={styles.input} type="number" min="0" placeholder="Minimum (R)" value={estimateMin} onChange={(event) => setEstimateMin(event.target.value)} /><input className={styles.input} type="number" min="0" placeholder="Maximum (R)" value={estimateMax} onChange={(event) => setEstimateMax(event.target.value)} /><button className={styles.action} onClick={updateEstimate} disabled={working === 'estimate'}>{working === 'estimate' ? <Loader2 /> : 'Save project range'}</button></div></aside>
      </div>}

      {tab === 'materials' && <div className={styles.panelGrid}>
        <section className={styles.panel}><span className={styles.eyebrow}>Materials list</span><h2>{rand(materialsTotal)} planned</h2><p className={styles.subtle}>AI estimate items and anything you add stay editable here.</p><div className={styles.list}>{materials.map((item) => <div className={styles.row} key={item.id}><div><strong>{item.name}</strong><small>{item.quantity ?? '—'} {item.unit ?? ''}{item.notes ? ` · ${item.notes}` : ''}</small></div><span className={styles.amount}>{rand(item.actual_total ?? item.estimated_total)}</span><button className={styles.iconButton} onClick={() => removeMaterial(item.id)} aria-label={`Remove ${item.name}`}>{working === item.id ? <Loader2 size={17} /> : <Trash2 size={17} />}</button></div>)}{!materials.length && <p className={styles.subtle}>No materials have been added yet.</p>}</div></section>
        <aside className={styles.sidePanel}><PackagePlus /><h2>Add material</h2><form className={styles.form} onSubmit={addMaterial}><input className={styles.input} placeholder="Material name" value={materialName} onChange={(event) => setMaterialName(event.target.value)} /><div className={styles.formGrid}><input className={styles.input} type="number" min="0.001" step="0.001" placeholder="Qty" value={materialQuantity} onChange={(event) => setMaterialQuantity(event.target.value)} /><input className={styles.input} type="number" min="0" step="0.01" placeholder="Each R" value={materialPrice} onChange={(event) => setMaterialPrice(event.target.value)} /></div><button className={styles.action} disabled={working === 'material'}><Plus size={17} /> Add material</button></form>{showHardwareQuotes && <div style={{ marginTop: 24, paddingTop: 22, borderTop: '1px solid rgba(255,255,255,.12)' }}><span className={styles.eyebrow}>Ready to price it?</span><h2>Ask hardware stores</h2><p className={styles.subtle}>Send this materials list to participating suppliers and compare their quotations in one place.</p><HardwareQuoteRequestButton projectId={project.id} defaultArea={project.location_text ?? ''} /></div>}</aside>
      </div>}

      {tab === 'milestones' && <div className={styles.panelGrid}>
        <section className={styles.panel}><span className={styles.eyebrow}>Project progress</span><h2>{milestones.filter((item) => item.status === 'completed').length} of {milestones.length} complete</h2><div className={styles.list}>{milestones.map((item) => <div className={`${styles.milestoneRow} ${item.status === 'completed' ? styles.completed : ''}`} key={item.id}><button className={styles.check} onClick={() => toggleMilestone(item)} aria-label={`Mark ${item.title} ${item.status === 'completed' ? 'not complete' : 'complete'}`}>{working === item.id ? <Loader2 size={15} /> : item.status === 'completed' ? <Check size={17} /> : null}</button><div><strong>{item.title}</strong>{item.description && <small>{item.description}</small>}</div></div>)}{!milestones.length && <p className={styles.subtle}>Add the first step for this project.</p>}</div></section>
        <aside className={styles.sidePanel}><h2>Add a milestone</h2><p className={styles.subtle}>Examples: site measurement, quotation approved, materials delivered.</p><form className={styles.form} onSubmit={addMilestone}><input className={styles.input} placeholder="Milestone title" value={milestoneTitle} onChange={(event) => setMilestoneTitle(event.target.value)} /><button className={styles.action} disabled={working === 'milestone'}><Plus size={17} /> Add milestone</button></form></aside>
      </div>}

      {tab === 'expenses' && <div className={styles.panelGrid}>
        <section className={styles.panel}><span className={styles.eyebrow}>Actual spending</span><h2>{rand(expensesTotal)} recorded</h2><div className={styles.list}>{expenses.map((item) => <div className={styles.row} key={item.id}><div><strong>{item.description}</strong><small>{item.category.replaceAll('_', ' ')} · {new Date(item.expense_date).toLocaleDateString('en-ZA')}</small></div><span className={styles.amount}>{rand(item.amount)}</span></div>)}{!expenses.length && <p className={styles.subtle}>No actual expenses recorded yet.</p>}</div></section>
        <aside className={styles.sidePanel}><ReceiptText /><h2>Add an expense</h2><form className={styles.form} onSubmit={addExpense}><input className={styles.input} placeholder="Description" value={expenseDescription} onChange={(event) => setExpenseDescription(event.target.value)} /><input className={styles.input} type="number" min="0" step="0.01" placeholder="Amount (R)" value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} /><button className={styles.action} disabled={working === 'expense'}><Plus size={17} /> Record expense</button></form></aside>
      </div>}

      {tab === 'documents' && <div className={styles.panelGrid}>
        <section className={styles.panel}><span className={styles.eyebrow}>Project files</span><h2>Plans, quotes and receipts</h2><div className={styles.list}>{documents.map((item) => <div className={styles.row} key={item.id}><div><button className={styles.documentLink} onClick={() => openDocument(item.storage_path)}><FileText size={15} style={{ display: 'inline', marginRight: 7 }} />{item.file_name}</button><small>{item.document_type.replaceAll('_', ' ')} · {item.size_bytes ? `${Math.ceil(item.size_bytes / 1024)} KB` : 'size unavailable'}</small></div><button className={styles.iconButton} onClick={() => openDocument(item.storage_path)} aria-label={`Open ${item.file_name}`}><FileDown size={17} /></button><button className={styles.iconButton} onClick={() => removeDocument(item)} aria-label={`Remove ${item.file_name}`}>{working === item.id ? <Loader2 size={17} /> : <Trash2 size={17} />}</button></div>)}{!documents.length && <p className={styles.subtle}>No documents uploaded yet.</p>}</div></section>
        <aside className={styles.sidePanel}><Upload /><h2>Attach a document</h2><p className={styles.subtle}>PDF, JPG, PNG, WEBP or text. Free: 5 files · 5 MB each · 25 MB/project. Basic: 20 files · 10 MB each · 200 MB/project. Home Project Pass: 50 files · 10 MB each · 500 MB/project.</p><label className={styles.uploadLabel}>{working === 'document' ? <Loader2 size={18} /> : <Upload size={18} />} {working === 'document' ? 'Uploading…' : 'Choose a file'}<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf,text/plain" onChange={uploadDocument} disabled={working === 'document'} /></label></aside>
      </div>}
    </>
  );
}
