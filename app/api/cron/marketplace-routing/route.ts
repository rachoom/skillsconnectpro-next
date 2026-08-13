import { NextResponse } from 'next/server';
import { processAutomaticRouting } from '@/services/marketplace/automaticRouting';
import { processCompletionTimeouts } from '@/services/marketplace/completionAutomation';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';
import { hashOpaqueToken, safeTokenEquals } from '@/services/marketplace/tokens';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ROUTING_BATCH_LIMIT = 25;
const OPEN_PROJECT_STATUSES = [
  'assessment_complete',
  'matching',
  'responses_received',
];

function bearerToken(request: Request): string {
  const authorization = request.headers.get('authorization') || '';
  return authorization.toLowerCase().startsWith('bearer ')
    ? authorization.slice(7).trim()
    : '';
}

async function isAuthorised(request: Request): Promise<boolean> {
  const suppliedToken = bearerToken(request);
  if (suppliedToken.length < 20) return false;

  const environmentSecret = process.env.CRON_SECRET;
  if (environmentSecret && safeTokenEquals(hashOpaqueToken(environmentSecret), suppliedToken)) {
    return true;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('marketplace_cron_credentials')
    .select('id')
    .eq('id', 'marketplace-routing')
    .eq('token_hash', hashOpaqueToken(suppliedToken))
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to verify scheduled marketplace access: ${error.message}`);
  }

  return Boolean(data);
}

async function startRun(): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('marketplace_backend_runs')
    .insert({
      job_name: 'marketplace-routing',
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Scheduled marketplace run could not be recorded:', error.message);
    return null;
  }

  return data.id;
}

async function finishRun(input: {
  runId: string | null;
  status: 'completed' | 'failed';
  projectsProcessed?: number;
  projectsFailed?: number;
  invitationsQueued?: number;
  projectsAutoCompleted?: number;
  errorMessage?: string | null;
}) {
  if (!input.runId) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('marketplace_backend_runs')
    .update({
      status: input.status,
      completed_at: new Date().toISOString(),
      projects_processed: input.projectsProcessed ?? 0,
      projects_failed: input.projectsFailed ?? 0,
      invitations_queued: input.invitationsQueued ?? 0,
      projects_auto_completed: input.projectsAutoCompleted ?? 0,
      error_message: input.errorMessage ?? null,
    })
    .eq('id', input.runId);

  if (error) {
    console.error('Scheduled marketplace run result could not be recorded:', error.message);
  }
}

export async function GET(request: Request) {
  try {
    if (!(await isAuthorised(request))) {
      return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });
    }
  } catch (error) {
    console.error('Scheduled marketplace authentication failed:', error);
    return NextResponse.json(
      { error: 'Scheduled marketplace authentication is unavailable.' },
      { status: 503 },
    );
  }

  const runId = await startRun();

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

    const invitationsQueued = summaries.reduce(
      (total, summary) => total + summary.invitationsQueued,
      0,
    );

    await finishRun({
      runId,
      status: failures.length > 0 ? 'failed' : 'completed',
      projectsProcessed: summaries.length,
      projectsFailed: failures.length,
      invitationsQueued,
      projectsAutoCompleted: completionTimeouts.completed,
      errorMessage: failures.length > 0
        ? `${failures.length} project routing operation(s) failed.`
        : null,
    });

    return NextResponse.json({
      completionTimeouts,
      routing: {
        processed: summaries.length,
        failed: failures.length,
        invitationsQueued,
        summaries,
        failures,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Scheduled marketplace processing failed.';
    console.error('Scheduled marketplace processing failed:', error);
    await finishRun({ runId, status: 'failed', errorMessage: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
