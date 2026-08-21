import {
  isPlausibleWhatsAppRecipient,
  normaliseWhatsAppRecipient,
} from './whatsappPolicy.js';

type AdminDispatchAlertConfiguration = {
  accessToken: string;
  phoneNumberId: string;
  graphApiVersion: string;
  recipient: string;
  templateName: string;
  templateLanguage: string;
  publicSiteUrl: string;
};

export type AdminDispatchAlertResult =
  | { status: 'disabled'; reason: string }
  | { status: 'sent'; externalMessageId: string | null }
  | { status: 'failed'; reason: string };

function configuration(): AdminDispatchAlertConfiguration | null {
  if (process.env.MARKETPLACE_ADMIN_WHATSAPP_ALERTS_ENABLED !== 'true') {
    return null;
  }

  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID?.trim();
  const graphApiVersion = process.env.META_WHATSAPP_GRAPH_API_VERSION?.trim();
  const recipient = process.env.MARKETPLACE_ADMIN_WHATSAPP_NUMBER?.trim();
  const templateName = process.env.META_WHATSAPP_ADMIN_ALERT_TEMPLATE_NAME?.trim();
  const templateLanguage =
    process.env.META_WHATSAPP_ADMIN_ALERT_TEMPLATE_LANGUAGE?.trim() ||
    process.env.META_WHATSAPP_TEMPLATE_LANGUAGE?.trim();

  if (
    !accessToken ||
    !phoneNumberId ||
    !graphApiVersion ||
    !recipient ||
    !templateName ||
    !templateLanguage
  ) {
    console.error('Admin WhatsApp alerts are enabled but Meta Cloud API alert configuration is incomplete.');
    return null;
  }

  return {
    accessToken,
    phoneNumberId,
    graphApiVersion,
    recipient,
    templateName,
    templateLanguage,
    publicSiteUrl: (process.env.MARKETPLACE_PUBLIC_URL || 'https://www.skillsconnectpro.co.za')
      .replace(/\/+$/, ''),
  };
}

export async function notifyAdminManualDispatchQueued(input: {
  projectId: string;
  projectTitle: string;
  manualInvitationCount: number;
}): Promise<AdminDispatchAlertResult> {
  if (input.manualInvitationCount <= 0) {
    return { status: 'disabled', reason: 'No manual invitation dispatch is pending.' };
  }

  const config = configuration();
  if (!config) {
    return {
      status: 'disabled',
      reason: 'Admin WhatsApp alerts are disabled or not configured.',
    };
  }

  const recipient = normaliseWhatsAppRecipient(config.recipient);
  if (!isPlausibleWhatsAppRecipient(recipient)) {
    return {
      status: 'failed',
      reason: 'Admin WhatsApp alert recipient is not a plausible WhatsApp number.',
    };
  }

  const adminUrl = `${config.publicSiteUrl}/marketplace-admin`;
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
              { type: 'text', text: String(input.manualInvitationCount) },
              { type: 'text', text: input.projectTitle },
              { type: 'text', text: adminUrl },
            ],
          }],
        },
      }),
    },
  );

  const payload = await response.json().catch(() => ({})) as {
    messages?: Array<{ id?: string }>;
    error?: { message?: string };
  };
  const externalMessageId = payload.messages?.[0]?.id ?? null;

  if (!response.ok || !externalMessageId) {
    return {
      status: 'failed',
      reason: payload.error?.message || `Meta WhatsApp admin alert failed with status ${response.status}.`,
    };
  }

  return { status: 'sent', externalMessageId };
}
