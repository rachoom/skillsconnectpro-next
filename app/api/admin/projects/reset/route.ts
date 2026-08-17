import { NextResponse } from 'next/server';
import { requireMarketplaceAdmin } from '@/services/marketplace/adminAuth';
import { resetMarketplaceTestData } from '@/services/marketplace/adminReset';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RESET_CONFIRMATION = 'RESET_MARKETPLACE_TEST_DATA';

export async function POST(request: Request) {
  try {
    requireMarketplaceAdmin(request);

    const body = await request.json().catch(() => ({}));
    if (body?.confirm !== RESET_CONFIRMATION) {
      return NextResponse.json(
        { error: 'Reset confirmation is required.' },
        { status: 400 },
      );
    }

    const reset = await resetMarketplaceTestData();
    return NextResponse.json({ reset });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reset marketplace test data.';
    const unauthorised = error instanceof Error && error.name === 'UnauthorisedError';
    const configurationError = message.includes('MARKETPLACE_ADMIN_API_KEY') || message.includes('SUPABASE_');

    console.error('POST /api/admin/projects/reset failed:', error);

    return NextResponse.json(
      { error: unauthorised ? 'Unauthorised.' : configurationError ? 'Marketplace service is not configured.' : message },
      { status: unauthorised ? 401 : configurationError ? 503 : 400 },
    );
  }
}
