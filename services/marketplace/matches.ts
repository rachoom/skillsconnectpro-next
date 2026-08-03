import { getSupabaseAdmin } from '../supabaseAdmin';
import { getProjectByAccessToken } from './projects';

export async function selectProviderForProject(input: {
  projectId: string;
  projectAccessToken: string;
  providerResponseId: string;
}) {
  const project = await getProjectByAccessToken(input.projectId, input.projectAccessToken);
  if (!project) throw new Error('Project not found.');

  if (['completed', 'cancelled', 'unfulfilled'].includes(project.status)) {
    throw new Error(`A provider cannot be selected while the project is ${project.status}.`);
  }

  const supabase = getSupabaseAdmin();
  const { data: responseData, error: responseError } = await supabase
    .from('provider_responses')
    .select('id, project_id, provider_id, response_type')
    .eq('id', input.providerResponseId)
    .eq('project_id', input.projectId)
    .single();

  if (responseError) throw new Error(`Unable to load provider response: ${responseError.message}`);
  if (!responseData) throw new Error('Provider response not found.');
  if (responseData.response_type === 'declined') {
    throw new Error('A declined provider response cannot be selected.');
  }

  const { data: existingMatch, error: existingMatchError } = await supabase
    .from('project_matches')
    .select('id, provider_id, provider_response_id, status, contact_released_at')
    .eq('project_id', input.projectId)
    .maybeSingle();

  if (existingMatchError) {
    throw new Error(`Unable to check current project match: ${existingMatchError.message}`);
  }

  if (existingMatch?.contact_released_at) {
    throw new Error('This project has already released contact details to a selected provider.');
  }

  const selectedAt = new Date().toISOString();
  const { data: matchData, error: matchError } = await supabase
    .from('project_matches')
    .upsert(
      {
        project_id: input.projectId,
        provider_id: responseData.provider_id,
        provider_response_id: responseData.id,
        status: 'selected',
        selected_at: selectedAt,
      },
      { onConflict: 'project_id' },
    )
    .select(
      'id, project_id, provider_id, provider_response_id, status, selected_at, contact_released_at',
    )
    .single();

  if (matchError) throw new Error(`Unable to select provider: ${matchError.message}`);
  if (!matchData) throw new Error('Unable to select provider: no match returned.');

  const { error: projectUpdateError } = await supabase
    .from('projects')
    .update({ status: 'provider_selected' })
    .eq('id', input.projectId);

  if (projectUpdateError) {
    throw new Error(`Provider selected but project status update failed: ${projectUpdateError.message}`);
  }

  const { error: eventError } = await supabase.from('project_status_events').insert({
    project_id: input.projectId,
    event_type: 'provider_selected',
    actor_type: 'customer',
    actor_id: project.customerId,
    message: 'The customer selected a provider response.',
    event_data: {
      matchId: matchData.id,
      providerId: matchData.provider_id,
      providerResponseId: matchData.provider_response_id,
    },
  });

  if (eventError) {
    console.error('Provider selected but timeline event failed:', eventError.message);
  }

  return {
    id: matchData.id,
    projectId: matchData.project_id,
    providerId: matchData.provider_id,
    providerResponseId: matchData.provider_response_id,
    status: matchData.status,
    selectedAt: matchData.selected_at,
    contactReleasedAt: matchData.contact_released_at,
  };
}
