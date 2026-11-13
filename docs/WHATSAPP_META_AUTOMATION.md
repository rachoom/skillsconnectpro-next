# Meta WhatsApp automation

Skills Connect Pro supports two WhatsApp Cloud API message paths:

1. Customer project confirmation after a job is submitted.
2. Provider job invitation messages when routing creates an invitation wave.

**Administrator operations are browser-only.** No admin alert templates or admin-console links are sent through WhatsApp. This avoids unnecessary messaging costs.

Customer and provider messages are controlled independently. Provider delivery remains off unless its delivery and auto-send flags are both enabled.

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
Hi {{1}}, a new {{2}} job is available in {{3}}: {{4}}. View the details and respond by {{5}}: {{6}} — Skills Connect Pro
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
Hi {{1}}, your Skills Connect Pro request for {{2}} has been received. Track provider responses here: {{3}}. Your contact details stay private until you choose to connect with a provider. Providers are independent and will agree the work and price with you directly.
```

## Administrator notifications

The marketplace administration console is browser-only. No admin WhatsApp notifications or admin-console links are sent by the application. Inspect dispatches, errors, and response activity using the authenticated `/marketplace-admin` page.

## Activation order

1. Configure the Meta credentials and webhook verification token.
2. Verify the webhook in Meta and subscribe to delivery-status updates.
3. Create and approve customer confirmation and provider invitation templates.
4. Enable `MARKETPLACE_CUSTOMER_WHATSAPP_ENABLED=true` and verify customer receipt.
5. Verify provider invitations using an opted-in test provider.
6. Enable the provider delivery mode with `MARKETPLACE_WHATSAPP_DELIVERY_MODE=automatic` and `MARKETPLACE_WHATSAPP_AUTO_SEND=true`.
7. Monitor results in the authenticated browser-based `/marketplace-admin` console. Do not send WhatsApp admin alerts.

The delivery code records provider message attempts in `lead_invitation_delivery_attempts`. Meta webhook status updates then keep `lead_invitations` aligned with delivered or failed provider messages.

## Controlled production testing

The original manual WhatsApp test was followed by a successful live customer/provider end-to-end test on 13 November 2026. The operational model is now customer confirmations and provider invitation messages only, with no WhatsApp alerts to marketplace administrators. Observe provider delivery receipts, customer response milestones and cancellations through the admin console in the browser.
