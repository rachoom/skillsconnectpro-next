import 'server-only';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';

export async function requireProjectWorkspaceAccess(projectId: string, permission: 'read' | 'write' = 'write') {
  const { supabase, user } = await getAuthenticatedAccount();
  if (!user) return { ok: false as const, status: 401, error: 'Sign in to manage this project.' };

  // Use the exact authenticated session + RLS policy that already governs
  // whether this customer can open the project workspace. This supports both
  // project owners and active project members without duplicating ownership
  // logic in application code.
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id,customer_id')
    .eq('id', projectId)
    .maybeSingle();

  if (projectError) {
    return { ok: false as const, status: 403, error: 'You do not have access to manage this project.' };
  }
  if (!project) {
    return { ok: false as const, status: 403, error: 'You do not have access to manage this project.' };
  }

  const isOwner = project.customer_id === user.id;
  if (permission === 'write' && !isOwner) {
    const { data: member, error } = await supabase.from('project_members')
      .select('member_role').eq('project_id', projectId).eq('user_id', user.id)
      .eq('status', 'active').maybeSingle();
    if (error || member?.member_role !== 'collaborator') {
      return { ok: false as const, status: 403, error: 'This project is read-only for your account.' };
    }
  }
  return { ok: true as const, user, isOwner, admin: getSupabaseAdmin() };
}
