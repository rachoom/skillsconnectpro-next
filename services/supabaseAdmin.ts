import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

/**
 * Supabase's JavaScript client expects the project base URL only. It appends
 * paths such as /rest/v1 itself. This normaliser protects server routes from an
 * environment variable copied from the REST API panel with /rest/v1 attached.
 */
function normaliseSupabaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  const withoutApiPath = trimmed.replace(/\/(?:rest|auth|storage|realtime)\/v1$/i, '');

  let parsed: URL;
  try {
    parsed = new URL(withoutApiPath);
  } catch {
    throw new Error('SUPABASE_URL must be a valid absolute project URL.');
  }

  if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') {
    throw new Error('SUPABASE_URL must use HTTPS.');
  }

  return parsed.toString().replace(/\/$/, '');
}

/**
 * Server-only Supabase client for marketplace operations.
 *
 * Never expose SUPABASE_SERVICE_ROLE_KEY through NEXT_PUBLIC_* variables or
 * import this module into a client component.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;

  const configuredUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!configuredUrl) {
    throw new Error('Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.');
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY.');
  }

  const supabaseUrl = normaliseSupabaseUrl(configuredUrl);

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
