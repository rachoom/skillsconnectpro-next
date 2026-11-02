-- Server-only revocable admin sessions; the browser holds only an opaque token.
create table public.provider_admin_sessions (
 token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
 credential_version text not null,
 expires_at timestamptz not null,
 revoked_at timestamptz,
 created_at timestamptz not null default now()
);
alter table public.provider_admin_sessions enable row level security;
revoke all on public.provider_admin_sessions from public,anon,authenticated;
grant select,insert,update,delete on public.provider_admin_sessions to service_role;

-- No browser feature needs table administration privileges. Existing service-role
-- migrations and SECURITY DEFINER admin RPCs retain their permissions.
revoke truncate,references,trigger on all tables in schema public from anon,authenticated;
alter default privileges in schema public revoke truncate,references,trigger on tables from anon,authenticated;
-- Project creation/lifecycle writes already go through authenticated server APIs.
-- Prevent direct Data API reassignment of owners, statuses or access-token hashes.
revoke insert,update,delete on public.projects from anon,authenticated;

-- Preserve every response type supported in production (staging previously
-- omitted the two week-based availability options).
alter table public.provider_responses drop constraint provider_responses_response_type_check;
alter table public.provider_responses add constraint provider_responses_response_type_check
 check(response_type in ('available_now','available_today','available_tomorrow',
 'available_this_week','available_next_week','site_visit','estimate','need_information','declined'));

-- Each new verified paid period receives its own allowance.
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
        used = case when allowance_row.resets_at is distinct from limits.ends_at
          or allowance_row.metadata ->> 'plan_code' is distinct from limits.plan_code
          then 0 else least(used, limits.photo_assessment_limit) end,
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


create or replace function public.reserve_customer_photo_image(p_user_id uuid,p_image_hash text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare limits record; receipt public.customer_photo_assessments%rowtype;
 usage record; period text; reservation uuid;
begin
 if p_image_hash is null or p_image_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid image identity'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text,92154));
 select * into limits from private.current_customer_plan_limits(p_user_id);
 period := limits.plan_code || ':' || coalesce(limits.ends_at::text,'free');
 -- Release all abandoned images before considering a different new image.
 with expired as (
  update public.customer_photo_assessments set status='failed'
  where user_id=p_user_id and status='pending' and reserved_until <= now()
  returning plan_code,period_end
 )
 update public.usage_allowances u set used=greatest(u.used-(
  select count(*)::integer from expired e
  where e.plan_code=u.metadata->>'plan_code'
   and e.period_end is not distinct from u.resets_at
 ),0),updated_at=now()
 where u.user_id=p_user_id and u.allowance_type='ai_assessments';
 select * into receipt from public.customer_photo_assessments
  where user_id=p_user_id and image_hash=p_image_hash and period_key=period for update;
 if found and receipt.status='completed' then
  return jsonb_build_object('allowed',true,'plan_code',limits.plan_code);
 end if;
 if found and receipt.status='pending' then
  if receipt.reserved_until > now() then
   return jsonb_build_object('allowed',false,'reason','processing','plan_code',limits.plan_code);
  end if;
 end if;
 select * into usage from public.consume_customer_photo_assessment(p_user_id);
 if not usage.is_allowed then
  return jsonb_build_object('allowed',false,'reason','limit','plan_code',usage.plan_code);
 end if;
 reservation := gen_random_uuid();
 insert into public.customer_photo_assessments
  (user_id,image_hash,period_key,plan_code,period_end,reservation_id,status,reserved_until)
 values(p_user_id,p_image_hash,period,limits.plan_code,limits.ends_at,reservation,'pending',now()+interval '5 minutes')
 on conflict(user_id,image_hash,period_key) do update set
  reservation_id=excluded.reservation_id,status='pending',reserved_until=excluded.reserved_until;
 return jsonb_build_object('allowed',true,'plan_code',usage.plan_code,'reservation_id',reservation);
end;
$$;

