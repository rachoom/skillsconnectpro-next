import { NextResponse } from 'next/server';
import { requireProviderAdmin } from '@/services/providerAdminSession';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    requireProviderAdmin(request);
    const url = new URL(request.url);
    const id = Number(url.searchParams.get('applicationId'));
    const index = Number(url.searchParams.get('index'));
    if (!Number.isSafeInteger(id) || id <= 0 || !Number.isInteger(index) || index < 0 || index >= 3) {
      return new NextResponse('Invalid image reference.', { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    const { data: application, error: applicationError } = await supabase
      .from('artisan_applications').select('portfolio_images').eq('id', id).single();
    if (applicationError || !application) return new NextResponse('Not found.', { status: 404 });
    const path = Array.isArray(application.portfolio_images) ? application.portfolio_images[index] : null;
    if (typeof path !== 'string' || !/^[0-9a-f-]{36}\/work-[1-3]\.jpg$/.test(path)) {
      return new NextResponse('Not found.', { status: 404 });
    }
    const { data, error } = await supabase.storage.from('provider-application-proofs').download(path);
    if (error || !data) return new NextResponse('Not found.', { status: 404 });
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'",
      },
    });
  } catch (error) {
    const unauthorised = error instanceof Error && error.name === 'UnauthorisedError';
    return new NextResponse(unauthorised ? 'Unauthorised.' : 'Could not load image.', {
      status: unauthorised ? 401 : 500,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
