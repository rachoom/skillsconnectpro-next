-- Calculator-to-hardware procurement limits and atomic quote allowance accounting.

create or replace function public.consume_supplier_quote_allowance(target_user_id uuid)
returns table(is_allowed boolean, remaining integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  allowance_row public.usage_allowances%rowtype;
begin
  select * into allowance_row
  from public.usage_allowances
  where user_id = target_user_id
    and allowance_type = 'supplier_quote_requests'
  for update;

  if not found then
    return query select false, 0;
    return;
  end if;

  if allowance_row.resets_at is not null
     and allowance_row.resets_at <= timezone('utc', now()) then
    return query select false, 0;
    return;
  end if;

  if allowance_row.allowed is not null
     and allowance_row.used >= allowance_row.allowed then
    return query select false, greatest(allowance_row.allowed - allowance_row.used, 0);
    return;
  end if;

  update public.usage_allowances
  set used = used + 1,
      updated_at = timezone('utc', now())
  where id = allowance_row.id;

  return query
  select true,
    case
      when allowance_row.allowed is null then null
      else greatest(allowance_row.allowed - (allowance_row.used + 1), 0)
    end;
end;
$$;

revoke all on function public.consume_supplier_quote_allowance(uuid) from public, anon, authenticated;
grant execute on function public.consume_supplier_quote_allowance(uuid) to service_role;

create or replace function public.release_supplier_quote_allowance(target_user_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.usage_allowances
  set used = greatest(used - 1, 0),
      updated_at = timezone('utc', now())
  where user_id = target_user_id
    and allowance_type = 'supplier_quote_requests'
    and used > 0;
  return found;
end;
$$;

revoke all on function public.release_supplier_quote_allowance(uuid) from public, anon, authenticated;
grant execute on function public.release_supplier_quote_allowance(uuid) to service_role;

create or replace function public.grant_customer_payment_entitlement(payment_ref text, processor_ref text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  payment_row public.customer_payment_transactions%rowtype;
  plan_row public.plans%rowtype;
  inserted_event text;
  active_project_allowance integer;
  ai_assessment_allowance integer;
  document_storage_allowance integer;
  supplier_quote_allowance integer;
begin
  select * into payment_row
  from public.customer_payment_transactions
  where m_payment_id = payment_ref
  for update;
  if not found then raise exception 'Unknown customer payment reference'; end if;

  insert into public.customer_payment_events (payfast_payment_id, m_payment_id)
  values (processor_ref, payment_ref)
  on conflict (payfast_payment_id) do nothing
  returning payfast_payment_id into inserted_event;
  if inserted_event is null then return false; end if;

  select * into plan_row from public.plans where code = payment_row.plan_code and active = true;
  if not found or plan_row.price_cents <= 0 or plan_row.duration_days is null then
    raise exception 'Unknown or inactive customer plan';
  end if;

  active_project_allowance := coalesce(plan_row.project_limit, 1);
  ai_assessment_allowance := case payment_row.plan_code when 'basic_30' then 2 when 'project_pass_90' then 5 else 1 end;
  document_storage_allowance := case payment_row.plan_code when 'basic_30' then 50 when 'project_pass_90' then 250 else 25 end;
  supplier_quote_allowance := case payment_row.plan_code when 'basic_30' then 3 when 'project_pass_90' then 10 else 1 end;

  update public.account_subscriptions
  set status = 'expired', ends_at = timezone('utc', now()), updated_at = timezone('utc', now())
  where user_id = payment_row.user_id
    and status in ('trial', 'active', 'past_due')
    and (ends_at is null or ends_at > timezone('utc', now()));

  insert into public.account_subscriptions (user_id, plan_code, status, starts_at, ends_at, payment_reference, metadata)
  values (
    payment_row.user_id,
    payment_row.plan_code,
    'active',
    timezone('utc', now()),
    timezone('utc', now()) + make_interval(days => plan_row.duration_days),
    payment_ref,
    jsonb_build_object('payment_source', 'payfast', 'processor_reference', processor_ref)
  );

  insert into public.usage_allowances (user_id, allowance_type, allowed, used, resets_at, metadata)
  values
    (payment_row.user_id, 'active_projects', active_project_allowance, 0, timezone('utc', now()) + make_interval(days => plan_row.duration_days), jsonb_build_object('plan_code', payment_row.plan_code)),
    (payment_row.user_id, 'ai_assessments', ai_assessment_allowance, 0, timezone('utc', now()) + make_interval(days => plan_row.duration_days), jsonb_build_object('plan_code', payment_row.plan_code)),
    (payment_row.user_id, 'document_storage_mb', document_storage_allowance, 0, timezone('utc', now()) + make_interval(days => plan_row.duration_days), jsonb_build_object('plan_code', payment_row.plan_code)),
    (payment_row.user_id, 'supplier_quote_requests', supplier_quote_allowance, 0, timezone('utc', now()) + make_interval(days => plan_row.duration_days), jsonb_build_object('plan_code', payment_row.plan_code))
  on conflict (user_id, allowance_type) do update set
    allowed = excluded.allowed,
    used = 0,
    resets_at = excluded.resets_at,
    metadata = excluded.metadata,
    updated_at = timezone('utc', now());

  return true;
end;
$$;

revoke all on function public.grant_customer_payment_entitlement(text, text) from public, anon, authenticated;
grant execute on function public.grant_customer_payment_entitlement(text, text) to service_role;

update public.usage_allowances ua
set allowed = case
      when ua.metadata ->> 'plan_code' = 'basic_30' then 3
      when ua.metadata ->> 'plan_code' = 'project_pass_90' then 10
      else coalesce(ua.allowed, 1)
    end,
    updated_at = timezone('utc', now())
where ua.allowance_type = 'supplier_quote_requests';

update public.plans
set project_limit = case code when 'project_pass_90' then 3 else 1 end,
    features = case code
      when 'basic_30' then '["Save one active project","Materials and budget workspace","Document storage","3 hardware quotation requests"]'::jsonb
      when 'project_pass_90' then '["Full project workspace for 90 days","3 active projects","Materials, milestones and expenses","Documents and supplier quotation preparation","10 hardware quotation requests"]'::jsonb
      else features
    end,
    updated_at = timezone('utc', now())
where code in ('basic_30','project_pass_90');
