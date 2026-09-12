type ReadinessState = 'ready' | 'disabled' | 'incomplete';

export type WhatsAppReadinessSection = {
  status: ReadinessState;
  enabled: boolean;
  configured: boolean;
  missing: string[];
  notes: string[];
};

export type WhatsAppAutomationReadiness = {
  checkedAt: string;
  base: WhatsAppReadinessSection;
  customer: WhatsAppReadinessSection & {
    templateName: string | null;
    templateLanguage: string | null;
  };
  admin: WhatsAppReadinessSection & {
    recipientConfigured: boolean;
    templateName: string | null;
    templateLanguage: string | null;
  };
  provider: WhatsAppReadinessSection & {
    deliveryMode: string;
    autoSendEnabled: boolean;
    templateName: string | null;
    templateLanguage: string | null;
  };
  webhook: WhatsAppReadinessSection;
  rollout: {
    readyForCustomerAdminTest: boolean;
    readyForProviderAutoSend: boolean;
    providerAutoSendArmed: boolean;
    nextSteps: string[];
  };
};

function value(key: string): string | null {
  const configuredValue = process.env[key]?.trim();
  return configuredValue ? configuredValue : null;
}

function isTrue(key: string): boolean {
  return value(key) === 'true';
}

function missing(keys: string[]): string[] {
  return keys.filter((key) => !value(key));
}

function section(input: {
  enabled: boolean;
  required: string[];
  notes?: string[];
}): WhatsAppReadinessSection {
  const missingKeys = missing(input.required);
  const configured = missingKeys.length === 0;

  return {
    status: !input.enabled ? 'disabled' : configured ? 'ready' : 'incomplete',
    enabled: input.enabled,
    configured,
    missing: missingKeys,
    notes: input.notes ?? [],
  };
}

function templateLanguage(...keys: string[]): string | null {
  for (const key of keys) {
    const configuredValue = value(key);
    if (configuredValue) return configuredValue;
  }
  return null;
}

