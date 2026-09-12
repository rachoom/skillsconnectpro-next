# Controlled automatic routing waves

The marketplace now queues an initial provider wave immediately after a customer creates a consented project.

## Wave rules

- Emergency: 5 providers in the first wave, then up to 3 per expansion.
- Urgent: 4 providers in the first wave, then up to 2 per expansion.
- Planned: 3 providers in the first wave, then up to 2 per expansion.
- Large project: 3 providers in the first wave, or 4 for managed service, then up to 2 per expansion.

The routing engine applies urgency and service-level caps so a project cannot invite the entire directory. It excludes unrelated trades, previously invited providers and closed projects.

## Controlled dispatch

Automatically selected invitations are created with the `admin` delivery channel and remain queued. This is deliberate: a provider is not recorded as sent until the admin actually opens the WhatsApp handoff or another outbound channel is connected.

The existing admin workflow can regenerate a queued provider's secure link, send it through WhatsApp and mark it as sent. A queued-but-unsent wave does not expand automatically.

When Meta WhatsApp automation is enabled with `MARKETPLACE_WHATSAPP_DELIVERY_MODE=automatic` and `MARKETPLACE_WHATSAPP_AUTO_SEND=true`, the same routing engine sends the selected provider invitations through the WhatsApp Cloud API immediately. Accepted Meta sends are recorded as `sent`, and webhook delivery updates can later move them to `delivered` or `failed`.

## Expansion

`GET /api/cron/marketplace-routing` checks open projects and expands a wave only when:

1. the customer has consented to provider sharing;
2. routing is still open;
3. the target number of valid responses has not been reached;
4. at least one invitation in the current wave was dispatched;
5. the current response deadline has elapsed; and
6. the project remains below its invitation cap.

The route requires `CRON_SECRET`. The repository declares a daily production cron in `vercel.json` so it remains compatible with Vercel Hobby cron limits. Urgent pilot projects can still be expanded immediately through the protected admin routing endpoint. When the deployment plan or an external scheduler supports a shorter cadence, the same route can be called more frequently without changing the routing engine.

Vercel Cron runs only on production deployments. The branch preview therefore tests automatic first-wave creation, scoring, caps and manual dispatch; scheduled expansion becomes active after production deployment and `CRON_SECRET` configuration.

## Admin override

`POST /api/admin/projects/:id/routing` processes one project. Send `{ "force": true }` to bypass the response-window wait while still respecting consent, closed-project checks, duplicate prevention and the invitation cap.

## Safety properties

- Customer contact details remain hidden until provider selection and contact release.
- Secure provider tokens are still stored as hashes.
- Raw provider tokens are returned only from the request that creates or regenerates them.
- The scheduled processor never returns raw provider tokens in its response.
- Automatic routing can be disabled with `MARKETPLACE_AUTOROUTING_ENABLED=false`.

## WhatsApp automation

See `docs/WHATSAPP_META_AUTOMATION.md` for the required Meta credentials, webhook URL, approved-template parameters and activation order.
