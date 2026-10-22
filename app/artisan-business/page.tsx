import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  WalletCards,
  Wrench,
} from 'lucide-react';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';
import { buildProviderLeadAccess, parseFreeLeadLimit } from '@/services/marketplace/providerLeadAccessPolicy.js';
import { WorkspaceThemeToggle } from '../my-projects/workspace-theme-toggle';
import styles from '../my-projects/workspace.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Artisan Business Workspace | Skills Connect Pro',
  description: 'Track provider opportunities, responses, selected jobs and lead access.',
};

type ProjectSummary = {
  id: string;
  title: string;
  category: string;
  location_text: string;
  status: string;
  urgency: string;
  preferred_date: string | null;
};

function displayName(profile: {
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}) {
  return profile.name?.trim()
    || [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim()
    || 'Service provider';
}

function planLabel(code?: string | null) {
  if (code === 'starter_monthly') return 'Starter';
  if (code === 'growth_monthly') return 'Growth';
  if (code === 'pro_monthly') return 'Pro';
  if (code?.startsWith('lead_pack_')) return 'Lead pack';
  return 'Free lead access';
}

export default async function ArtisanBusinessPage() {
  const { supabase, user } = await getAuthenticatedAccount();
  if (!user) redirect('/sign-in?next=/artisan-business');

  const [{ data: roles }, { data: applications }] = await Promise.all([
    supabase
      .from('account_roles')
      .select('role,status,linked_artisan_id')
      .eq('user_id', user.id),
    supabase
      .from('artisan_applications')
      .select('id,status,trade,location,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  const artisanRole = (roles ?? []).find(
    (role) => role.role === 'artisan' && role.status === 'active' && role.linked_artisan_id,
  );
  const latestApplication = applications?.[0] ?? null;

  if (!artisanRole?.linked_artisan_id) {
    const pending = latestApplication?.status === 'pending';

    return (
      <main className={styles.page} data-workspace-shell>
        <nav className={styles.nav}>
          <div className={styles.navInner}>
            <Link href="/"><Image src="/logo-new.svg" alt="Skills Connect Pro" width={210} height={56} priority /></Link>
            <div className={styles.navActions}>
              <Link href="/my-projects" className={styles.navLink}>My Projects</Link>
              <WorkspaceThemeToggle />
              <form action="/auth/sign-out" method="post"><button className={styles.signOut}><span>Sign out</span></button></form>
            </div>
          </div>
        </nav>

        <div className={styles.shell}>
          <section className={styles.hero}>
            <div>
              <span className={styles.eyebrow}>Provider access</span>
              <h1>Artisan tools stay separate until you join the provider network.</h1>
              <p>Your customer account can also become a provider account, but Skills Connect Pro activates business tools only after provider onboarding and approval.</p>
            </div>
          </section>

          <section className={styles.panelGrid}>
            <div className={styles.panel}>
              {pending ? <Clock3 size={30} /> : <BriefcaseBusiness size={30} />}
              <h2>{pending ? 'Application under review' : 'Want to offer your services too?'}</h2>
              <p className={styles.subtle}>
                {pending
                  ? (latestApplication.trade || 'Provider') + ' application is pending review. Once approved, this same login will automatically unlock the Artisan Business Workspace.'
                  : 'Apply as a service provider using the same account. Your homeowner projects remain private and separate from your provider business activity.'}
              </p>
              {!pending && (
                <Link href="/join" className={styles.primaryLink} style={{ display: 'inline-flex', marginTop: 18 }}>
                  Join as a provider <ArrowRight size={17} />
                </Link>
              )}
            </div>

            <aside className={styles.sidePanel}>
              <ShieldCheck />
              <h2>One login, two roles</h2>
              <p className={styles.subtle}>You do not need a second email address. Customer access and provider access can coexist, but each role has its own workspace and permissions.</p>
              <Link href="/my-projects" className={styles.secondaryAction} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 18 }}>
                Back to My Projects
              </Link>
            </aside>
          </section>
        </div>
      </main>
    );
  }

  const providerId = Number(artisanRole.linked_artisan_id);
  const admin = getSupabaseAdmin();

  const [
    profileResult,
    invitationsResult,
    responsesResult,
    matchesResult,
    entitlementsResult,
    availabilityResult,
  ] = await Promise.all([
    admin.from('artisans')
      .select('id,name,first_name,last_name,category,location,verified,approval_status,status,rating,marketplace_rating,marketplace_review_count')
      .eq('id', providerId)
      .maybeSingle(),
    admin.from('lead_invitations')
      .select('id,project_id,status,wave_number,sent_at,delivered_at,viewed_at,response_deadline,created_at')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })
      .limit(40),
    admin.from('provider_responses')
      .select('id,lead_invitation_id,project_id,response_type,estimate_min,estimate_max,estimate_currency,created_at')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })
      .limit(40),
    admin.from('project_matches')
      .select('id,project_id,status,selected_at,contact_released_at,completion_reported_at,final_price,final_price_currency,created_at')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })
      .limit(40),
    admin.from('subscription_entitlements')
      .select('id,plan_code,status,qualified_leads_used,qualified_leads_limit,starts_at,ends_at')
      .eq('subject_type', 'provider')
      .eq('subject_id', String(providerId))
      .in('status', ['trial', 'active'])
      .order('created_at', { ascending: false }),
    admin.from('provider_availability')
      .select('availability_status,accepts_emergency_jobs,accepts_planned_work,maximum_travel_km,last_confirmed_at')
      .eq('provider_id', providerId)
      .maybeSingle(),
  ]);

  for (const result of [profileResult, invitationsResult, responsesResult, matchesResult, entitlementsResult, availabilityResult]) {
    if (result.error) console.error('Artisan workspace data warning:', result.error.message);
  }

  const profile = profileResult.data;
  if (!profile) redirect('/my-projects');

  const invitations = invitationsResult.data ?? [];
  const responses = responsesResult.data ?? [];
  const matches = matchesResult.data ?? [];
  const entitlements = entitlementsResult.data ?? [];

  const projectIds = Array.from(new Set([
    ...invitations.map((row) => row.project_id),
    ...matches.map((row) => row.project_id),
  ]));

  const projectsResult = projectIds.length
    ? await admin.from('projects')
        .select('id,title,category,location_text,status,urgency,preferred_date')
        .in('id', projectIds)
    : { data: [] as ProjectSummary[], error: null };

  if (projectsResult.error) console.error('Artisan workspace projects warning:', projectsResult.error.message);
  const projects = (projectsResult.data ?? []) as ProjectSummary[];
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const responseByInvitation = new Map(responses.map((response) => [response.lead_invitation_id, response]));

  const countedLeadStatuses = new Set(['sent', 'delivered', 'viewed', 'accepted']);
  const usedFreeLeads = invitations.filter((row) => countedLeadStatuses.has(row.status)).length;
  const leadAccess = buildProviderLeadAccess({
    usedFreeLeads,
    freeLeadLimit: parseFreeLeadLimit(process.env.PROVIDER_FREE_LEAD_LIMIT),
    entitlements,
  });

  const openOpportunities = invitations.filter((row) => ['sent', 'delivered', 'viewed'].includes(row.status));
  const selectedJobs = matches.filter((row) => ['selected', 'accepted', 'contact_released', 'in_progress'].includes(row.status));
  const completedJobs = matches.filter((row) => row.status === 'completed');
  const providerPlan = leadAccess.activePlan?.code ?? null;
  const availability = availabilityResult.data;
  const providerPlansHref = '/provider-plans?provider=' + providerId;

  return (
    <main className={styles.page} data-workspace-shell>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/"><Image src="/logo-new.svg" alt="Skills Connect Pro" width={210} height={56} priority /></Link>
          <div className={styles.navActions}>
            <Link href="/my-projects" className={styles.navLink}>My Projects</Link>
            <Link href={providerPlansHref} className={styles.navLink}>Provider plans</Link>
            <WorkspaceThemeToggle />
            <form action="/auth/sign-out" method="post"><button className={styles.signOut}><span>Sign out</span></button></form>
          </div>
        </div>
      </nav>

      <div className={styles.shell}>
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>Artisan Business Workspace</span>
            <h1>{displayName(profile)}</h1>
            <p>Track incoming Skills Connect Pro opportunities, submitted responses, selected jobs and provider-plan access from one business view.</p>
          </div>
          <Link href={providerPlansHref} className={styles.primaryLink}>
            <WalletCards size={17} /> {leadAccess.locked ? 'Unlock more leads' : 'Manage provider plan'}
          </Link>
        </section>

        <section className={styles.stats} aria-label="Provider business summary">
          <div className={styles.stat}><span>Open opportunities</span><strong>{openOpportunities.length}</strong></div>
          <div className={styles.stat}><span>Responses sent</span><strong>{responses.length}</strong></div>
          <div className={styles.stat}><span>Active jobs</span><strong>{selectedJobs.length}</strong></div>
          <div className={styles.stat}><span>Lead access</span><strong style={{ fontSize: '1.05rem' }}>{planLabel(providerPlan)}</strong></div>
        </section>

        <section className={styles.panelGrid}>
          <div className={styles.panel}>
            <span className={styles.eyebrow}>Incoming work</span>
            <h2>Opportunities</h2>
            <p className={styles.subtle}>New jobs sent to your provider profile. Customer contact remains protected until you are selected.</p>
            <div className={styles.list}>
              {openOpportunities.map((invitation) => {
                const project = projectById.get(invitation.project_id);
                const response = responseByInvitation.get(invitation.id);
                return (
                  <div className={styles.row} key={invitation.id}>
                    <div>
                      <strong>{project?.title ?? 'Customer opportunity'}</strong>
                      <small>{[project?.category, project?.location_text, invitation.status.replaceAll('_', ' ')].filter(Boolean).join(' · ')}</small>
                      {response && <small>Response: {response.response_type.replaceAll('_', ' ')}</small>}
                    </div>
                    <span className={styles.status}>{response ? 'responded' : 'new'}</span>
                  </div>
                );
              })}
              {!openOpportunities.length && <p className={styles.subtle}>No open opportunities right now. New matched jobs will appear here automatically.</p>}
            </div>
            <div className={styles.notice} style={{ marginTop: 18, marginBottom: 0 }}>
              Opportunity responses still use the secure link sent to your WhatsApp. The next workspace upgrade can bring that response form directly into this dashboard.
            </div>
          </div>

          <aside className={styles.sidePanel}>
            <UserRoundCheck />
            <h2>Provider profile</h2>
            <p className={styles.subtle}>{profile.category || 'Service provider'} · {profile.location || 'Service area not set'}</p>
            <div className={styles.list}>
              <div className={styles.row}><div><strong>Verification</strong><small>Marketplace profile</small></div><span className={styles.status}>{profile.verified ? 'verified' : 'pending'}</span></div>
              <div className={styles.row}><div><strong>Availability</strong><small>Last provider setting</small></div><span>{availability?.availability_status?.replaceAll('_', ' ') || 'not set'}</span></div>
              <div className={styles.row}><div><strong>Free leads remaining</strong><small>First {leadAccess.freeLeadLimit} leads are complimentary</small></div><span className={styles.amount}>{leadAccess.freeLeadsRemaining}</span></div>
            </div>
          </aside>
        </section>

        <section className={styles.panelGrid} style={{ marginTop: 22 }}>
          <div className={styles.panel}>
            <span className={styles.eyebrow}>Won work</span>
            <h2>Selected & current jobs</h2>
            <div className={styles.list}>
              {selectedJobs.map((match) => {
                const project = projectById.get(match.project_id);
                return (
                  <div className={styles.row} key={match.id}>
                    <div>
                      <strong>{project?.title ?? 'Selected customer job'}</strong>
                      <small>{[project?.category, project?.location_text, match.status.replaceAll('_', ' ')].filter(Boolean).join(' · ')}</small>
                    </div>
                    <CheckCircle2 size={19} />
                  </div>
                );
              })}
              {!selectedJobs.length && <p className={styles.subtle}>Jobs a customer selects you for will appear here.</p>}
            </div>
          </div>

          <aside className={styles.sidePanel}>
            <MessageSquareText />
            <h2>Business activity</h2>
            <div className={styles.list}>
              <div className={styles.row}><div><strong>{completedJobs.length}</strong><small>Completed marketplace jobs</small></div><Wrench size={18} /></div>
              <div className={styles.row}><div><strong>{responses.length}</strong><small>Total responses submitted</small></div><MessageSquareText size={18} /></div>
              <div className={styles.row}><div><strong>{profile.marketplace_review_count ?? 0}</strong><small>Marketplace reviews</small></div><Sparkles size={18} /></div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
