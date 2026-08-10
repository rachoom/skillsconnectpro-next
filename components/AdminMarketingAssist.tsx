'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ExternalLink,
  Megaphone,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';

type Campaign = {
  id: string;
  campaign_date: string;
  provider_id: number;
  status: 'queued' | 'ready' | 'sent' | 'failed' | 'skipped';
  delivery_mode: 'whatsapp_link' | 'whatsapp_cloud_api';
  provider_snapshot: {
    name?: string;
    firstName?: string;
    category?: string;
    location?: string;
    verified?: boolean;
  } | null;
  generated_at: string | null;
  sent_at: string | null;
};

type Provider = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  name: string | null;
  category: string | null;
  location: string | null;
  phone: string | null;
  whatsapp: string | null;
  status: string | null;
  approval_status: string | null;
  created_at: string | null;
};

const variants = [
  { key: 'poster', label: 'Promotional Poster', ratio: 'aspect-[4/5]' },
  { key: 'business_card', label: 'Digital Business Card', ratio: 'aspect-[16/9]' },
  { key: 'whatsapp_status', label: 'WhatsApp Status', ratio: 'aspect-[9/16]' },
] as const;

function normaliseWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('27')) return digits;
  if (digits.startsWith('0')) return `27${digits.slice(1)}`;
  return digits;
}

function providerName(provider: Provider): string {
  const explicit = (provider.name || '').trim();
  const first = (provider.first_name || '').trim();
  const last = (provider.last_name || '').trim();
  const combined = `${first} ${last}`.trim();
  if (explicit && explicit.toLowerCase() !== first.toLowerCase()) return explicit;
  return combined || explicit || `Provider #${provider.id}`;
}

function johannesburgToday(): string {
  const parts = new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';
  return `${year}-${month}-${day}`;
}

