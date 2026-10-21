create or replace function public.consume_customer_photo_assessment(target_user_id uuid)
returns table (is_allowed boolean, remaining integer, plan_code text, allowed integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  limits record;
  allowance_row public.usage_allowances%rowtype;
begin
  perform pg_advisory_xact_lock(hashtextextended(target_user_id::text, 92154));
  select * into limits from private.current_customer_plan_limits(target_user_id);

  insert into public.usage_allowances (user_id, allowance_type, allowed, used, resets_at, metadata)
  values (target_user_id, 'ai_assessments', limits.photo_assessment_limit, 0, limits.ends_at, jsonb_build_object('plan_code', limits.plan_code))
  on conflict (user_id, allowance_type) do nothing;

  select * into allowance_row from public.usage_allowances
  where user_id = target_user_id and allowance_type = 'ai_assessments'
  for update;

  if allowance_row.metadata ->> 'plan_code' is distinct from limits.plan_code
     or allowance_row.resets_at is distinct from limits.ends_at
     or allowance_row.allowed is distinct from limits.photo_assessment_limit then
    update public.usage_allowances
    set allowed = limits.photo_assessment_limit,
        used = case when limits.plan_code = 'free' then 0 else least(used, limits.photo_assessment_limit) end,
        resets_at = limits.ends_at,
        metadata = jsonb_build_object('plan_code', limits.plan_code),
        updated_at = timezone('utc', now())
    where id = allowance_row.id;
    select * into allowance_row from public.usage_allowances where id = allowance_row.id for update;
  end if;

  if allowance_row.used >= coalesce(allowance_row.allowed, 0) then
    return query select false, 0, limits.plan_code, limits.photo_assessment_limit;
    return;
  end if;

  update public.usage_allowances set used = used + 1, updated_at = timezone('utc', now())
  where id = allowance_row.id;

  return query select true, greatest(limits.photo_assessment_limit - allowance_row.used - 1, 0), limits.plan_code, limits.photo_assessment_limit;
end;
$$;

revoke all on function public.consume_customer_photo_assessment(uuid) from public, anon, authenticated;
grant execute on function public.consume_customer_photo_assessment(uuid) to service_role;

create or replace function public.release_customer_photo_assessment(target_user_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.usage_allowances
  set used = greatest(used - 1, 0), updated_at = timezone('utc', now())
  where user_id = target_user_id and allowance_type = 'ai_assessments' and used > 0;
  return found;
end;
$$;

revoke all on function public.release_customer_photo_assessment(uuid) from public, anon, authenticated;
grant execute on function public.release_customer_photo_assessment(uuid) to service_role;

create or replace function private.enforce_customer_document_storage_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
  limits record;
  stored_bytes bigint;
begin
  select customer_id into owner_id from public.projects where id = new.project_id;
  if owner_id is null then return new; end if;

  perform pg_advisory_xact_lock(hashtextextended(owner_id::text, 92155));
  select * into limits from private.current_customer_plan_limits(owner_id);
  select coalesce(sum(d.size_bytes), 0)::bigint into stored_bytes
  from public.project_documents d
  join public.projects p on p.id = d.project_id
  where p.customer_id = owner_id;

  if stored_bytes + coalesce(new.size_bytes, 0) > limits.document_storage_limit_bytes then
    raise exception using errcode = 'P0001', message = 'SCP_PLAN_LIMIT_DOCUMENT_STORAGE';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_customer_document_storage_limit() from public;

drop trigger if exists scp_enforce_customer_document_storage_limit on public.project_documents;
create trigger scp_enforce_customer_document_storage_limit
before insert or update of size_bytes, project_id on public.project_documents
for each row execute function private.enforce_customer_document_storage_limit();

create or replace function private.enforce_project_pass_milestones()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
  limits record;
begin
  select customer_id into owner_id from public.projects where id = new.project_id;
  if owner_id is null then return new; end if;
  select * into limits from private.current_customer_plan_limits(owner_id);
  if limits.plan_code <> 'project_pass_90' then
    raise exception using errcode = 'P0001', message = 'SCP_PLAN_LIMIT_MILESTONES';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_project_pass_milestones() from public;

drop trigger if exists scp_enforce_project_pass_milestones on public.project_milestones;
create trigger scp_enforce_project_pass_milestones
before insert or update on public.project_milestones
for each row execute function private.enforce_project_pass_milestones();
