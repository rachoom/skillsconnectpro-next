export type MetaWhatsAppTemplateParameter = {
  type: 'text';
  text: string;
};

export type MetaWhatsAppTemplateComponent =
  | {
      type: 'body';
      parameters: MetaWhatsAppTemplateParameter[];
    }
  | {
      type: 'button';
      sub_type: 'url';
      index: string;
      parameters: MetaWhatsAppTemplateParameter[];
    };

export type MetaWhatsAppConfiguration = {
  accessToken: string;
  phoneNumberId: string;
  graphApiVersion: string;
};

export type MetaWhatsAppSendResult =
  | {
      status: 'sent';
      externalMessageId: string;
    }
  | {
      status: 'failed';
      reason: string;
      errorCode: string | null;
    };

export function getMetaWhatsAppConfiguration(
  featureName: string,
): MetaWhatsAppConfiguration | null {
  const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID?.trim();
  const graphApiVersion = process.env.META_WHATSAPP_GRAPH_API_VERSION?.trim();

  if (!accessToken || !phoneNumberId || !graphApiVersion) {
    console.error(`${featureName} is enabled but Meta Cloud API configuration is incomplete.`);
    return null;
  }

  return {
    accessToken,
    phoneNumberId,
    graphApiVersion,
  };
}

export function publicMarketplaceUrl(): string {
  return (process.env.MARKETPLACE_PUBLIC_URL || 'https://www.skillsconnectpro.co.za')
    .replace(/\/+$/, '');
}

export function textParameter(value: unknown): MetaWhatsAppTemplateParameter {
  const text = typeof value === 'string' ? value : String(value ?? '');
  return {
    type: 'text',
    text: text.trim().slice(0, 1_024) || '-',
  };
}

export function bodyComponent(
  values: unknown[],
): MetaWhatsAppTemplateComponent {
  return {
    type: 'body',
    parameters: values.map((value) => textParameter(value)),
  };
}

export async function sendMetaWhatsAppTemplate(input: {
  config: MetaWhatsAppConfiguration;
  to: string;
  templateName: string;
  templateLanguage: string;
  components: MetaWhatsAppTemplateComponent[];
}): Promise<MetaWhatsAppSendResult> {
  const response = await fetch(
    `https://graph.facebook.com/${input.config.graphApiVersion}/${input.config.phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: input.to,
        type: 'template',
        template: {
          name: input.templateName,
          language: { code: input.templateLanguage },
          components: input.components,
        },
      }),
    },
  );

  const payload = await response.json().catch(() => ({})) as {
    messages?: Array<{ id?: string }>;
    error?: { code?: number | string; message?: string };
  };
  const externalMessageId = payload.messages?.[0]?.id ?? null;

  if (!response.ok || !externalMessageId) {
    return {
      status: 'failed',
      reason: payload.error?.message || `Meta WhatsApp request failed with status ${response.status}.`,
      errorCode: payload.error?.code ? String(payload.error.code) : String(response.status),
    };
  }

  return {
    status: 'sent',
    externalMessageId,
  };
}
