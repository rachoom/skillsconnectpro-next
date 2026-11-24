import { NextResponse } from 'next/server';
import { requireMarketplaceAdmin } from '@/services/marketplace/adminAuth';
import { requireProviderAdmin } from '@/services/providerAdminSession';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAY = 86_400_000;
const PAGE = 500;
const MAX_PROJECTS = 10_000;
type Project = { id: string; status: string };
type Invitation = { project_id: string; sent_at: string | null; delivered_at: string | null; viewed_at: string | null; status: string };
type Response = { project_id: string };
type Match = { project_id: string; selected_at: string | null; contact_released_at: string | null; completion_reported_at: string | null };

function localDate(value: string | null): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const utc = Date.parse(value + 'T00:00:00Z');
  if (!Number.isFinite(utc) || new Date(utc).toISOString().slice(0, 10) !== value) return null;
  return utc - 2 * 60 * 60 * 1000; // South Africa, UTC+02:00.
}

async function pages<T>(load: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>, max = 50_000): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; from <= max; from += PAGE) {
    const { data, error } = await load(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const batch = data ?? [];
    rows.push(...batch);
    if (rows.length > max) throw new Error('Date range contains too many records; choose a shorter period.');
    if (batch.length < PAGE) return rows;
  }
  throw new Error('Date range contains too many records; choose a shorter period.');
}

export async function GET(request: Request) {
  try {
    // Both existing admin interfaces may read this aggregate report.
    if (request.headers.has('x-marketplace-admin-key')) requireMarketplaceAdmin(request);
    else requireProviderAdmin(request);
    const params = new URL(request.url).searchParams;
    const from = localDate(params.get('from'));
    const to = localDate(params.get('to'));
    if (from === null || to === null || to < from || to - from >= 90 * DAY) {
      return NextResponse.json({ error: 'Choose a valid period of up to 90 days.' }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    const projects = await pages<Project>((start, end) => supabase.from('projects').select('id,status')
      .gte('created_at', new Date(from).toISOString()).lt('created_at', new Date(to + DAY).toISOString())
      .order('id').range(start, end), MAX_PROJECTS);
    const invited = new Set<string>(), sent = new Set<string>(), delivered = new Set<string>(), viewed = new Set<string>();
    const responded = new Set<string>(), selected = new Set<string>(), released = new Set<string>(), reported = new Set<string>();
    const failed = new Set<string>();
    let invitations = 0;
    let failedInvitations = 0;
    for (let i = 0; i < projects.length; i += 100) {
      const ids = projects.slice(i, i + 100).map(project => project.id);
      const [invites, responses, matches] = await Promise.all([
        pages<Invitation>((start, end) => supabase.from('lead_invitations').select('project_id,sent_at,delivered_at,viewed_at,status').in('project_id', ids).order('id').range(start, end)),
        pages<Response>((start, end) => supabase.from('provider_responses').select('project_id').in('project_id', ids).order('id').range(start, end)),
        pages<Match>((start, end) => supabase.from('project_matches').select('project_id,selected_at,contact_released_at,completion_reported_at').in('project_id', ids).order('id').range(start, end)),
      ]);
      for (const invite of invites) {
        invitations++;
        invited.add(invite.project_id);
        if (invite.sent_at) sent.add(invite.project_id);
        if (invite.delivered_at) delivered.add(invite.project_id);
        if (invite.viewed_at) viewed.add(invite.project_id);
        if (invite.status === 'failed') { failedInvitations++; failed.add(invite.project_id); }
      }
      for (const response of responses) responded.add(response.project_id);
      for (const match of matches) {
        if (match.selected_at) selected.add(match.project_id);
        if (match.contact_released_at) released.add(match.project_id);
        if (match.completion_reported_at) reported.add(match.project_id);
      }
    }
    return NextResponse.json({
      submitted: projects.length, invited: invited.size, sent: sent.size,
      delivered: delivered.size, viewed: viewed.size, responded: responded.size,
      selected: selected.size, released: released.size, reported: reported.size,
      completed: projects.filter(project => project.status === 'completed').length,
      cancelled: projects.filter(project => project.status === 'cancelled').length,
      failedProjects: failed.size, invitations, failedInvitations,
      awaitingAttribution: true,
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof Error && error.name === 'UnauthorisedError') {
      return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });
    }
    console.error('Customer outcomes report failed:', error);
    return NextResponse.json({ error: 'Unable to load customer outcomes. Try a shorter period or retry.' }, { status: 503 });
  }
}
