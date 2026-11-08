import { NextResponse } from 'next/server';
import { getPayfastConfig, payfastApiSignature, payfastNotificationUrl } from '@/services/payments/payfast';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Preview-only: safe diagnostics for merchant API and the public ITN callback.
// Returns booleans only: never reveal signatures, bypass tokens, or Payfast keys.
export async function GET() {
  if (process.env.VERCEL_ENV !== 'preview' || process.env.PAYFAST_MODE !== 'sandbox') {
    return new NextResponse('Not found', { status: 404 });
  }
  let callbackConfigured = false;
  try {
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '').replace(/\\/+$/, '');
    if (baseUrl) {
      const notify = new URL(payfastNotificationUrl(baseUrl, 'sandbox'));
      callbackConfigured =
        notify.protocol === 'https:' &&
        notify.hostname.endsWith('.vercel.app') &&
        notify.searchParams.has('x-vercel-protection-bypass');
    }
  } catch {
    callbackConfigured = false;
  }
  try {
    const cfg = getPayfastConfig();
    const timestamp = new Date().toISOString().slice(0, 19) + '+00:00';
    const signed = { 'merchant-id': cfg.merchantId, version: 'v1', timestamp };
    const signature = payfastApiSignature(signed, cfg.passphrase);
    const response = await fetch('https://api.payfast.co.za/ping?testing=true', {
      headers: { ...signed, signature },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(8_000),
    });
    const apiAuthenticated = response.ok;
    return NextResponse.json({
      configured: true, sandbox: true, apiAuthenticated, callbackConfigured,
    }, {
      status: apiAuthenticated && callbackConfigured ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({
      configured: false, sandbox: true, apiAuthenticated: false, callbackConfigured,
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
