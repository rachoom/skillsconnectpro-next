import { getSupabaseAdmin } from '../supabaseAdmin';
import { getProjectByAccessToken } from './projects';
import { getProviderOpportunity } from './providerResponses';

export type LifecycleActor = 'customer' | 'provider';
export type LifecycleAction =
  | 'start_work'
  | 'report_completion'
  | 'confirm_completion'
  | 'cancel_project'
  | 'report_issue';

type MatchRow = {
  id: string;
  project_id: string;
  provider_id: number;
  status: string;
  contact_released_at: string | null;
  completion_reported_at: string | null;
  final_price: number | null;
  final_price_currency: string;
};

type ProjectRow = {
  id: string;
  status: string;
  title: string;
  guest_name: string | null;
};

type StatusEventRow = {
  actor_type: string;
  actor_id: string | null;
  message: string | null;
  event_data: Record<string, unknown> | null;
  created_at: string;
};

export type MarketplaceLifecycleState = {
  projectId: string;
  projectTitle: string;
  projectStatus: string;
  matchStatus: string;
  actorType: LifecycleActor;
  providerId: number;
  providerName: string;
  customerName: string;
  contactReleased: boolean;
  completionReportedAt: string | null;
  completionReportedBy: string | null;
  completionNote: string | null;
  issueReportedAt: string | null;
  issueReportedBy: string | null;
  issueNote: string | null;
  finalPrice: number | null;
  finalPriceCurrency: string;
};

function displayProviderName(provider: {
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
} | null): string {
  if (!provider) return 'Selected provider';
  const businessName = provider.name?.trim();
  if (businessName) return businessName;
  const personalName = `${provider.first_name ?? ''} ${provider.last_name ?? ''}`.trim();
  return personalName || 'Selected provider';
}

function snapshotProviderName(snapshot: Record<string, unknown>): string {
  const name = typeof snapshot.name === 'string' ? snapshot.name.trim() : '';
  if (name) return name;
  const firstName = typeof snapshot.first_name === 'string' ? snapshot.first_name : '';
  const lastName = typeof snapshot.last_name === 'string' ? snapshot.last_name : '';
  return `${firstName} ${lastName}`.trim() || 'Selected provider';
}

async function loadMatch(projectId: string): Promise<MatchRow> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('project_matches')
    .select(
      'id, project_id, provider_id, status, contact_released_at, completion_reported_at, final_price, final_price_currency',
    )
    .eq('project_id', projectId)
    .maybeSingle();

  if (error) throw new Error(`Unable to load the selected provider record: ${error.message}`);
  if (!data) throw new Error('A selected provider is required before the job can be updated.');
  return data as MatchRow;
}

