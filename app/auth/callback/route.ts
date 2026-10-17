import { NextResponse } from 'next/server';
import { safeInternalPath, withResult } from '@/services/authRedirect';
import { createServerSupabaseClient } from '@/services/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = safeInternalPath(requestUrl.searchParams.get('next'));
  const projectId = requestUrl.searchParams.get('projectId');
  const token = requestUrl.searchParams.get('token');
  const supabase = await createServerSupabaseClient();

  if (!code) {
    return NextResponse.redirect(new URL('/sign-in?error=missing_code', requestUrl.origin));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL('/sign-in?error=auth_callback', requestUrl.origin));
  }

  let destination = next;
  if (projectId && token) {
    const { data: claimed, error: claimError } = await supabase.rpc('claim_guest_project', {
      target_project_id: projectId,
      raw_access_token: token,
    });
    destination = withResult(next, 'claim', !claimError && claimed ? 'saved' : 'failed');
  }

  return NextResponse.redirect(new URL(destination, requestUrl.origin));
}
