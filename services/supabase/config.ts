/**
 * Supabase clients expect the project origin, not a Data API endpoint copied
 * from the dashboard. Keep this shared by browser, server and proxy clients so
 * a trailing /rest/v1 (or another Supabase API path) cannot break Auth.
 */
export function normaliseSupabaseProjectUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, '');
  const withoutApiPath = trimmed.replace(/\/(?:rest|auth|storage|realtime)\/v1$/i, '');

  let parsed: URL;
  try {
    parsed = new URL(withoutApiPath);
  } catch {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid absolute project URL.');
  }

  if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must use HTTPS.');
  }

  return parsed.toString().replace(/\/$/, '');
}

export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (!url || !key) {
    throw new Error('Supabase public configuration is missing.');
  }

  return { url: normaliseSupabaseProjectUrl(url), key };
}
