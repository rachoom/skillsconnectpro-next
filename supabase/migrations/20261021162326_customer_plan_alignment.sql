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
  select * into payment_row from public.customer_payment_transactions where m_payment_id = payment_ref for update;
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
  values (payment_row.user_id, payment_row.plan_code, 'active', timezone('utc', now()),
    timezone('utc', now()) + make_interval(days => plan_row.duration_days), payment_ref,
    jsonb_build_object('payment_source', 'payfast', 'processor_reference', processor_ref));

  insert into public.usage_allowances (user_id, allowance_type, allowed, used, resets_at, metadata)
  values
    (payment_row.user_id, 'active_projects', active_project_allowance, 0, timezone('utc', now()) + make_interval(days => plan_row.duration_days), jsonb_build_object('plan_code', payment_row.plan_code)),
    (payment_row.user_id, 'ai_assessments', ai_assessment_allowance, 0, timezone('utc', now()) + make_interval(days => plan_row.duration_days), jsonb_build_object('plan_code', payment_row.plan_code)),
    (payment_row.user_id, 'document_storage_mb', document_storage_allowance, 0, timezone('utc', now()) + make_interval(days => plan_row.duration_days), jsonb_build_object('plan_code', payment_row.plan_code)),
    (payment_row.user_id, 'supplier_quote_requests', supplier_quote_allowance, 0, timezone('utc', now()) + make_interval(days => plan_row.duration_days), jsonb_build_object('plan_code', payment_row.plan_code))
  on conflict (user_id, allowance_type) do update set
    allowed = excluded.allowed, used = 0, resets_at = excluded.resets_at,
    metadata = excluded.metadata, updated_at = timezone('utc', now());

  return true;
end;
$$;

revoke all on function public.grant_customer_payment_entitlement(text, text) from public, anon, authenticated;
grant execute on function public.grant_customer_payment_entitlement(text, text) to service_role;

update public.usage_allowances ua
set allowed = case ua.allowance_type
      when 'active_projects' then 1
      when 'ai_assessments' then 1
      when 'document_storage_mb' then 25
      when 'supplier_quote_requests' then 1
      else ua.allowed
    end,
    used = case when ua.allowance_type = 'ai_assessments' then 0 else ua.used end,
    resets_at = null,
    metadata = jsonb_build_object('plan_code', 'free'),
    updated_at = timezone('utc', now())
where not exists (
  select 1 from public.account_subscriptions s
  where s.user_id = ua.user_id
    and s.status in ('trial', 'active')
    and (s.ends_at is null or s.ends_at > timezone('utc', now()))
);

update public.plans
set features = case code
  when 'free' then '["Account registration","Basic AI Project Assistant","1 project photo analysis","Basic materials calculation","1 hardware quotation request","Find suitable artisans","1 active project","Basic project budget","Limited expense tracking and receipt storage"]'::jsonb
  when 'basic_30' then '["Everything in Free","2 project photo analyses","Full materials calculations","3 hardware quotation requests","1 active project","Expense tracking","Limited receipt storage","Limited artisan collaboration","Basic project budget"]'::jsonb
  when 'project_pass_90' then '["Everything in Basic","5 project photo analyses","10 hardware quotation requests","3 active projects","Advanced project budget","Expanded receipt storage","Project timeline and milestones","Project reports","Collaborate with artisans","Project document export"]'::jsonb
  else features
end,
updated_at = timezone('utc', now())
where code in ('free', 'basic_30', 'project_pass_90');
