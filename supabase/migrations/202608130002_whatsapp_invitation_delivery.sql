alter table public.lead_invitations
  add column if not exists delivery_provider text,
  add column if not exists external_message_id text,
  add column if not exists delivery_attempted_at timestamptz;

create unique index if not exists lead_invitations_external_message_id_uidx
  on public.lead_invitations (external_message_id)
  where external_message_id is not null;

create table if not exists public.lead_invitation_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  lead_invitation_id uuid not null references public.lead_invitations(id) on delete cascade,
  provider_id integer not null references public.artisans(id),
  delivery_channel text not null,
  delivery_provider text not null,
  status text not null check (status in ('accepted', 'sent', 'delivered', 'read', 'failed')),
  external_message_id text,
  error_code text,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists lead_invitation_delivery_attempts_invitation_idx
  on public.lead_invitation_delivery_attempts (lead_invitation_id, created_at desc);

create unique index if not exists lead_invitation_delivery_attempts_message_uidx
  on public.lead_invitation_delivery_attempts (external_message_id)
  where external_message_id is not null;

alter table public.lead_invitation_delivery_attempts enable row level security;
revoke all on table public.lead_invitation_delivery_attempts from anon, authenticated;
grant select, insert, update on table public.lead_invitation_delivery_attempts to service_role;

comment on table public.lead_invitation_delivery_attempts is
  'Server-only delivery audit for provider invitation messages. Message content and access tokens are not stored here.';
