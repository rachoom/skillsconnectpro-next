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
  'verified',
  'isVerified',
  'image_url',
  'profile_image',
  'portfolio',
  'portfolio_images',
  'portfolio_urls',
  'proof_of_work',
  'status',
  'approval_status',
  'created_at',
].join(', ');

const QUEUE_COLUMNS = 'provider_id, queue_state, priority_rank, updated_at';

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

    const [campaignResult, providerResult, queueResult] = await Promise.all([
      supabase
        .from('marketing_campaigns')
        .select(CAMPAIGN_COLUMNS)
        .order('campaign_date', { ascending: false })
        .limit(90),
      supabase
        .from('artisans')
        .select(PROVIDER_COLUMNS)
        .order('id', { ascending: true }),
      supabase
        .from('marketing_provider_queue_overrides')
        .select(QUEUE_COLUMNS)
        .order('priority_rank', { ascending: true, nullsFirst: false }),
    ]);

    if (campaignResult.error) {
      throw new Error(`Unable to load marketing campaigns: ${campaignResult.error.message}`);
    }
    if (providerResult.error) {
      throw new Error(`Unable to load providers: ${providerResult.error.message}`);
    }
    if (queueResult.error) {
      throw new Error(`Unable to load marketing queue preferences: ${queueResult.error.message}`);
    }

    return NextResponse.json({
      campaigns: campaignResult.data ?? [],
      providers: providerResult.data ?? [],
      queueOverrides: queueResult.data ?? [],
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

export async function PATCH(request: Request) {
  try {
    requireMarketplaceAdmin(request);
    const payload = await request.json().catch(() => ({}));
    const providerId = Number(payload.providerId);
    const action = typeof payload.action === 'string' ? payload.action : '';

    if (!Number.isInteger(providerId) || providerId <= 0) {
      return NextResponse.json({ error: 'Choose a valid provider.' }, { status: 400 });
    }
    if (!['make_next', 'prioritize', 'skip', 'restore'].includes(action)) {
      return NextResponse.json({ error: 'Choose a valid queue action.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const providerResult = await supabase.from('artisans').select('id').eq('id', providerId).maybeSingle();
    if (providerResult.error) throw new Error(`Unable to verify provider: ${providerResult.error.message}`);
    if (!providerResult.data) return NextResponse.json({ error: 'Provider not found.' }, { status: 404 });

    if (action === 'restore') {
      const deleted = await supabase.from('marketing_provider_queue_overrides').delete().eq('provider_id', providerId);
      if (deleted.error) throw new Error(`Unable to restore provider: ${deleted.error.message}`);
      return NextResponse.json({ ok: true, providerId, state: 'automatic' });
    }

    if (action === 'skip') {
      const skipped = await supabase.from('marketing_provider_queue_overrides').upsert({
        provider_id: providerId,
        queue_state: 'skipped',
        priority_rank: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'provider_id' });
      if (skipped.error) throw new Error(`Unable to skip provider: ${skipped.error.message}`);
      return NextResponse.json({ ok: true, providerId, state: 'skipped' });
    }

    const rankResult = await supabase
      .from('marketing_provider_queue_overrides')
      .select('priority_rank')
      .eq('queue_state', 'priority')
      .not('priority_rank', 'is', null)
      .order('priority_rank', { ascending: action === 'make_next' })
      .limit(1)
      .maybeSingle();
    if (rankResult.error) throw new Error(`Unable to inspect priority queue: ${rankResult.error.message}`);

    const currentRank = Number(rankResult.data?.priority_rank ?? 0);
    const priorityRank = action === 'make_next'
      ? (currentRank || 1000) - 1
      : (currentRank || 0) + 1;

    const prioritized = await supabase.from('marketing_provider_queue_overrides').upsert({
      provider_id: providerId,
      queue_state: 'priority',
      priority_rank: priorityRank,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'provider_id' });
    if (prioritized.error) throw new Error(`Unable to prioritise provider: ${prioritized.error.message}`);

    return NextResponse.json({
      ok: true,
      providerId,
      state: 'priority',
      priorityRank,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
