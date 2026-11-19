import { NextResponse } from 'next/server';
import { directoryFilters } from '@/services/marketplace/directoryServices';
import { supabase } from '@/services/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const columns = 'id, first_name, last_name, category, location, image_url, banner_url, verified, status, bio, marketplace_rating, marketplace_review_count, portfolio_urls, proof_of_work';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  // This preview is a visual review of the real, publicly listed providers.
  // Staging Supabase is paused; read only the existing public production API.
  // Never inject production credentials into preview deployments.
  if (process.env.VERCEL_ENV === 'preview' &&
      process.env.VERCEL_GIT_COMMIT_REF === 'design/provider-premium-identity-20261119') {
    try {
      const response = await fetch(`https://skillsconnectpro.co.za/api/providers?${params}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error(`Live directory returned HTTP ${response.status}`);
      const payload: unknown = await response.json();
      if (!payload || typeof payload !== 'object' || !('providers' in payload)
          || !Array.isArray(payload.providers)) {
        throw new Error('Unexpected public directory response');
      }
      return NextResponse.json(payload, {
        headers: {
          'Cache-Control': 'no-store',
          'X-SCP-Preview-Data': 'production-public-directory',
        },
      });
    } catch (error) {
      console.error('Provider design preview could not load the public directory:', error);
      return NextResponse.json(
        { error: 'Design preview cannot reach the public directory.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }
  }
  const headers = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' };
  try {
    const profiles = () => supabase.from('artisans').select(columns).eq('status', 'active');
    if (params.has('id')) {
      const id = Number(params.get('id'));
      if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647) {
        return NextResponse.json({ error: 'Invalid provider ID.' }, { status: 400 });
      }
      const { data } = await profiles().eq('id', id).throwOnError();
      return NextResponse.json({ providers: data }, { headers });
    }

    const search = (params.get('q') || '').trim();
    const service = params.get('service') || '';
    const page = Number(params.get('page') || '1');
    if (!Number.isSafeInteger(page) || page < 1 || page > 10000000 || search.length > 300 || service.length > 1000) {
      return NextResponse.json({ error: 'Invalid directory filters.' }, { status: 400 });
    }
    // Older clients request the directory without paging parameters.
    const pageSize = params.size ? 18 : 120;
    const { data: labels } = await supabase.rpc('public_directory_categories').throwOnError();
    const { services, serviceCategories, searchCategories } = directoryFilters(labels, service, search);
    const offset = (page - 1) * pageSize;
    const filters = {
      search_text: search, service_categories: serviceCategories, search_categories: searchCategories,
    };
    const { data: matches, count, error } = await supabase.rpc('public_directory_matches', filters, { count: 'exact' })
      .order('verified', { ascending: false, nullsFirst: false })
      .order('marketplace_review_count', { ascending: false, nullsFirst: false })
      .order('id').range(offset, offset + pageSize - 1);
    if (error?.code === 'PGRST103' && page > 1) {
      // The last page may disappear while somebody is browsing.
      const latest = await supabase.rpc('public_directory_matches', filters, { count: 'exact' })
        .range(0, 0).throwOnError();
      return NextResponse.json({ providers: [], services, total: latest.count, page, pageSize }, { headers });
    }
    if (error) throw error;
    const ids = (matches || []).map((row: { id: number }) => row.id);
    const { data } = ids.length ? await profiles().in('id', ids).throwOnError() : { data: [] };
    const byId = new Map(data?.map(row => [row.id, row]));
    const providers = ids.map((id: number) => byId.get(id)).filter(Boolean);
    return NextResponse.json({ providers, services, total: count, page, pageSize }, { headers });
  } catch (error) {
    console.error('Public provider directory query failed:', error);
    return NextResponse.json({ error: 'Provider profiles are temporarily unavailable.' }, { status: 503 });
  }
}
