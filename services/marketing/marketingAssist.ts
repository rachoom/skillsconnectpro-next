import { getSupabaseAdmin } from '../supabaseAdmin';

export const MARKETING_TIMEZONE = 'Africa/Johannesburg';
export const MARKETING_ASSET_VARIANTS = ['poster', 'business_card', 'whatsapp_status'] as const;
export type MarketingAssetVariant = (typeof MARKETING_ASSET_VARIANTS)[number];

type ProviderRow = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  name: string | null;
  category: string | null;
  services: string[] | null;
  location: string | null;
  phone: string | null;
  whatsapp: string | null;
  image_url: string | null;
  profile_image: string | null;
  verified: boolean | null;
  status: string | null;
  approval_status: string | null;
  created_at: string | null;
};

type HistoryRow = {
  provider_id: number;
  campaign_date: string;
  status: string;
};

export type MarketingCampaignRow = {
  id: string;
  campaign_type: 'daily_feature' | 'manual';
  campaign_date: string;
  provider_id: number;
  status: 'queued' | 'ready' | 'sent' | 'failed' | 'skipped';
  delivery_mode: 'whatsapp_link' | 'whatsapp_cloud_api';
  provider_snapshot: {
    id: number;
    name: string;
    firstName: string;
    category: string;
    location: string;
    imageUrl: string | null;
    verified: boolean;
  };
  creative_copy: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    serviceLine: string;
    cta: string;
    brandLine: string;
  };
  asset_variants: MarketingAssetVariant[];
  generated_at: string | null;
  sent_at: string | null;
  created_at: string;
};

const clean = (value: string | null | undefined) => (value ?? '').trim();

