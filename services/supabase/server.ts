import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabasePublicConfig } from './config';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabasePublicConfig();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. proxy.ts refreshes them.
        }
      },
    },
  });
}

export async function getAuthenticatedAccount() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userId = typeof claims?.sub === 'string' ? claims.sub : null;

  if (error || !userId) return { supabase, user: null };
  const safeClaims = claims as Record<string, unknown>;
  const metadata = typeof safeClaims.user_metadata === 'object' && safeClaims.user_metadata
    ? safeClaims.user_metadata as Record<string, unknown>
    : null;

  return {
    supabase,
    user: {
      id: userId,
      email: typeof safeClaims.email === 'string' ? safeClaims.email : null,
      name: metadata ? String(metadata.full_name ?? '') || null : null,
    },
  };
}
