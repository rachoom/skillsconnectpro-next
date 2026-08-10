import { ImageResponse } from 'next/og';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';
import {
  MARKETING_ASSET_VARIANTS,
  type MarketingAssetVariant,
  type MarketingCampaignRow,
} from '@/services/marketing/marketingAssist';
import {
  buildMarketingArtwork,
  type MarketingArtworkProvider,
} from '@/services/marketing/marketingArtwork';

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
    .select('phone, whatsapp, profile_image, image_url, portfolio, portfolio_images, portfolio_urls, proof_of_work, services, years_experience, experience, description, bio, verified, isVerified')
    .eq('id', campaignResult.data.provider_id)
    .maybeSingle();

  const provider = providerResult.data as (MarketingArtworkProvider & {
    phone?: string | null;
    whatsapp?: string | null;
  }) | null;
  const phone = (provider?.whatsapp || provider?.phone || '').trim();
  const origin = `${requestUrl.protocol}//${requestUrl.host}`;
  const artwork = buildMarketingArtwork({
    campaign: campaignResult.data as unknown as MarketingCampaignRow,
    variant,
    origin,
    phone,
    provider,
  });

  return new ImageResponse(artwork.element, {
    width: artwork.width,
    height: artwork.height,
    headers: {
      'Cache-Control': 'public, max-age=120, s-maxage=900, stale-while-revalidate=3600',
      'Content-Disposition': `inline; filename="skillsconnect-pro-${variant}-${campaignId}.png"`,
    },
  });
}
