create table if not exists public.provider_claim_invites (
  id uuid primary key default gen_random_uuid(),
  artisan_id integer not null references public.artisans(id) on delete cascade,
  application_id integer references public.artisan_applications(id) on delete set null,
  token_hash text not null unique,
  status text not null default 'pending'
    check (status in ('pending','sent','claimed','approved','declined','revoked','expired')),
  consent_version text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  claimed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days'),
  updated_at timestamptz not null default now()
);

create unique index if not exists provider_claim_invites_open_artisan_idx
  on public.provider_claim_invites(artisan_id)
  where status in ('pending','sent');

alter table public.provider_claim_invites enable row level security;
revoke all on table public.provider_claim_invites from anon, authenticated;

drop policy if exists public_directory_fields on public.artisans;
create policy public_directory_fields
on public.artisans
for select
to anon
using (
  status = 'active'
  and approval_status = 'approved'
);
