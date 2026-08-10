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

## Expansion

`GET /api/cron/marketplace-routing` checks open projects and expands a wave only when:

1. the customer has consented to provider sharing;
2. routing is still open;
3. the target number of valid responses has not been reached;
4. at least one invitation in the current wave was dispatched;
5. the current response deadline has elapsed; and
6. the project remains below its invitation cap.

The route requires `CRON_SECRET`. The pilot repository uses a plan-compatible daily production cron. Urgent pilot projects can be expanded immediately through the protected admin routing endpoint. When the deployment plan or an external scheduler supports a shorter cadence, the same route can be called every five minutes without changing the routing engine.

Vercel Cron runs only on production deployments. The branch preview therefore tests automatic first-wave creation, scoring, caps and manual dispatch; scheduled expansion becomes active after production deployment and `CRON_SECRET` configuration.

## Admin override

`POST /api/admin/projects/:id/routing` processes one project. Send `{ "force": true }` to bypass the response-window wait while still respecting consent, closed-project checks, duplicate prevention and the invitation cap.

## Safety properties

- Customer contact details remain hidden until provider selection and contact release.
- Secure provider tokens are still stored as hashes.
- Raw provider tokens are returned only from the request that creates or regenerates them.
- The scheduled processor never returns raw provider tokens in its response.
- Automatic routing can be disabled with `MARKETPLACE_AUTOROUTING_ENABLED=false`.

## Next integration

The remaining automation boundary is outbound delivery. Once a compliant WhatsApp Business, SMS or email adapter is connected, the queued invitation can be dispatched immediately and marked `sent` without the current admin click-through.
