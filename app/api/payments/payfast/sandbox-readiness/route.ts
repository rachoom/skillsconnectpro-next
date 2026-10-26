import { NextResponse } from 'next/server';

// A protected, read-only sandbox preflight. Never returns a key, passphrase,
// access token or payment details; production returns 404.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.VERCEL_ENV !== 'preview') {
    return new NextResponse('Not found', { status: 404 });
  }

  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '';
  const callbackSiteIsStaging = /^https:\/\/[^/]+\.vercel\.app\/?$/i.test(configuredSiteUrl)
    && !configuredSiteUrl.includes('www.skillsconnectpro.co.za');
  const databaseIsStaging = String(process.env.NEXT_PUBLIC_SUPABASE_URL || '')
    .includes('bvzsbcpoxdvuvpskavho.supabase.co');
  const checks = {
    payfastSandboxMode: process.env.PAYFAST_MODE === 'sandbox',
    sandboxCredentialsPresent: Boolean(
      process.env.PAYFAST_MERCHANT_ID?.trim()
      && process.env.PAYFAST_MERCHANT_KEY?.trim()
      && process.env.PAYFAST_PASSPHRASE?.trim()
    ),
    automationBypassAvailable: Boolean(process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim()),
    callbackUsesPreviewHost: callbackSiteIsStaging,
    separateStagingDatabase: databaseIsStaging,
  };
  // Verify Vercel actually honours the bypass on the callback route,
  // using a harmless GET (Payfast sends POST). Never return the secret or URL.
  let callbackBypassWorks = false;
  if (Object.values(checks).every(Boolean)) {
    try {
      const probe = new URL('/api/payments/payfast/itn', configuredSiteUrl);
      probe.searchParams.set('x-vercel-protection-bypass', process.env.VERCEL_AUTOMATION_BYPASS_SECRET!);
      const response = await fetch(probe, { method: 'GET', redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(6000) });
      // Next.js reports 405 for GET on a POST-only endpoint.
      callbackBypassWorks = response.status === 405;
    } catch { /* Deployment may still be starting or egress unavailable */ }
  }
  const fullChecks = { ...checks, callbackBypassWorks };
  const ready = Object.values(fullChecks).every(Boolean);
  return NextResponse.json({ ready, checks: fullChecks }, {
    status: ready ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  });
}
