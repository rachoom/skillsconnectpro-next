import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export function createOpaqueToken(byteLength = 32): string {
  return randomBytes(byteLength).toString('base64url');
}

export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function safeTokenEquals(expectedHash: string, token: string): boolean {
  const actualHash = hashOpaqueToken(token);

  if (expectedHash.length !== actualHash.length) return false;

  return timingSafeEqual(
    Buffer.from(expectedHash, 'utf8'),
    Buffer.from(actualHash, 'utf8'),
  );
}

export function createTokenPair(byteLength = 32): { token: string; hash: string } {
  const token = createOpaqueToken(byteLength);
  return { token, hash: hashOpaqueToken(token) };
}
