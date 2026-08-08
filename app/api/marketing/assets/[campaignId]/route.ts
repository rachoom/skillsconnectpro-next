import { ImageResponse } from 'next/og';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';
import {
  MARKETING_ASSET_VARIANTS,
  type MarketingAssetVariant,
  type MarketingCampaignRow,
} from '@/services/marketing/marketingAssist';
import { buildMarketingArtwork } from '@/services/marketing/marketingArtwork';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isVariant(value: string | null): value is MarketingAssetVariant {
  return Boolean(value && MARKETING_ASSET_VARIANTS.includes(value as MarketingAssetVariant));
}

export async function GET(
  request: Request,
  context: { params: Promise<{ campaignId: string }> },
) {
  const { campaignId } = await context.params;
  const requestUrl = new URL(request.url);
  const variantParam = requestUrl.searchParams.get('variant');
  const variant: MarketingAssetVariant = isVariant(variantParam) ? variantParam : 'poster';
  const supabase = getSupabaseAdmin();

  const campaignResult = await supabase
    .from('marketing_campaigns')
    .select('id, campaign_type, campaign_date, provider_id, status, delivery_mode, provider_snapshot, creative_copy, asset_variants, generated_at, sent_at, created_at')
    .eq('id', campaignId)
    .single();

  if (campaignResult.error || !campaignResult.data) {
    return new Response('Marketing campaign not found.', { status: 404 });
  }

  const providerResult = await supabase
    .from('artisans')
    .select('phone, whatsapp')
    .eq('id', campaignResult.data.provider_id)
    .maybeSingle();

  const provider = providerResult.data as { phone?: string | null; whatsapp?: string | null } | null;
  const phone = (provider?.whatsapp || provider?.phone || '').trim();
  const origin = `${requestUrl.protocol}//${requestUrl.host}`;
  const artwork = buildMarketingArtwork({
    campaign: campaignResult.data as unknown as MarketingCampaignRow,
    variant,
    origin,
    phone,
  });

  return new ImageResponse(artwork.element, {
    width: artwork.width,
    height: artwork.height,
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
      'Content-Disposition': `inline; filename="skillsconnect-pro-${variant}-${campaignId}.png"`,
    },
  });
}
