import { NextResponse } from 'next/server';
import { requireMarketplaceAdminAccess } from '@/services/marketplace/adminSessionAuth';
import { processAutomaticRouting } from '@/services/marketplace/automaticRouting';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseForce(body: unknown): boolean {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  return (body as Record<string, unknown>).force === true;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireMarketplaceAdminAccess(request);
    const { id: projectId } = await context.params;

    let force = false;
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > 0) {
      force = parseForce(await request.json());
    }

    const routing = await processAutomaticRouting({ projectId, force });
    const origin = new URL(request.url).origin;

    return NextResponse.json({
      routing: {
        ...routing,
        invitations: routing.invitations.map((invitation) => ({
          ...invitation,
          responseUrl: `${origin}/provider-opportunity/${invitation.responseToken}`,
        })),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to process routing.';
    const unauthorised = error instanceof Error && error.name === 'UnauthorisedError';
    const configurationError =
      message.includes('MARKETPLACE_ADMIN_API_KEY') ||
      message.includes('Supabase admin-session verification') ||
      message.includes('SUPABASE_');

    console.error('POST automatic routing failed:', error);

    return NextResponse.json(
      {
        error: unauthorised
          ? message
          : configurationError
            ? 'Marketplace service is not configured.'
            : message,
      },
      { status: unauthorised ? 401 : configurationError ? 503 : 400 },
    );
  }
}
