-- Link marketplace provider records to the existing public.artisans table.
-- Production schema inspection confirmed public.artisans.id is integer.
-- Run after 202608030001_marketplace_foundation.sql and
-- 202608030002_secure_access_tokens.sql.

begin;

alter table public.provider_availability
  alter column provider_id type integer
  using provider_id::integer;

alter table public.lead_invitations
  alter column provider_id type integer
  using provider_id::integer;

alter table public.provider_responses
  alter column provider_id type integer
  using provider_id::integer;

alter table public.project_matches
  alter column provider_id type integer
  using provider_id::integer;

alter table public.provider_availability
  add constraint provider_availability_provider_id_fkey
  foreign key (provider_id)
  references public.artisans(id)
  on update cascade
  on delete cascade;

alter table public.lead_invitations
  add constraint lead_invitations_provider_id_fkey
  foreign key (provider_id)
  references public.artisans(id)
  on update cascade
  on delete restrict;

alter table public.provider_responses
  add constraint provider_responses_provider_id_fkey
  foreign key (provider_id)
  references public.artisans(id)
  on update cascade
  on delete restrict;

alter table public.project_matches
  add constraint project_matches_provider_id_fkey
  foreign key (provider_id)
  references public.artisans(id)
  on update cascade
  on delete restrict;

comment on column public.provider_availability.provider_id is
  'Integer foreign key to public.artisans(id), confirmed by production schema inspection on 2026-08-03.';

comment on column public.lead_invitations.provider_id is
  'Integer foreign key identifying the artisan invited to this project.';

comment on column public.provider_responses.provider_id is
  'Integer foreign key identifying the artisan who submitted this response.';

comment on column public.project_matches.provider_id is
  'Integer foreign key identifying the artisan selected by the customer.';

commit;
