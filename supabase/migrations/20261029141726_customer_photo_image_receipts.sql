-- One account/image/plan-period debit shared by all customer photo endpoints.
create table public.customer_photo_assessments (
 user_id uuid not null references auth.users(id) on delete cascade,
 image_hash text not null check (image_hash ~ '^[a-f0-9]{64}$'),
 period_key text not null,
 plan_code text not null,
 period_end timestamptz,
 reservation_id uuid not null default gen_random_uuid(),
 status text not null check (status in ('pending','completed','failed')),
 reserved_until timestamptz not null default now() + interval '5 minutes',
 created_at timestamptz not null default now(),
 primary key(user_id,image_hash,period_key)
);
alter table public.customer_photo_assessments enable row level security;
revoke all on public.customer_photo_assessments from public,anon,authenticated;
grant all on public.customer_photo_assessments to service_role;

create function public.reserve_customer_photo_image(p_user_id uuid,p_image_hash text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare limits record; receipt public.customer_photo_assessments%rowtype;
 usage record; period text; reservation uuid;
begin
 if p_image_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid image identity'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text,92154));
 select * into limits from private.current_customer_plan_limits(p_user_id);
 period := limits.plan_code || ':' || coalesce(limits.ends_at::text,'free');
 select * into receipt from public.customer_photo_assessments
  where user_id=p_user_id and image_hash=p_image_hash and period_key=period for update;
 if found and receipt.status='completed' then
  return jsonb_build_object('allowed',true,'plan_code',limits.plan_code);
 end if;
 if found and receipt.status='pending' then
  if receipt.reserved_until > now() then
   return jsonb_build_object('allowed',false,'reason','processing','plan_code',limits.plan_code);
  end if;
  -- Recover abandoned reservations only within the matching allowance period.
  update public.usage_allowances set used=greatest(used-1,0)
   where user_id=p_user_id and allowance_type='ai_assessments'
    and resets_at is not distinct from receipt.period_end
    and metadata->>'plan_code'=receipt.plan_code;
  update public.customer_photo_assessments set status='failed'
   where user_id=receipt.user_id and image_hash=receipt.image_hash and period_key=receipt.period_key;
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

create function public.finish_customer_photo_image(p_user_id uuid,p_reservation_id uuid,p_success boolean)
returns boolean language plpgsql security invoker set search_path='' as $$
declare receipt public.customer_photo_assessments%rowtype;
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text,92154));
 select * into receipt from public.customer_photo_assessments
 where user_id=p_user_id and reservation_id=p_reservation_id and status='pending' for update;
 if not found then return false; end if;
 if not p_success then
  update public.usage_allowances set used=greatest(used-1,0),updated_at=now()
   where user_id=p_user_id and allowance_type='ai_assessments'
    and resets_at is not distinct from receipt.period_end
    and metadata->>'plan_code'=receipt.plan_code;
 end if;
 update public.customer_photo_assessments set status=case when p_success then 'completed' else 'failed' end
 where user_id=receipt.user_id and image_hash=receipt.image_hash and period_key=receipt.period_key;
 return true;
end;
$$;
revoke all on function public.reserve_customer_photo_image(uuid,text) from public,anon,authenticated;
revoke all on function public.finish_customer_photo_image(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.reserve_customer_photo_image(uuid,text) to service_role;
grant execute on function public.finish_customer_photo_image(uuid,uuid,boolean) to service_role;
