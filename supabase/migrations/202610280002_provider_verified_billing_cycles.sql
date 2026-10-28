-- Monthly provider subscriptions: reset response allowance only after a
-- newly verified Payfast payment. payment_events enforces exact-once processing.
create or replace function public.grant_provider_payment_entitlement(
  payment_ref text, processor_ref text
) returns boolean
language plpgsql security invoker set search_path = ''
as $$
declare
  payment_row public.payment_transactions%rowtype;
  inserted_event text;
  credit_count integer;
  monthly_limit integer;
begin
  select * into payment_row from public.payment_transactions
  where m_payment_id = payment_ref for update;
  if not found then raise exception 'Unknown payment reference'; end if;
  if payment_row.processor_status <> 'COMPLETE' then
    raise exception 'Payment has not been verified complete';
  end if;
  if not exists (select 1 from public.artisans where id=payment_row.provider_id) then
    raise exception 'Unknown provider';
  end if;
  insert into public.payment_events(payfast_payment_id,m_payment_id)
    values(processor_ref,payment_ref)
    on conflict(payfast_payment_id) do nothing
    returning payfast_payment_id into inserted_event;
  if inserted_event is null then return false; end if;

  if payment_row.plan_kind='lead_pack' then
    credit_count := case payment_row.plan_code when 'lead_pack_4' then 4
      when 'lead_pack_10' then 10 when 'lead_pack_25' then 25 else 0 end;
    if credit_count=0 then raise exception 'Unknown lead pack'; end if;
    insert into public.subscription_entitlements(subject_type,subject_id,plan_code,
      status,qualified_leads_used,qualified_leads_limit,starts_at,ends_at,metadata)
    values('provider',payment_row.provider_id::text,payment_row.plan_code,'active',
      0,credit_count,now(),null,pg_catalog.jsonb_build_object('payment_source','payfast'))
    on conflict(subject_type,subject_id,plan_code) do update set
      status='active',
      qualified_leads_limit=public.subscription_entitlements.qualified_leads_limit
        + excluded.qualified_leads_limit,
      updated_at=now();
  elsif payment_row.plan_kind='subscription' then
    monthly_limit := case payment_row.plan_code when 'starter_monthly' then 15
      when 'growth_monthly' then 40 when 'pro_monthly' then 100 else 0 end;
    if monthly_limit=0 then raise exception 'Unknown provider subscription'; end if;
    insert into public.subscription_entitlements(subject_type,subject_id,plan_code,
      status,qualified_leads_used,qualified_leads_limit,starts_at,ends_at,metadata)
    values('provider',payment_row.provider_id::text,payment_row.plan_code,'active',
      0,monthly_limit,now(),now() + interval '1 month',
      pg_catalog.jsonb_build_object('payment_source','payfast','cancel_at_period_end',false))
    on conflict(subject_type,subject_id,plan_code) do update set
      status='active',qualified_leads_used=0,qualified_leads_limit=monthly_limit,
      starts_at=now(),ends_at=now() + interval '1 month',
      metadata=public.subscription_entitlements.metadata
        - 'cancel_at_period_end' - 'cancel_requested_at',
      updated_at=now();
  else
    raise exception 'Unsupported payment type';
  end if;
  return true;
end;
$$;
revoke all on function public.grant_provider_payment_entitlement(text,text)
from public,anon,authenticated;
grant execute on function public.grant_provider_payment_entitlement(text,text)
to service_role;

-- Cancelled billing does not retroactively remove the already-paid month.
-- Expiration still follows ends_at; no further renewal should be granted.
create or replace function public.record_provider_subscription_cancellation(
  p_provider_id integer, p_plan_code text
) returns boolean
language plpgsql security invoker set search_path = ''
as $$
declare updated_count integer;
begin
  if p_plan_code not in ('starter_monthly','growth_monthly','pro_monthly') then
    raise exception 'Not a provider subscription';
  end if;
  update public.subscription_entitlements
    set metadata = metadata || pg_catalog.jsonb_build_object(
      'cancel_at_period_end',true,'cancel_requested_at',now()),
      updated_at=now()
    where subject_type='provider' and subject_id=p_provider_id::text
      and plan_code=p_plan_code and status='active';
  get diagnostics updated_count=row_count;
  return updated_count>0;
end;
$$;
revoke all on function public.record_provider_subscription_cancellation(integer,text)
from public,anon,authenticated;
grant execute on function public.record_provider_subscription_cancellation(integer,text)
to service_role;
