import { NextResponse } from 'next/server';
import { requireMarketplaceAdmin } from '@/services/marketplace/adminAuth';
import { getProviderCandidates } from '@/services/marketplace/providerCandidates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireMarketplaceAdmin(request);
    const { id: projectId } = await context.params;
    const result = await getProviderCandidates(projectId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load provider candidates.';
    const unauthorised = error instanceof Error && error.name === 'UnauthorisedError';
    const configurationError = message.includes('MARKETPLACE_ADMIN_API_KEY') || message.includes('SUPABASE_');

    console.error('GET project candidates failed:', error);

    return NextResponse.json(
      { error: unauthorised ? 'Unauthorised.' : configurationError ? 'Marketplace service is not configured.' : message },
      { status: unauthorised ? 401 : configurationError ? 503 : 400 },
    );
  }
}
