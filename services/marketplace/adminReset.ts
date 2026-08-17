import { getSupabaseAdmin } from '../supabaseAdmin';

const DELETE_ALL_CREATED_AFTER = '1900-01-01T00:00:00.000Z';

export interface MarketplaceResetResult {
  projectsBefore: number;
  pendingDispatchBefore: number;
  backendRunsBefore: number;
  projectsAfter: number;
  pendingDispatchAfter: number;
  backendRunsAfter: number;
}

async function countTableRows(table: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true });

  if (error) throw new Error(`Unable to count ${table}: ${error.message}`);
  return count ?? 0;
}

async function countPendingDispatchRows(): Promise<number> {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from('lead_invitations')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'queued')
    .is('sent_at', null);

  if (error) throw new Error(`Unable to count pending dispatch rows: ${error.message}`);
  return count ?? 0;
}

async function deleteRows(table: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from(table)
    .delete()
    .gte('created_at', DELETE_ALL_CREATED_AFTER);

  if (error) throw new Error(`Unable to reset ${table}: ${error.message}`);
}

export async function resetMarketplaceTestData(): Promise<MarketplaceResetResult> {
  const supabase = getSupabaseAdmin();

  const [projectsBefore, pendingDispatchBefore, backendRunsBefore] = await Promise.all([
    countTableRows('projects'),
    countPendingDispatchRows(),
    countTableRows('marketplace_backend_runs'),
  ]);

  // Deleting projects cascades through the active customer/provider workflow chain:
  // project_media, lead_invitations, provider_responses, project_matches,
  // status events, reviews, complaints, and invitation delivery attempts.
  const { error: projectDeleteError } = await supabase
    .from('projects')
    .delete()
    .gte('created_at', DELETE_ALL_CREATED_AFTER);

  if (projectDeleteError) {
    throw new Error(`Unable to reset projects: ${projectDeleteError.message}`);
  }

  // Clear backend run history so the pilot dashboard starts clean for the next test.
  await deleteRows('marketplace_backend_runs');

  const [projectsAfter, pendingDispatchAfter, backendRunsAfter] = await Promise.all([
    countTableRows('projects'),
    countPendingDispatchRows(),
    countTableRows('marketplace_backend_runs'),
  ]);

  return {
    projectsBefore,
    pendingDispatchBefore,
    backendRunsBefore,
    projectsAfter,
    pendingDispatchAfter,
    backendRunsAfter,
  };
}
