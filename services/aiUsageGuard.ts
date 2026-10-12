import { createHmac, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from './supabaseAdmin';

const SESSION_COOKIE = 'scp_ai_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type UsageProfile = {
  kind: 'customer_project' | 'provider_onboarding' | 'quick_intent';
  hasImage: boolean;
  reserveCents: number;
  sessionLimit: number;
  imageLimit: number;
  windowSeconds: number;
};

export type UsageReservation = {
  id: string;
  cookieValue?: string;
  reserveCents: number;
  settled: boolean;
};

type GuardResult =
  | { allowed: true; reservation: UsageReservation | null }
  | { allowed: false; response: NextResponse };

function guardEnabled() {
  return process.env.AI_USAGE_GUARD_ENABLED !== 'false';
}

function serverSecret() {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

function hash(value: string) {
  const secret = serverSecret();
  if (!secret) throw new Error('AI usage guard configuration is missing.');
  return createHmac('sha256', secret).update(value).digest('hex');
}

function clientIp(request: Request) {
  return request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')?.trim()
    || 'unknown';
}

function getSession(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  if (match?.[1] && /^[a-zA-Z0-9_-]{32,128}$/.test(match[1])) {
    return { value: match[1], isNew: false };
  }
  return { value: randomBytes(32).toString('base64url'), isNew: true };
}

function budgetCents() {
  const value = Number(process.env.AI_MONTHLY_BUDGET_CENTS || 50_000);
  return Number.isFinite(value) ? Math.max(100, Math.min(1_000_000, Math.round(value))) : 50_000;
}

function unavailableMigrationError(error: { code?: string; message?: string } | null) {
  return error?.code === 'PGRST202' || error?.code === '42883'
    || /reserve_ai_usage|function.*does not exist/i.test(error?.message || '');
}

/**
 * Reserves a small portion of the monthly AI budget before a Gemini call. The
 * database function makes the check atomic across Vercel instances; the
 * reservation is settled with actual token usage or released on failure.
 */
export async function reserveAiUsage(request: Request, profile: UsageProfile): Promise<GuardResult> {
  if (!guardEnabled()) return { allowed: true, reservation: null };

  try {
    const session = getSession(request);
    const { data, error } = await getSupabaseAdmin().rpc('reserve_ai_usage', {
      p_session_hash: hash(session.value),
      p_ip_hash: hash(clientIp(request)),
      p_usage_kind: profile.kind,
      p_has_image: profile.hasImage,
      p_session_limit: profile.sessionLimit,
      p_image_limit: profile.imageLimit,
      p_window_seconds: profile.windowSeconds,
      p_monthly_budget_cents: budgetCents(),
      p_reserve_cents: profile.reserveCents,
    });

    if (error) {
      // Code may deploy before the migration. Existing IP limits remain active
      // until the durable ledger is installed, rather than breaking the pilot.
      if (unavailableMigrationError(error)) {
        console.warn('AI usage guard migration has not been applied yet.');
        return { allowed: true, reservation: null };
      }
      console.error('AI usage reservation failed:', error.message);
      return { allowed: false, response: NextResponse.json(
        { error: 'AI service is temporarily unavailable. Please try again shortly.' },
        { status: 503 },
      ) };
    }

    const result = data as { allowed?: boolean; reason?: string; reservation_id?: string } | null;
    if (!result?.allowed || !result.reservation_id) {
      const message = result?.reason === 'monthly_budget'
        ? 'The free AI planner is taking a short break while we refresh this month’s allowance.'
        : result?.reason === 'photo_limit'
          ? 'You have used the photo allowance for this guided project. Continue with the details you have already provided.'
          : 'You have reached the free guided-project allowance for now. Continue by sending your project to suitable local providers.';
      return { allowed: false, response: NextResponse.json({ error: message }, { status: 429 }) };
    }

    return {
      allowed: true,
      reservation: {
        id: result.reservation_id,
        cookieValue: session.isNew ? session.value : undefined,
        reserveCents: profile.reserveCents,
        settled: false,
      },
    };
  } catch (error) {
    console.error('AI usage guard is unavailable:', error);
    return { allowed: false, response: NextResponse.json(
      { error: 'AI service is temporarily unavailable. Please try again shortly.' },
      { status: 503 },
    ) };
  }
}

function tokensFrom(response: unknown) {
  const responseRecord = response && typeof response === 'object'
    ? response as Record<string, unknown>
    : {};
  const usage = responseRecord.usageMetadata && typeof responseRecord.usageMetadata === 'object'
    ? responseRecord.usageMetadata as Record<string, unknown>
    : {};
  return {
    input: Math.max(0, Number(usage.promptTokenCount || usage.totalTokenCount || 0)),
    output: Math.max(0, Number(usage.candidatesTokenCount || 0)),
  };
}

function estimatedCents(model: string, response: unknown, maximum: number) {
  const pricePerMillionUsd = model.includes('flash-lite')
    ? { input: 0.30, output: 2.50 }
    : { input: 0.75, output: 3.75 };
  const zarPerUsd = Number(process.env.AI_COST_ZAR_PER_USD || 20);
  const { input, output } = tokensFrom(response);
  const cents = Math.ceil(((input * pricePerMillionUsd.input + output * pricePerMillionUsd.output) / 1_000_000)
    * (Number.isFinite(zarPerUsd) ? zarPerUsd : 20) * 100);
  return { cents: Math.max(1, Math.min(maximum, cents)), input, output };
}

export async function settleAiUsage(reservation: UsageReservation | null, model: string, response: unknown) {
  if (!reservation || reservation.settled) return;
  reservation.settled = true;
  const amount = estimatedCents(model, response, reservation.reserveCents);
  try {
    const { error } = await getSupabaseAdmin().rpc('settle_ai_usage', {
      p_reservation_id: reservation.id,
      p_settled_cents: amount.cents,
      p_input_tokens: amount.input,
      p_output_tokens: amount.output,
      p_model: model,
    });
    if (error && !unavailableMigrationError(error)) console.error('AI usage settlement failed:', error.message);
  } catch (error) {
    console.error('AI usage settlement failed:', error);
  }
}

export async function releaseAiUsage(reservation: UsageReservation | null) {
  if (!reservation || reservation.settled) return;
  reservation.settled = true;
  try {
    const { error } = await getSupabaseAdmin().rpc('release_ai_usage', { p_reservation_id: reservation.id });
    if (error && !unavailableMigrationError(error)) console.error('AI usage release failed:', error.message);
  } catch (error) {
    console.error('AI usage release failed:', error);
  }
}

export async function linkAiUsageToProject(request: Request, projectId: string) {
  if (!guardEnabled() || !projectId) return;
  try {
    const session = getSession(request);
    const { error } = await getSupabaseAdmin().rpc('link_ai_usage_to_project', {
      p_session_hash: hash(session.value),
      p_project_id: projectId,
    });
    if (error && !unavailableMigrationError(error)) console.error('AI usage project-link failed:', error.message);
  } catch (error) {
    console.error('AI usage project-link failed:', error);
  }
}

export function withAiUsageCookie(response: NextResponse, reservation: UsageReservation | null) {
  if (reservation?.cookieValue) {
    response.cookies.set(SESSION_COOKIE, reservation.cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  }
  return response;
}

export const customerProjectUsage = (hasImage: boolean): UsageProfile => ({
  kind: 'customer_project',
  hasImage,
  reserveCents: hasImage ? 100 : 50,
  sessionLimit: 4,
  imageLimit: 1,
  windowSeconds: 60 * 60 * 24 * 7,
});

export const quickIntentUsage = (hasImage: boolean): UsageProfile => ({
  kind: 'quick_intent',
  hasImage,
  reserveCents: hasImage ? 25 : 10,
  sessionLimit: 4,
  imageLimit: 1,
  windowSeconds: 60 * 60 * 24 * 7,
});

export const providerOnboardingUsage = (): UsageProfile => ({
  kind: 'provider_onboarding',
  hasImage: true,
  reserveCents: 25,
  sessionLimit: 5,
  imageLimit: 5,
  windowSeconds: 60 * 60 * 24,
});
