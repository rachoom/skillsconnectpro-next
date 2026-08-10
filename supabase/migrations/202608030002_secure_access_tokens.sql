-- Secure opaque tokens for guest customer project access and provider lead responses.
-- Only SHA-256 hashes are stored in the database; raw tokens are returned once.

alter table public.projects
  add column if not exists customer_access_token_hash text null;

alter table public.lead_invitations
  add column if not exists response_token_hash text null,
  add column if not exists response_token_expires_at timestamptz null;

create unique index if not exists projects_customer_access_token_hash_uidx
  on public.projects (customer_access_token_hash)
  where customer_access_token_hash is not null;

create unique index if not exists lead_invitations_response_token_hash_uidx
  on public.lead_invitations (response_token_hash)
  where response_token_hash is not null;

create index if not exists lead_invitations_response_token_expiry_idx
  on public.lead_invitations (response_token_expires_at)
  where response_token_hash is not null
    and status in ('queued', 'sent', 'delivered', 'viewed');

comment on column public.projects.customer_access_token_hash is
  'SHA-256 hash of the opaque guest token used to read this project and its responses.';

comment on column public.lead_invitations.response_token_hash is
  'SHA-256 hash of the single-provider token used to view and respond to a lead.';
