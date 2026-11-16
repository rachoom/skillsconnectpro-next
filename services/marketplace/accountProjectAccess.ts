import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

type AccountProjectAccess = {
  projectId: string;
  userId: string;
  expiresAt: number;
};

const PREFIX = 'acct.v1';

function signingKey(): string {
  const source = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!source) throw new Error('Server account project access is not configured.');
  return createHmac('sha256', source).update('skills-connect-pro:account-project-dashboard:v1').digest('hex');
}

function sign(payload: string): string {
  return createHmac('sha256', signingKey()).update(payload).digest('base64url');
}

function validUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function createAccountProjectAccessToken(input: {
  projectId: string;
  userId: string;
  ttlSeconds?: number;
}): string {
  if (!validUuid(input.projectId) || !validUuid(input.userId)) {
    throw new Error('Invalid account project access identity.');
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + Math.max(300, Math.min(input.ttlSeconds ?? 14_400, 43_200));
  const payload = Buffer.from(JSON.stringify({
    p: input.projectId,
    u: input.userId,
    e: expiresAt,
  })).toString('base64url');
  const signed = `${PREFIX}.${payload}`;
  return `${signed}.${sign(signed)}`;
}

export function readAccountProjectAccessToken(token: string): AccountProjectAccess | null {
  if (!token.startsWith(`${PREFIX}.`)) return null;
  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== 'acct' || parts[1] !== 'v1') return null;

  const payload = parts[2];
  const provided = parts[3];
  const signed = `${PREFIX}.${payload}`;
  const expected = sign(signed);

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      p?: unknown;
      u?: unknown;
      e?: unknown;
    };
    const projectId = typeof parsed.p === 'string' ? parsed.p : '';
    const userId = typeof parsed.u === 'string' ? parsed.u : '';
    const expiresAt = typeof parsed.e === 'number' ? parsed.e : 0;
    const now = Math.floor(Date.now() / 1000);

    if (!validUuid(projectId) || !validUuid(userId) || !Number.isFinite(expiresAt) || expiresAt <= now) {
      return null;
    }

    return { projectId, userId, expiresAt };
  } catch {
    return null;
  }
}

export function isAccountProjectAccessToken(token: string): boolean {
  return token.startsWith(`${PREFIX}.`);
}
