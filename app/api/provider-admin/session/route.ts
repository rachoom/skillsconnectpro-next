import { NextResponse } from 'next/server';
import { enforcePublicRequestLimit, publicRequestError, readBoundedJson } from '@/services/publicRequestGuard';
import {
  isProviderAdminRequest,
  providerAdminSessionToken,
  PROVIDER_ADMIN_COOKIE,
  verifyProviderAdminPassword,
} from '@/services/providerAdminSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: 60 * 60 * 12,
};

export async function GET(request: Request) {
  try {
    return NextResponse.json({ authenticated: isProviderAdminRequest(request) });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

export async function POST(request: Request) {
  try {
    const blocked = await enforcePublicRequestLimit(request, 'provider_admin_login', 10, 15 * 60);
    if (blocked) return blocked;

    const body = await readBoundedJson(request, 8_000);
    const password = typeof body.password === 'string' ? body.password : '';

    if (!verifyProviderAdminPassword(password)) {
      return NextResponse.json({ error: 'Incorrect administrator password.' }, { status: 401 });
    }

    const response = NextResponse.json({ authenticated: true });
    response.cookies.set(PROVIDER_ADMIN_COOKIE, providerAdminSessionToken(), cookieOptions);
    return response;
  } catch (error) {
    const publicError = publicRequestError(error);
    if (publicError) return publicError;
    console.error('Provider admin sign-in failed:', error);
    return NextResponse.json({ error: 'Administrator sign-in is unavailable.' }, { status: 503 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(PROVIDER_ADMIN_COOKIE, '', { ...cookieOptions, maxAge: 0 });
  return response;
}
