-- Database-enforced customer-plan limits. Provider lead entitlements stay separate.

create or replace function private.current_customer_plan_limits(target_user_id uuid)
returns table (
  plan_code text,
  active_project_limit integer,
  photo_assessment_limit integer,
  document_storage_limit_bytes bigint,
  supplier_quote_limit integer,
  ends_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  paid_plan text;
  paid_project_limit integer;
  paid_ends_at timestamptz;
begin
  select s.plan_code, p.project_limit, s.ends_at
    into paid_plan, paid_project_limit, paid_ends_at
  from public.account_subscriptions s
  join public.plans p on p.code = s.plan_code
  where s.user_id = target_user_id
    and s.status in ('trial', 'active')
    and p.active = true
    and (s.ends_at is null or s.ends_at > timezone('utc', now()))
  order by s.starts_at desc
  limit 1;

  if paid_plan = 'project_pass_90' then
    return query select 'project_pass_90', coalesce(paid_project_limit, 3), 5, 250::bigint * 1024 * 1024, 10, paid_ends_at;
  elsif paid_plan = 'basic_30' then
    return query select 'basic_30', coalesce(paid_project_limit, 1), 2, 50::bigint * 1024 * 1024, 3, paid_ends_at;
  end if;

  return query select 'free', 1, 1, 25::bigint * 1024 * 1024, 1, null::timestamptz;
end;
$$;

revoke all on function private.current_customer_plan_limits(uuid) from public;
grant execute on function private.current_customer_plan_limits(uuid) to service_role;

create or replace function private.enforce_customer_project_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  limits record;
  current_projects integer;
begin
  if new.customer_id is null then return new; end if;

  perform pg_advisory_xact_lock(hashtextextended(new.customer_id::text, 92153));
  select * into limits from private.current_customer_plan_limits(new.customer_id);

  select count(*)::integer into current_projects
  from public.projects p
  where p.customer_id = new.customer_id
    and p.status not in ('completed', 'cancelled', 'unfulfilled');

  if current_projects >= limits.active_project_limit then
    raise exception using errcode = 'P0001', message = 'SCP_PLAN_LIMIT_ACTIVE_PROJECTS';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_customer_project_limit() from public;

drop trigger if exists scp_enforce_customer_project_limit on public.projects;
create trigger scp_enforce_customer_project_limit
before insert on public.projects
for each row execute function private.enforce_customer_project_limit();
