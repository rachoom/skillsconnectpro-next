import { NextResponse } from 'next/server';
import { supabase } from '@/services/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabase.from('artisans')
    .select('id, name, first_name, last_name, category, location, image_url, verified, status, bio, marketplace_rating, marketplace_review_count')
    .neq('status', 'inactive').order('verified', { ascending: false })
    .order('marketplace_review_count', { ascending: false }).limit(120);
  if (error) return NextResponse.json({ error: 'Provider profiles are temporarily unavailable.' }, { status: 503 });
  return NextResponse.json({ providers: data }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } });
}
