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

type CustomerWhatsAppConfiguration = {
  accessToken: string;
  phoneNumberId: string;
  graphApiVersion: string;
  templateName: string;
  templateLanguage: string;
  publicSiteUrl: string;
};

export type CustomerWhatsAppNotificationResult =
  | { status: 'disabled'; reason: string }
  | { status: 'sent'; externalMessageId: string }
  | { status: 'failed'; reason: string };

function configuration(): CustomerWhatsAppConfiguration | null {
  if (process.env.MARKETPLACE_CUSTOMER_WHATSAPP_ENABLED !== 'true') {
    return null;
  }

  const baseConfig = getMetaWhatsAppConfiguration('Customer WhatsApp confirmation');
  const templateName = process.env.META_WHATSAPP_CUSTOMER_CONFIRMATION_TEMPLATE_NAME?.trim();
  const templateLanguage =
    process.env.META_WHATSAPP_CUSTOMER_CONFIRMATION_TEMPLATE_LANGUAGE?.trim() ||
    process.env.META_WHATSAPP_TEMPLATE_LANGUAGE?.trim();

  if (!baseConfig || !templateName || !templateLanguage) {
    console.error('Customer WhatsApp confirmation is enabled but template configuration is incomplete.');
    return null;
  }

  return {
    ...baseConfig,
    templateName,
    templateLanguage,
    publicSiteUrl: publicMarketplaceUrl(),
  };
}

function customerProjectUrl(config: CustomerWhatsAppConfiguration, projectId: string, accessToken: string): string {
  return `${config.publicSiteUrl}/project/${encodeURIComponent(projectId)}?token=${encodeURIComponent(accessToken)}`;
}

async function recordCustomerNotificationEvent(input: {
  projectId: string;
  status: 'sent' | 'failed';
  message: string;
  externalMessageId?: string | null;
  reason?: string | null;
}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('project_status_events').insert({
    project_id: input.projectId,
    event_type: input.status === 'sent'
      ? 'customer_whatsapp_confirmation_sent'
      : 'customer_whatsapp_confirmation_failed',
    actor_type: 'system',
    message: input.message,
    event_data: {
      deliveryProvider: 'meta_cloud_api',
      externalMessageId: input.externalMessageId ?? null,
      reason: input.reason ?? null,
    },
  });

  if (error) {
    console.error('Customer WhatsApp notification event could not be recorded:', error.message);
  }
}

export async function sendCustomerProjectConfirmation(input: {
  projectId: string;
  accessToken: string;
  customerName: string | null | undefined;
  customerPhone: string | null | undefined;
  projectTitle: string;
}): Promise<CustomerWhatsAppNotificationResult> {
  const config = configuration();
  if (!config) {
    return {
      status: 'disabled',
      reason: 'Customer WhatsApp confirmations are disabled or not configured.',
    };
  }

  const recipient = normaliseWhatsAppRecipient(input.customerPhone);
  if (!isPlausibleWhatsAppRecipient(recipient)) {
    return {
      status: 'disabled',
      reason: 'Customer phone number is not a plausible WhatsApp recipient.',
    };
  }

  const projectUrl = customerProjectUrl(config, input.projectId, input.accessToken);
  const delivery = await sendMetaWhatsAppTemplate({
    config,
    to: recipient,
    templateName: config.templateName,
    templateLanguage: config.templateLanguage,
    components: [
      bodyComponent([
        input.customerName || 'there',
        input.projectTitle,
        projectUrl,
      ]),
    ],
  });

  if (delivery.status === 'failed') {
    await recordCustomerNotificationEvent({
      projectId: input.projectId,
      status: 'failed',
      message: 'Customer WhatsApp confirmation could not be sent.',
      reason: delivery.reason,
    });

    return {
      status: 'failed',
      reason: delivery.reason,
    };
  }

  await recordCustomerNotificationEvent({
    projectId: input.projectId,
    status: 'sent',
    message: 'Customer WhatsApp confirmation and project link were sent.',
    externalMessageId: delivery.externalMessageId,
  });

  return {
    status: 'sent',
    externalMessageId: delivery.externalMessageId,
  };
}
