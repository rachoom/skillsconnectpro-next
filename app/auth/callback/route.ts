import { NextRequest, NextResponse } from 'next/server';
import { AUTH_RETURN_PATH_COOKIE, resolveAuthReturnPath, withResult } from '@/services/authRedirect';
import { createServerSupabaseClient } from '@/services/supabase/server';
import { claimGuestProjectForUser } from '@/services/projectClaim';

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
    // Exchange the auth code before claiming; derive the target account only
    // from Supabase's verified session. Never accept it from the callback URL.
    const { data: identity, error: identityError } = await supabase.auth.getUser();
    let claimed = false;
    if (!identityError && identity.user) {
      claimed = await claimGuestProjectForUser({
        projectId,
        rawAccessToken: token,
        userId: identity.user.id,
      });
    }
    destination = withResult(next, 'claim', claimed ? 'saved' : 'failed');
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
