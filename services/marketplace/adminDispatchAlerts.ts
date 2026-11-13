import {
  isPlausibleWhatsAppRecipient,
  normaliseWhatsAppRecipient,
} from './whatsappPolicy.js';
import { getSupabaseAdmin } from '../supabaseAdmin';
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

/**
 * WhatsApp dispatch summaries are internal operational messages. A configured
 * destination alone is not authorisation: it must belong to an active
 * marketplace administrator and it must not be the current project's customer.
 * Fail closed on missing records or database errors; customer/provider messages
 * are delivered through separate services and are unaffected.
 */
async function isAuthorisedAdminRecipient(recipient: string, projectId: string): Promise<boolean> {
  const db = getSupabaseAdmin();
  const { data: project, error: projectError } = await db
    .from('projects')
    .select('guest_phone')
    .eq('id', projectId)
    .maybeSingle();

  if (projectError || !project) {
    console.error('Admin WhatsApp alert suppressed: project recipient validation unavailable.');
    return false;
  }
  if (normaliseWhatsAppRecipient(project.guest_phone) === recipient) {
    console.warn('Admin WhatsApp alert suppressed: recipient is also this project customer.');
    return false;
  }

  const { data: administrators, error: adminsError } = await db
    .from('marketplace_admin_users')
    .select('user_id')
    .eq('is_active', true);

  if (adminsError || !administrators?.length) {
    console.warn('Admin WhatsApp alert suppressed: no authorised administrator was available.');
    return false;
  }

  const adminUserIds = administrators
    .map((admin) => admin.user_id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);
  if (!adminUserIds.length) return false;

  const { data: profiles, error: profilesError } = await db
    .from('profiles')
    .select('phone')
    .in('id', adminUserIds);

  if (profilesError) {
    console.error('Admin WhatsApp alert suppressed: administrator profile lookup unavailable.');
    return false;
  }

  return (profiles ?? []).some((profile) => (
    isPlausibleWhatsAppRecipient(profile.phone) &&
    normaliseWhatsAppRecipient(profile.phone) === recipient
  ));
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
  if (!(await isAuthorisedAdminRecipient(recipient, input.projectId))) {
    return {
      status: 'disabled',
      reason: 'Admin WhatsApp alert skipped: recipient is not a registered administrator phone or matches the customer.',
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
