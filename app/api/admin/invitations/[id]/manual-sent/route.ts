import { NextResponse } from 'next/server';
import { requireMarketplaceAdmin } from '@/services/marketplace/adminAuth';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type UpdatedInvitationRow = {
  id: string;
  project_id: string;
  provider_id: string | number;
  status: string;
  sent_at: string | null;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    requireMarketplaceAdmin(request);
    const { id: invitationId } = await context.params;
    const sentAt = new Date().toISOString();
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('lead_invitations')
      .update({
        status: 'sent',
        delivery_channel: 'whatsapp',
        delivery_provider: 'manual_whatsapp_click_to_send',
        delivery_attempted_at: sentAt,
        sent_at: sentAt,
        failure_reason: null,
      })
      .eq('id', invitationId)
      .in('status', ['queued', 'sent', 'delivered', 'viewed'])
      .select('id, project_id, provider_id, status, sent_at')
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to mark invitation as manually sent: ${error.message}`);
    }
    if (!data) {
      return NextResponse.json(
        { error: 'Invitation was not found or is no longer dispatchable.' },
        { status: 404 },
      );
    }

    const invitation = data as UpdatedInvitationRow;
    const providerId = Number(invitation.provider_id);
    if (Number.isInteger(providerId) && providerId > 0) {
      const attemptResult = await supabase.from('lead_invitation_delivery_attempts').insert({
        lead_invitation_id: invitation.id,
        provider_id: providerId,
        delivery_channel: 'whatsapp',
        delivery_provider: 'manual_whatsapp_click_to_send',
        status: 'sent',
        external_message_id: null,
        error_code: null,
        error_message: null,
      });

      if (attemptResult.error) {
        console.error('Manual WhatsApp delivery attempt could not be recorded:', attemptResult.error.message);
      }
    }

    const eventResult = await supabase.from('project_status_events').insert({
      project_id: invitation.project_id,
      event_type: 'manual_whatsapp_invitation_sent',
      actor_type: 'admin',
      message: 'Provider invitation was opened for manual WhatsApp delivery by the admin.',
      event_data: {
        invitationId: invitation.id,
        providerId: invitation.provider_id,
        deliveryProvider: 'manual_whatsapp_click_to_send',
        sentAt,
      },
    });

    if (eventResult.error) {
      console.error('Manual WhatsApp sent event could not be recorded:', eventResult.error.message);
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        projectId: invitation.project_id,
        providerId: invitation.provider_id,
        status: invitation.status,
        sentAt: invitation.sent_at,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to mark invitation as manually sent.';
    const unauthorised = error instanceof Error && error.name === 'UnauthorisedError';
    const configurationError = message.includes('MARKETPLACE_ADMIN_API_KEY') || message.includes('SUPABASE_');

    console.error('POST manual invitation sent failed:', error);

    return NextResponse.json(
      {
        error: unauthorised
          ? 'Unauthorised.'
          : configurationError
            ? 'Marketplace service is not configured.'
            : message,
      },
      { status: unauthorised ? 401 : configurationError ? 503 : 400 },
    );
  }
}
