import { NextRequest, NextResponse } from 'next/server';
import { AUTH_RETURN_PATH_COOKIE, resolveAuthReturnPath, withResult } from '@/services/authRedirect';
import { createServerSupabaseClient } from '@/services/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = resolveAuthReturnPath(
    requestUrl.searchParams.get('next'),
    request.cookies.get(AUTH_RETURN_PATH_COOKIE)?.value,
  );
  const projectId = requestUrl.searchParams.get('projectId');
  const token = requestUrl.searchParams.get('token');
  const supabase = await createServerSupabaseClient();

  if (!code) {
    const destination = new URL('/sign-in?error=missing_code', requestUrl.origin);
    destination.searchParams.set('next', next);
    return NextResponse.redirect(destination);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const destination = new URL('/sign-in?error=auth_callback', requestUrl.origin);
    destination.searchParams.set('next', next);
    return NextResponse.redirect(destination);
  }

  let destination = next;
  if (projectId && token) {
    const { data: claimed, error: claimError } = await supabase.rpc('claim_guest_project', {
      target_project_id: projectId,
      raw_access_token: token,
    });
    destination = withResult(next, 'claim', !claimError && claimed ? 'saved' : 'failed');
  }

  const response = NextResponse.redirect(new URL(destination, requestUrl.origin));
  response.cookies.set({
    name: AUTH_RETURN_PATH_COOKIE,
    value: '',
    path: '/',
    maxAge: 0,
  });
  return response;
}
