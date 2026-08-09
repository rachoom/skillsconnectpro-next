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

function bearerToken(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token || null;
}

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

export async function POST(request: Request) {
  try {
    const accessToken = bearerToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: 'Supabase sign-in is required.' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const userResult = await supabase.auth.getUser(accessToken);
    const user = userResult.data.user;

    if (userResult.error || !user) {
      return NextResponse.json({ error: 'Your sign-in session is invalid or has expired.' }, { status: 401 });
    }

    const adminResult = await supabase
      .from('marketplace_admin_users')
      .select('user_id, email, role, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (adminResult.error) {
      throw new Error(`Unable to verify administrator access: ${adminResult.error.message}`);
    }

    const admin = adminResult.data as {
      user_id: string;
      email: string;
      role: 'admin' | 'super_admin';
      is_active: boolean;
    } | null;

    if (!admin) {
      return NextResponse.json({ error: 'This account is not authorised for SkillsConnect Pro administration.' }, { status: 403 });
    }

    const response = NextResponse.json({
      authenticated: true,
      admin: {
        userId: user.id,
        email: admin.email || user.email,
        role: admin.role,
      },
    });

    response.cookies.set({
      name: MARKETPLACE_ADMIN_SESSION_COOKIE,
      value: createMarketplaceAdminSessionToken({ userId: user.id, role: admin.role }),
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
