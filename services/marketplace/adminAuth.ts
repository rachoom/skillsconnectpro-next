import { timingSafeEqual } from 'node:crypto';

function secureStringEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');

  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function requireMarketplaceAdmin(request: Request): void {
  const expectedKey = process.env.MARKETPLACE_ADMIN_API_KEY;
  const suppliedKey = request.headers.get('x-marketplace-admin-key');

  if (!expectedKey) {
    throw new Error('MARKETPLACE_ADMIN_API_KEY is not configured.');
  }

  if (!suppliedKey || !secureStringEquals(expectedKey, suppliedKey)) {
    const error = new Error('Unauthorised marketplace administration request.');
    error.name = 'UnauthorisedError';
    throw error;
  }
}
