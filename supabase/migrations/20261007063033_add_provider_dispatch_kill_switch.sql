begin;
create table public.marketplace_automation_controls (
  id boolean primary key default true check(id),
  provider_auto_send boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.marketplace_automation_controls(id,provider_auto_send) values(true,false);
alter table public.marketplace_automation_controls enable row level security;
revoke all on public.marketplace_automation_controls from public,anon,authenticated;
grant select,update on public.marketplace_automation_controls to service_role;
create function public.marketplace_provider_dispatch_enabled()
returns boolean language sql security invoker set search_path='' as $$
  select coalesce((select provider_auto_send from public.marketplace_automation_controls where id=true),false);
$$;
revoke all on function public.marketplace_provider_dispatch_enabled() from public,anon,authenticated;
grant execute on function public.marketplace_provider_dispatch_enabled() to service_role;
commit;
