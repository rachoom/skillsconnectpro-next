import { getSupabaseAdmin } from '@/services/supabaseAdmin';

export async function claimGuestProjectForUser(input: {
  projectId: string;
  rawAccessToken: string;
  userId: string;
}) {
  if (!input.projectId || !input.rawAccessToken || !input.userId) return false;

  const { data, error } = await getSupabaseAdmin().rpc('claim_guest_project_as_service', {
    target_project_id: input.projectId,
    raw_access_token: input.rawAccessToken,
    target_user_id: input.userId,
  });

  if (error) {
    console.error('Guest project claim failed:', error.message);
    return false;
  }

  return data === true;
}