export function formatJohannesburgDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-ZA', {
    timeZone: MARKETING_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value ?? '1970';
  const month = parts.find((part) => part.type === 'month')?.value ?? '01';
  const day = parts.find((part) => part.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

function providerName(provider: ProviderRow): string {
  const explicit = clean(provider.name);
  const first = clean(provider.first_name);
  const last = clean(provider.last_name);
  const combined = `${first} ${last}`.trim();

  if (explicit && explicit.toLowerCase() !== first.toLowerCase()) return explicit;
  return combined || explicit || `SkillsConnect Pro Provider #${provider.id}`;
}

function providerCategory(provider: ProviderRow): string {
  if (clean(provider.category)) return clean(provider.category);
  return provider.services?.map(clean).find(Boolean) || 'Local Service Professional';
}

function providerPhone(provider: ProviderRow): string {
  return clean(provider.whatsapp) || clean(provider.phone);
}

function eligible(provider: ProviderRow): boolean {
  const status = clean(provider.status).toLowerCase();
  const approval = clean(provider.approval_status).toLowerCase();
  if (['inactive', 'disabled', 'suspended', 'deleted'].includes(status)) return false;
  if (['rejected', 'declined'].includes(approval)) return false;
  return providerPhone(provider).replace(/\D/g, '').length >= 9;
}

export function selectNextMarketingProvider(providers: ProviderRow[], history: HistoryRow[]): ProviderRow | null {
  const lastFeatured = new Map<number, string>();
  for (const campaign of history) {
    if (campaign.status === 'failed' || campaign.status === 'skipped') continue;
    const previous = lastFeatured.get(campaign.provider_id);
    if (!previous || campaign.campaign_date > previous) lastFeatured.set(campaign.provider_id, campaign.campaign_date);
  }

  const ranked = providers.filter(eligible).sort((left, right) => {
    const leftLast = lastFeatured.get(left.id);
    const rightLast = lastFeatured.get(right.id);
    if (!leftLast && rightLast) return -1;
    if (leftLast && !rightLast) return 1;
    if (leftLast && rightLast && leftLast !== rightLast) return leftLast.localeCompare(rightLast);
    return (clean(left.created_at) || String(left.id)).localeCompare(clean(right.created_at) || String(right.id));
  });
  return ranked[0] ?? null;
}

function creativeCopy(provider: ProviderRow) {
  const category = providerCategory(provider);
  const key = category.toLowerCase();
  let subheadline = 'Trusted local service. Professional results.';
  if (key.includes('electric')) subheadline = 'Safe, dependable electrical work from a local professional.';
  else if (key.includes('plumb')) subheadline = 'Reliable plumbing help for homes and businesses.';
  else if (key.includes('build')) subheadline = 'Build it right with a skilled local professional.';
  else if (key.includes('clean')) subheadline = 'A cleaner space starts with a trusted local professional.';
  else if (key.includes('mechan')) subheadline = 'Keep moving with dependable local mechanical expertise.';
  else if (key.includes('paint')) subheadline = 'Fresh finishes and careful workmanship for your space.';
  else if (key.includes('carpent')) subheadline = 'Craftsmanship that brings practical ideas to life.';
  else if (key.includes('cater')) subheadline = 'Professional local catering for memorable occasions.';
  else if (key.includes('beaut') || key.includes('hair')) subheadline = 'Local beauty expertise designed around you.';
  else if (key.includes('garden') || key.includes('landscap')) subheadline = 'Professional care for greener, better outdoor spaces.';

  return {
    eyebrow: "TODAY'S FEATURED LOCAL PROFESSIONAL",
    headline: providerName(provider),
    subheadline,
    serviceLine: `${category} • ${clean(provider.location) || 'Local service area'}`,
    cta: 'Save this contact • Share with someone who needs the service',
    brandLine: 'Professionally promoted by SkillsConnect Pro',
  };
}

function snapshot(provider: ProviderRow) {
  const name = providerName(provider);
  return {
    id: provider.id,
    name,
    firstName: clean(provider.first_name) || name.split(/\s+/)[0] || 'there',
    category: providerCategory(provider),
    location: clean(provider.location) || 'Local service area',
    imageUrl: clean(provider.image_url) || clean(provider.profile_image) || null,
    verified: provider.verified === true,
  };
}

export function getMarketingAssetPath(campaignId: string, variant: MarketingAssetVariant): string {
  return `/api/marketing/assets/${encodeURIComponent(campaignId)}?variant=${variant}`;
}

export async function ensureDailyMarketingCampaign(now = new Date()): Promise<{ campaign: MarketingCampaignRow; created: boolean }> {
  const supabase = getSupabaseAdmin();
  const campaignDate = formatJohannesburgDate(now);
  const columns = 'id, campaign_type, campaign_date, provider_id, status, delivery_mode, provider_snapshot, creative_copy, asset_variants, generated_at, sent_at, created_at';

  const existing = await supabase.from('marketing_campaigns').select(columns)
    .eq('campaign_type', 'daily_feature').eq('campaign_date', campaignDate).maybeSingle();
  if (existing.error) throw new Error(`Unable to check today's marketing campaign: ${existing.error.message}`);
  if (existing.data) return { campaign: existing.data as unknown as MarketingCampaignRow, created: false };

  const [providersResult, historyResult] = await Promise.all([
    supabase.from('artisans').select('id, first_name, last_name, name, category, services, location, phone, whatsapp, image_url, profile_image, verified, status, approval_status, created_at').order('id'),
    supabase.from('marketing_campaigns').select('provider_id, campaign_date, status').order('campaign_date'),
  ]);
  if (providersResult.error) throw new Error(`Unable to load providers: ${providersResult.error.message}`);
  if (historyResult.error) throw new Error(`Unable to load marketing history: ${historyResult.error.message}`);

  const provider = selectNextMarketingProvider(
    (providersResult.data ?? []) as ProviderRow[],
    (historyResult.data ?? []) as HistoryRow[],
  );
  if (!provider) throw new Error('No eligible provider with a WhatsApp-capable phone number is available.');

  const inserted = await supabase.from('marketing_campaigns').insert({
    campaign_type: 'daily_feature',
    campaign_date: campaignDate,
    provider_id: provider.id,
    status: 'ready',
    delivery_mode: 'whatsapp_link',
    provider_snapshot: snapshot(provider),
    creative_copy: creativeCopy(provider),
    asset_variants: [...MARKETING_ASSET_VARIANTS],
    generated_at: now.toISOString(),
  }).select(columns).single();

  if (inserted.error || !inserted.data) throw new Error(`Unable to create today's campaign: ${inserted.error?.message ?? 'Unknown database error.'}`);
  return { campaign: inserted.data as unknown as MarketingCampaignRow, created: true };
}
