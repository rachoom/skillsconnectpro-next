import { NextResponse } from 'next/server';
import {
  COMPLAINT_CATEGORIES,
  getProjectFeedbackState,
  submitProjectComplaint,
  submitProjectReview,
  type ComplaintCategory,
} from '@/services/marketplace/feedback';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function accessToken(request: Request): string {
  const token = request.headers.get('x-project-access-token')?.trim();
  if (!token) throw new Error('Project access token is required.');
  return token;
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unable to process project feedback.';
  const missingToken = message === 'Project access token is required.';
  const notFound = message.toLowerCase().includes('not found');
  const duplicate = message.toLowerCase().includes('already exists');
  const configurationError = message.includes('SUPABASE_');

  console.error('Project feedback API failed:', error);

  return NextResponse.json(
    { error: configurationError ? 'Project feedback service is not configured.' : message },
    { status: configurationError ? 503 : missingToken ? 401 : notFound ? 404 : duplicate ? 409 : 400 },
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await context.params;
    const feedback = await getProjectFeedbackState(projectId, accessToken(request));
    return NextResponse.json({ feedback });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await context.params;
    const token = accessToken(request);
    const body = (await request.json()) as Record<string, unknown>;

    if (body.type === 'review') {
      if (typeof body.overallRating !== 'number') {
        throw new Error('overallRating is required.');
      }

      const review = await submitProjectReview({
        projectId,
        accessToken: token,
        overallRating: body.overallRating,
        reviewText: typeof body.reviewText === 'string' ? body.reviewText : null,
      });

      return NextResponse.json({ review }, { status: 201 });
    }

    if (body.type === 'complaint') {
      if (
        typeof body.category !== 'string' ||
        !COMPLAINT_CATEGORIES.includes(body.category as ComplaintCategory)
      ) {
        throw new Error(`category must be one of: ${COMPLAINT_CATEGORIES.join(', ')}.`);
      }
      if (typeof body.description !== 'string') {
        throw new Error('description is required.');
      }

      const complaint = await submitProjectComplaint({
        projectId,
        accessToken: token,
        category: body.category as ComplaintCategory,
        description: body.description,
      });

      return NextResponse.json({ complaint }, { status: 201 });
    }

    throw new Error('Feedback type must be review or complaint.');
  } catch (error) {
    return errorResponse(error);
  }
}