async function latestEvent(projectId: string, eventTypes: string[]): Promise<StatusEventRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('project_status_events')
    .select('actor_type, actor_id, message, event_data, created_at')
    .eq('project_id', projectId)
    .in('event_type', eventTypes)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Unable to load project activity: ${error.message}`);
  return (data as StatusEventRow | null) ?? null;
}

async function buildLifecycleState(input: {
  project: ProjectRow;
  match: MatchRow;
  actorType: LifecycleActor;
  providerName?: string;
}): Promise<MarketplaceLifecycleState> {
  const supabase = getSupabaseAdmin();
  let providerName = input.providerName;

  if (!providerName) {
    const { data, error } = await supabase
      .from('artisans')
      .select('name, first_name, last_name')
      .eq('id', input.match.provider_id)
      .maybeSingle();

    if (error) throw new Error(`Unable to load provider details: ${error.message}`);
    providerName = displayProviderName(data);
  }

  const [completionEvent, issueEvent] = await Promise.all([
    latestEvent(input.project.id, ['completion_reported', 'project_completed']),
    latestEvent(input.project.id, ['customer_issue_reported', 'provider_issue_reported']),
  ]);

  return {
    projectId: input.project.id,
    projectTitle: input.project.title,
    projectStatus: input.project.status,
    matchStatus: input.match.status,
    actorType: input.actorType,
    providerId: input.match.provider_id,
    providerName,
    customerName: input.project.guest_name?.trim() || 'Customer',
    contactReleased: Boolean(input.match.contact_released_at),
    completionReportedAt: input.match.completion_reported_at,
    completionReportedBy: completionEvent?.actor_type ?? null,
    completionNote:
      typeof completionEvent?.event_data?.note === 'string'
        ? completionEvent.event_data.note
        : completionEvent?.message ?? null,
    issueReportedAt: issueEvent?.created_at ?? null,
    issueReportedBy: issueEvent?.actor_type ?? null,
    issueNote:
      typeof issueEvent?.event_data?.note === 'string'
        ? issueEvent.event_data.note
        : issueEvent?.message ?? null,
    finalPrice: input.match.final_price,
    finalPriceCurrency: input.match.final_price_currency || 'ZAR',
  };
}

export async function getCustomerLifecycleState(projectId: string, accessToken: string) {
  const project = await getProjectByAccessToken(projectId, accessToken);
  if (!project) throw new Error('Project not found.');

  const match = await loadMatch(projectId);
  return buildLifecycleState({
    project: {
      id: project.id,
      status: project.status,
      title: project.title,
      guest_name: project.guestName,
    },
    match,
    actorType: 'customer',
  });
}

export async function getProviderLifecycleState(token: string) {
  const opportunity = await getProviderOpportunity(token);
  if (!opportunity) throw new Error('Provider opportunity not found.');
  if (!opportunity.customerContact) {
    throw new Error('Job controls become available after the customer selects and connects with you.');
  }

  const match = await loadMatch(opportunity.project.id);
  if (match.provider_id !== opportunity.providerId) {
    throw new Error('This provider is not selected for the project.');
  }

  const supabase = getSupabaseAdmin();
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, status, title, guest_name')
    .eq('id', opportunity.project.id)
    .single();

  if (error || !project) {
    throw new Error(`Unable to load project: ${error?.message ?? 'Project not found.'}`);
  }

  return buildLifecycleState({
    project: project as ProjectRow,
    match,
    actorType: 'provider',
    providerName: snapshotProviderName(opportunity.providerSnapshot),
  });
}

function assertMoney(value: number | null | undefined): number | null {
  if (value === undefined || value === null) return null;
  if (!Number.isFinite(value) || value < 0) throw new Error('Final price must be a valid positive amount.');
  return value;
}

async function insertEvent(input: {
  projectId: string;
  eventType: string;
  actorType: LifecycleActor;
  actorId: string;
  message: string;
  action: LifecycleAction;
  note: string | null;
  finalPrice: number | null;
}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('project_status_events').insert({
    project_id: input.projectId,
    event_type: input.eventType,
    actor_type: input.actorType,
    actor_id: input.actorId,
    message: input.message,
    event_data: {
      action: input.action,
      note: input.note,
      finalPrice: input.finalPrice,
    },
  });

  if (error) console.error('Lifecycle update saved but timeline event failed:', error.message);
}

async function applyLifecycleAction(input: {
  projectId: string;
  providerId: number;
  actorType: LifecycleActor;
  actorId: string;
  action: LifecycleAction;
  note?: string | null;
  finalPrice?: number | null;
}) {
  const supabase = getSupabaseAdmin();
  const match = await loadMatch(input.projectId);

  if (match.provider_id !== input.providerId) {
    throw new Error('The selected provider does not match this job link.');
  }

  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select('id, status, title, guest_name')
    .eq('id', input.projectId)
    .single();

  if (projectError || !projectData) {
    throw new Error(`Unable to load project: ${projectError?.message ?? 'Project not found.'}`);
  }

  const project = projectData as ProjectRow;
  const note = input.note?.trim().slice(0, 2000) || null;
  const finalPrice = assertMoney(input.finalPrice);
  const now = new Date().toISOString();

  if (!match.contact_released_at) {
    throw new Error('Job controls become available after customer and provider contact details are released.');
  }

  if (input.action === 'start_work') {
    if (!['contact_released', 'in_progress'].includes(project.status)) {
      throw new Error('This job cannot be started from its current status.');
    }

    const { error: matchUpdateError } = await supabase
      .from('project_matches')
      .update({ status: 'in_progress' })
      .eq('id', match.id);
    if (matchUpdateError) throw new Error(`Unable to start work: ${matchUpdateError.message}`);

    const { error: projectUpdateError } = await supabase
      .from('projects')
      .update({ status: 'in_progress' })
      .eq('id', input.projectId);
    if (projectUpdateError) throw new Error(`Unable to update project: ${projectUpdateError.message}`);

    await insertEvent({
      projectId: input.projectId,
      eventType: 'work_started',
      actorType: input.actorType,
      actorId: input.actorId,
      message: `${input.actorType === 'provider' ? 'The provider' : 'The customer'} reported that work has started.`,
      action: input.action,
      note,
      finalPrice,
    });
    return;
  }

  if (input.action === 'report_completion') {
    if (input.actorType !== 'provider') {
      throw new Error('Only the selected provider can report completion for customer confirmation.');
    }
    if (!['contact_released', 'in_progress'].includes(project.status)) {
      throw new Error('Completion cannot be reported from the current project status.');
    }

    const { error } = await supabase
      .from('project_matches')
      .update({
        status: project.status === 'contact_released' ? 'in_progress' : match.status,
        completion_reported_at: now,
        final_price: finalPrice ?? match.final_price,
      })
      .eq('id', match.id);
    if (error) throw new Error(`Unable to report completion: ${error.message}`);

    if (project.status === 'contact_released') {
      await supabase.from('projects').update({ status: 'in_progress' }).eq('id', input.projectId);
    }

    await insertEvent({
      projectId: input.projectId,
      eventType: 'completion_reported',
      actorType: input.actorType,
      actorId: input.actorId,
      message: 'The provider reported that the work is complete and is awaiting customer confirmation.',
      action: input.action,
      note,
      finalPrice,
    });
    return;
  }

  if (input.action === 'confirm_completion') {
    if (input.actorType !== 'customer') {
      throw new Error('The customer must confirm final completion.');
    }
    if (!['contact_released', 'in_progress', 'completed'].includes(project.status)) {
      throw new Error('This job cannot be completed from its current status.');
    }

    const { error: matchUpdateError } = await supabase
      .from('project_matches')
      .update({
        status: 'completed',
        completion_reported_at: match.completion_reported_at ?? now,
        final_price: finalPrice ?? match.final_price,
      })
      .eq('id', match.id);
    if (matchUpdateError) throw new Error(`Unable to complete job: ${matchUpdateError.message}`);

    const { error: projectUpdateError } = await supabase
      .from('projects')
      .update({ status: 'completed' })
      .eq('id', input.projectId);
    if (projectUpdateError) throw new Error(`Unable to complete project: ${projectUpdateError.message}`);

    await insertEvent({
      projectId: input.projectId,
      eventType: 'project_completed',
      actorType: input.actorType,
      actorId: input.actorId,
      message: 'The customer confirmed that the job was completed.',
      action: input.action,
      note,
      finalPrice,
    });
    return;
  }

  if (input.action === 'cancel_project') {
    if (input.actorType !== 'customer') {
      throw new Error('The provider should report a problem rather than closing the customer project.');
    }
    if (!['provider_selected', 'contact_released', 'in_progress'].includes(project.status)) {
      throw new Error('This project cannot be cancelled from its current status.');
    }

    const { error: matchUpdateError } = await supabase
      .from('project_matches')
      .update({ status: 'cancelled' })
      .eq('id', match.id);
    if (matchUpdateError) throw new Error(`Unable to cancel job: ${matchUpdateError.message}`);

    const { error: projectUpdateError } = await supabase
      .from('projects')
      .update({ status: 'cancelled' })
      .eq('id', input.projectId);
    if (projectUpdateError) throw new Error(`Unable to cancel project: ${projectUpdateError.message}`);

    await insertEvent({
      projectId: input.projectId,
      eventType: 'project_cancelled',
      actorType: input.actorType,
      actorId: input.actorId,
      message: 'The customer cancelled the project after connection.',
      action: input.action,
      note,
      finalPrice,
    });
    return;
  }

  if (input.action === 'report_issue') {
    if (!['contact_released', 'in_progress'].includes(project.status)) {
      throw new Error('A problem can only be reported on an active connected job.');
    }
    if (!note || note.length < 10) {
      throw new Error('Please describe the problem in a little more detail.');
    }

    const { error } = await supabase
      .from('project_matches')
      .update({ status: 'disputed' })
      .eq('id', match.id);
    if (error) throw new Error(`Unable to report the problem: ${error.message}`);

    await insertEvent({
      projectId: input.projectId,
      eventType: input.actorType === 'provider' ? 'provider_issue_reported' : 'customer_issue_reported',
      actorType: input.actorType,
      actorId: input.actorId,
      message: `${input.actorType === 'provider' ? 'The provider' : 'The customer'} reported a project problem for administrator review.`,
      action: input.action,
      note,
      finalPrice,
    });
    return;
  }

  throw new Error('Unsupported lifecycle action.');
}

export async function updateCustomerLifecycle(input: {
  projectId: string;
  accessToken: string;
  action: LifecycleAction;
  note?: string | null;
  finalPrice?: number | null;
}) {
  const project = await getProjectByAccessToken(input.projectId, input.accessToken);
  if (!project) throw new Error('Project not found.');
  const match = await loadMatch(input.projectId);

  await applyLifecycleAction({
    projectId: input.projectId,
    providerId: match.provider_id,
    actorType: 'customer',
    actorId: project.customerId ?? project.guestPhone ?? project.id,
    action: input.action,
    note: input.note,
    finalPrice: input.finalPrice,
  });

  return getCustomerLifecycleState(input.projectId, input.accessToken);
}

export async function updateProviderLifecycle(input: {
  token: string;
  action: LifecycleAction;
  note?: string | null;
  finalPrice?: number | null;
}) {
  const opportunity = await getProviderOpportunity(input.token);
  if (!opportunity) throw new Error('Provider opportunity not found.');
  if (!opportunity.customerContact) {
    throw new Error('Job controls become available after the customer selects and connects with you.');
  }

  await applyLifecycleAction({
    projectId: opportunity.project.id,
    providerId: opportunity.providerId,
    actorType: 'provider',
    actorId: String(opportunity.providerId),
    action: input.action,
    note: input.note,
    finalPrice: input.finalPrice,
  });

  return getProviderLifecycleState(input.token);
}
