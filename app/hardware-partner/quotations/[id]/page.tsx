import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { HardwareQuoteForm } from './hardware-quote-form';
import styles from '../../../my-projects/workspace.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Prepare Hardware Quote | Skills Connect Pro' };

export default async function HardwarePartnerQuotePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const query = await searchParams;
  const partnerId = Array.isArray(query.partner) ? query.partner[0] : query.partner;
  const { supabase, user } = await getAuthenticatedAccount();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/hardware-partner/quotations/${id}${partnerId ? `?partner=${partnerId}` : ''}`)}`);
  if (!partnerId) notFound();

  const { data: membership } = await supabase.from('hardware_partner_members').select('partner_id').eq('partner_id', partnerId).eq('user_id', user.id).eq('status', 'active').maybeSingle();
  if (!membership) notFound();

  const [{ data: request }, { data: items }, { data: existing }] = await Promise.all([
    supabase.from('material_quote_requests').select('id,request_title,delivery_area,notes,status').eq('id', id).maybeSingle(),
    supabase.from('material_quote_request_items').select('id,description,quantity,unit,notes,sort_order').eq('request_id', id).order('sort_order'),
    supabase.from('supplier_quotes').select('id,delivery_fee,notes').eq('request_id', id).eq('partner_id', partnerId).maybeSingle(),
  ]);
  if (!request) notFound();

  await supabase.from('hardware_quote_invitations').update({ status: existing ? 'quoted' : 'viewed', viewed_at: new Date().toISOString() }).eq('request_id', id).eq('partner_id', partnerId);

  return (
    <main className={styles.page}>
      <nav className={styles.nav}><div className={styles.navInner}><Link href="/"><Image src="/logo-new.svg" alt="Skills Connect Pro" width={210} height={56} priority /></Link></div></nav>
      <div className={styles.shell}>
        <div className={styles.backRow}><Link href="/hardware-partner" className={styles.back}><ArrowLeft size={18} /> Quotation workspace</Link><span className={styles.status}>{request.status}</span></div>
        <header className={styles.projectHeader}><div><span className={styles.eyebrow}>Supplier quotation</span><h1>{request.request_title}</h1><p>Deliver to {request.delivery_area}{request.notes ? ` · ${request.notes}` : ''}</p></div></header>
        <HardwareQuoteForm requestId={id} partnerId={partnerId} userId={user.id} items={items ?? []} existingQuoteId={existing?.id ?? null} existingDeliveryFee={Number(existing?.delivery_fee ?? 0)} existingNotes={existing?.notes ?? ''} />
      </div>
    </main>
  );
}
