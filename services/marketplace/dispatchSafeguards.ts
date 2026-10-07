import { createHash, randomUUID } from 'node:crypto';
import { getSupabaseAdmin } from '../supabaseAdmin';

export class MarketplaceBusyError extends Error {}

export async function withMarketplaceLease<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const owner = randomUUID();
  const supabase = getSupabaseAdmin();
  const acquired = await supabase.rpc('acquire_marketplace_dispatch_lease', { p_key: key, p_owner: owner });
  if (acquired.error) throw new Error('Dispatch protection is unavailable.');
  if (acquired.data !== true) throw new MarketplaceBusyError('This project is already being processed.');
  try { return await operation(); }
  finally {
    const released = await supabase.rpc('release_marketplace_dispatch_lease', { p_key: key, p_owner: owner });
    if (released.error) console.error('Dispatch lease release failed; it will expire automatically.');
  }
}

export function providerAutoSendApplies(createdAt: string): boolean {
  const start = Date.parse(process.env.MARKETPLACE_PROVIDER_AUTOMATION_START_AT || '');
  const created = Date.parse(createdAt);
  return process.env.MARKETPLACE_WHATSAPP_AUTO_SEND === 'true'
    && process.env.MARKETPLACE_WHATSAPP_DELIVERY_MODE?.trim().toLowerCase() === 'automatic'
    && Number.isFinite(start) && Number.isFinite(created) && created >= start;
}

function limit(key: string, fallback: number, maximum: number): number {
  const value = Number(process.env[key]);
  return Number.isInteger(value) && value >= 1 && value <= maximum ? value : fallback;
}

export async function reserveProviderSendBudget(providerId: number): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const enabled = await supabase.rpc('marketplace_provider_dispatch_enabled');
  if (enabled.error) throw new Error('Provider dispatch control is unavailable.');
  if (enabled.data !== true) return false;
  const limits: Array<[string, string, number, number]> = [
    ['provider_send_hour', 'global', limit('MARKETPLACE_PROVIDER_HOURLY_LIMIT', 20, 100), 3600],
    ['provider_send_day', 'global', limit('MARKETPLACE_PROVIDER_DAILY_LIMIT', 60, 200), 86400],
    ['provider_recipient_day', String(providerId), 3, 86400],
  ];
  for (const [bucket, key, count, seconds] of limits) {
    const { data, error } = await supabase.rpc('consume_public_request_limit', {
      p_bucket: bucket, p_key_hash: createHash('sha256').update(key).digest('hex'),
      p_limit: count, p_window_seconds: seconds,
    });
    if (error) throw new Error('Provider send budget is unavailable.');
    if (data !== true) return false;
  }
  return true;
}
