import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const PROVIDER_ADMIN_COOKIE = 'scp_provider_admin';
const SESSION_PURPOSE = 'provider-admin-session-v1';

function configuredPasswordHash(): string {
  const hash = process.env.PROVIDER_ADMIN_PASSWORD_SHA256?.trim().toLowerCase();
  if (!hash || !/^[a-f0-9]{64}$/.test(hash)) {
    throw new Error('PROVIDER_ADMIN_PASSWORD_SHA256 is not configured.');
  }
  return hash;
}

function digest(value: string): Buffer {
  return createHmac('sha256', configuredPasswordHash()).update(value).digest();
}

export function verifyProviderAdminPassword(candidate: string): boolean {
  if (!candidate) return false;
  const supplied = Buffer.from(createHash('sha256').update(candidate).digest('hex'), 'utf8');
  const expected = Buffer.from(configuredPasswordHash(), 'utf8');
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
