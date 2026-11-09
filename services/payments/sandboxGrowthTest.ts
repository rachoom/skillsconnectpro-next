import { createHmac, timingSafeEqual } from 'node:crypto';

export const STAGING_PROJECT = 'bvzsbcpoxdvuvpskavho';
export const GROWTH_TEST_PROVIDER_ID = 900000002;
export const GROWTH_TEST_COOKIE = 'scp_growth_sandbox_receipt';

export function growthSandboxEnabled() {
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serverUrl = process.env.SUPABASE_URL || publicUrl;
  return process.env.VERCEL_ENV === 'preview'
    && process.env.PAYFAST_MODE === 'sandbox'
    && publicUrl.includes(STAGING_PROJECT)
    && serverUrl.includes(STAGING_PROJECT)
    && Boolean(process.env.SCP_SANDBOX_GROWTH_TEST_TOKEN);
}

export function growthSandboxSecret() {
  const secret = process.env.SCP_SANDBOX_GROWTH_TEST_TOKEN || '';
  if (!/^[a-f0-9]{64}$/.test(secret)) throw new Error('Sandbox authorization unavailable');
  return secret;
}

export function isValidGrowthTestToken(candidate: string, expected: string) {
  if (!/^[a-f0-9]{64}$/.test(candidate)) return false;
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(expected));
}

export function growthTestReceipt(ref: string, secret: string) {
  return createHmac('sha256', secret).update('growth-sandbox:' + ref).digest('hex');
}
