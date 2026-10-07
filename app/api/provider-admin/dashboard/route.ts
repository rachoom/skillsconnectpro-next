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

export async function GET(request: Request) {
  try {
    requireProviderAdmin(request);
    const supabase = getSupabaseAdmin();

    const [applicationsResult, unclaimedResult, suggestionsResult, reviewsResult] = await Promise.all([
      supabase.from('artisan_applications').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('artisans').select('id, first_name, last_name, category, phone, is_claimed').eq('is_claimed', false).order('id', { ascending: false }),
      supabase.from('service_suggestions').select('*').order('created_at', { ascending: false }),
      supabase.from('artisan_reviews').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
    ]);

    for (const result of [applicationsResult, unclaimedResult, suggestionsResult, reviewsResult]) {
      if (result.error) throw result.error;
    }

    return NextResponse.json({
      applications: applicationsResult.data || [],
      unclaimedArtisans: unclaimedResult.data || [],
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

    if (action === 'approve_application') {
      const id = numericId(body.id);
      const { data: app, error: appError } = await supabase
        .from('artisan_applications')
        .select('*')
        .eq('id', id)
        .eq('status', 'pending')
        .single();
      if (appError || !app) throw appError || new Error('Application not found.');

      const { error: insertError } = await supabase.from('artisans').insert([{
        first_name: app.first_name,
        last_name: app.last_name,
        category: app.trade,
        location: app.location,
        phone: app.phone,
        bio: app.bio,
        verified: true,
        rating: 5.0,
        is_claimed: false,
        image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400',
      }]);
      if (insertError) throw insertError;

      const { error: updateError } = await supabase.from('artisan_applications').update({ status: 'approved' }).eq('id', id);
      if (updateError) throw updateError;
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
