import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  createMarketplaceAdminSessionToken,
  MARKETPLACE_ADMIN_SESSION_COOKIE,
  MARKETPLACE_ADMIN_SESSION_MAX_AGE_SECONDS,
  requireMarketplaceAdmin,
} from '@/services/marketplace/adminAuth';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FAILED_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function clearAdminCookie(response: NextResponse) {
  response.cookies.set({
    name: MARKETPLACE_ADMIN_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

function clientIpHash(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')?.trim()
    || 'unknown';
  return createHash('sha256').update(ip).digest('hex');
}

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const pin = typeof payload.pin === 'string' ? payload.pin.trim() : '';

    if (!/^\d{4,12}$/.test(pin)) {
      return NextResponse.json({ error: 'Enter a valid Admin PIN.' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const ipHash = clientIpHash(request);
    const cutoff = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

    const recentAttempts = await supabase
      .from('marketplace_admin_login_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .eq('succeeded', false)
      .gte('attempted_at', cutoff);

    if (recentAttempts.error) {
      throw new Error(`Unable to check admin login limits: ${recentAttempts.error.message}`);
    }

    if ((recentAttempts.count ?? 0) >= MAX_FAILED_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many incorrect PIN attempts. Please try again in 15 minutes.' },
        { status: 429 },
      );
    }

    const verification = await supabase.rpc('verify_marketplace_admin_pin', { p_pin: pin });
    if (verification.error) {
      throw new Error(`Unable to verify Admin PIN: ${verification.error.message}`);
    }

    const authenticated = verification.data === true;
    const attempt = await supabase.from('marketplace_admin_login_attempts').insert({
      ip_hash: ipHash,
      succeeded: authenticated,
    });

    if (attempt.error) {
      console.error('Unable to record marketplace admin login attempt:', attempt.error.message);
    }

    if (!authenticated) {
      return NextResponse.json({ error: 'Incorrect Admin PIN.' }, { status: 401 });
    }

    const response = NextResponse.json({
      authenticated: true,
      admin: {
        role: 'super_admin',
        method: 'pin',
      },
    });

    response.cookies.set({
      name: MARKETPLACE_ADMIN_SESSION_COOKIE,
      value: createMarketplaceAdminSessionToken({ userId: 'pin-admin', role: 'super_admin' }),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: MARKETPLACE_ADMIN_SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to establish administrator session.';
    console.error('POST /api/admin/session failed:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = requireMarketplaceAdmin(request);
    return NextResponse.json({
      authenticated: true,
      admin: session && 'sub' in session
        ? { userId: session.sub, role: session.role }
        : { role: 'legacy' },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  clearAdminCookie(response);
  return response;
}
