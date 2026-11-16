import 'server-only';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';

function validUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function claimGuestProjectForUser(input: {
  projectId: string;
  accessToken: string;
  userId: string;
}): Promise<boolean> {
  const projectId = input.projectId.trim();
  const accessToken = input.accessToken.trim();
  const userId = input.userId.trim();

  if (!validUuid(projectId) || !validUuid(userId)) return false;
  if (accessToken.length < 32 || accessToken.length > 512) return false;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc('claim_guest_project_as_service', {
    target_project_id: projectId,
    raw_access_token: accessToken,
    target_user_id: userId,
  });

  if (error) {
    console.error('Guest project claim failed:', error.message);
    return false;
  }

  return data === true;
}
