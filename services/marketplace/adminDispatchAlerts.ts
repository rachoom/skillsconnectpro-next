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

  const baseConfig = getMetaWhatsAppConfiguration('Admin WhatsApp alerts');
  const recipient = process.env.MARKETPLACE_ADMIN_WHATSAPP_NUMBER?.trim();
  const templateName = process.env.META_WHATSAPP_ADMIN_ALERT_TEMPLATE_NAME?.trim();
  const templateLanguage =
    process.env.META_WHATSAPP_ADMIN_ALERT_TEMPLATE_LANGUAGE?.trim() ||
    process.env.META_WHATSAPP_TEMPLATE_LANGUAGE?.trim();

  if (
    !baseConfig ||
    !recipient ||
    !templateName ||
    !templateLanguage
  ) {
    console.error('Admin WhatsApp alerts are enabled but alert configuration is incomplete.');
    return null;
  }

  return {
    ...baseConfig,
    recipient,
    templateName,
    templateLanguage,
    publicSiteUrl: publicMarketplaceUrl(),
  };
}

export async function notifyAdminProviderDispatch(input: {
  projectId: string;
  projectTitle: string;
  invitationsTotal: number;
  sentCount: number;
  failedCount: number;
  manualCount: number;
}): Promise<AdminDispatchAlertResult> {
  if (input.invitationsTotal <= 0) {
    return { status: 'disabled', reason: 'No provider invitation dispatch was attempted.' };
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
  const summary = input.manualCount > 0
    ? `${input.manualCount} provider invite(s) need manual WhatsApp send`
    : `${input.sentCount} provider invite(s) sent automatically${input.failedCount > 0 ? `, ${input.failedCount} failed` : ''}`;

  const delivery = await sendMetaWhatsAppTemplate({
    config,
    to: recipient,
    templateName: config.templateName,
    templateLanguage: config.templateLanguage,
    components: [
      bodyComponent([
        summary,
        input.projectTitle,
        adminUrl,
      ]),
    ],
  });

  if (delivery.status === 'failed') {
    return {
      status: 'failed',
      reason: delivery.reason,
    };
  }

  return { status: 'sent', externalMessageId: delivery.externalMessageId };
}

export async function notifyAdminManualDispatchQueued(input: {
  projectId: string;
  projectTitle: string;
  manualInvitationCount: number;
}): Promise<AdminDispatchAlertResult> {
  return notifyAdminProviderDispatch({
    projectId: input.projectId,
    projectTitle: input.projectTitle,
    invitationsTotal: input.manualInvitationCount,
    sentCount: 0,
    failedCount: 0,
    manualCount: input.manualInvitationCount,
  });
}
