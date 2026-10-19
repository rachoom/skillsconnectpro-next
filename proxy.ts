import { NextResponse, type NextRequest } from 'next/server';
import { refreshSupabaseSession } from '@/services/supabase/proxy';

export async function proxy(request: NextRequest) {
  // Supabase falls back to the configured Site URL when a redirect URL is
  // unavailable or has not propagated yet. Preserve the one-time OAuth code
  // and feed it through our server callback, rather than leaving a signed-in
  // customer stranded on the public homepage.
  if (request.nextUrl.pathname === '/' && request.nextUrl.searchParams.has('code')) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = '/auth/callback';
    callbackUrl.searchParams.set('next', '/my-projects');
    return NextResponse.redirect(callbackUrl);
  }

  return refreshSupabaseSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
