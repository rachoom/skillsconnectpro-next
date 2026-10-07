begin;
create table public.marketplace_dispatch_leases (
  key text primary key,
  owner uuid not null,
  expires_at timestamptz not null
);
alter table public.marketplace_dispatch_leases enable row level security;
revoke all on public.marketplace_dispatch_leases from public,anon,authenticated;
grant select,insert,update,delete on public.marketplace_dispatch_leases to service_role;

create function public.acquire_marketplace_dispatch_lease(p_key text,p_owner uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
declare acquired uuid;
begin
  if p_key !~ '^(routing|invitations):[0-9a-f-]{36}$' or p_owner is null then
    raise exception 'Invalid dispatch lease';
  end if;
  insert into public.marketplace_dispatch_leases as leases(key,owner,expires_at)
    values(p_key,p_owner,now()+interval '10 minutes')
    on conflict(key) do update set owner=excluded.owner,expires_at=excluded.expires_at
      where leases.expires_at<=now()
    returning owner into acquired;
  return coalesce(acquired=p_owner,false);
end $$;
create function public.release_marketplace_dispatch_lease(p_key text,p_owner uuid)
returns void language sql security invoker set search_path='' as $$
  delete from public.marketplace_dispatch_leases where key=p_key and owner=p_owner;
$$;
revoke all on function public.acquire_marketplace_dispatch_lease(text,uuid) from public,anon,authenticated;
revoke all on function public.release_marketplace_dispatch_lease(text,uuid) from public,anon,authenticated;
grant execute on function public.acquire_marketplace_dispatch_lease(text,uuid) to service_role;
grant execute on function public.release_marketplace_dispatch_lease(text,uuid) to service_role;

create table public.marketplace_system_delivery_tests (
  id uuid primary key default gen_random_uuid(),
  status text not null check(status in ('queued','sent','delivered','read','failed')),
  external_message_id text unique,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.marketplace_system_delivery_tests enable row level security;
revoke all on public.marketplace_system_delivery_tests from public,anon,authenticated;
grant select,insert,update,delete on public.marketplace_system_delivery_tests to service_role;
commit;
