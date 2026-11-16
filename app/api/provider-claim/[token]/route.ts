import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

async function getInvite(token: string) {
  const supabase = getSupabaseAdmin();
  const { data: invite, error } = await supabase
    .from('provider_claim_invites')
    .select('id, artisan_id, application_id, status, expires_at, claimed_at')
    .eq('token_hash', hashToken(token))
    .maybeSingle();

  if (error) throw error;
  if (!invite) return { supabase, invite: null };
  return { supabase, invite };
}

function expired(expiresAt: string | null) {
  return !expiresAt || new Date(expiresAt).getTime() <= Date.now();
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const { supabase, invite } = await getInvite(token);

    if (!invite || !['pending', 'sent'].includes(invite.status) || expired(invite.expires_at)) {
      return NextResponse.json({ error: 'This invitation is invalid or has expired.' }, { status: 404 });
    }

    const { data: artisan, error } = await supabase
      .from('artisans')
      .select('id, first_name, last_name, name, category, location, phone, bio, image_url, portfolio_urls, approval_status, is_claimed')
      .eq('id', invite.artisan_id)
      .single();

    if (error || !artisan) {
      return NextResponse.json({ error: 'Provider profile not found.' }, { status: 404 });
    }

    return NextResponse.json({
      provider: artisan,
      expiresAt: invite.expires_at,
      consentVersion: 'provider-claim-v1',
    });
  } catch (error) {
    console.error('Provider claim lookup failed:', error);
    return NextResponse.json({ error: 'Unable to load this invitation.' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const { supabase, invite } = await getInvite(token);

    if (!invite || !['pending', 'sent'].includes(invite.status) || expired(invite.expires_at)) {
      return NextResponse.json({ error: 'This invitation is invalid or has expired.' }, { status: 404 });
    }

    const form = await request.formData();
    const agreed = String(form.get('agreed') || '') === 'true';
    if (!agreed) {
      return NextResponse.json({ error: 'Consent is required before the profile can be submitted.' }, { status: 400 });
    }

    const { data: artisan, error: artisanError } = await supabase
      .from('artisans')
      .select('id, portfolio_urls')
      .eq('id', invite.artisan_id)
      .single();
    if (artisanError || !artisan) throw artisanError || new Error('Provider profile not found.');

    const submittedBio = String(form.get('bio') || '').trim();
    if (submittedBio.length > 600) {
      return NextResponse.json({ error: 'Your profile description must be 600 characters or fewer.' }, { status: 400 });
    }

    // Unclaimed/scanned records may contain a generic or unrelated image. Never
    // carry that into a newly confirmed public profile unless the provider
    // explicitly uploads their own photo or logo during this claim flow.
    let imageUrl: string | null = null;
    const existingPortfolio = Array.isArray(artisan.portfolio_urls) ? artisan.portfolio_urls.filter(Boolean) : [];
    const uploadedPortfolio: string[] = [];

    const profile = form.get('profile');
    if (profile instanceof File && profile.size > 0) {
      if (!ALLOWED_TYPES.has(profile.type) || profile.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: 'Profile image must be JPG, PNG, WEBP or HEIC and no larger than 6MB.' }, { status: 400 });
      }
      const ext = (profile.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
      const path = `claims/${artisan.id}/profile-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('artisan_media')
        .upload(path, Buffer.from(await profile.arrayBuffer()), { contentType: profile.type, upsert: false });
      if (uploadError) throw uploadError;
      imageUrl = supabase.storage.from('artisan_media').getPublicUrl(path).data.publicUrl;
    }

    const portfolioFiles = form.getAll('portfolio').filter((value): value is File => value instanceof File && value.size > 0);
    if (portfolioFiles.length > 5) {
      return NextResponse.json({ error: 'A maximum of five proof-of-work images may be uploaded.' }, { status: 400 });
    }

    for (let index = 0; index < portfolioFiles.length; index += 1) {
      const file = portfolioFiles[index];
      if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: `${file.name} must be JPG, PNG, WEBP or HEIC and no larger than 6MB.` }, { status: 400 });
      }
      const ext = (file.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
      const path = `claims/${artisan.id}/portfolio-${Date.now()}-${index}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('artisan_media')
        .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      uploadedPortfolio.push(supabase.storage.from('artisan_media').getPublicUrl(path).data.publicUrl);
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('artisans')
      .update({
        is_claimed: true,
        status: 'draft',
        approval_status: 'claimed_pending_approval',
        verified: false,
        image_url: imageUrl,
        bio: submittedBio || null,
        portfolio_urls: [...existingPortfolio, ...uploadedPortfolio].slice(0, 10),
        updated_at: now,
      })
      .eq('id', artisan.id);
    if (updateError) throw updateError;

    const { error: inviteError } = await supabase
      .from('provider_claim_invites')
      .update({
        status: 'claimed',
        consent_version: 'provider-claim-v1',
        claimed_at: now,
        updated_at: now,
      })
      .eq('id', invite.id);
    if (inviteError) throw inviteError;

    return NextResponse.json({
      ok: true,
      message: 'Thank you. Your profile has been confirmed and sent to SkillsConnect Pro for final approval.',
    });
  } catch (error) {
    console.error('Provider claim submission failed:', error);
    return NextResponse.json({ error: 'Unable to submit your confirmation. Please try again.' }, { status: 500 });
  }
}
