"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Megaphone, MessageCircle, RefreshCw, X, ExternalLink, CalendarDays } from 'lucide-react';
import { supabase } from '../services/supabase';

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
  return (provider.name || `${provider.first_name || ''} ${provider.last_name || ''}`.trim() || `Provider #${provider.id}`).trim();
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

function detectAdminDashboard(): boolean {
  if (typeof document === 'undefined') return false;
  return Array.from(document.querySelectorAll('h1')).some((heading) =>
    (heading.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase().includes('admin dashboard'),
  );
}

export const AdminMarketingAssist: React.FC = () => {
  const [adminVisible, setAdminVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setAdminVisible(detectAdminDashboard());
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!adminVisible) setOpen(false);
  }, [adminVisible]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [campaignResult, providerResult] = await Promise.all([
        supabase
          .from('marketing_campaigns')
          .select('id, campaign_date, provider_id, status, delivery_mode, provider_snapshot, generated_at, sent_at')
          .order('campaign_date', { ascending: false })
          .limit(90),
        supabase
          .from('artisans')
          .select('id, first_name, last_name, name, category, location, phone, whatsapp, status, approval_status, created_at')
          .order('id', { ascending: true }),
      ]);

      if (campaignResult.error) throw campaignResult.error;
      if (providerResult.error) throw providerResult.error;
      setCampaigns((campaignResult.data || []) as Campaign[]);
      setProviders((providerResult.data || []) as Provider[]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load Marketing Assist data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const providersById = useMemo(() => new Map(providers.map((provider) => [provider.id, provider])), [providers]);
  const today = johannesburgToday();
  const todayCampaign = campaigns.find((campaign) => campaign.campaign_date === today) || campaigns[0] || null;
  const todayProvider = todayCampaign ? providersById.get(todayCampaign.provider_id) || null : null;

  const rotation = useMemo(() => {
    const lastCampaign = new Map<number, string>();
    for (const campaign of campaigns) {
      if (campaign.status === 'failed' || campaign.status === 'skipped') continue;
      const previous = lastCampaign.get(campaign.provider_id);
      if (!previous || campaign.campaign_date > previous) lastCampaign.set(campaign.provider_id, campaign.campaign_date);
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
        if (leftLast && rightLast && leftLast !== rightLast) return leftLast.localeCompare(rightLast);
        return left.id - right.id;
      })
      .slice(0, 5);
  }, [campaigns, providers, todayCampaign?.provider_id]);

  const assetUrl = (campaignId: string, variant: string) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/api/marketing/assets/${campaignId}?variant=${variant}`;
  };

  const sendViaWhatsApp = () => {
    if (!todayCampaign || !todayProvider) return;
    const phone = normaliseWhatsApp(todayProvider.whatsapp || todayProvider.phone || '');
    if (!phone) return;
    const firstName = todayProvider.first_name || todayCampaign.provider_snapshot?.firstName || 'there';
    const message = [
      `Hi ${firstName}! SkillsConnect Pro selected your business for today's complimentary marketing support.`,
      '',
      'We created three branded marketing pieces for you:',
      `1. Promotional poster: ${assetUrl(todayCampaign.id, 'poster')}`,
      `2. Digital business card: ${assetUrl(todayCampaign.id, 'business_card')}`,
      `3. WhatsApp Status: ${assetUrl(todayCampaign.id, 'whatsapp_status')}`,
      '',
      'You are welcome to save and share them with customers and your WhatsApp contacts.',
      '',
      'SkillsConnect Pro — helping local professionals get discovered and grow.',
    ].join('\n');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  if (!adminVisible) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[450] flex items-center gap-3 rounded-2xl border border-[#f6c84c]/40 bg-[#0b0906] px-5 py-4 text-[#f6c84c] shadow-2xl transition hover:-translate-y-1 hover:border-[#f6c84c]"
      >
        <Megaphone className="h-5 w-5" />
        <span className="text-xs font-black uppercase tracking-[0.18em]">Marketing Assist</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[500] overflow-y-auto bg-black/90 p-4 backdrop-blur-xl md:p-8">
          <div className="mx-auto min-h-full max-w-7xl rounded-[2rem] border border-[#f6c84c]/20 bg-[#0b0906] text-white shadow-[0_30px_100px_rgba(0,0,0,0.65)]">
            <header className="sticky top-0 z-20 flex flex-col gap-5 rounded-t-[2rem] border-b border-white/10 bg-[#0b0906]/95 px-6 py-6 backdrop-blur-xl md:flex-row md:items-center md:justify-between md:px-10">
              <div>
                <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#f6c84c]">
                  <Megaphone className="h-4 w-4" /> SkillsConnect Pro Marketing Assist
                </div>
                <h2 className="text-3xl font-black tracking-tight md:text-4xl">Daily Provider Marketing</h2>
                <p className="mt-2 text-sm text-zinc-400">One provider per day • three WhatsApp-ready branded assets • fair rotation.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={refresh} disabled={loading} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-wider hover:border-[#f6c84c]/50 disabled:opacity-50">
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
                <button onClick={() => setOpen(false)} className="rounded-xl border border-white/10 bg-white/5 p-3 hover:border-red-400/50 hover:text-red-300" aria-label="Close Marketing Assist">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>

            <main className="space-y-10 p-6 md:p-10">
              {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

              <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Automation</div>
                  <div className="mt-2 text-xl font-black text-[#f6c84c]">Daily at 08:15 SAST</div>
                  <div className="mt-1 text-xs text-zinc-500">Vercel scheduled generation</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Eligible providers</div>
                  <div className="mt-2 text-3xl font-black">{providers.filter((p) => normaliseWhatsApp(p.whatsapp || p.phone || '').length >= 9).length}</div>
                  <div className="mt-1 text-xs text-zinc-500">with WhatsApp-capable contact numbers</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Packs generated</div>
                  <div className="mt-2 text-3xl font-black">{campaigns.length}</div>
                  <div className="mt-1 text-xs text-zinc-500">campaign history in this rotation</div>
                </div>
              </section>

              <section>
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#f6c84c]">Today's featured provider</div>
                    <h3 className="mt-2 text-2xl font-black md:text-3xl">{todayCampaign?.provider_snapshot?.name || (todayProvider ? providerName(todayProvider) : 'Awaiting today’s campaign')}</h3>
                    <p className="mt-1 text-sm text-zinc-400">{todayCampaign?.provider_snapshot?.category || todayProvider?.category || ''}{todayCampaign?.provider_snapshot?.location ? ` • ${todayCampaign.provider_snapshot.location}` : ''}</p>
                  </div>
                  {todayCampaign && todayProvider && (
                    <button onClick={sendViaWhatsApp} className="flex items-center justify-center gap-3 rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-black uppercase tracking-wider text-white shadow-[0_15px_40px_rgba(16,185,129,0.25)] transition hover:-translate-y-1 hover:bg-emerald-400">
                      <MessageCircle className="h-5 w-5" /> Send pack on WhatsApp
                    </button>
                  )}
                </div>

                {todayCampaign ? (
                  <div className="grid gap-5 lg:grid-cols-3">
                    {variants.map((variant) => (
                      <div key={variant.key} className="overflow-hidden rounded-3xl border border-white/10 bg-[#15110c]">
                        <div className={`relative w-full overflow-hidden bg-black ${variant.ratio}`}>
                          <img src={`/api/marketing/assets/${todayCampaign.id}?variant=${variant.key}`} alt={variant.label} className="h-full w-full object-contain" />
                        </div>
                        <div className="flex items-center justify-between p-4">
                          <div>
                            <div className="text-sm font-black">{variant.label}</div>
                            <div className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">PNG • WhatsApp ready</div>
                          </div>
                          <a href={`/api/marketing/assets/${todayCampaign.id}?variant=${variant.key}`} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 p-2 text-zinc-400 hover:border-[#f6c84c]/50 hover:text-[#f6c84c]" aria-label={`Open ${variant.label}`}>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] py-16 text-center text-sm text-zinc-500">The daily automation has not created a campaign yet.</div>
                )}
              </section>

              <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-[#f6c84c]" />
                    <h3 className="text-xl font-black">Upcoming rotation</h3>
                  </div>
                  <div className="space-y-3">
                    {rotation.map((provider, index) => (
                      <div key={provider.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/30 px-4 py-3">
                        <div className="flex items-center gap-4">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#f6c84c]/25 bg-[#f6c84c]/10 text-xs font-black text-[#f6c84c]">{index + 1}</div>
                          <div>
                            <div className="text-sm font-bold">{providerName(provider)}</div>
                            <div className="text-xs text-zinc-500">{provider.category || 'Local professional'} • {provider.location || 'Local area'}</div>
                          </div>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-wider text-zinc-600">Queued</div>
                      </div>
                    ))}
                    {!loading && rotation.length === 0 && <div className="py-8 text-center text-sm text-zinc-500">No eligible providers waiting in the rotation.</div>}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
                  <h3 className="mb-5 text-xl font-black">Recent campaigns</h3>
                  <div className="max-h-[390px] space-y-3 overflow-y-auto pr-1">
                    {campaigns.slice(0, 12).map((campaign) => (
                      <div key={campaign.id} className="rounded-2xl border border-white/5 bg-black/30 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <div className="text-sm font-bold">{campaign.provider_snapshot?.name || `Provider #${campaign.provider_id}`}</div>
                            <div className="mt-1 text-xs text-zinc-500">{campaign.campaign_date}</div>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wider ${campaign.status === 'sent' ? 'bg-emerald-500/15 text-emerald-300' : campaign.status === 'failed' ? 'bg-red-500/15 text-red-300' : 'bg-[#f6c84c]/10 text-[#f6c84c]'}`}>{campaign.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <div className="rounded-2xl border border-[#f6c84c]/20 bg-[#f6c84c]/5 p-5 text-sm leading-relaxed text-zinc-300">
                <strong className="text-[#f6c84c]">Delivery status:</strong> the current SkillsConnect Pro WhatsApp connection opens a prepared WhatsApp message with the three image links. True unattended image delivery requires the WhatsApp Business Cloud API and an approved messaging template; the campaign records already include a delivery-mode field for that upgrade.
              </div>
            </main>
          </div>
        </div>
      )}
    </>
  );
};
