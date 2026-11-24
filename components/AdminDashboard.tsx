import React, { useEffect, useMemo, useState } from 'react';
import { CustomerOutcomesPanel } from './CustomerOutcomesPanel';
import { CheckCircle2, ChevronDown, Search, Send, ShieldCheck, UserCheck, UserX } from 'lucide-react';

interface Application {
  id: number;
  created_at: string;
  first_name: string;
  last_name: string;
  trade: string;
  location: string;
  phone: string;
  bio: string;
  institution?: string;
  status: string;
}

interface Provider {
  id: number;
  first_name: string | null;
  last_name: string | null;
  name?: string | null;
  category: string | null;
  phone: string | null;
  location: string | null;
  is_claimed: boolean | null;
  approval_status: string | null;
  status: string | null;
  verified: boolean | null;
  created_at: string | null;
}

interface ClaimInvite {
  id: string;
  artisan_id: number;
  application_id: number | null;
  status: string;
  sent_at: string | null;
  claimed_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface Suggestion {
  id: number;
  created_at: string;
  suggestion_text: string;
  contact_number?: string;
}

interface Review {
  id: number;
  created_at: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  artisan_id: number;
  status: string;
}

interface AdminDashboardProps {
  onBack: () => void;
}

function providerName(provider: Provider) {
  const explicit = (provider.name || '').trim();
  const combined = `${provider.first_name || ''} ${provider.last_name || ''}`.trim();
  return explicit || combined || `Provider #${provider.id}`;
}

function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('27')) return digits;
  if (digits.startsWith('0')) return `27${digits.slice(1)}`;
  return digits;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [section, setSection] = useState<'providers' | 'outcomes'>('providers');
  const [applications, setApplications] = useState<Application[]>([]);
  const [awaitingClaims, setAwaitingClaims] = useState<Provider[]>([]);
  const [finalApprovals, setFinalApprovals] = useState<Provider[]>([]);
  const [providerDirectory, setProviderDirectory] = useState<Provider[]>([]);
  const [claimInvites, setClaimInvites] = useState<ClaimInvite[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [legacyOpen, setLegacyOpen] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/provider-admin/dashboard', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) window.location.assign('/admin-dashboard');
        throw new Error(payload.error || 'Unable to load admin data.');
      }
      setApplications(payload.applications || []);
      setAwaitingClaims(payload.awaitingClaims || []);
      setFinalApprovals(payload.finalApprovals || []);
      setProviderDirectory(payload.providerDirectory || []);
      setClaimInvites(payload.claimInvites || []);
      setSuggestions(payload.suggestions || []);
      setReviews(payload.reviews || []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  const dashboardAction = async (action: string, body: Record<string, unknown> = {}) => {
    const response = await fetch('/api/provider-admin/dashboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) window.location.assign('/admin-dashboard');
      throw new Error(payload.error || 'Admin action failed.');
    }
    return payload;
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const inviteByArtisan = useMemo(() => {
    const map = new Map<number, ClaimInvite>();
    for (const invite of claimInvites) {
      if (!map.has(invite.artisan_id)) map.set(invite.artisan_id, invite);
    }
    return map;
  }, [claimInvites]);

  const openConsentWhatsApp = (provider: Provider, token: string) => {
    const phone = whatsappNumber(provider.phone || '');
    if (!phone) {
      alert('No usable phone number is available for this provider.');
      return;
    }
    const firstName = provider.first_name || providerName(provider);
    const claimLink = `${window.location.origin}/?claim=${encodeURIComponent(token)}`;
    const message = [
      `Hi ${firstName}, SkillsConnect Pro has prepared a basic professional profile for your business.`,
      '',
      'SkillsConnect Pro helps local customers find trusted service providers in their area.',
      '',
      'Before we publish anything, please review the profile and confirm that you consent to your business/contact information being listed on SkillsConnect Pro. You can also add a profile photo or proof-of-work images.',
      '',
      `Review and confirm your profile here: ${claimLink}`,
      '',
      'Nothing will be published until you confirm and SkillsConnect Pro completes a final review.',
      `Website: ${window.location.origin}`,
    ].join('\n');

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  const sendApplicationConsent = async (app: Application) => {
    setProcessing(`app-${app.id}`);
    try {
      const payload = await dashboardAction('prepare_application_claim', { id: app.id });
      const provider: Provider = {
        id: payload.artisanId,
        first_name: app.first_name,
        last_name: app.last_name,
        category: app.trade,
        phone: app.phone,
        location: app.location,
        is_claimed: false,
        approval_status: 'awaiting_claim',
        status: 'draft',
        verified: false,
        created_at: app.created_at,
      };
      openConsentWhatsApp(provider, payload.token);
      await fetchData();
    } catch (caught) {
      alert(caught instanceof Error ? caught.message : 'Unable to create consent invitation.');
    } finally {
      setProcessing(null);
    }
  };

  const sendProviderConsent = async (provider: Provider) => {
    setProcessing(`provider-${provider.id}`);
    try {
      const payload = await dashboardAction('create_claim_invite', { artisanId: provider.id });
      openConsentWhatsApp(provider, payload.token);
      await fetchData();
    } catch (caught) {
      alert(caught instanceof Error ? caught.message : 'Unable to create consent invitation.');
    } finally {
      setProcessing(null);
    }
  };

  const finalApprove = async (provider: Provider) => {
    if (!confirm(`Publish ${providerName(provider)} on the live SkillsConnect Pro directory?`)) return;
    setProcessing(`approve-${provider.id}`);
    try {
      await dashboardAction('final_approve_claim', { artisanId: provider.id });
      await fetchData();
    } catch (caught) {
      alert(caught instanceof Error ? caught.message : 'Unable to approve provider.');
    } finally {
      setProcessing(null);
    }
  };

  const rejectClaim = async (provider: Provider) => {
    if (!confirm(`Reject ${providerName(provider)} at final review?`)) return;
    setProcessing(`reject-${provider.id}`);
    try {
      await dashboardAction('reject_claim', { artisanId: provider.id });
      await fetchData();
    } catch (caught) {
      alert(caught instanceof Error ? caught.message : 'Unable to reject provider.');
    } finally {
      setProcessing(null);
    }
  };

  const rejectApplication = async (id: number) => {
    if (!confirm('Reject this application?')) return;
    try {
      await dashboardAction('reject_application', { id });
      await fetchData();
    } catch (caught) {
      alert(caught instanceof Error ? caught.message : 'Unable to reject application.');
    }
  };

  const filteredProviders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return providerDirectory.filter(provider => {
      const haystack = [
        providerName(provider),
        provider.category,
        provider.phone,
        provider.location,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(query);
    }).slice(0, 20);
  }, [providerDirectory, search]);

  const legacyUnclaimedCount = useMemo(
    () => providerDirectory.filter(provider =>
      !provider.is_claimed
      && provider.approval_status !== 'awaiting_claim'
      && provider.approval_status !== 'claimed_pending_approval'
    ).length,
    [providerDirectory],
  );

  const approveReview = async (id: number) => {
    await dashboardAction('approve_review', { id });
    await fetchData();
  };

  const deleteReview = async (id: number) => {
    if (!confirm('Delete this review permanently?')) return;
    await dashboardAction('delete_review', { id });
    await fetchData();
  };

  const deleteSuggestion = async (id: number) => {
    if (!confirm('Delete this message?')) return;
    await dashboardAction('delete_suggestion', { id });
    await fetchData();
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-white md:p-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <button onClick={onBack} className="mb-4 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-amber-300">← Back to Home</button>
            <h1 className="text-4xl font-black">Admin <span className="text-amber-300">Dashboard</span></h1>
            <p className="mt-2 text-zinc-400">Provider management, customer outcomes and network moderation.</p>
          </div>
          <button onClick={() => void fetchData()} className="rounded-xl bg-zinc-800 px-6 py-3 text-xs font-black uppercase tracking-wider hover:bg-zinc-700">Refresh data</button>
        </header>

        <nav aria-label="Admin dashboard sections" className="mb-6 grid grid-cols-2 gap-3">
          <button type="button" aria-pressed={section === 'providers'} onClick={() => setSection('providers')} className={`min-h-14 rounded-xl border p-3 text-sm font-bold ${section === 'providers' ? 'border-amber-400 bg-amber-400 text-black' : 'border-white/15 bg-zinc-900 text-white'}`}>Provider Management</button>
          <button type="button" aria-pressed={section === 'outcomes'} onClick={() => setSection('outcomes')} className={`min-h-14 rounded-xl border p-3 text-sm font-bold ${section === 'outcomes' ? 'border-amber-400 bg-amber-400 text-black' : 'border-white/15 bg-zinc-900 text-white'}`}>Customer Outcomes</button>
        </nav>
        {section === 'outcomes' ? (
          <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4 md:p-6">
            <CustomerOutcomesPanel />
          </section>
        ) : <>
        {error ? <div className="mb-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}

        <section className="mb-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">New applications</div>
            <div className="mt-2 text-3xl font-black">{applications.length}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Awaiting provider consent</div>
            <div className="mt-2 text-3xl font-black text-teal-300">{awaitingClaims.length}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Ready for final approval</div>
            <div className="mt-2 text-3xl font-black text-amber-300">{finalApprovals.length}</div>
          </div>
        </section>

        <section className="mb-14">
          <div className="mb-5">
            <h2 className="text-2xl font-black">1. New Applications</h2>
            <p className="mt-1 text-sm text-zinc-500">Send consent first. These profiles are not live yet.</p>
          </div>
          {loading ? <div className="rounded-2xl bg-zinc-900 p-8 text-zinc-500">Loading…</div> : applications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/40 p-8 text-sm text-zinc-500">No new applications waiting.</div>
          ) : (
            <div className="space-y-4">
              {applications.map(app => (
                <div key={app.id} className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">{app.trade}</div>
                      <h3 className="mt-2 text-2xl font-black">{app.first_name} {app.last_name}</h3>
                      <p className="mt-2 text-sm text-zinc-400">📍 {app.location || 'Location not supplied'} &nbsp; 📞 {app.phone}</p>
                      {app.bio ? <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500">{app.bio}</p> : null}
                    </div>
                    <div className="flex min-w-48 flex-col gap-2">
                      <button
                        onClick={() => void sendApplicationConsent(app)}
                        disabled={processing !== null}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#128C7E] px-5 py-3 text-xs font-black uppercase tracking-wider disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" /> {processing === `app-${app.id}` ? 'Preparing…' : 'Send consent invite'}
                      </button>
                      <button onClick={() => void rejectApplication(app.id)} className="rounded-xl border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-wider text-zinc-500 hover:text-red-300">Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-14">
          <div className="mb-5">
            <h2 className="text-2xl font-black">2. Awaiting Provider Consent</h2>
            <p className="mt-1 text-sm text-zinc-500">Only providers actively placed into the consent workflow appear here.</p>
          </div>
          {awaitingClaims.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/40 p-8 text-sm text-zinc-500">No active consent invitations.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {awaitingClaims.map(provider => {
                const invite = inviteByArtisan.get(provider.id);
                return (
                  <div key={provider.id} className="rounded-2xl border border-teal-400/15 bg-zinc-900 p-5">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-teal-300"><UserX className="h-4 w-4" /> Awaiting consent</div>
                    <h3 className="mt-3 text-xl font-black">{providerName(provider)}</h3>
                    <p className="mt-1 text-xs text-amber-300">{provider.category || 'Local professional'}</p>
                    <p className="mt-3 text-sm text-zinc-500">📞 {provider.phone || 'No phone'} · 📍 {provider.location || 'No location'}</p>
                    <p className="mt-3 text-[11px] text-zinc-600">
                      {invite?.sent_at ? `Invite last sent ${new Date(invite.sent_at).toLocaleString()}` : 'Invite has not been sent yet.'}
                    </p>
                    <button
                      onClick={() => void sendProviderConsent(provider)}
                      disabled={processing !== null}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-teal-400/30 bg-teal-500/10 px-4 py-3 text-xs font-black uppercase tracking-wider text-teal-300 hover:bg-teal-500/20 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" /> {processing === `provider-${provider.id}` ? 'Preparing…' : invite ? 'Resend / refresh consent link' : 'Send consent link'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mb-14">
          <div className="mb-5">
            <h2 className="text-2xl font-black">3. Final Admin Approval</h2>
            <p className="mt-1 text-sm text-zinc-500">These providers have confirmed ownership/consent. Your approval is what makes them live and verified.</p>
          </div>
          {finalApprovals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/40 p-8 text-sm text-zinc-500">No confirmed profiles are waiting for final approval.</div>
          ) : (
            <div className="space-y-4">
              {finalApprovals.map(provider => (
                <div key={provider.id} className="rounded-2xl border border-amber-300/20 bg-zinc-900 p-6">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Provider consent received</div>
                      <h3 className="mt-3 text-2xl font-black">{providerName(provider)}</h3>
                      <p className="mt-2 text-sm text-zinc-400">{provider.category || 'Local professional'} · {provider.location || 'Local area'} · {provider.phone || 'No phone'}</p>
                    </div>
                    <div className="flex min-w-48 flex-col gap-2">
                      <button onClick={() => void finalApprove(provider)} disabled={processing !== null} className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-xs font-black uppercase tracking-wider disabled:opacity-50">
                        <UserCheck className="h-4 w-4" /> Approve & publish
                      </button>
                      <button onClick={() => void rejectClaim(provider)} disabled={processing !== null} className="rounded-xl border border-white/10 px-5 py-3 text-xs font-black uppercase tracking-wider text-zinc-500 hover:text-red-300">Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-14 rounded-3xl border border-white/10 bg-zinc-900/60 p-6">
          <div className="flex items-start gap-3">
            <Search className="mt-1 h-5 w-5 text-amber-300" />
            <div className="flex-1">
              <h2 className="text-2xl font-black">Find a Specific Provider</h2>
              <p className="mt-1 text-sm text-zinc-500">Search by provider/business name, trade, phone number or location, then send that person a consent/claim invitation.</p>
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search provider, trade, phone or area…"
                className="mt-5 min-h-12 w-full rounded-xl border border-white/10 bg-black/60 px-4 text-sm outline-none focus:border-amber-300/50"
              />
            </div>
          </div>

          {search.trim() ? (
            <div className="mt-5 space-y-2">
              {filteredProviders.length === 0 ? <p className="py-4 text-sm text-zinc-600">No matching providers found.</p> : filteredProviders.map(provider => {
                const fullyApproved = provider.is_claimed && provider.approval_status === 'approved';
                return (
                  <div key={provider.id} className="flex flex-col gap-3 rounded-xl border border-white/5 bg-black/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-bold">{providerName(provider)}</div>
                      <div className="mt-1 text-xs text-zinc-500">{provider.category || 'Local professional'} · {provider.phone || 'No phone'} · {provider.location || 'No location'}</div>
                      <div className="mt-2 text-[9px] font-black uppercase tracking-wider text-zinc-600">{provider.approval_status || 'No approval status'} · {provider.is_claimed ? 'Claimed' : 'Unclaimed'}</div>
                    </div>
                    <button
                      onClick={() => void sendProviderConsent(provider)}
                      disabled={fullyApproved || processing !== null || !provider.phone}
                      className="rounded-lg border border-teal-400/25 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-teal-300 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      {fullyApproved ? 'Already approved' : 'Send claim invite'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}

          <button type="button" onClick={() => setLegacyOpen(open => !open)} className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-zinc-600 hover:text-zinc-400">
            Legacy unclaimed pool: {legacyUnclaimedCount} profiles <ChevronDown className={`h-4 w-4 transition ${legacyOpen ? 'rotate-180' : ''}`} />
          </button>
          {legacyOpen ? (
            <p className="mt-3 text-xs leading-6 text-zinc-600">
              These older records are preserved for lookup but are no longer dumped into the working consent queue. Search above whenever you want to contact a specific one.
            </p>
          ) : null}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-zinc-900/50 p-6">
            <h2 className="text-xl font-black">Pending Reviews <span className="ml-2 text-sm text-amber-300">{reviews.length}</span></h2>
            <div className="mt-5 space-y-3">
              {reviews.length === 0 ? <p className="text-sm text-zinc-600">No reviews awaiting moderation.</p> : reviews.map(review => (
                <div key={review.id} className="rounded-xl bg-black/30 p-4">
                  <div className="font-bold">{review.reviewer_name} <span className="text-amber-300">{'★'.repeat(review.rating)}</span></div>
                  <p className="mt-2 text-sm text-zinc-400">{review.comment}</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => void approveReview(review.id)} className="rounded-lg bg-green-600 px-3 py-2 text-[10px] font-black uppercase">Approve</button>
                    <button onClick={() => void deleteReview(review.id)} className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-black uppercase text-zinc-500">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900/50 p-6">
            <h2 className="text-xl font-black">Service Suggestions <span className="ml-2 text-sm text-amber-300">{suggestions.length}</span></h2>
            <div className="mt-5 space-y-3">
              {suggestions.length === 0 ? <p className="text-sm text-zinc-600">No suggestions in the inbox.</p> : suggestions.map(item => (
                <div key={item.id} className="rounded-xl bg-black/30 p-4">
                  <p className="text-sm text-zinc-300">{item.suggestion_text}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-zinc-600">
                    <span>{item.contact_number || 'No contact number'}</span>
                    <button onClick={() => void deleteSuggestion(item.id)} className="font-black uppercase hover:text-red-300">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        </>}
      </div>
    </div>
  );
};
