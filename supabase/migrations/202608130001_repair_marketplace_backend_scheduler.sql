create extension if not exists pg_net;
create extension if not exists pg_cron with schema pg_catalog;

create table if not exists public.marketplace_cron_credentials (
  id text primary key,
  token_hash text not null check (length(token_hash) = 64),
  created_at timestamptz not null default timezone('utc', now()),
  rotated_at timestamptz not null default timezone('utc', now())
);

alter table public.marketplace_cron_credentials enable row level security;
revoke all on table public.marketplace_cron_credentials from anon, authenticated;
grant select on table public.marketplace_cron_credentials to service_role;

comment on table public.marketplace_cron_credentials is
  'Server-only hashes for authenticating protected marketplace scheduler calls. Plaintext tokens are stored only in Supabase Vault.';

create table if not exists public.marketplace_backend_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  status text not null check (status in ('running', 'completed', 'failed')),
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  projects_processed integer not null default 0,
  projects_failed integer not null default 0,
  invitations_queued integer not null default 0,
  projects_auto_completed integer not null default 0,
  error_message text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists marketplace_backend_runs_job_started_idx
  on public.marketplace_backend_runs (job_name, started_at desc);

alter table public.marketplace_backend_runs enable row level security;
revoke all on table public.marketplace_backend_runs from anon, authenticated;
grant select, insert, update on table public.marketplace_backend_runs to service_role;

comment on table public.marketplace_backend_runs is
  'Server-only operational history for marketplace routing and completion automation.';

do $setup$
declare
  v_secret text;
begin
  if not exists (
    select 1 from public.marketplace_cron_credentials where id = 'marketplace-routing'
  ) then
    v_secret := encode(extensions.gen_random_bytes(32), 'hex');

    insert into public.marketplace_cron_credentials (id, token_hash)
    values (
      'marketplace-routing',
      encode(extensions.digest(v_secret, 'sha256'), 'hex')
    );

    perform vault.create_secret(
      v_secret,
      'skillsconnectpro_marketplace_cron_bearer',
      'Bearer token for the Skills Connect Pro marketplace scheduler'
    );
  end if;
end
$setup$;

select cron.schedule(
  'skillsconnectpro-marketplace-routing',
  '* * * * *',
  $job$
    select net.http_get(
      url := 'https://www.skillsconnectpro.co.za/api/cron/marketplace-routing',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'skillsconnectpro_marketplace_cron_bearer'
          order by created_at desc
          limit 1
        )
      ),
      timeout_milliseconds := 55000
    ) as request_id;
  $job$
);
