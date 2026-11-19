import { NextResponse } from 'next/server';
import { supabase } from '@/services/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // This preview is a visual review of the real, publicly listed providers.
  // Staging Supabase is paused; read only the existing public production API.
  // Never inject production credentials into preview deployments.
  if (process.env.VERCEL_ENV === 'preview') {
    try {
      const response = await fetch('https://skillsconnectpro.co.za/api/providers', {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error(`Live directory returned HTTP ${response.status}`);
      const payload: unknown = await response.json();
      if (!payload || typeof payload !== 'object' || !('providers' in payload)
          || !Array.isArray(payload.providers)) {
        throw new Error('Unexpected public directory response');
      }
      return NextResponse.json({ providers: payload.providers }, {
        headers: {
          'Cache-Control': 'no-store',
          'X-SCP-Preview-Data': 'production-public-directory',
        },
      });
    } catch (error) {
      console.error('Provider design preview could not load the public directory:', error);
      return NextResponse.json(
        { error: 'Design preview cannot reach the public directory.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }
  }
  const { data, error } = await supabase
    .from('artisans')
    .select('id, first_name, last_name, category, location, image_url, banner_url, verified, status, bio, marketplace_rating, marketplace_review_count, portfolio_urls, proof_of_work')
    .eq('status', 'active')
    .order('verified', { ascending: false })
    .order('marketplace_review_count', { ascending: false })
    .limit(120);

  if (error) {
    console.error('Public provider directory query failed:', error);
    return NextResponse.json(
      { error: 'Provider profiles are temporarily unavailable.' },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { providers: data || [] },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } },
  );
}
