import { NextResponse } from 'next/server';
import { releaseContactsForProject } from '@/services/marketplace/matches';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await context.params;
    const projectAccessToken = request.headers.get('x-project-access-token');

    if (!projectAccessToken) {
      return NextResponse.json({ error: 'Project access token is required.' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    if (body.confirmShare !== true) {
      return NextResponse.json(
        { error: 'You must confirm contact sharing before continuing.' },
        { status: 400 },
      );
    }

    const contacts = await releaseContactsForProject({
      projectId,
      projectAccessToken,
      confirmShare: true,
    });

    return NextResponse.json({ contacts }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to release contact details.';
    const configurationError = message.includes('SUPABASE_');
    const missing = message.toLowerCase().includes('not found');

    console.error('POST project contact release failed:', error);

    return NextResponse.json(
      { error: configurationError ? 'Contact release service is not configured.' : message },
      { status: configurationError ? 503 : missing ? 404 : 400 },
    );
  }
}
