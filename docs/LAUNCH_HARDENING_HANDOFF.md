# Launch hardening checkpoint — 1 November 2026

## Scope

Recovered the interrupted launch-hardening work based on production-source branch
`feat/accounts-my-projects` at `8e91286acf8c17c11207492d3e423a3743722f4b`.
This checkpoint preserves the pending technical changes; it is not a completed
launch audit or a production release.

## Included changes

- Provider checkout derives its artisan exclusively from the signed-in account's
  active artisan role. Caller-supplied IDs, email addresses and phone numbers no
  longer select the payable provider. The checkout UI requires the linked account.
- Customer image routes share an account/image/plan-period receipt and reserve,
  settle or release photo allowances on the server. Browser clarification counts
  no longer determine whether a photo is charged.
- Missing durable AI budget storage fails closed.
- Workspace write access distinguishes owners, collaborators and read-only members.
- Dependency patches, Leaflet asset declarations, robots metadata and footer policy
  links from the interrupted run are retained.
- Recovery review also rejects false photo-settlement results and adds behavioral
  tests for forged checkout identity, anonymous/unlinked rejection, image identity,
  completed-image reuse, processing/limit responses, storage failures and settlement.

## Verification and current blockers

- Full regression suite after recovery additions: 125 passing, 0 failing.
- Standalone TypeScript check passed; the production build also passed TypeScript
  after the recovery additions.
- Next build compiled and passed TypeScript, but page-data collection failed with
  missing Supabase environment configuration in this workspace. The full build then
  passed with explicit public placeholders. This checks packaging only; it does not
  verify a real Supabase connection or authenticated runtime behavior.
- GitHub's source branch still pointed to `8e91286` when checked on 1 November.
- Production project `vnpafurjyexvmghuwemm` has no
  `public.customer_photo_assessments` table, `reserve_customer_photo_image(uuid,text)`
  function or `finish_customer_photo_image(uuid,uuid,boolean)` function when checked
  on 1 November. The included photo receipt migration must be validated in staging
  and applied before this application code is released.
- Vercel project listing for the previously recorded team slug
  `rachoombs-projects` returned 403 Not authorized. No Vercel CLI is installed here.
  The current production deployment could not be confirmed.

## Resume from here

1. Finish staging database tests for new-image/replay/concurrency/refund/plan-expiry
   behavior. The new JS tests mock the database and do not establish SQL correctness.
2. Reconcile pending provider quota/billing migrations with actual production function
   signatures and migration history; do not infer readiness from local files.
3. Complete the remaining audit items: database write privileges, admin sessions,
   privacy wording, onboarding fallback, backup recovery and authenticated acceptance.
4. Restore access to the intended Vercel team/project, verify the release commit and
   environment, then deploy the matched database and application release.
5. Real purchases, hosting subscription changes and provider messaging need their
   existing owner-controlled acceptance process. No such action was performed here.

No production code or database changes were applied during recovery. No real
payments or WhatsApp messages were sent. The chat's failed Stop action cannot be
controlled from this separate thread.