export function getWhatsAppAutomationReadiness(): WhatsAppAutomationReadiness {
  const baseRequired = [
    'META_WHATSAPP_GRAPH_API_VERSION',
    'META_WHATSAPP_PHONE_NUMBER_ID',
    'META_WHATSAPP_ACCESS_TOKEN',
  ];
  const baseMissing = missing(baseRequired);
  const baseConfigured = baseMissing.length === 0;

  const customerLanguage = templateLanguage(
    'META_WHATSAPP_CUSTOMER_CONFIRMATION_TEMPLATE_LANGUAGE',
    'META_WHATSAPP_TEMPLATE_LANGUAGE',
  );
  const adminLanguage = templateLanguage(
    'META_WHATSAPP_ADMIN_ALERT_TEMPLATE_LANGUAGE',
    'META_WHATSAPP_TEMPLATE_LANGUAGE',
  );
  const providerLanguage = templateLanguage('META_WHATSAPP_TEMPLATE_LANGUAGE');

  const customerEnabled = isTrue('MARKETPLACE_CUSTOMER_WHATSAPP_ENABLED');
  const adminEnabled = isTrue('MARKETPLACE_ADMIN_WHATSAPP_ALERTS_ENABLED');
  const providerDeliveryMode = value('MARKETPLACE_WHATSAPP_DELIVERY_MODE') ?? 'manual';
  const providerAutoSendEnabled = isTrue('MARKETPLACE_WHATSAPP_AUTO_SEND');
  const providerAutoSendArmed =
    providerDeliveryMode.toLowerCase() === 'automatic' && providerAutoSendEnabled;

  const base: WhatsAppReadinessSection = {
    status: baseConfigured ? 'ready' : 'incomplete',
    enabled: true,
    configured: baseConfigured,
    missing: baseMissing,
    notes: [
      value('MARKETPLACE_PUBLIC_URL')
        ? 'Public marketplace URL is explicitly configured.'
        : 'Public marketplace URL will fall back to https://www.skillsconnectpro.co.za.',
    ],
  };

  const customerRequired = [
    ...baseRequired,
    'META_WHATSAPP_CUSTOMER_CONFIRMATION_TEMPLATE_NAME',
    ...(customerLanguage
      ? []
      : ['META_WHATSAPP_CUSTOMER_CONFIRMATION_TEMPLATE_LANGUAGE or META_WHATSAPP_TEMPLATE_LANGUAGE']),
  ];
  const customer = {
    ...section({
      enabled: customerEnabled,
      required: customerRequired,
      notes: [
        customerEnabled
          ? 'Customer confirmation messages are armed when a new project is created.'
          : 'Customer confirmation messages are currently off.',
      ],
    }),
    templateName: value('META_WHATSAPP_CUSTOMER_CONFIRMATION_TEMPLATE_NAME'),
    templateLanguage: customerLanguage,
  };

  const adminRequired = [
    ...baseRequired,
    'MARKETPLACE_ADMIN_WHATSAPP_NUMBER',
    'META_WHATSAPP_ADMIN_ALERT_TEMPLATE_NAME',
    ...(adminLanguage
      ? []
      : ['META_WHATSAPP_ADMIN_ALERT_TEMPLATE_LANGUAGE or META_WHATSAPP_TEMPLATE_LANGUAGE']),
  ];
  const admin = {
    ...section({
      enabled: adminEnabled,
      required: adminRequired,
      notes: [
        adminEnabled
          ? 'Admin WhatsApp alerts are armed for dispatch summaries.'
          : 'Admin WhatsApp alerts are currently off.',
      ],
    }),
    recipientConfigured: Boolean(value('MARKETPLACE_ADMIN_WHATSAPP_NUMBER')),
    templateName: value('META_WHATSAPP_ADMIN_ALERT_TEMPLATE_NAME'),
    templateLanguage: adminLanguage,
  };

  const providerRequired = [
    ...baseRequired,
    'META_WHATSAPP_TEMPLATE_NAME',
    ...(providerLanguage ? [] : ['META_WHATSAPP_TEMPLATE_LANGUAGE']),
  ];
  const provider = {
    ...section({
      enabled: providerAutoSendArmed,
      required: providerRequired,
      notes: [
        providerAutoSendArmed
          ? 'Provider auto-send is armed. New invitation waves can send through Meta automatically.'
          : 'Provider auto-send is off. Manual dispatch remains the active test path.',
      ],
    }),
    deliveryMode: providerDeliveryMode,
    autoSendEnabled: providerAutoSendEnabled,
    templateName: value('META_WHATSAPP_TEMPLATE_NAME'),
    templateLanguage: providerLanguage,
  };

  const webhook = section({
    enabled: true,
    required: [
      'META_WHATSAPP_APP_SECRET',
      'META_WHATSAPP_WEBHOOK_VERIFY_TOKEN',
    ],
    notes: [
      'Webhook URL: https://www.skillsconnectpro.co.za/api/webhooks/whatsapp',
    ],
  });

  const readyForCustomerAdminTest =
    base.configured &&
    customer.configured &&
    admin.configured &&
    webhook.configured;
  const readyForProviderAutoSend =
    base.configured &&
    provider.configured &&
    webhook.configured &&
    providerAutoSendArmed;

  const nextSteps: string[] = [];
  if (!base.configured) {
    nextSteps.push('Add the Meta Graph API version, phone number ID and access token in Vercel production env vars.');
  }
  if (!webhook.configured) {
    nextSteps.push('Add the Meta app secret and webhook verify token, then verify the webhook callback in Meta.');
  }
  if (!customer.configured) {
    nextSteps.push('Create and approve the customer confirmation template, then add its env vars.');
  }
  if (!admin.configured) {
    nextSteps.push('Create and approve the admin alert template, then add the admin WhatsApp recipient number.');
  }
  if (!customerEnabled || !adminEnabled) {
    nextSteps.push('Enable customer/admin WhatsApp flags first; keep provider auto-send off for the first live test.');
  }
  if (!providerAutoSendArmed) {
    nextSteps.push('Leave provider auto-send disabled until customer/admin alerts pass a controlled test.');
  }
  if (nextSteps.length === 0) {
    nextSteps.push('Run a controlled customer job submission and confirm customer/admin WhatsApp delivery before enabling provider auto-send.');
  }

  return {
    checkedAt: new Date().toISOString(),
    base,
    customer,
    admin,
    provider,
    webhook,
    rollout: {
      readyForCustomerAdminTest,
      readyForProviderAutoSend,
      providerAutoSendArmed,
      nextSteps,
    },
  };
}
