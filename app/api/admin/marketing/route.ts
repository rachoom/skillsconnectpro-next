import { NextResponse } from 'next/server';
import { requireMarketplaceAdmin } from '@/services/marketplace/adminAuth';
import { ensureDailyMarketingCampaign } from '@/services/marketing/marketingAssist';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CAMPAIGN_COLUMNS = [
  'id',
  'campaign_date',
  'provider_id',
  'status',
  'delivery_mode',
  'provider_snapshot',
  'generated_at',
  'sent_at',
].join(', ');

const PROVIDER_COLUMNS = [
  'id',
  'first_name',
  'last_name',
  'name',
  'category',
  'location',
  'phone',
  'whatsapp',
  'status',
  'approval_status',
  'created_at',
].join(', ');

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unable to load Marketing Assist.';
  const unauthorised = error instanceof Error && error.name === 'UnauthorisedError';
  const configurationError = message.includes('MARKETPLACE_ADMIN_API_KEY') || message.includes('SUPABASE_');

  console.error('Marketing Assist admin API failed:', error);

  return NextResponse.json(
    {
      error: unauthorised
        ? 'Unauthorised.'
        : configurationError
          ? 'Marketplace service is not configured.'
          : message,
    },
    { status: unauthorised ? 401 : configurationError ? 503 : 400 },
  );
}

export async function GET(request: Request) {
  try {
    requireMarketplaceAdmin(request);
    const supabase = getSupabaseAdmin();

    const [campaignResult, providerResult] = await Promise.all([
      supabase
        .from('marketing_campaigns')
        .select(CAMPAIGN_COLUMNS)
        .order('campaign_date', { ascending: false })
        .limit(90),
      supabase
        .from('artisans')
        .select(PROVIDER_COLUMNS)
        .order('id', { ascending: true }),
    ]);

    if (campaignResult.error) {
      throw new Error(`Unable to load marketing campaigns: ${campaignResult.error.message}`);
    }
    if (providerResult.error) {
      throw new Error(`Unable to load providers: ${providerResult.error.message}`);
    }

    return NextResponse.json({
      campaigns: campaignResult.data ?? [],
      providers: providerResult.data ?? [],
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    requireMarketplaceAdmin(request);
    const result = await ensureDailyMarketingCampaign();
    return NextResponse.json({
      campaign: result.campaign,
      created: result.created,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
