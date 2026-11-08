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
  let callbackReachable = false;
  let callbackHttpStatus: number | null = null;
  let validationEndpointReachable = false;
  let validationHttpStatus: number | null = null;
  try {
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '').trim();
    if (baseUrl) {
      const notify = new URL(payfastNotificationUrl(baseUrl, 'sandbox'));
      callbackConfigured =
        notify.protocol === 'https:' &&
        notify.hostname.endsWith('.vercel.app') &&
        notify.searchParams.has('x-vercel-protection-bypass');
      if (callbackConfigured) {
        // GET cannot process an ITN because the route only exports POST.
        // A 405 from the actual callback URL confirms Vercel routed through
        // deployment protection without creating or modifying any payment.
        try {
          const probe = await fetch(notify.toString(), {
            method: 'GET', cache: 'no-store', redirect: 'manual',
            signal: AbortSignal.timeout(6_000),
          });
          callbackHttpStatus = probe.status;
          callbackReachable = probe.status === 405;
        } catch {
          callbackReachable = false;
        }
      }
    }
  } catch {
    callbackConfigured = false;
  }
  let cfg: ReturnType<typeof getPayfastConfig>;
  try {
    cfg = getPayfastConfig();
  } catch {
    return NextResponse.json({
      configured: false, sandbox: true, callbackConfigured, callbackReachable, callbackHttpStatus, validationEndpointReachable, validationHttpStatus,
      apiAuthenticated: false, apiReachable: false, check: 'merchant_configuration',
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  try {
    // Connectivity only. GET cannot validate a transaction; no payment
    // references, merchant keys, signatures or customer data are transmitted.
    const response = await fetch(cfg.validateUrl, {
      method: 'GET', redirect: 'manual', cache: 'no-store',
      signal: AbortSignal.timeout(6_000),
    });
    validationEndpointReachable = true;
    validationHttpStatus = response.status;
  } catch {
    validationEndpointReachable = false;
  }
  try {
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
      configured: true, sandbox: true, apiAuthenticated, apiReachable: true,
      callbackConfigured, callbackReachable, apiHttpStatus: response.status,
    }, {
      status: apiAuthenticated && callbackReachable ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({
      configured: true, sandbox: true, apiAuthenticated: false,
      apiReachable: false, callbackConfigured, callbackReachable, callbackHttpStatus, validationEndpointReachable, validationHttpStatus, check: 'api_network',
    }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
