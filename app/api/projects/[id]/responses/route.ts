import { NextResponse } from 'next/server';
import { processAutomaticRouting } from '@/services/marketplace/automaticRouting';
import { getCustomerProjectResponseFeed } from '@/services/marketplace/projectResponses';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function validateClarification(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Clarification must be text.');
  const message = value.trim();
  if (!message) throw new Error('Please enter a clarification.');
  if (message.length > 600) throw new Error('Clarification must be 600 characters or fewer.');

  const contactPatterns = [
    /(?:https?:\/\/|www\.|wa\.me|whatsapp)/i,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
    /(?:\+?\d[\d\s().-]{7,}\d)/,
  ];

  if (contactPatterns.some((pattern) => pattern.test(message))) {
    throw new Error('Please keep contact details private until you select a provider. Remove phone numbers, email addresses or links.');
  }

  return message;
}

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

    let feed = await getCustomerProjectResponseFeed(projectId, accessToken);
    if (!feed) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    let routing: Awaited<ReturnType<typeof processAutomaticRouting>> | null = null;
    try {
      routing = await processAutomaticRouting({ projectId });
      if (routing.invitationsQueued > 0) {
        feed = await getCustomerProjectResponseFeed(projectId, accessToken);
      }
    } catch (routingError) {
      console.error('Customer dashboard routing check failed:', routingError);
    }

    return NextResponse.json({
      ...feed,
      routing: routing
        ? {
            action: routing.action,
            reason: routing.reason,
            waveNumber: routing.waveNumber,
            invitationsQueued: routing.invitationsQueued,
            totalInvitations: routing.totalInvitations,
            validResponses: routing.validResponses,
            targetResponses: routing.targetResponses,
            invitationCap: routing.invitationCap,
            nextCheckAt: routing.nextCheckAt,
          }
        : null,
    });
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

export async function POST(
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
    if (!feed) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    if (feed.match?.providerResponseId) {
      return NextResponse.json({ error: 'Clarification closes once a provider has been selected.' }, { status: 409 });
    }
    if (['cancelled', 'completed', 'unfulfilled'].includes(feed.project.status)) {
      return NextResponse.json({ error: 'This project is closed.' }, { status: 409 });
    }

    const body = await request.json().catch(() => ({}));
    const responseId = typeof body.providerResponseId === 'string' ? body.providerResponseId : '';
    const clarification = validateClarification(body.message);
    const response = feed.responses.find((item) => item.id === responseId);

    if (!response) return NextResponse.json({ error: 'Provider response not found.' }, { status: 404 });
    if (!response.providerMessage && response.responseType !== 'need_information') {
      return NextResponse.json({ error: 'This provider did not request clarification.' }, { status: 400 });
    }
    if (response.customerClarification) {
      return NextResponse.json({ error: 'You have already sent a clarification to this provider.' }, { status: 409 });
    }

    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('provider_responses')
      .update({
        customer_clarification: clarification,
        customer_clarification_at: now,
      })
      .eq('id', responseId)
      .eq('project_id', projectId)
      .is('customer_clarification', null)
      .select('id')
      .maybeSingle();

    if (error) throw new Error(`Unable to save clarification: ${error.message}`);
    if (!data) {
      return NextResponse.json({ error: 'A clarification has already been sent.' }, { status: 409 });
    }

    await supabase.from('project_status_events').insert({
      project_id: projectId,
      event_type: 'customer_clarification_sent',
      actor_type: 'customer',
      message: 'The customer answered a provider clarification question.',
      event_data: { providerResponseId: responseId, providerId: response.providerId },
    });

    return NextResponse.json({ ok: true, clarification, sentAt: now });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to send clarification.';
    console.error('POST project clarification failed:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
