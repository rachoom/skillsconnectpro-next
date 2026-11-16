import { NextResponse } from 'next/server';
import { claimGuestProjectForUser } from '@/services/projectClaim';
import { getAuthenticatedAccount } from '@/services/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { user } = await getAuthenticatedAccount();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 2_000) {
    return NextResponse.json({ error: 'Request is too large.' }, { status: 413 });
  }

  const body = await request.json().catch(() => null) as { projectId?: unknown; token?: unknown } | null;
  const projectId = typeof body?.projectId === 'string' ? body.projectId : '';
  const token = typeof body?.token === 'string' ? body.token : '';

  if (!projectId || !token) {
    return NextResponse.json({ error: 'Project access details are missing.' }, { status: 400 });
  }

  const claimed = await claimGuestProjectForUser({
    projectId,
    accessToken: token,
    userId: user.id,
  });

  return NextResponse.json({ claimed }, { status: claimed ? 200 : 400 });
}
