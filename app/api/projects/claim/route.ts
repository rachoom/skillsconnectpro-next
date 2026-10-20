import { NextResponse } from 'next/server';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { claimGuestProjectForUser } from '@/services/projectClaim';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: Request) {
  const { user } = await getAuthenticatedAccount();
  if (!user) {
    return NextResponse.json({ claimed: false, error: 'Authentication required.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ claimed: false, error: 'Invalid request.' }, { status: 400 });
  }

  const value = body && typeof body === 'object' && !Array.isArray(body)
    ? body as Record<string, unknown>
    : {};
  const projectId = text(value.projectId, 80);
  const token = text(value.token, 512);

  if (!projectId || token.length < 32) {
    return NextResponse.json({ claimed: false, error: 'Project claim details are incomplete.' }, { status: 400 });
  }

  const claimed = await claimGuestProjectForUser({
    projectId,
    rawAccessToken: token,
    userId: user.id,
  });

  return NextResponse.json({ claimed }, { status: claimed ? 200 : 409 });
}
