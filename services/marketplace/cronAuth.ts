import { getSupabaseAdmin } from '../supabaseAdmin';
import { hashOpaqueToken, safeTokenEquals } from './tokens';

export async function isCronAuthorised(request: Request): Promise<boolean> {
  const authorization = request.headers.get('authorization') || '';
  const supplied = authorization.toLowerCase().startsWith('bearer ') ? authorization.slice(7).trim() : '';
  if (supplied.length < 20) return false;
  if (process.env.CRON_SECRET && safeTokenEquals(hashOpaqueToken(process.env.CRON_SECRET), supplied)) return true;
  const { data, error } = await getSupabaseAdmin().from('marketplace_cron_credentials').select('id')
    .eq('id', 'marketplace-routing').eq('token_hash', hashOpaqueToken(supplied)).maybeSingle();
  if (error) throw new Error('Unable to verify scheduled marketplace access.');
  return Boolean(data);
}
