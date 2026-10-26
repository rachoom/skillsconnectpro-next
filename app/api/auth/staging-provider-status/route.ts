import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Read-only, no secrets. Never expose production auth settings here.
export async function GET() {
  if (process.env.VERCEL_ENV !== 'preview') {
    return new NextResponse('Not found', { status: 404 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl.startsWith('https://bvzsbcpoxdvuvpskavho.supabase.co') || !key) {
    return NextResponse.json({ checked: false, stagingDatabase: false }, { status: 503 });
  }

  try {
    const response = await fetch(supabaseUrl + '/auth/v1/settings', {
      headers: { apikey: key },
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) {
      return NextResponse.json({ checked: false, stagingDatabase: true, settingsHttpStatus: response.status }, { status: 503 });
    }
    const data = await response.json() as { external?: Record<string, unknown> };
    const googleEnabled = data.external?.google === true;
    return NextResponse.json({ checked: true, stagingDatabase: true, googleEnabled }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ checked: false, stagingDatabase: true, connectionFailed: true }, { status: 503 });
  }
}
