import { getSupabaseAdmin } from '../supabaseAdmin';
import {
  isPlausibleWhatsAppRecipient,
  normaliseWhatsAppRecipient,
} from './whatsappPolicy.js';

type DispatchInvitation = {
  invitationId: string;
  providerId: number;
  responseToken: string;
  responseDeadline: string;
  deliveryAddress: string | null;
  providerName: string;
};

type ProjectDeliveryContext = {
  title: string;
  category: string;
  location: string;
};

export type InvitationDeliveryResult = {
  invitationId: string;
  status: 'manual' | 'sent' | 'failed';
  externalMessageId: string | null;
  reason: string | null;
};

type WhatsAppConfiguration = {
  accessToken: string;
  phoneNumberId: string;
  graphApiVersion: string;
  templateName: string;
  templateLanguage: string;
  publicSiteUrl: string;
};

function configuration(): WhatsAppConfiguration | null {
  if (process.env.MARKETPLACE_WHATSAPP_AUTO_SEND !== 'true') return null;

  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID?.trim();
  const graphApiVersion = process.env.META_WHATSAPP_GRAPH_API_VERSION?.trim();
  const templateName = process.env.META_WHATSAPP_TEMPLATE_NAME?.trim();
  const templateLanguage = process.env.META_WHATSAPP_TEMPLATE_LANGUAGE?.trim();

  if (!accessToken || !phoneNumberId || !graphApiVersion || !templateName || !templateLanguage) {
    console.error('WhatsApp auto-send is enabled but its Meta Cloud API configuration is incomplete.');
    return null;
  }

  return {
    accessToken,
    phoneNumberId,
    graphApiVersion,
    templateName,
    templateLanguage,
    publicSiteUrl: (process.env.MARKETPLACE_PUBLIC_URL || 'https://www.skillsconnectpro.co.za')
      .replace(/\/+$/, ''),
  };
}

function providerOpportunityUrl(config: WhatsAppConfiguration, responseToken: string): string {
  return `${config.publicSiteUrl}/provider-opportunity/${encodeURIComponent(responseToken)}`;
}

async function recordAttempt(input: {
  invitation: DispatchInvitation;
  status: 'accepted' | 'failed';
  externalMessageId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('lead_invitation_delivery_attempts').insert({
    lead_invitation_id: input.invitation.invitationId,
    provider_id: input.invitation.providerId,
    delivery_channel: 'whatsapp',
    delivery_provider: 'meta_cloud_api',
    status: input.status,
    external_message_id: input.externalMessageId ?? null,
    error_code: input.errorCode ?? null,
    error_message: input.errorMessage?.slice(0, 1_000) ?? null,
  });

  if (error) {
    console.error('Unable to record WhatsApp delivery attempt:', error.message);
  }
}

async function sendOne(
  config: WhatsAppConfiguration,
  project: ProjectDeliveryContext,
  invitation: DispatchInvitation,
): Promise<InvitationDeliveryResult> {
  const supabase = getSupabaseAdmin();
  const recipient = normaliseWhatsAppRecipient(invitation.deliveryAddress);

  if (!isPlausibleWhatsAppRecipient(recipient)) {
    const reason = 'Provider does not have a valid WhatsApp recipient number.';
    await recordAttempt({ invitation, status: 'failed', errorCode: 'invalid_recipient', errorMessage: reason });
    await supabase
      .from('lead_invitations')
      .update({ status: 'failed', failure_reason: reason, delivery_attempted_at: new Date().toISOString() })
      .eq('id', invitation.invitationId);
    return { invitationId: invitation.invitationId, status: 'failed', externalMessageId: null, reason };
  }

  const response = await fetch(
    `https://graph.facebook.com/${config.graphApiVersion}/${config.phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'template',
        template: {
          name: config.templateName,
          language: { code: config.templateLanguage },
          components: [{
            type: 'body',
            parameters: [
              { type: 'text', text: invitation.providerName },
              { type: 'text', text: project.category },
              { type: 'text', text: project.location },
              { type: 'text', text: project.title },
              { type: 'text', text: new Date(invitation.responseDeadline).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' }) },
              { type: 'text', text: providerOpportunityUrl(config, invitation.responseToken) },
            ],
          }],
        },
      }),
    },
  );

  const payload = await response.json().catch(() => ({})) as {
    messages?: Array<{ id?: string }>;
    error?: { code?: number; message?: string };
  };
  const externalMessageId = payload.messages?.[0]?.id ?? null;

  if (!response.ok || !externalMessageId) {
    const reason = payload.error?.message || `Meta WhatsApp request failed with status ${response.status}.`;
    const errorCode = payload.error?.code ? String(payload.error.code) : String(response.status);
    await recordAttempt({ invitation, status: 'failed', errorCode, errorMessage: reason });
    await supabase
      .from('lead_invitations')
      .update({
        status: 'failed',
        failure_reason: reason.slice(0, 1_000),
        delivery_provider: 'meta_cloud_api',
        delivery_attempted_at: new Date().toISOString(),
      })
      .eq('id', invitation.invitationId);
    return { invitationId: invitation.invitationId, status: 'failed', externalMessageId: null, reason };
  }

  const sentAt = new Date().toISOString();
  await recordAttempt({ invitation, status: 'accepted', externalMessageId });
  const { error: updateError } = await supabase
    .from('lead_invitations')
    .update({
      status: 'sent',
      delivery_channel: 'whatsapp',
      delivery_provider: 'meta_cloud_api',
      external_message_id: externalMessageId,
      delivery_attempted_at: sentAt,
      sent_at: sentAt,
      failure_reason: null,
    })
    .eq('id', invitation.invitationId);

  if (updateError) {
    console.error('WhatsApp message was accepted but invitation state could not be updated:', updateError.message);
  }

  return { invitationId: invitation.invitationId, status: 'sent', externalMessageId, reason: null };
}

export async function dispatchProviderInvitations(input: {
  project: ProjectDeliveryContext;
  invitations: DispatchInvitation[];
}): Promise<InvitationDeliveryResult[]> {
  const config = configuration();
  if (!config) {
    return input.invitations.map((invitation) => ({
      invitationId: invitation.invitationId,
      status: 'manual',
      externalMessageId: null,
      reason: 'Automatic WhatsApp delivery is not enabled.',
    }));
  }

  const results: InvitationDeliveryResult[] = [];
  for (const invitation of input.invitations) {
    try {
      results.push(await sendOne(config, input.project, invitation));
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unexpected WhatsApp delivery failure.';
      console.error('WhatsApp invitation delivery failed:', reason);
      await recordAttempt({ invitation, status: 'failed', errorCode: 'unexpected_error', errorMessage: reason });
      const supabase = getSupabaseAdmin();
      await supabase
        .from('lead_invitations')
        .update({
          status: 'failed',
          failure_reason: reason.slice(0, 1_000),
          delivery_provider: 'meta_cloud_api',
          delivery_attempted_at: new Date().toISOString(),
        })
        .eq('id', invitation.invitationId);
      results.push({ invitationId: invitation.invitationId, status: 'failed', externalMessageId: null, reason });
    }
  }

  return results;
}
