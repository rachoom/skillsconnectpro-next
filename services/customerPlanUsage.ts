import { getSupabaseAdmin } from './supabaseAdmin';

export type CustomerPhotoUsageReservation = {
  userId: string;
  settled: boolean;
};

export type CustomerPhotoUsageResult =
  | { allowed: true; reservation: CustomerPhotoUsageReservation; remaining: number; planCode: string }
  | { allowed: false; remaining: number; planCode: string };

/**
 * Uses the service-role-only database function so a browser cannot bypass a
 * photo-analysis allowance by altering client state or issuing parallel calls.
 */
export async function reserveCustomerPhotoAssessment(userId: string): Promise<CustomerPhotoUsageResult> {
  const { data, error } = await getSupabaseAdmin().rpc('consume_customer_photo_assessment', {
    target_user_id: userId,
  });
  if (error) throw new Error(`Unable to verify your project-photo allowance: ${error.message}`);

  const result = Array.isArray(data) ? data[0] : data;
  const allowed = Boolean(result?.is_allowed);
  const remaining = Math.max(0, Number(result?.remaining ?? 0));
  const planCode = typeof result?.plan_code === 'string' ? result.plan_code : 'free';

  return allowed
    ? { allowed: true, remaining, planCode, reservation: { userId, settled: false } }
    : { allowed: false, remaining, planCode };
}

export async function releaseCustomerPhotoAssessment(reservation: CustomerPhotoUsageReservation | null) {
  if (!reservation || reservation.settled) return;
  reservation.settled = true;
  const { error } = await getSupabaseAdmin().rpc('release_customer_photo_assessment', {
    target_user_id: reservation.userId,
  });
  if (error) console.error('Unable to release customer project-photo allowance:', error.message);
}

export function isCustomerPlanLimitError(error: unknown, limit: string) {
  return error instanceof Error && error.message.includes(`SCP_PLAN_LIMIT_${limit}`);
}
