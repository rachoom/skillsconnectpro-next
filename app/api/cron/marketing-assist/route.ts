import { NextResponse } from 'next/server';
import { ensureDailyMarketingCampaign } from '@/services/marketing/marketingAssist';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get('authorization') === `Bearer ${secret}`);
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json(
      { error: process.env.CRON_SECRET ? 'Unauthorised.' : 'CRON_SECRET is not configured.' },
      { status: process.env.CRON_SECRET ? 401 : 503 },
    );
  }

  try {
    const result = await ensureDailyMarketingCampaign();
    return NextResponse.json({
      ok: true,
      created: result.created,
      campaignId: result.campaign.id,
      campaignDate: result.campaign.campaign_date,
      providerId: result.campaign.provider_id,
      status: result.campaign.status,
      deliveryMode: result.campaign.delivery_mode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Daily marketing automation failed.';
    console.error('Daily marketing automation failed:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
