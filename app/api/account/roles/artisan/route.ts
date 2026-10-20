import { NextResponse } from 'next/server';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const { user } = await getAuthenticatedAccount();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from('account_roles').upsert({
    user_id: user.id,
    role: 'artisan',
    status: 'active',
    is_primary: false,
    linked_artisan_id: null,
  }, { onConflict: 'user_id,role', ignoreDuplicates: false });

  if (error) {
    console.error('Unable to activate artisan workspace:', error.message);
    return NextResponse.json({ error: 'Unable to activate artisan workspace.' }, { status: 500 });
  }

  return NextResponse.json({ activated: true });
}
