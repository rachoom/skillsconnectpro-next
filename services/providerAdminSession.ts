import { createHmac, timingSafeEqual } from 'node:crypto';

export const PROVIDER_ADMIN_COOKIE = 'scp_provider_admin';
const SESSION_PURPOSE = 'provider-admin-session-v1';

function configuredSecret(): string {
  const secret = process.env.PROVIDER_ADMIN_PASSWORD?.trim();
  if (!secret) throw new Error('PROVIDER_ADMIN_PASSWORD is not configured.');
  return secret;
}

function digest(value: string): Buffer {
  return createHmac('sha256', configuredSecret()).update(value).digest();
}

export function verifyProviderAdminPassword(candidate: string): boolean {
  if (!candidate) return false;
  const supplied = createHmac('sha256', configuredSecret()).update(candidate).digest();
  const expected = createHmac('sha256', configuredSecret()).update(configuredSecret()).digest();
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function providerAdminSessionToken(): string {
  return digest(SESSION_PURPOSE).toString('hex');
}

export function isProviderAdminRequest(request: Request): boolean {
  const cookie = request.headers.get('cookie') || '';
  const raw = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${PROVIDER_ADMIN_COOKIE}=`));
  if (!raw) return false;
  const value = decodeURIComponent(raw.slice(PROVIDER_ADMIN_COOKIE.length + 1));
  const expected = providerAdminSessionToken();
  const suppliedBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return suppliedBuffer.length === expectedBuffer.length && timingSafeEqual(suppliedBuffer, expectedBuffer);
}

export function requireProviderAdmin(request: Request): void {
  if (!isProviderAdminRequest(request)) {
    const error = new Error('Unauthorised.');
    error.name = 'UnauthorisedError';
    throw error;
  }
}
