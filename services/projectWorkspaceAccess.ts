import 'server-only';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';

export async function requireProjectWorkspaceAccess(projectId: string) {
  const { user } = await getAuthenticatedAccount();
  if (!user) return { ok: false as const, status: 401, error: 'Sign in to manage this project.' };

  const admin = getSupabaseAdmin();
  const { data: project, error: projectError } = await admin
    .from('projects')
    .select('id,customer_id')
    .eq('id', projectId)
    .maybeSingle();

  if (projectError || !project) return { ok: false as const, status: 404, error: 'Project not found.' };

  if (project.customer_id !== user.id) {
    const { data: membership, error: memberError } = await admin
      .from('project_members')
      .select('project_id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (memberError || !membership) {
      return { ok: false as const, status: 403, error: 'You do not have access to manage this project.' };
    }
  }

  return { ok: true as const, user, admin };
}
