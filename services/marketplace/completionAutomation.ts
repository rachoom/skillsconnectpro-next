import { getSupabaseAdmin } from '../supabaseAdmin';
import {
  isCustomerCompletionConfirmation,
  isProviderCompletionReport,
  isSystemAutoCompletion,
} from './completionPolicy.js';

const DEFAULT_GRACE_HOURS = 72;
const DEFAULT_BATCH_LIMIT = 50;

const ACTIVE_COMPLAINT_STATUSES = ['open', 'in_review'];

type CompletionMatchRow = {
  id: string;
  project_id: string;
  provider_id: number;
  status: string;
  completion_reported_at: string;
};

type CompletionEventRow = {
  event_type: string;
  actor_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
};

export type CompletionTimeoutSummary = {
  graceHours: number;
  checked: number;
  completed: number;
  skipped: number;
  failures: Array<{ projectId: string; error: string }>;
};

export function getCompletionGraceHours(): number {
  const configured = Number(process.env.MARKETPLACE_COMPLETION_GRACE_HOURS);
  if (!Number.isFinite(configured)) return DEFAULT_GRACE_HOURS;
  return Math.min(720, Math.max(1, Math.round(configured)));
}

export function completionConfirmationDueAt(
  completionReportedAt: string | null,
  graceHours = getCompletionGraceHours(),
): string | null {
  if (!completionReportedAt) return null;
  const reportedAt = new Date(completionReportedAt);
  if (!Number.isFinite(reportedAt.getTime())) return null;
  return new Date(reportedAt.getTime() + graceHours * 60 * 60 * 1000).toISOString();
}

async function latestEvent(
  projectId: string,
  eventType: string,
): Promise<CompletionEventRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('project_status_events')
    .select('event_type, actor_type, event_data, created_at')
    .eq('project_id', projectId)
    .eq('event_type', eventType)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Unable to load ${eventType} event: ${error.message}`);
  return (data as CompletionEventRow | null) ?? null;
}

async function activeComplaintExists(projectId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('marketplace_complaints')
    .select('id')
    .eq('project_id', projectId)
    .in('status', ACTIVE_COMPLAINT_STATUSES)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Unable to check support cases: ${error.message}`);
  return Boolean(data);
}

async function closeTimedOutCompletion(
  match: CompletionMatchRow,
  graceHours: number,
): Promise<'completed' | 'skipped'> {
  const supabase = getSupabaseAdmin();
  const [projectResult, providerEvent, customerEvent, autoEvent, complaintOpen] = await Promise.all([
    supabase
      .from('projects')
      .select('id, status')
      .eq('id', match.project_id)
      .maybeSingle(),
    latestEvent(match.project_id, 'completion_reported'),
    latestEvent(match.project_id, 'project_completed'),
    latestEvent(match.project_id, 'project_auto_completed'),
    activeComplaintExists(match.project_id),
  ]);

  if (projectResult.error) {
    throw new Error(`Unable to load project: ${projectResult.error.message}`);
  }

  const project = projectResult.data as { id: string; status: string } | null;
  if (!project || project.status !== 'in_progress' || match.status !== 'in_progress') {
    return 'skipped';
  }

  if (!isProviderCompletionReport(providerEvent)) return 'skipped';
  if (isCustomerCompletionConfirmation(customerEvent)) return 'skipped';
  if (isSystemAutoCompletion(autoEvent)) return 'skipped';
  if (complaintOpen) return 'skipped';

  const issueEvent = await Promise.all([
    latestEvent(match.project_id, 'customer_issue_reported'),
    latestEvent(match.project_id, 'provider_issue_reported'),
  ]);
  if (issueEvent.some(Boolean)) return 'skipped';

  const { data: updatedProject, error: projectUpdateError } = await supabase
    .from('projects')
    .update({ status: 'completed' })
    .eq('id', match.project_id)
    .eq('status', 'in_progress')
    .select('id')
    .maybeSingle();

  if (projectUpdateError) {
    throw new Error(`Unable to automatically close project: ${projectUpdateError.message}`);
  }
  if (!updatedProject) return 'skipped';

  const { data: updatedMatch, error: matchUpdateError } = await supabase
    .from('project_matches')
    .update({ status: 'completed' })
    .eq('id', match.id)
    .eq('status', 'in_progress')
    .select('id')
    .maybeSingle();

  if (matchUpdateError || !updatedMatch) {
    await supabase
      .from('projects')
      .update({ status: 'in_progress' })
      .eq('id', match.project_id)
      .eq('status', 'completed');
    throw new Error(
      `Unable to automatically close selected-provider record: ${matchUpdateError?.message ?? 'Record changed during processing.'}`,
    );
  }

  const { error: eventError } = await supabase.from('project_status_events').insert({
    project_id: match.project_id,
    event_type: 'project_auto_completed',
    actor_type: 'system',
    actor_id: null,
    message: `The project was automatically closed ${graceHours} hours after the provider reported completion because no customer response or support case was received.`,
    event_data: {
      action: 'auto_complete_after_timeout',
      graceHours,
      providerId: match.provider_id,
      completionReportedAt: match.completion_reported_at,
    },
  });

  if (eventError) {
    await Promise.all([
      supabase
        .from('projects')
        .update({ status: 'in_progress' })
        .eq('id', match.project_id)
        .eq('status', 'completed'),
      supabase
        .from('project_matches')
        .update({ status: 'in_progress' })
        .eq('id', match.id)
        .eq('status', 'completed'),
    ]);
    throw new Error(`Unable to record automatic completion: ${eventError.message}`);
  }

  return 'completed';
}

export async function processCompletionTimeouts(input?: {
  now?: Date;
  batchLimit?: number;
}): Promise<CompletionTimeoutSummary> {
  const supabase = getSupabaseAdmin();
  const graceHours = getCompletionGraceHours();
  const now = input?.now ?? new Date();
  const cutoff = new Date(now.getTime() - graceHours * 60 * 60 * 1000).toISOString();
  const batchLimit = Math.min(100, Math.max(1, input?.batchLimit ?? DEFAULT_BATCH_LIMIT));

  const { data, error } = await supabase
    .from('project_matches')
    .select('id, project_id, provider_id, status, completion_reported_at')
    .eq('status', 'in_progress')
    .not('completion_reported_at', 'is', null)
    .lte('completion_reported_at', cutoff)
    .order('completion_reported_at', { ascending: true })
    .limit(batchLimit);

  if (error) {
    throw new Error(`Unable to load completion reports awaiting confirmation: ${error.message}`);
  }

  const matches = (data ?? []) as CompletionMatchRow[];
  let completed = 0;
  let skipped = 0;
  const failures: Array<{ projectId: string; error: string }> = [];

  for (const match of matches) {
    try {
      const result = await closeTimedOutCompletion(match, graceHours);
      if (result === 'completed') completed += 1;
      else skipped += 1;
    } catch (error) {
      failures.push({
        projectId: match.project_id,
        error: error instanceof Error ? error.message : 'Unknown completion timeout error.',
      });
    }
  }

  return {
    graceHours,
    checked: matches.length,
    completed,
    skipped,
    failures,
  };
}
