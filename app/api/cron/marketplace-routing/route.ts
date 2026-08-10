import { NextResponse } from 'next/server';
import { processAutomaticRouting } from '@/services/marketplace/automaticRouting';
import { processCompletionTimeouts } from '@/services/marketplace/completionAutomation';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ROUTING_BATCH_LIMIT = 25;
const OPEN_PROJECT_STATUSES = [
  'assessment_complete',
  'matching',
  'responses_received',
];

function isAuthorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json(
      { error: process.env.CRON_SECRET ? 'Unauthorised.' : 'CRON_SECRET is not configured.' },
      { status: process.env.CRON_SECRET ? 401 : 503 },
    );
  }

  try {
    const completionTimeouts = await processCompletionTimeouts();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('consent_to_share', true)
      .in('status', OPEN_PROJECT_STATUSES)
      .order('response_target_at', { ascending: true, nullsFirst: false })
      .limit(ROUTING_BATCH_LIMIT);

    if (error) {
      throw new Error(`Unable to load projects for scheduled routing: ${error.message}`);
    }

    const summaries: Array<{
      projectId: string;
      action: string;
      invitationsQueued: number;
      totalInvitations: number;
      validResponses: number;
      reason: string;
    }> = [];
    const failures: Array<{ projectId: string; error: string }> = [];

    for (const row of data ?? []) {
      try {
        const routing = await processAutomaticRouting({ projectId: row.id });
        summaries.push({
          projectId: routing.projectId,
          action: routing.action,
          invitationsQueued: routing.invitationsQueued,
          totalInvitations: routing.totalInvitations,
          validResponses: routing.validResponses,
          reason: routing.reason,
        });
      } catch (routingError) {
        failures.push({
          projectId: row.id,
          error: routingError instanceof Error ? routingError.message : 'Unknown routing error.',
        });
      }
    }

    return NextResponse.json({
      completionTimeouts,
      routing: {
        processed: summaries.length,
        failed: failures.length,
        summaries,
        failures,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Scheduled marketplace processing failed.';
    console.error('Scheduled marketplace processing failed:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
