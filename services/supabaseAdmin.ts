import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { normaliseSupabaseProjectUrl } from './supabase/config';

let adminClient: SupabaseClient | null = null;

/**
 * Server-only Supabase client for marketplace operations.
 *
 * Never expose SUPABASE_SERVICE_ROLE_KEY through NEXT_PUBLIC_* variables or
 * import this module into a client component.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;

  const configuredUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!configuredUrl) {
    throw new Error('Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.');
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.');
  }

  const supabaseUrl = normaliseSupabaseProjectUrl(configuredUrl);

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
