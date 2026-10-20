import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronRight, PackageSearch, Store } from 'lucide-react';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import styles from '../my-projects/workspace.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Hardware Partner Workspace | Skills Connect Pro' };

export default async function HardwarePartnerPage() {
  const { supabase, user } = await getAuthenticatedAccount();
  if (!user) redirect('/sign-in?next=/hardware-partner');

  const { data: memberships } = await supabase
    .from('hardware_partner_members')
    .select('partner_id,member_role,status')
    .eq('user_id', user.id)
    .eq('status', 'active');

  const partnerIds = (memberships ?? []).map((membership) => membership.partner_id);
  const [{ data: partners }, { data: invitations }] = partnerIds.length
    ? await Promise.all([
        supabase.from('hardware_partners').select('id,name,trading_name,status,service_areas,delivery_available').in('id', partnerIds),
        supabase.from('hardware_quote_invitations').select('request_id,partner_id,status,invited_at').in('partner_id', partnerIds).order('invited_at', { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }];

  const requestIds = Array.from(new Set((invitations ?? []).map((item) => item.request_id)));
  const { data: requests } = requestIds.length
    ? await supabase.from('material_quote_requests').select('id,request_title,delivery_area,status,created_at').in('id', requestIds)
    : { data: [] as { id: string; request_title: string; delivery_area: string; status: string; created_at: string }[] };
  const requestMap = new Map((requests ?? []).map((item) => [item.id, item]));
  const partnerMap = new Map((partners ?? []).map((item) => [item.id, item]));

  return (
    <main className={styles.page}>
      <nav className={styles.nav}><div className={styles.navInner}>
        <Link href="/"><Image src="/logo-new.svg" alt="Skills Connect Pro" width={210} height={56} priority /></Link>
        <div className={styles.navActions}><Link href="/my-projects" className={styles.navLink}>My Projects</Link><form action="/auth/sign-out" method="post"><button className={styles.signOut}><span>Sign out</span></button></form></div>
      </div></nav>
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div><span className={styles.eyebrow}>Hardware partner</span><h1>Quotation Workspace</h1><p>Respond to materials requests from Skills Connect Pro customers and artisans using your normal quotation process.</p></div>
        </section>

        {!partnerIds.length ? (
          <section className={styles.panel}>
            <Store size={30} />
            <h2>No hardware business is linked to this account yet.</h2>
            <p className={styles.subtle}>Hardware partner access is added during partner onboarding. This prevents someone from claiming another supplier's business identity.</p>
          </section>
        ) : (
          <>
            <section className={styles.stats}>
              <div className={styles.stat}><span>Businesses</span><strong>{partnerIds.length}</strong></div>
              <div className={styles.stat}><span>Requests received</span><strong>{invitations?.length ?? 0}</strong></div>
              <div className={styles.stat}><span>Awaiting response</span><strong>{(invitations ?? []).filter((row) => ['invited','viewed'].includes(row.status)).length}</strong></div>
            </section>
            <section className={styles.panel}>
              <span className={styles.eyebrow}>Incoming material requests</span>
              <h2>Requests to quote</h2>
              <div className={styles.list}>
                {(invitations ?? []).map((invite) => {
                  const request = requestMap.get(invite.request_id);
                  const partner = partnerMap.get(invite.partner_id);
                  if (!request) return null;
                  return (
                    <Link className={styles.row} href={`/hardware-partner/quotations/${invite.request_id}?partner=${invite.partner_id}`} key={`${invite.request_id}-${invite.partner_id}`}>
                      <div><strong>{request.request_title}</strong><small>{partner?.trading_name || partner?.name || 'Hardware partner'} · {request.delivery_area} · {invite.status}</small></div>
                      <ChevronRight size={18} />
                    </Link>
                  );
                })}
                {!invitations?.length && <p className={styles.subtle}><PackageSearch size={16} style={{ display: 'inline', marginRight: 7 }} />No quotation requests have been sent to your business yet.</p>}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
