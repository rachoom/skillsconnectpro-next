import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';

function secureStringEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function unauthorised(message = 'Unauthorised marketplace administration request.'): never {
  const error = new Error(message);
  error.name = 'UnauthorisedError';
  throw error;
}

export async function requireMarketplaceAdminAccess(request: Request): Promise<void> {
  const expectedKey = process.env.MARKETPLACE_ADMIN_API_KEY;
  const suppliedKey = request.headers.get('x-marketplace-admin-key');

  if (expectedKey && suppliedKey && secureStringEquals(expectedKey, suppliedKey)) {
    return;
  }

  const authorization = request.headers.get('authorization') || '';
  const token = authorization.toLowerCase().startsWith('bearer ')
    ? authorization.slice(7).trim()
    : '';

  if (!token) unauthorised();

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase admin-session verification is not configured.');
  }

  const client = createClient(supabaseUrl.replace(/\/+$/, ''), anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData.user) unauthorised('Your admin session has expired.');

  const { data: isAdmin, error: adminError } = await client.rpc('is_marketplace_admin');
  if (adminError) {
    throw new Error(`Unable to verify marketplace administrator access: ${adminError.message}`);
  }
  if (isAdmin !== true) unauthorised();
}
