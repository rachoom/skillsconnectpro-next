import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, PackageSearch, Store, Truck } from 'lucide-react';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { AcceptHardwareQuoteButton } from './accept-hardware-quote';
import styles from '../../my-projects/workspace.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Hardware Quotations | Skills Connect Pro' };

export default async function HardwareQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedAccount();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/hardware-quotations/${id}`)}`);

  const [{ data: request }, { data: items }, { data: quotes }] = await Promise.all([
    supabase.from('material_quote_requests').select('id,project_id,request_title,delivery_area,notes,status,selected_quote_id,created_at').eq('id', id).maybeSingle(),
    supabase.from('material_quote_request_items').select('id,description,quantity,unit,notes,sort_order').eq('request_id', id).order('sort_order'),
    supabase.from('supplier_quotes').select('id,partner_id,status,subtotal,delivery_fee,total,valid_until,notes,supplier_reference,created_at').eq('request_id', id).order('total'),
  ]);

  if (!request) notFound();

  const partnerIds = Array.from(new Set((quotes ?? []).map((quote) => quote.partner_id)));
  const { data: partners } = partnerIds.length
    ? await supabase.from('hardware_partners').select('id,name,trading_name,delivery_available').in('id', partnerIds)
    : { data: [] as { id: string; name: string; trading_name: string | null; delivery_available: boolean }[] };

  const partnerMap = new Map((partners ?? []).map((partner) => [partner.id, partner]));

  return (
    <main className={styles.page}>
      <nav className={styles.nav}><div className={styles.navInner}>
        <Link href="/"><Image src="/logo-new.svg" alt="Skills Connect Pro" width={210} height={56} priority /></Link>
        <div className={styles.navActions}><Link href="/my-projects" className={styles.navLink}>My Projects</Link><Link href="/artisan-business" className={styles.navLink}>Artisan Workspace</Link></div>
      </div></nav>

      <div className={styles.shell}>
        <div className={styles.backRow}><Link href={`/my-projects/${request.project_id}`} className={styles.back}><ArrowLeft size={18} /> Back to project</Link><span className={styles.status}>{request.status}</span></div>
        <header className={styles.projectHeader}>
          <div><span className={styles.eyebrow}>Hardware quotation request</span><h1>{request.request_title}</h1><p>Delivery area: {request.delivery_area}</p></div>
        </header>

        <section className={styles.panelGrid}>
          <div className={styles.panel}>
            <span className={styles.eyebrow}>Materials sent to suppliers</span>
            <h2>{items?.length ?? 0} requested items</h2>
            <div className={styles.list}>
              {(items ?? []).map((item) => <div className={styles.row} key={item.id}><div><strong>{item.description}</strong><small>{item.quantity ?? '—'} {item.unit ?? ''}{item.notes ? ` · ${item.notes}` : ''}</small></div></div>)}
            </div>
          </div>

          <aside className={styles.sidePanel}>
            <PackageSearch />
            <h2>Quotation status</h2>
            <p className={styles.subtle}>{quotes?.length ? `${quotes.length} quotation${quotes.length === 1 ? '' : 's'} received.` : 'Waiting for participating hardware stores to respond.'}</p>
            {request.notes && <p className={styles.subtle}>Your note: {request.notes}</p>}
          </aside>
        </section>

        <section className={styles.panel} style={{ marginTop: 22 }}>
          <span className={styles.eyebrow}>Compare suppliers</span>
          <h2>Received quotations</h2>
          <div className={styles.list}>
            {(quotes ?? []).map((quote) => {
              const partner = partnerMap.get(quote.partner_id);
              const accepted = request.selected_quote_id === quote.id || quote.status === 'accepted';
              return (
                <div className={styles.row} key={quote.id}>
                  <div>
                    <strong><Store size={15} style={{ display: 'inline', marginRight: 6 }} />{partner?.trading_name || partner?.name || 'Hardware partner'}</strong>
                    <small>
                      Materials {money(quote.subtotal)} · <Truck size={13} style={{ display: 'inline', margin: '0 4px' }} /> delivery {money(quote.delivery_fee)}
                      {quote.valid_until ? ` · valid until ${new Date(quote.valid_until).toLocaleDateString('en-ZA')}` : ''}
                    </small>
                    {quote.notes && <small>{quote.notes}</small>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong>{money(quote.total)}</strong>
                    {accepted ? <div className={styles.status} style={{ marginTop: 8 }}>Selected</div> : request.status === 'open' ? <AcceptHardwareQuoteButton quoteId={quote.id} /> : null}
                  </div>
                </div>
              );
            })}
            {!quotes?.length && <p className={styles.subtle}>No quotations have been submitted yet.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

function money(value: number | string | null) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(Number(value ?? 0));
}
