import { NextResponse } from 'next/server';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { getProviderOpportunityHandoff } from '@/services/marketplace/providerResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedAccount();

  if (!user) {
    return NextResponse.json(
      { target: null },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  let token = '';
  try {
    const body = await request.json() as { token?: unknown };
    token = typeof body.token === 'string' ? body.token : '';
  } catch {
    return NextResponse.json(
      { target: null },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  if (!token || token.length < 20) {
    return NextResponse.json(
      { target: null },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  const { data: role, error } = await supabase
    .from('account_roles')
    .select('linked_artisan_id')
    .eq('user_id', user.id)
    .eq('role', 'artisan')
    .eq('status', 'active')
    .not('linked_artisan_id', 'is', null)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Provider opportunity handoff role lookup failed:', error.message);
    return NextResponse.json(
      { target: null },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  const providerId = Number(role?.linked_artisan_id);
  if (!Number.isInteger(providerId) || providerId <= 0) {
    return NextResponse.json(
      { target: null },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  try {
    const handoff = await getProviderOpportunityHandoff(token, providerId);
    return NextResponse.json(
      {
        target: handoff
          ? `/artisan-business/opportunity/${encodeURIComponent(handoff.invitationId)}`
          : null,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (handoffError) {
    console.error('Provider opportunity handoff failed:', handoffError);
    return NextResponse.json(
      { target: null },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
}
