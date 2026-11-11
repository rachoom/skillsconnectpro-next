import { NextResponse } from 'next/server';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { claimGuestProjectForUser } from '@/services/projectClaim';
import { enforcePublicRequestLimit, publicRequestError, readBoundedJson } from '@/services/publicRequestGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'private, no-store, max-age=0' };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  // A same-origin, authenticated request with the original private project token
  // is needed. A project ID or marketplace-admin access alone is insufficient.
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return NextResponse.json({ claimed: false, error: 'Invalid request origin.' }, { status: 403, headers: noStore });
  }

  const { user } = await getAuthenticatedAccount();
  if (!user) {
    return NextResponse.json({ claimed: false, error: 'Please sign in to save your request.' }, { status: 401, headers: noStore });
  }

  try {
    const blocked = await enforcePublicRequestLimit(request, 'claim_guest_project', 8);
    if (blocked) return blocked;
    const value = await readBoundedJson(request, 2048) as Record<string, unknown>;
    const projectId = typeof value.projectId === 'string' ? value.projectId.trim() : '';
    const token = typeof value.token === 'string' ? value.token.trim() : '';

    if (!uuid.test(projectId) || !/^[a-zA-Z0-9_-]{32,256}$/.test(token) || token === 'account-session') {
      return NextResponse.json({ claimed: false, error: 'A valid private customer project link is required.' }, { status: 400, headers: noStore });
    }

    // This helper calls the service-only SQL function, which verifies the
    // stored SHA-256 hash and rejects projects owned by another account.
    const claimed = await claimGuestProjectForUser({
      projectId,
      rawAccessToken: token,
      userId: user.id,
    });

    return NextResponse.json(
      claimed ? { claimed: true } : { claimed: false, error: 'The link could not be verified or the project is already owned by another account.' },
      { status: claimed ? 200 : 409, headers: noStore },
    );
  } catch (error) {
    const invalid = publicRequestError(error);
    if (invalid) return invalid;
    console.error('Guest project claim request failed:', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ claimed: false, error: 'Unable to link this request. Please retry.' }, { status: 503, headers: noStore });
  }
}
