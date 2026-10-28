import { NextResponse } from 'next/server';
import { getPayfastConfig, payfastApiSignature } from '@/services/payments/payfast';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Read-only staging readiness: test only API authentication with Payfast.
// No subscription token, customer details, keys or signatures are returned.
export async function GET() {
  if (process.env.VERCEL_ENV !== 'preview' || process.env.PAYFAST_MODE !== 'sandbox') {
    return new NextResponse('Not found', { status: 404 });
  }
  try {
    const cfg = getPayfastConfig();
    const timestamp = new Date().toISOString().slice(0, 19) + '+00:00';
    const signed = { 'merchant-id': cfg.merchantId, version: 'v1', timestamp };
    const signature = payfastApiSignature(signed, cfg.passphrase);
    const r = await fetch('https://api.payfast.co.za/ping?testing=true', {
      headers: { ...signed, signature }, cache: 'no-store', redirect: 'error',
      signal: AbortSignal.timeout(8_000),
    });
    return NextResponse.json({ configured: true, sandbox: true, apiAuthenticated: r.ok },
      { status: r.ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ configured: false, sandbox: true, apiAuthenticated: false },
      { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
