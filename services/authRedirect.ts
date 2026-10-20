export const AUTH_RETURN_PATH_COOKIE = 'skills_connect_return_path';

export function safeInternalPath(value: string | null | undefined, fallback = '/my-projects') {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;
  try {
    const parsed = new URL(value, 'https://skillsconnectpro.co.za');
    if (parsed.origin !== 'https://skillsconnectpro.co.za') return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

/**
 * Prefer the target supplied by the authentication provider, but retain a
 * same-site fallback for providers or email clients that remove redirect
 * query parameters. Both values are validated as local paths first.
 */
export function resolveAuthReturnPath(
  requestedPath: string | null | undefined,
  rememberedPath: string | null | undefined,
) {
  const requested = safeInternalPath(requestedPath, '');
  if (requested) return requested;
  return safeInternalPath(rememberedPath);
}

export function withResult(path: string, key: string, value: string) {
  const parsed = new URL(safeInternalPath(path), 'https://skillsconnectpro.co.za');
  parsed.searchParams.set(key, value);
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
