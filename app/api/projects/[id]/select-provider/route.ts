import { NextResponse } from 'next/server';
import { selectProviderForProject } from '@/services/marketplace/matches';

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

    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.providerResponseId !== 'string' || !body.providerResponseId.trim()) {
      return NextResponse.json({ error: 'providerResponseId is required.' }, { status: 400 });
    }

    const match = await selectProviderForProject({
      projectId,
      projectAccessToken,
      providerResponseId: body.providerResponseId,
    });

    return NextResponse.json({ match }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to select provider.';
    const configurationError = message.includes('SUPABASE_');
    const missing = message.toLowerCase().includes('not found');

    console.error('POST project provider selection failed:', error);

    return NextResponse.json(
      { error: configurationError ? 'Project selection service is not configured.' : message },
      { status: configurationError ? 503 : missing ? 404 : 400 },
    );
  }
}
