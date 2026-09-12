import { getSupabaseAdmin } from '../supabaseAdmin';
import {
  isPlausibleWhatsAppRecipient,
  normaliseWhatsAppRecipient,
} from './whatsappPolicy.js';
import {
  bodyComponent,
  getMetaWhatsAppConfiguration,
  publicMarketplaceUrl,
  sendMetaWhatsAppTemplate,
} from './metaWhatsApp';

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

type WhatsAppDeliveryMode = 'manual' | 'automatic';

type WhatsAppConfiguration = {
  accessToken: string;
  phoneNumberId: string;
  graphApiVersion: string;
  templateName: string;
  templateLanguage: string;
  publicSiteUrl: string;
};

function configuredDeliveryMode(): WhatsAppDeliveryMode {
  return process.env.MARKETPLACE_WHATSAPP_DELIVERY_MODE?.trim().toLowerCase() === 'automatic'
    ? 'automatic'
    : 'manual';
}

function configuration(): WhatsAppConfiguration | null {
  if (configuredDeliveryMode() !== 'automatic') return null;
  if (process.env.MARKETPLACE_WHATSAPP_AUTO_SEND !== 'true') return null;

  const baseConfig = getMetaWhatsAppConfiguration('Provider WhatsApp delivery');
  const templateName = process.env.META_WHATSAPP_TEMPLATE_NAME?.trim();
  const templateLanguage = process.env.META_WHATSAPP_TEMPLATE_LANGUAGE?.trim();

  if (!baseConfig || !templateName || !templateLanguage) {
    console.error('WhatsApp auto-send is enabled but its provider template configuration is incomplete.');
    return null;
  }

  return {
    ...baseConfig,
    templateName,
    templateLanguage,
    publicSiteUrl: publicMarketplaceUrl(),
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

  const delivery = await sendMetaWhatsAppTemplate({
    config,
    to: recipient,
    templateName: config.templateName,
    templateLanguage: config.templateLanguage,
    components: [
      bodyComponent([
        invitation.providerName,
        project.category,
        project.location,
        project.title,
        new Date(invitation.responseDeadline).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' }),
        providerOpportunityUrl(config, invitation.responseToken),
      ]),
    ],
  });

  if (delivery.status === 'failed') {
    const reason = delivery.reason;
    await recordAttempt({ invitation, status: 'failed', errorCode: delivery.errorCode, errorMessage: reason });
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
  await recordAttempt({ invitation, status: 'accepted', externalMessageId: delivery.externalMessageId });
  const { error: updateError } = await supabase
    .from('lead_invitations')
    .update({
      status: 'sent',
      delivery_channel: 'whatsapp',
      delivery_provider: 'meta_cloud_api',
      external_message_id: delivery.externalMessageId,
      delivery_attempted_at: sentAt,
      sent_at: sentAt,
      failure_reason: null,
    })
    .eq('id', invitation.invitationId);

  if (updateError) {
    console.error('WhatsApp message was accepted but invitation state could not be updated:', updateError.message);
  }

  return { invitationId: invitation.invitationId, status: 'sent', externalMessageId: delivery.externalMessageId, reason: null };
}

export async function dispatchProviderInvitations(input: {
  project: ProjectDeliveryContext;
  invitations: DispatchInvitation[];
}): Promise<InvitationDeliveryResult[]> {
  const mode = configuredDeliveryMode();
  const config = configuration();
  if (!config) {
    const reason = mode === 'automatic'
      ? 'Automatic WhatsApp delivery is not enabled or Meta Cloud API configuration is incomplete.'
      : 'Manual WhatsApp delivery mode is active.';

    return input.invitations.map((invitation) => ({
      invitationId: invitation.invitationId,
      status: 'manual',
      externalMessageId: null,
      reason,
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
