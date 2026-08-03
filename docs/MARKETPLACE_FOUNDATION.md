# Skills Connect Pro Marketplace Foundation

This branch introduces the backend foundation for the transition from a public artisan directory to a project-routing marketplace.

## What this milestone supports

1. A customer or AI assistant creates a structured project.
2. Skills Connect Pro creates targeted provider invitations.
3. Each provider receives a unique, expiring response token.
4. Providers can view a limited project brief and respond without creating an account.
5. The customer sees provider responses as they arrive.
6. The customer selects one provider response.
7. Contact release remains a separate future step for payment, membership, or admin policy.

The existing directory and `artisans` table are not altered by these migrations.

## Files added

- `supabase/migrations/202608030001_marketplace_foundation.sql`
- `supabase/migrations/202608030002_secure_access_tokens.sql`
- `supabase/inspect/production_schema.sql`
- `types/marketplace.ts`
- `services/marketplace/*`
- `services/supabaseAdmin.ts`
- `app/api/projects/*`
- `app/api/provider-opportunities/*`

## Supabase deployment order

### 1. Inspect the production schema

Run `supabase/inspect/production_schema.sql` in Supabase SQL Editor.

This is read-only. Its most important output is the exact PostgreSQL type of `public.artisans.id`. The first marketplace migration deliberately stores `provider_id` as text until that production type is confirmed.

### 2. Apply the marketplace foundation

Run, in order:

1. `supabase/migrations/202608030001_marketplace_foundation.sql`
2. `supabase/migrations/202608030002_secure_access_tokens.sql`

Apply these first to a preview or staging Supabase project where possible.

The migrations are additive. They create new tables and do not modify the existing directory tables.

### 3. Configure server environment variables

Add these to the deployment environment, not browser code:

```bash
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
MARKETPLACE_ADMIN_API_KEY=...
```

The service-role key must never use a `NEXT_PUBLIC_` prefix.

## API flow

### Create a project

`POST /api/projects`

```json
{
  "title": "Leaking kitchen sink",
  "customerDescription": "Water is leaking below the sink when the tap runs.",
  "category": "Plumbing",
  "urgency": "urgent",
  "serviceLevel": "assisted",
  "locationText": "Benoni",
  "suburb": "Rynfield",
  "city": "Benoni",
  "guestName": "Test Customer",
  "guestPhone": "+27...",
  "consentToShare": true,
  "estimatedMin": 650,
  "estimatedMax": 1500,
  "safetyNotes": ["Close the isolation valve if the leak worsens."],
  "materials": [
    { "name": "Flexible connector", "quantity": 1 }
  ]
}
```

The response returns:

- the project record;
- a raw `accessToken` shown only once.

The browser should store that token securely for the active project. The database stores only its SHA-256 hash.

### Invite providers

`POST /api/projects/{projectId}/invitations`

Required header:

```text
x-marketplace-admin-key: MARKETPLACE_ADMIN_API_KEY
```

Example body:

```json
{
  "waveNumber": 1,
  "targets": [
    {
      "providerId": "123",
      "deliveryChannel": "whatsapp",
      "deliveryAddress": "+27...",
      "providerSnapshot": {
        "name": "Example Plumbing",
        "category": "Plumbing",
        "location": "Benoni",
        "verified": true
      }
    }
  ]
}
```

Each result contains a unique provider `responseUrl`. That URL can later be inserted into WhatsApp, SMS, email, or app notifications.

### Provider views the opportunity

`GET /api/provider-opportunities/{responseToken}`

The result intentionally excludes customer contact details and a precise home address. It exposes the project scope and service area needed for an initial availability decision.

### Provider responds

`POST /api/provider-opportunities/{responseToken}`

```json
{
  "responseType": "available_today",
  "arrivalWindowStart": "2026-08-03T12:00:00+02:00",
  "arrivalWindowEnd": "2026-08-03T14:00:00+02:00",
  "siteVisitFee": 350,
  "estimateMin": 800,
  "estimateMax": 1600,
  "providerMessage": "I can inspect the leak this afternoon."
}
```

Other response types include:

- `available_now`
- `available_tomorrow`
- `site_visit`
- `estimate`
- `need_information`
- `declined`

### Customer polls the rolling response feed

`GET /api/projects/{projectId}/responses`

Required header:

```text
x-project-access-token: PROJECT_ACCESS_TOKEN
```

This returns:

- project status;
- invitation counts;
- provider responses received so far;
- provider-safe profile snapshots;
- selected match, if any;
- project timeline.

Provider contact information is not included at this stage.

### Customer selects a provider

`POST /api/projects/{projectId}/select-provider`

Required header:

```text
x-project-access-token: PROJECT_ACCESS_TOKEN
```

Body:

```json
{
  "providerResponseId": "UUID"
}
```

Selection is recorded separately from contact release. This preserves a future point for:

- assisted-match payment;
- provider subscription entitlement;
- admin approval;
- or a pilot rule allowing immediate release.

## Current limitations

- The marketplace schema has not yet been applied to the live Supabase project.
- The exact `artisans.id` type is still unknown, so provider IDs do not yet have a hard foreign key.
- Provider selection does not yet release telephone or email details.
- No payment integration is present.
- No WhatsApp Cloud API delivery is present.
- Invitation creation is currently protected by a temporary admin API key. It should later use proper authenticated admin roles.
- Multi-step writes are not yet wrapped in PostgreSQL transactions/RPC functions. The pilot admin console should surface partial failures.
- Rate limiting and abuse controls must be added before public launch.

## Next engineering milestone

After the Supabase schema is applied and inspected:

1. add the correct foreign keys to `artisans`;
2. build the provider-candidate query against the real artisan fields;
3. add the admin project-routing screen;
4. connect the current camera, voice, and estimator output to `POST /api/projects`;
5. build the provider opportunity UI and customer rolling-response UI;
6. add contact-release entitlement logic;
7. integrate WhatsApp delivery only after the web workflow is working end to end.
