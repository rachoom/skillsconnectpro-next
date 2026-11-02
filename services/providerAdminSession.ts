import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { getSupabaseAdmin } from './supabaseAdmin';

export const PROVIDER_ADMIN_COOKIE = 'scp_provider_admin';
const SESSION_PURPOSE = 'provider-admin-session-v1';
export const PROVIDER_ADMIN_SESSION_SECONDS = 60 * 60 * 12;

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

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function requestToken(request: Request): string | null {
  const cookie = request.headers.get('cookie') || '';
  const raw = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(`${PROVIDER_ADMIN_COOKIE}=`));
  if (!raw) return null;
  try {
    const value = decodeURIComponent(raw.slice(PROVIDER_ADMIN_COOKIE.length + 1));
    return /^[a-f0-9]{64}$/.test(value) ? value : null;
  } catch { return null; }
}

export async function providerAdminSessionToken(): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const { error } = await getSupabaseAdmin().from('provider_admin_sessions').insert({
    token_hash: tokenHash(token), credential_version: digest(SESSION_PURPOSE).toString('hex'),
    expires_at: new Date(Date.now() + PROVIDER_ADMIN_SESSION_SECONDS * 1000).toISOString(),
  });
  if (error) throw new Error('Unable to create administrator session.');
  return token;
}

export async function isProviderAdminRequest(request: Request): Promise<boolean> {
  const token = requestToken(request);
  if (!token) return false;
  const { data, error } = await getSupabaseAdmin().from('provider_admin_sessions')
    .select('expires_at').eq('token_hash', tokenHash(token))
    .eq('credential_version', digest(SESSION_PURPOSE).toString('hex'))
    .is('revoked_at', null).gt('expires_at', new Date().toISOString()).maybeSingle();
  if (error) throw new Error('Unable to verify administrator session.');
  return Boolean(data && new Date(data.expires_at).getTime() > Date.now());
}

export async function revokeProviderAdminSession(request: Request): Promise<void> {
  const token = requestToken(request);
  if (!token) return;
  const { error } = await getSupabaseAdmin().from('provider_admin_sessions')
    .update({ revoked_at: new Date().toISOString() }).eq('token_hash', tokenHash(token));
  if (error) throw new Error('Unable to revoke administrator session.');
}

export async function requireProviderAdmin(request: Request): Promise<void> {
  if (!await isProviderAdminRequest(request)) {
    const error = new Error('Unauthorised.');
    error.name = 'UnauthorisedError';
    throw error;
  }
}
