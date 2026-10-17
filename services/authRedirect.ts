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

export function withResult(path: string, key: string, value: string) {
  const parsed = new URL(safeInternalPath(path), 'https://skillsconnectpro.co.za');
  parsed.searchParams.set(key, value);
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
