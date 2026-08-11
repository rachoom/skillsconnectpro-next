create table if not exists public.marketing_provider_queue_overrides (
  provider_id integer primary key references public.artisans(id) on delete cascade,
  queue_state text not null check (queue_state in ('priority', 'skipped')),
  priority_rank bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketing_provider_queue_overrides_state_rank_idx
  on public.marketing_provider_queue_overrides (queue_state, priority_rank nulls last);

alter table public.marketing_provider_queue_overrides enable row level security;
revoke all on table public.marketing_provider_queue_overrides from anon, authenticated;

comment on table public.marketing_provider_queue_overrides is
  'Server-admin-only overrides for Marketing Assist provider rotation. Priority rows are considered before automatic rotation; skipped rows are excluded until restored.';