async function readJson(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed with status ${response.status}.`);
  }
  return payload;
}

export function AdminMarketingAssist() {
  const [adminKey, setAdminKey] = useState('');
  const [validatedKey, setValidatedKey] = useState('');
  const [onAdminRoute, setOnAdminRoute] = useState(false);
  const [open, setOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingToday, setCreatingToday] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const isAdmin = window.location.pathname === '/marketplace-admin';
      const storedKey = isAdmin
        ? window.sessionStorage.getItem('marketplaceAdminKey') ?? ''
        : '';

      setOnAdminRoute(isAdmin);
      setAdminKey((current) => (current === storedKey ? current : storedKey));
    };

    sync();
    const timer = window.setInterval(sync, 500);
    window.addEventListener('popstate', sync);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  useEffect(() => {
    if (!onAdminRoute || !adminKey) {
      setValidatedKey('');
      setOpen(false);
      return;
    }

    let cancelled = false;

    const validateAdminKey = async () => {
      try {
        const response = await fetch('/api/admin/projects', {
          headers: { 'x-marketplace-admin-key': adminKey },
          cache: 'no-store',
        });

        if (response.ok) {
          if (!cancelled) {
            setValidatedKey(adminKey);
            setError(null);
          }
          return;
        }

        const payload = await response.json().catch(() => ({}));

        if (response.status === 401) {
          window.sessionStorage.removeItem('marketplaceAdminKey');
          if (!cancelled) {
            setValidatedKey('');
            setAdminKey('');
            setOpen(false);
          }
          window.location.reload();
          return;
        }

        if (!cancelled) {
          setValidatedKey('');
          setError(payload.error || 'Unable to validate the Marketplace Admin session.');
        }
      } catch (caught) {
        if (!cancelled) {
          setValidatedKey('');
          setError(caught instanceof Error ? caught.message : 'Unable to validate the Marketplace Admin session.');
        }
      }
    };

    void validateAdminKey();

    return () => {
      cancelled = true;
    };
  }, [adminKey, onAdminRoute]);

  const isValidated = Boolean(adminKey && validatedKey === adminKey);

  const handleUnauthorised = useCallback(() => {
    window.sessionStorage.removeItem('marketplaceAdminKey');
    setValidatedKey('');
    setAdminKey('');
    setOpen(false);
    window.location.reload();
  }, []);

  const refresh = useCallback(async () => {
    if (!adminKey || !isValidated) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/marketing', {
        headers: { 'x-marketplace-admin-key': adminKey },
        cache: 'no-store',
      });

      if (response.status === 401) {
        handleUnauthorised();
        return;
      }

      const payload = await readJson(response);
      setCampaigns((payload.campaigns ?? []) as Campaign[]);
      setProviders((payload.providers ?? []) as Provider[]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load Marketing Assist.');
    } finally {
      setLoading(false);
    }
  }, [adminKey, handleUnauthorised, isValidated]);

  useEffect(() => {
    if (open && isValidated) void refresh();
  }, [isValidated, open, refresh]);

  const providersById = useMemo(
    () => new Map(providers.map((provider) => [provider.id, provider])),
    [providers],
  );
  const today = johannesburgToday();
  const todayCampaign = campaigns.find((campaign) => campaign.campaign_date === today) ?? null;
  const selectedCampaign = selectedCampaignId
    ? campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? null
    : null;
  const viewedCampaign = selectedCampaign ?? todayCampaign;
  const viewedProvider = viewedCampaign
    ? providersById.get(viewedCampaign.provider_id) ?? null
    : null;
  const viewingArchive = Boolean(selectedCampaign && selectedCampaign.id !== todayCampaign?.id);

  const eligibleCount = useMemo(
    () => providers.filter((provider) => {
      const phone = provider.whatsapp || provider.phone || '';
      const status = (provider.status || '').toLowerCase();
      const approval = (provider.approval_status || '').toLowerCase();
      return normaliseWhatsApp(phone).length >= 9
        && !['inactive', 'disabled', 'suspended', 'deleted'].includes(status)
        && !['rejected', 'declined'].includes(approval);
    }).length,
    [providers],
  );

  const rotation = useMemo(() => {
    const lastCampaign = new Map<number, string>();
    for (const campaign of campaigns) {
      if (campaign.status === 'failed' || campaign.status === 'skipped') continue;
      const previous = lastCampaign.get(campaign.provider_id);
      if (!previous || campaign.campaign_date > previous) {
        lastCampaign.set(campaign.provider_id, campaign.campaign_date);
      }
    }

    return providers
      .filter((provider) => {
        const phone = provider.whatsapp || provider.phone || '';
        const status = (provider.status || '').toLowerCase();
        const approval = (provider.approval_status || '').toLowerCase();
        return normaliseWhatsApp(phone).length >= 9
          && !['inactive', 'disabled', 'suspended', 'deleted'].includes(status)
          && !['rejected', 'declined'].includes(approval)
          && provider.id !== todayCampaign?.provider_id;
      })
      .sort((left, right) => {
        const leftLast = lastCampaign.get(left.id);
        const rightLast = lastCampaign.get(right.id);
        if (!leftLast && rightLast) return -1;
        if (leftLast && !rightLast) return 1;
        if (leftLast && rightLast && leftLast !== rightLast) {
          return leftLast.localeCompare(rightLast);
        }
        return left.id - right.id;
      })
      .slice(0, 5);
  }, [campaigns, providers, todayCampaign?.provider_id]);

  const createToday = async () => {
    if (!adminKey || !isValidated) return;
    setCreatingToday(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/marketing', {
        method: 'POST',
        headers: {
          'x-marketplace-admin-key': adminKey,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        handleUnauthorised();
        return;
      }

      await readJson(response);
      setSelectedCampaignId(null);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to prepare today’s campaign.');
    } finally {
      setCreatingToday(false);
    }
  };

  const assetUrl = (campaignId: string, variant: string) =>
    `${window.location.origin}/api/marketing/assets/${campaignId}?variant=${variant}`;

  const openCampaign = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    window.setTimeout(() => {
      document.getElementById('marketing-campaign-viewer')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  };

  const sendViaWhatsApp = () => {
    if (!viewedCampaign || !viewedProvider) return;
    const phone = normaliseWhatsApp(viewedProvider.whatsapp || viewedProvider.phone || '');
    if (!phone) return;

    const firstName = viewedProvider.first_name
      || viewedCampaign.provider_snapshot?.firstName
      || 'there';
    const message = [
      `Hi ${firstName}! SkillsConnect Pro created a complimentary marketing pack for your business.`,
      '',
      'Your three branded marketing pieces are ready:',
      `1. Promotional poster: ${assetUrl(viewedCampaign.id, 'poster')}`,
      `2. Digital business card: ${assetUrl(viewedCampaign.id, 'business_card')}`,
      `3. WhatsApp Status: ${assetUrl(viewedCampaign.id, 'whatsapp_status')}`,
      '',
      'You are welcome to save and share them with customers and your WhatsApp contacts.',
      '',
      'SkillsConnect Pro — helping local professionals get discovered and grow.',
    ].join('\n');

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  if (!onAdminRoute || !isValidated) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[450] flex items-center gap-3 rounded-2xl border border-amber-300/40 bg-[#0b0906] px-5 py-4 text-amber-300 shadow-2xl transition hover:-translate-y-1 hover:border-amber-300"
      >
        <Megaphone className="h-5 w-5" />
        <span className="text-xs font-black uppercase tracking-[0.18em]">Marketing Assist</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[500] overflow-y-auto bg-black/90 p-4 backdrop-blur-xl md:p-8">
          <div className="mx-auto min-h-full max-w-7xl rounded-[2rem] border border-amber-300/20 bg-[#0b0906] text-white shadow-[0_30px_100px_rgba(0,0,0,0.65)]">
            <header className="sticky top-0 z-20 flex flex-col gap-5 rounded-t-[2rem] border-b border-white/10 bg-[#0b0906]/95 px-6 py-6 backdrop-blur-xl md:flex-row md:items-center md:justify-between md:px-10">
              <div>
                <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-amber-300">
                  <ShieldCheck className="h-4 w-4" /> Secure admin module
                </div>
                <h2 className="text-3xl font-black tracking-tight md:text-4xl">Marketing Assist</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  One provider per day • three SkillsConnect Pro branded assets • WhatsApp delivery.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => void refresh()}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-wider hover:border-amber-300/50 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 hover:border-red-400/50 hover:text-red-300"
                  aria-label="Close Marketing Assist"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>

            <main className="space-y-10 p-6 md:p-10">
              {error ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Automation</div>
                  <div className="mt-2 text-xl font-black text-amber-300">Daily at 08:15 SAST</div>
                  <div className="mt-1 text-xs text-zinc-500">Scheduled campaign preparation</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Eligible providers</div>
                  <div className="mt-2 text-3xl font-black">{eligibleCount}</div>
                  <div className="mt-1 text-xs text-zinc-500">with WhatsApp-capable contact numbers</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Packs prepared</div>
                  <div className="mt-2 text-3xl font-black">{campaigns.length}</div>
                  <div className="mt-1 text-xs text-zinc-500">campaign records in this rotation</div>
                </div>
              </section>

              <section id="marketing-campaign-viewer" className="scroll-mt-36">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-300">
                      {viewingArchive ? `Campaign archive • ${viewedCampaign?.campaign_date || ''}` : "Today's featured provider"}
                    </div>
                    <h3 className="mt-2 text-2xl font-black md:text-3xl">
                      {viewedCampaign?.provider_snapshot?.name || 'No campaign prepared yet'}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-400">
                      {viewedCampaign?.provider_snapshot?.category || ''}
                      {viewedCampaign?.provider_snapshot?.location
                        ? ` • ${viewedCampaign.provider_snapshot.location}`
                        : ''}
                    </p>
                    {viewingArchive ? (
                      <button
                        type="button"
                        onClick={() => setSelectedCampaignId(null)}
                        className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/5 px-4 py-2 text-xs font-black uppercase tracking-wider text-amber-300 transition hover:border-amber-300/60 hover:bg-amber-300/10"
                      >
                        ← Back to today&apos;s campaign
                      </button>
                    ) : null}
                  </div>
                  {viewedCampaign && viewedProvider ? (
                    <button
                      type="button"
                      onClick={sendViaWhatsApp}
                      className="flex items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-black uppercase tracking-wider text-white shadow-[0_15px_40px_rgba(16,185,129,0.25)] transition hover:-translate-y-1 hover:bg-emerald-400"
                    >
                      <MessageCircle className="h-5 w-5" />
                      {viewingArchive ? 'Send this pack on WhatsApp' : 'Send pack on WhatsApp'}
                    </button>
                  ) : !todayCampaign ? (
                    <button
                      type="button"
                      onClick={() => void createToday()}
                      disabled={creatingToday}
                      className="flex items-center justify-center gap-3 rounded-2xl bg-amber-300 px-6 py-4 text-sm font-black uppercase tracking-wider text-black transition hover:bg-amber-200 disabled:opacity-60"
                    >
                      <Megaphone className="h-5 w-5" />
                      {creatingToday ? 'Preparing…' : 'Prepare today’s pack'}
                    </button>
                  ) : null}
                </div>

                {viewedCampaign ? (
                  <div className="grid gap-5 lg:grid-cols-3">
                    {variants.map((variant) => (
                      <div key={variant.key} className="overflow-hidden rounded-3xl border border-white/10 bg-[#15110c]">
                        <div className={`relative w-full overflow-hidden bg-black ${variant.ratio}`}>
                          {/* Dynamic ImageResponse assets intentionally use a plain img so admin previews can render arbitrary generated dimensions. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/marketing/assets/${viewedCampaign.id}?variant=${variant.key}`}
                            alt={`${variant.label} for ${viewedCampaign.provider_snapshot?.name || 'featured provider'}`}
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="flex items-center justify-between p-4">
                          <div>
                            <div className="text-sm font-black">{variant.label}</div>
                            <div className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">PNG • WhatsApp ready</div>
                          </div>
                          <a
                            href={`/api/marketing/assets/${viewedCampaign.id}?variant=${variant.key}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-white/10 p-2 text-zinc-400 hover:border-amber-300/50 hover:text-amber-300"
                            aria-label={`Open ${variant.label}`}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] py-16 text-center text-sm text-zinc-500">
                    Prepare today&apos;s campaign to generate the three branded assets.
                  </div>
                )}
              </section>

              <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-amber-300" />
                    <h3 className="text-xl font-black">Upcoming rotation</h3>
                  </div>
                  <div className="space-y-3">
                    {rotation.map((provider, index) => (
                      <div
                        key={provider.id}
                        className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/30 px-4 py-3"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-300/25 bg-amber-300/10 text-xs font-black text-amber-300">
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-sm font-bold">{providerName(provider)}</div>
                            <div className="text-xs text-zinc-500">
                              {provider.category || 'Local professional'} • {provider.location || 'Local area'}
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-zinc-600">Queued</div>
                      </div>
                    ))}
                    {!loading && rotation.length === 0 ? (
                      <div className="py-8 text-center text-sm text-zinc-500">No eligible providers waiting in the rotation.</div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
                  <div className="mb-5 flex items-end justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-black">Recent campaigns</h3>
                      <p className="mt-1 text-xs text-zinc-500">Tap any campaign to reopen its complete marketing pack.</p>
                    </div>
                  </div>
                  <div className="max-h-[390px] space-y-3 overflow-y-auto pr-1">
                    {campaigns.slice(0, 12).map((campaign) => {
                      const active = viewedCampaign?.id === campaign.id;
                      return (
                        <button
                          key={campaign.id}
                          type="button"
                          onClick={() => openCampaign(campaign.id)}
                          className={`w-full rounded-2xl border p-4 text-left transition ${
                            active
                              ? 'border-amber-300/45 bg-amber-300/[0.08]'
                              : 'border-white/5 bg-black/30 hover:border-amber-300/30 hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="text-sm font-bold">
                                {campaign.provider_snapshot?.name || `Provider #${campaign.provider_id}`}
                              </div>
                              <div className="mt-1 text-xs text-zinc-500">{campaign.campaign_date}</div>
                              <div className="mt-2 text-[10px] font-black uppercase tracking-wider text-amber-300/80">
                                {active ? 'Viewing pack' : 'View pack →'}
                              </div>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider ${
                              campaign.status === 'sent'
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : campaign.status === 'failed'
                                  ? 'bg-red-500/15 text-red-300'
                                  : 'bg-amber-300/10 text-amber-300'
                            }`}>
                              {campaign.status}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-5 text-sm leading-relaxed text-zinc-300">
                <strong className="text-amber-300">WhatsApp delivery:</strong> the current SkillsConnect Pro connection opens a prepared WhatsApp message containing the three generated image links. The campaign schema already supports a later switch to unattended WhatsApp Business Cloud API media delivery.
              </div>
            </main>
          </div>
        </div>
      ) : null}
    </>
  );
}
