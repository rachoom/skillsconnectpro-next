import { NextResponse } from 'next/server';
import { getAuthenticatedAccount } from '@/services/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const { user } = await getAuthenticatedAccount();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  // Provider access must come from explicit onboarding + approval/linking.
  // A customer account must never become an active artisan merely by
  // opening the Artisan Business area.
  return NextResponse.json({
    error: 'Provider tools are activated after your service-provider application is reviewed and linked to your account.',
    joinHref: '/join',
  }, { status: 409 });
}
