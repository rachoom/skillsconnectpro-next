import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/services/supabase/server';

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/', request.url), { status: 303 });
}
