import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, PackageSearch } from 'lucide-react';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import styles from '../my-projects/workspace.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Hardware Quotations | Skills Connect Pro',
  description: 'Track material quotation requests and compare hardware supplier responses.',
};

export default async function HardwareQuotationsPage() {
  const { supabase, user } = await getAuthenticatedAccount();
  if (!user) redirect('/sign-in?next=/hardware-quotations');

  const { data: requests, error } = await supabase
    .from('material_quote_requests')
    .select('id,project_id,request_title,delivery_area,status,selected_quote_id,created_at,updated_at')
    .order('created_at', { ascending: false });

  const requestIds = (requests ?? []).map((request) => request.id);
  const { data: quotes } = requestIds.length
    ? await supabase.from('supplier_quotes').select('id,request_id,total,status').in('request_id', requestIds)
    : { data: [] as { id: string; request_id: string; total: number; status: string }[] };

  const counts = new Map<string, number>();
  for (const quote of quotes ?? []) counts.set(quote.request_id, (counts.get(quote.request_id) ?? 0) + 1);

  return (
    <main className={styles.page}>
      <nav className={styles.nav}><div className={styles.navInner}>
        <Link href="/"><Image src="/logo-new.svg" alt="Skills Connect Pro" width={210} height={56} priority /></Link>
        <div className={styles.navActions}>
          <Link href="/my-projects" className={styles.navLink}>My Projects</Link>
          <Link href="/artisan-business" className={styles.navLink}>Artisan Business</Link>
          <Link href="/plans" className={styles.navLink}>Plans</Link>
          <form action="/auth/sign-out" method="post"><button className={styles.signOut}><span>Sign out</span></button></form>
        </div>
      </div></nav>

      <div className={styles.shell}>
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>Materials procurement</span>
            <h1>Hardware Quotations</h1>
            <p>Every hardware-price request created from a project appears here, with supplier response counts and its current status.</p>
          </div>
        </section>

        {error && <div className={styles.error}>Unable to load hardware quotations: {error.message}</div>}

        <section className={styles.grid}>
          {(requests ?? []).map((request) => (
            <Link key={request.id} href={`/hardware-quotations/${request.id}`} className={styles.projectCard}>
              <div className={styles.cardTop}>
                <span className={styles.category}>{request.delivery_area}</span>
                <span className={styles.status}>{request.status}</span>
              </div>
              <PackageSearch size={27} />
              <h2>{request.request_title}</h2>
              <p className={styles.description}>{counts.get(request.id) ?? 0} supplier quotation{(counts.get(request.id) ?? 0) === 1 ? '' : 's'} received.</p>
              <div className={styles.open}>
                <span>{new Date(request.created_at).toLocaleDateString('en-ZA', { dateStyle: 'medium' })}</span>
                <ArrowRight size={19} />
              </div>
            </Link>
          ))}

          {!requests?.length && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}><PackageSearch size={30} /></div>
              <h2>No hardware quotations yet.</h2>
              <p>Hardware quotations start inside a saved project. Open a project, choose <strong>Materials</strong>, add or review the material list, then tap <strong>Get hardware quotations</strong>.</p>
              <Link href="/my-projects" className={styles.primaryLink} style={{ display: 'inline-flex' }}>Open My Projects</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
