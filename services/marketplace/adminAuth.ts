import { createHmac, timingSafeEqual } from 'node:crypto';

export const MARKETPLACE_ADMIN_SESSION_COOKIE = 'scp_marketplace_admin';
export const MARKETPLACE_ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

type MarketplaceAdminSessionPayload = {
  sub: string;
  role: 'admin' | 'super_admin';
  exp: number;
};

function secureStringEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');

  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function getSigningSecret(): string {
  const secret = process.env.MARKETPLACE_ADMIN_API_KEY;
  if (!secret) {
    throw new Error('MARKETPLACE_ADMIN_API_KEY is not configured.');
  }
  return secret;
}

function sign(value: string): string {
  return createHmac('sha256', getSigningSecret()).update(value).digest('base64url');
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;

  for (const item of header.split(';')) {
    const [rawName, ...rawValue] = item.trim().split('=');
    if (rawName === name) return decodeURIComponent(rawValue.join('='));
  }
  return null;
}

export function createMarketplaceAdminSessionToken(input: {
  userId: string;
  role: 'admin' | 'super_admin';
  now?: Date;
}): string {
  const nowSeconds = Math.floor((input.now ?? new Date()).getTime() / 1000);
  const payload: MarketplaceAdminSessionPayload = {
    sub: input.userId,
    role: input.role,
    exp: nowSeconds + MARKETPLACE_ADMIN_SESSION_MAX_AGE_SECONDS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `v1.${encodedPayload}.${sign(`v1.${encodedPayload}`)}`;
}

export function verifyMarketplaceAdminSessionToken(token: string): MarketplaceAdminSessionPayload | null {
  const [version, encodedPayload, signature] = token.split('.');
  if (version !== 'v1' || !encodedPayload || !signature) return null;

  const expectedSignature = sign(`${version}.${encodedPayload}`);
  if (!secureStringEquals(expectedSignature, signature)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as MarketplaceAdminSessionPayload;
    if (!payload.sub || !['admin', 'super_admin'].includes(payload.role)) return null;
    if (!Number.isFinite(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function requireMarketplaceAdmin(request: Request): MarketplaceAdminSessionPayload | void {
  const sessionToken = readCookie(request, MARKETPLACE_ADMIN_SESSION_COOKIE);
  if (sessionToken) {
    const session = verifyMarketplaceAdminSessionToken(sessionToken);
    if (session) return session;
  }

  // Temporary legacy fallback for server-to-server/admin tooling while the
  // browser UI migrates completely to Supabase Auth. The key is no longer
  // required or exposed in the normal administrator login flow.
  const expectedKey = process.env.MARKETPLACE_ADMIN_API_KEY;
  const suppliedKey = request.headers.get('x-marketplace-admin-key');
  if (expectedKey && suppliedKey && secureStringEquals(expectedKey, suppliedKey)) return;

  const error = new Error('Unauthorised marketplace administration request.');
  error.name = 'UnauthorisedError';
  throw error;
}
