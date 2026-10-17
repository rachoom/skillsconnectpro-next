import { createBrowserClient } from '@supabase/ssr';
import { getSupabasePublicConfig } from './config';

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createBrowserSupabaseClient() {
  if (browserClient) return browserClient;
  const { url, key } = getSupabasePublicConfig();
  browserClient = createBrowserClient(url, key);
  return browserClient;
}
