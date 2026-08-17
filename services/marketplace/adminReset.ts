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

async function countRows(
  table: string,
  configure?: (query: ReturnType<ReturnType<typeof getSupabaseAdmin>['from']> extends infer T ? T : never) => unknown,
): Promise<number> {
  const supabase = getSupabaseAdmin();
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  if (configure) query = configure(query) as typeof query;
  const { count, error } = await query;
  if (error) throw new Error(`Unable to count ${table}: ${error.message}`);
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
    countRows('projects'),
    countRows('lead_invitations', (query) => query.eq('status', 'queued').is('sent_at', null)),
    countRows('marketplace_backend_runs'),
  ]);

  // Delivery attempts depend on invitations, and invitations depend on projects.
  // Deleting projects cascades through the active customer/provider workflow chain:
  // project_media, lead_invitations, provider_responses, project_matches,
  // status events, reviews, complaints, and delivery attempts.
  const { error: projectDeleteError } = await supabase
    .from('projects')
    .delete()
    .gte('created_at', DELETE_ALL_CREATED_AFTER);

  if (projectDeleteError) {
    throw new Error(`Unable to reset projects: ${projectDeleteError.message}`);
  }

  await deleteRows('marketplace_backend_runs');

  const [projectsAfter, pendingDispatchAfter, backendRunsAfter] = await Promise.all([
    countRows('projects'),
    countRows('lead_invitations', (query) => query.eq('status', 'queued').is('sent_at', null)),
    countRows('marketplace_backend_runs'),
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
