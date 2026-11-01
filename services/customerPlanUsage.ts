import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getAuthenticatedAccount } from './supabase/server';
import { getSupabaseAdmin } from './supabaseAdmin';
import { PublicRequestError } from './publicRequestGuard';

export type CustomerPhotoUsageReservation = { userId: string; id: string; settled: boolean };
type PhotoAccess =
  | { allowed: true; reservation: CustomerPhotoUsageReservation | null; planCode: string | null }
  | { allowed: false; response: NextResponse };

/**
 * Same image is debited once per authenticated account/plan period, across
 * endpoints. Browser question counts/history are never entitlement evidence.
 * Anonymous previews keep the separate durable session/IP/monthly AI guards.
 */
export async function reserveCustomerPhotoImage(image: string): Promise<PhotoAccess> {
  if (!image) return { allowed: true, reservation: null, planCode: null };
  const base64 = (image.includes(',') ? image.slice(image.indexOf(',') + 1) : image).replace(/\s/g, '');
  if (!base64 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64) || base64.length % 4 === 1) {
    throw new PublicRequestError('Choose a valid image.', 400);
  }
  const bytes = Buffer.from(base64, 'base64');
  if (!bytes.length) throw new PublicRequestError('Choose a valid image.', 400);
  const { user } = await getAuthenticatedAccount();
  if (!user) return { allowed: true, reservation: null, planCode: null };
  const { data, error } = await getSupabaseAdmin().rpc('reserve_customer_photo_image', {
    p_user_id: user.id,
    p_image_hash: createHash('sha256').update(bytes).digest('hex'),
  });
  if (error) throw new PublicRequestError('Photo allowance checks are temporarily unavailable. Please try again.', 503);
  if (!data?.allowed) {
    const processing = data?.reason === 'processing';
    return { allowed: false, response: NextResponse.json({
      error: processing ? 'This photo is already being analysed. Please wait a moment and try again.'
        : 'You have used the project-photo analyses included with your current plan.',
      code: processing ? 'PHOTO_ANALYSIS_PROCESSING' : 'PHOTO_ANALYSIS_LIMIT',
      upgradeUrl: processing ? undefined : '/plans#homeowners',
      planCode: data?.plan_code ?? 'free',
    }, { status: processing ? 409 : 403 }) };
  }
  return { allowed: true, planCode: data.plan_code ?? 'free', reservation: data.reservation_id
    ? { userId: user.id, id: data.reservation_id, settled: false } : null };
}

async function finish(reservation: CustomerPhotoUsageReservation | null, success: boolean) {
  if (!reservation || reservation.settled) return;
  const { data, error } = await getSupabaseAdmin().rpc('finish_customer_photo_image', {
    p_user_id: reservation.userId, p_reservation_id: reservation.id, p_success: success,
  });
  if (error || data !== true) throw new PublicRequestError('Unable to confirm photo allowance. Please try again.', 503);
  reservation.settled = true;
}

export const settleCustomerPhotoAssessment = (reservation: CustomerPhotoUsageReservation | null) => finish(reservation, true);
export async function releaseCustomerPhotoAssessment(reservation: CustomerPhotoUsageReservation | null) {
  try { await finish(reservation, false); }
  catch (error) { console.error('Photo allowance release failed:', error instanceof Error ? error.message : 'Unknown error'); }
}
export function isCustomerPlanLimitError(error: unknown, limit: string) {
  return error instanceof Error && error.message.includes(`SCP_PLAN_LIMIT_${limit}`);
}
