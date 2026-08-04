# Marketplace contact-release regression check

Run this only against the Preview deployment until the branch is approved for merge.

## 1. Open routing

1. Create a new pilot project.
2. Load ranked provider candidates.
3. Create an invitation for one provider.
4. Regenerate that invitation before the provider responds.

Expected:

- The new secure URL works.
- The previous URL becomes invalid immediately.
- The project remains in `matching`.

## 2. Provider response freezes the link

1. Open the latest provider URL.
2. Submit an available/accepted response.
3. Attempt to regenerate that provider's link.

Expected:

- The original response URL remains valid.
- Regeneration is rejected with: `This provider has already responded. Their secure invitation link cannot be regenerated.`
- The provider response remains unchanged.

## 3. Customer selection and contact release

1. Allow at least two providers to respond.
2. Select one provider from the customer project page.
3. Confirm contact release.

Expected:

- `projects.status` becomes `contact_released`.
- `project_matches.status` becomes `contact_released`.
- The selected invitation remains `accepted` and its expiry is extended by at least seven days.
- Other active invitations become `cancelled` and expire immediately.
- The customer page shows the selected provider's contact panel.
- The selected provider's existing secure URL shows customer contact details.
- Non-selected provider URLs show that the opportunity is no longer available.

## 4. Closed-routing admin behaviour

1. Refresh the admin marketplace view after contact release.
2. Load the closed project again.
3. Attempt to create or regenerate any invitation through the API.

Expected:

- The candidate response is empty and includes `routingClosed: true`.
- Provider invitation controls are not presented once the client consumes the closed-routing response.
- A stale client attempting the write receives HTTP `409` with a clear closed-routing message.
- No invitation status, response token, provider selection or project status changes.

## 5. Permission boundary

Expected database privileges:

- `authenticated`: may execute the two guarded marketplace token RPCs.
- `anon`: may not execute either RPC.
- Both RPCs still verify `public.is_marketplace_admin()` before doing any work.

## Current verified test record

Project: `Leaking kitchen pipe`

- Project status: `contact_released`
- Match status: `contact_released`
- Selected provider ID: `51`
- Selected invitation: `accepted`
- Other invitations: two `cancelled`, one `declined`
- Selected invitation expiry: `2026-08-11 00:39:01 UTC`
