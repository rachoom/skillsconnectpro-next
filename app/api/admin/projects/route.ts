import { NextResponse } from 'next/server';
import { requireMarketplaceAdmin } from '@/services/marketplace/adminAuth';
import { getOpenProjectsForAdmin } from '@/services/marketplace/adminProjects';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    requireMarketplaceAdmin(request);
    const projects = await getOpenProjectsForAdmin();
    return NextResponse.json({ projects });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load projects.';
    const unauthorised = error instanceof Error && error.name === 'UnauthorisedError';
    const configurationError = message.includes('MARKETPLACE_ADMIN_API_KEY') || message.includes('SUPABASE_');

    console.error('GET /api/admin/projects failed:', error);

    return NextResponse.json(
      { error: unauthorised ? 'Unauthorised.' : configurationError ? 'Marketplace service is not configured.' : message },
      { status: unauthorised ? 401 : configurationError ? 503 : 400 },
    );
  }
}
