import { createHash, randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';
import { requireProviderAdmin } from '@/services/providerAdminSession';
import { readBoundedJson, publicRequestError } from '@/services/publicRequestGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function numericId(value: unknown): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new Error('A valid record id is required.');
  return id;
}

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function newToken(): string {
  return randomBytes(32).toString('base64url');
}

async function issueClaimInvite(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  artisanId: number,
  applicationId: number | null,
) {
  await supabase
    .from('provider_claim_invites')
    .update({ status: 'revoked', updated_at: new Date().toISOString() })
    .eq('artisan_id', artisanId)
    .in('status', ['pending', 'sent']);

  const token = newToken();
  const { data, error } = await supabase
    .from('provider_claim_invites')
    .insert({
      artisan_id: artisanId,
      application_id: applicationId,
      token_hash: tokenHash(token),
      status: 'sent',
      sent_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('id, artisan_id, application_id, status, sent_at, expires_at')
    .single();

  if (error || !data) throw error || new Error('Unable to create claim invitation.');
  return { invite: data, token };
}

export async function GET(request: Request) {
  try {
    requireProviderAdmin(request);
    const supabase = getSupabaseAdmin();

    const [
      applicationsResult,
      awaitingClaimResult,
      finalApprovalResult,
      directoryResult,
      suggestionsResult,
      reviewsResult,
      inviteResult,
    ] = await Promise.all([
      supabase.from('artisan_applications').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase
        .from('artisans')
        .select('id, first_name, last_name, category, phone, location, is_claimed, approval_status, status, verified, created_at')
        .eq('approval_status', 'awaiting_claim')
        .order('created_at', { ascending: false }),
      supabase
        .from('artisans')
        .select('id, first_name, last_name, category, phone, location, is_claimed, approval_status, status, verified, image_url, portfolio_urls, created_at')
        .eq('approval_status', 'claimed_pending_approval')
        .order('created_at', { ascending: false }),
      supabase
        .from('artisans')
        .select('id, first_name, last_name, name, category, phone, location, is_claimed, approval_status, status, verified, created_at')
        .order('created_at', { ascending: false })
        .limit(250),
      supabase.from('service_suggestions').select('*').order('created_at', { ascending: false }),
      supabase.from('artisan_reviews').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase
        .from('provider_claim_invites')
        .select('id, artisan_id, application_id, status, sent_at, claimed_at, expires_at, created_at')
        .order('created_at', { ascending: false })
        .limit(250),
    ]);

    for (const result of [
      applicationsResult,
      awaitingClaimResult,
      finalApprovalResult,
      directoryResult,
      suggestionsResult,
      reviewsResult,
      inviteResult,
    ]) {
      if (result.error) throw result.error;
    }

    return NextResponse.json({
      applications: applicationsResult.data || [],
      awaitingClaims: awaitingClaimResult.data || [],
      finalApprovals: finalApprovalResult.data || [],
      providerDirectory: directoryResult.data || [],
      claimInvites: inviteResult.data || [],
      suggestions: suggestionsResult.data || [],
      reviews: reviewsResult.data || [],
    });
  } catch (error) {
    const unauthorised = error instanceof Error && error.name === 'UnauthorisedError';
    console.error('Provider admin dashboard load failed:', error);
    return NextResponse.json(
      { error: unauthorised ? 'Unauthorised.' : 'Unable to load provider administration data.' },
      { status: unauthorised ? 401 : 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    requireProviderAdmin(request);
    const body = await readBoundedJson(request, 80_000);
    const action = typeof body.action === 'string' ? body.action : '';
    const supabase = getSupabaseAdmin();

    if (action === 'update_application') {
      const id = numericId(body.id);
      const changes = (body.changes && typeof body.changes === 'object' && !Array.isArray(body.changes))
        ? body.changes as Record<string, unknown> : {};
      const allowed = ['first_name', 'last_name', 'trade', 'location', 'phone', 'bio', 'institution'] as const;
      const update: Record<string, string | null> = {};
      for (const key of allowed) {
        if (key in changes) {
          const value = changes[key];
          update[key] = value == null ? null : String(value).trim();
        }
      }
      const { error } = await supabase.from('artisan_applications').update(update).eq('id', id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === 'prepare_application_claim') {
      const id = numericId(body.id);
      const { data: app, error: appError } = await supabase
        .from('artisan_applications')
        .select('*')
        .eq('id', id)
        .eq('status', 'pending')
        .single();
      if (appError || !app) throw appError || new Error('Application not found.');

      const { data: existingInvite } = await supabase
        .from('provider_claim_invites')
        .select('artisan_id')
        .eq('application_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let artisanId = existingInvite?.artisan_id ?? null;

      if (!artisanId) {
        const { data: existingByPhone } = await supabase
          .from('artisans')
          .select('id')
          .eq('phone', app.phone)
          .limit(1)
          .maybeSingle();

        artisanId = existingByPhone?.id ?? null;
      }

      if (!artisanId) {
        const { data: artisan, error: insertError } = await supabase
          .from('artisans')
          .insert({
            first_name: app.first_name,
            last_name: app.last_name,
            category: app.trade,
            location: app.location,
            phone: app.phone,
            bio: app.bio,
            verified: false,
            is_claimed: false,
            status: 'draft',
            approval_status: 'awaiting_claim',
            portfolio_urls: Array.isArray(app.portfolio_images) ? app.portfolio_images : [],
          })
          .select('id')
          .single();
        if (insertError || !artisan) throw insertError || new Error('Unable to create draft provider.');
        artisanId = artisan.id;
      } else {
        const { error } = await supabase
          .from('artisans')
          .update({
            first_name: app.first_name,
            last_name: app.last_name,
            category: app.trade,
            location: app.location,
            phone: app.phone,
            bio: app.bio,
            verified: false,
            is_claimed: false,
            status: 'draft',
            approval_status: 'awaiting_claim',
          })
          .eq('id', artisanId);
        if (error) throw error;
      }

      const issued = await issueClaimInvite(supabase, artisanId, id);
      const { error: applicationError } = await supabase
        .from('artisan_applications')
        .update({ status: 'awaiting_claim' })
        .eq('id', id);
      if (applicationError) throw applicationError;

      return NextResponse.json({ ok: true, artisanId, invite: issued.invite, token: issued.token });
    }

    if (action === 'create_claim_invite') {
      const artisanId = numericId(body.artisanId);
      const { data: artisan, error: artisanError } = await supabase
        .from('artisans')
        .select('id, is_claimed, approval_status')
        .eq('id', artisanId)
        .single();
      if (artisanError || !artisan) throw artisanError || new Error('Provider not found.');

      if (artisan.approval_status === 'approved' && artisan.is_claimed) {
        throw new Error('This provider is already claimed and approved.');
      }

      const { error: updateError } = await supabase
        .from('artisans')
        .update({
          status: 'draft',
          approval_status: 'awaiting_claim',
          verified: false,
          is_claimed: false,
        })
        .eq('id', artisanId);
      if (updateError) throw updateError;

      const issued = await issueClaimInvite(supabase, artisanId, null);
      return NextResponse.json({ ok: true, artisanId, invite: issued.invite, token: issued.token });
    }

    if (action === 'final_approve_claim') {
      const artisanId = numericId(body.artisanId);
      const { data: artisan, error: artisanError } = await supabase
        .from('artisans')
        .select('id, is_claimed, approval_status')
        .eq('id', artisanId)
        .single();
      if (artisanError || !artisan) throw artisanError || new Error('Provider not found.');
      if (!artisan.is_claimed || artisan.approval_status !== 'claimed_pending_approval') {
        throw new Error('Provider has not completed the consent/claim step yet.');
      }

      const now = new Date().toISOString();
      const { error: approveError } = await supabase
        .from('artisans')
        .update({
          status: 'active',
          approval_status: 'approved',
          verified: true,
          approved_at: now,
        })
        .eq('id', artisanId);
      if (approveError) throw approveError;

      const { data: invite } = await supabase
        .from('provider_claim_invites')
        .select('id, application_id')
        .eq('artisan_id', artisanId)
        .eq('status', 'claimed')
        .order('claimed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (invite) {
        await supabase
          .from('provider_claim_invites')
          .update({ status: 'approved', updated_at: now })
          .eq('id', invite.id);
        if (invite.application_id) {
          await supabase
            .from('artisan_applications')
            .update({ status: 'approved' })
            .eq('id', invite.application_id);
        }
      }

      return NextResponse.json({ ok: true });
    }

    if (action === 'reject_claim') {
      const artisanId = numericId(body.artisanId);
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('artisans')
        .update({ status: 'draft', approval_status: 'rejected', verified: false })
        .eq('id', artisanId);
      if (error) throw error;
      await supabase
        .from('provider_claim_invites')
        .update({ status: 'declined', updated_at: now })
        .eq('artisan_id', artisanId)
        .in('status', ['pending', 'sent', 'claimed']);
      return NextResponse.json({ ok: true });
    }

    if (action === 'reject_application') {
      const id = numericId(body.id);
      const { error } = await supabase.from('artisan_applications').update({ status: 'rejected' }).eq('id', id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === 'approve_review') {
      const id = numericId(body.id);
      const { error } = await supabase.from('artisan_reviews').update({ status: 'approved' }).eq('id', id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === 'delete_review') {
      const id = numericId(body.id);
      const { error } = await supabase.from('artisan_reviews').delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === 'delete_suggestion') {
      const id = numericId(body.id);
      const { error } = await supabase.from('service_suggestions').delete().eq('id', id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  } catch (error) {
    const publicError = publicRequestError(error);
    if (publicError) return publicError;
    const unauthorised = error instanceof Error && error.name === 'UnauthorisedError';
    const message = error instanceof Error ? error.message : 'Unable to update provider administration data.';
    console.error('Provider admin dashboard action failed:', error);
    return NextResponse.json(
      { error: unauthorised ? 'Unauthorised.' : message },
      { status: unauthorised ? 401 : 400 },
    );
  }
}
