import { NextRequest, NextResponse } from 'next/server';
import { AUTH_RETURN_PATH_COOKIE, safeInternalPath } from '@/services/authRedirect';

type Body = { next?: unknown };

export async function POST(request: NextRequest) {
  let body: Body = {};
  try {
    body = await request.json() as Body;
  } catch {
    // Treat an invalid body like a missing return path; it can only result in
    // the safe My Projects fallback.
  }

  const nextPath = safeInternalPath(typeof body.next === 'string' ? body.next : null);
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: AUTH_RETURN_PATH_COOKIE,
    value: nextPath,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 15 * 60,
  });
  return response;
}
