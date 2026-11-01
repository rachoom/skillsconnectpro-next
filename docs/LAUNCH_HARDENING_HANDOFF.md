# Skills Connect Pro launch hardening — 1 November 2026

## Current result

The interrupted source changes have been recovered and extended in PR #23.
The current source passes all 132 regression tests, TypeScript and the full
production build using explicit non-secret public Supabase placeholders.
These checks do not establish authenticated runtime acceptance.

Vercel access is working. The correct team is `rachooms-projects`
(`team_TSdHjpaNXhRNbpAg7pUMGTO6`); the previously recorded spelling had an extra b.
The project is `skillsconnectpro-next` (`prj_BI4rxMyQAU6UOpG6Dklg424b8IiK`).
Production still serves commit `717cfccbd07d059875b869d30b98b0bc86bef9a6` in
READY deployment `dpl_TWRK8jqrkdS4BqZrxyzdtJh5hti8` as checked on 1 November.
The recovery branch built successfully as a Vercel Preview.

## Implemented changes

- Provider checkout derives the payable artisan from the signed-in account's
  active artisan role, ignoring caller-supplied provider identity.
- Shared server-side image receipts enforce account/image/plan-period photo
  allowances across the applicable AI routes. Completed images are not charged
  twice, failed analyses release reservations, and abandoned reservations are
  recovered before another image is considered. New paid periods reset usage.
- Verified paid image plans receive finite anti-abuse headroom across both
  quick-intent and project-assessment paths, retaining the global AI budget.
- Missing durable AI budget storage fails closed.
- Project workspace writes distinguish owners, collaborators and read-only viewers;
  project closure remains owner-only. Direct browser project writes are revoked
  in the candidate database migration because the current UI uses server APIs.
- Provider admin sessions use independent random tokens, store only token hashes,
  expire server-side after 12 hours, revoke on logout and invalidate after admin
  password rotation. Existing legacy admin cookies require signing in again.
- The candidate migration removes unused TRUNCATE, REFERENCES and TRIGGER grants
  from anon/authenticated roles on public tables, including their future defaults.
- Provider registration offers manual entry when photo scanning is unavailable.
- Dependency patches, Leaflet asset declarations, robots metadata, footer policy
  links and privacy wording describing AI/image processing are included.
- Previously pending provider billing changes preserve all nine production
  availability response types, atomically account for replies, differentiate
  monthly quotas and retain paid access after cancellation of future renewals.

## Database validation

Production: `vnpafurjyexvmghuwemm` (kasi-skills-connect).
Staging: `bvzsbcpoxdvuvpskavho` (Skills Connect Pro Staging).

The candidate provider quota, billing-cycle and access-hardening migrations were
loaded in a single staging transaction with a 15-second statement timeout and
2-second lock timeout. The SQL assertions in
`supabase/tests/launch_hardening_validation.sql` passed. The transaction then
rolled back all schema and fixture changes. A follow-up query confirmed the new
admin-session table was absent after rollback.

The assertions exercised Free/Basic/Pass photo limits, pending duplicates,
completed-image replay, refunds, repeated refunds, new periods, abandoned
reservations, expiry, the three free provider responses, the monthly last credit
and exhaustion, lead-pack fallback, uncharged declines, duplicate replies,
closed-project rejection, verified payment activation/replay, cancellation
retaining the paid period, and restricted browser privileges/RPC access.
The test fixtures used generated IDs and invalid contact destinations; there
were no real payments, model calls or messages.

Actual simultaneous multi-connection races, fresh authenticated browser journeys,
physical Android camera/voice acceptance and a backup restore drill are not
covered by these checks.

## Explicit approval needed before persistent application

Automatic approval review rejected the persistent staging migration, stating
that the earlier request authorized validation rather than this exact access
control and schema change. No persistent migration was applied after that
rejection. Rollback-only validation was used as a safer alternative.

The reviewable migration set is:

1. `202610280001_provider_atomic_response_quotas.sql` — missing production reply
   ledger/RPC; fills null monthly quota values with 15/40/100.
2. `202610280002_provider_verified_billing_cycles.sql` — verified recurring-cycle
   resets, payment replay protection and cancellation recording.
3. `20261029141726_customer_photo_image_receipts.sql` — missing production photo
   receipt table and service-only reserve/finish functions.
4. `20261101173240_launch_access_hardening.sql` — admin session table, removal of
   unused browser administrative privileges and direct project writes, expanded
   staging availability constraint, photo-period resets and stale recovery.

Staging already contains the first three features, although the SQL validation
reloaded the provider functions inside its rolled-back transaction. Do not
blindly replay the original photo-table CREATE in staging. Production needs the
missing features; inspect actual functions/tables and apply only the matching
reviewed migrations. Migration history contains legacy timestamp differences,
so do not run an indiscriminate db push.

After explicit approval, apply the needed changes to staging, re-run validation
and authenticated smoke tests, apply the corresponding production migrations,
and release the exact tested application commit through the confirmed Vercel
project. Keep the application and database release coordinated. None of these
steps requires a purchase or a provider-message test.

## Remaining wider launch items

- Owner-controlled live-payment and scoped marketplace acceptance remain separate
  from existing successful sandbox purchase tests.
- Confirm commercial hosting/billing choice and consent-appropriate conversion
  tracking before paid advertising; no subscription or ad spend was changed.
- Confirm backup scope and a restore drill, and retain the known Vercel production
  deployment for application rollback. Application rollback does not undo database
  changes; do not drop receipt or billing records as a rollback technique.
- The original broad lint baseline, sitemap expansion, pg_net placement and
  optional auth settings were not represented as resolved in this release.
- Server-only RLS tables intentionally retain no public policies. The four
  authenticated-callable admin SECURITY DEFINER RPCs retain their internal admin
  checks rather than granting wider access to suppress advisor notices.

No production code/database changes or outbound WhatsApp messages were performed
in this recovery continuation. This separate thread cannot cancel the old chat run.
