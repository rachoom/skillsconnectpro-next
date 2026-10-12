begin;

create table public.ai_response_cache (
  key_hash text primary key check (key_hash ~ '^[a-f0-9]{64}$'),
  response jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index ai_response_cache_expiry_idx on public.ai_response_cache (expires_at);
alter table public.ai_response_cache enable row level security;
revoke all on public.ai_response_cache from public, anon, authenticated;
grant select, insert, update, delete on public.ai_response_cache to service_role;
comment on table public.ai_response_cache is 'Short-lived server-only duplicate-request cache. Lookup keys are HMAC hashes, never customer prompts.';

commit;
