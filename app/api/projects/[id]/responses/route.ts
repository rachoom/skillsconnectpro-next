import { NextResponse } from 'next/server';
import { getCustomerProjectResponseFeed } from '@/services/marketplace/projectResponses';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await context.params;
    const accessToken = request.headers.get('x-project-access-token');

    if (!accessToken) {
      return NextResponse.json({ error: 'Project access token is required.' }, { status: 401 });
    }

    const feed = await getCustomerProjectResponseFeed(projectId, accessToken);
    if (!feed) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    return NextResponse.json(feed);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load project responses.';
    const configurationError = message.includes('SUPABASE_');

    console.error('GET project responses failed:', error);

    return NextResponse.json(
      { error: configurationError ? 'Project response service is not configured.' : message },
      { status: configurationError ? 503 : 400 },
    );
  }
}
