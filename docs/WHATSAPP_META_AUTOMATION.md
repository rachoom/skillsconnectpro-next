# Meta WhatsApp automation

Skills Connect Pro supports three WhatsApp Cloud API message paths:

1. Customer project confirmation / waiver after a job is submitted.
2. Provider job invitation messages when routing creates an invitation wave.
3. Admin summary alerts when provider dispatch is pending or completed.

All outbound sends are disabled unless the related environment flags are enabled.

Keep the customer, admin and provider switches separate during rollout. This
allows customer confirmations and admin alerts to be tested before provider
messages are fully automated.

## Required Meta setup

Create a Meta Business WhatsApp app, connect a WhatsApp Business phone number, and configure these production environment variables:

```env
MARKETPLACE_PUBLIC_URL=https://www.skillsconnectpro.co.za
META_WHATSAPP_GRAPH_API_VERSION=v23.0
META_WHATSAPP_PHONE_NUMBER_ID=...
META_WHATSAPP_ACCESS_TOKEN=...
META_WHATSAPP_APP_SECRET=...
META_WHATSAPP_WEBHOOK_VERIFY_TOKEN=...
```

The webhook callback URL is:

```text
https://www.skillsconnectpro.co.za/api/webhooks/whatsapp
```

Subscribe the webhook to WhatsApp message status updates so the app can update invitation rows from sent to delivered or failed.

## Provider invitation automation

Enable this only after the provider template is approved:

```env
MARKETPLACE_WHATSAPP_DELIVERY_MODE=automatic
MARKETPLACE_WHATSAPP_AUTO_SEND=true
META_WHATSAPP_TEMPLATE_NAME=provider_job_invitation
META_WHATSAPP_TEMPLATE_LANGUAGE=en
```

Template parameters:

| Parameter | Value |
| --- | --- |
| `{{1}}` | Provider name |
| `{{2}}` | Project category |
| `{{3}}` | Project location |
| `{{4}}` | Project title |
| `{{5}}` | Response deadline |
| `{{6}}` | Secure provider opportunity link |

Suggested provider template body:

```text
Hi {{1}}, Skills Connect Pro has a {{2}} request in {{3}}: {{4}}.

Please review and respond before {{5}}:
{{6}}

By responding, you confirm that you are an independent provider, that any quote or inspection remains your responsibility, and that customer contact details must only be used for this job.
```

## Customer confirmation / waiver

Enable this after the customer template is approved:

```env
MARKETPLACE_CUSTOMER_WHATSAPP_ENABLED=true
META_WHATSAPP_CUSTOMER_CONFIRMATION_TEMPLATE_NAME=customer_project_confirmation
META_WHATSAPP_CUSTOMER_CONFIRMATION_TEMPLATE_LANGUAGE=en
```

Template parameters:

| Parameter | Value |
| --- | --- |
| `{{1}}` | Customer name |
| `{{2}}` | Project title |
| `{{3}}` | Secure customer project link |

Suggested customer template body:

```text
Hi {{1}}, your Skills Connect Pro request has been received: {{2}}.

Track provider responses here:
{{3}}

Reminder: Skills Connect Pro shares your project brief with suitable independent providers. Your contact details stay private until you choose to connect with a provider. Providers remain independent and may need to inspect, quote and agree work terms directly with you.
```

## Admin summary alert

Enable this after the admin template is approved:

```env
MARKETPLACE_ADMIN_WHATSAPP_ALERTS_ENABLED=true
MARKETPLACE_ADMIN_WHATSAPP_NUMBER=27...
META_WHATSAPP_ADMIN_ALERT_TEMPLATE_NAME=admin_dispatch_alert
META_WHATSAPP_ADMIN_ALERT_TEMPLATE_LANGUAGE=en
```

Template parameters:

| Parameter | Value |
| --- | --- |
| `{{1}}` | Dispatch summary |
| `{{2}}` | Project title |
| `{{3}}` | Admin URL |

Suggested admin template body:

```text
Skills Connect Pro update: {{1}} for {{2}}.

Open the admin console:
{{3}}
```

## Activation order

1. Configure `META_WHATSAPP_*` credentials and webhook verification token.
2. Verify the webhook in Meta.
3. Create and approve the three templates above.
4. Enable `MARKETPLACE_CUSTOMER_WHATSAPP_ENABLED=true`.
5. Enable `MARKETPLACE_ADMIN_WHATSAPP_ALERTS_ENABLED=true`.
6. Test with provider delivery still manual.
7. Enable full provider automation with `MARKETPLACE_WHATSAPP_DELIVERY_MODE=automatic` and `MARKETPLACE_WHATSAPP_AUTO_SEND=true`.

The delivery code records provider message attempts in `lead_invitation_delivery_attempts`. Meta webhook status updates then keep `lead_invitations` aligned with delivered or failed provider messages.
