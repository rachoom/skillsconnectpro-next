-- Customer project-plan payments are separate from provider lead payments.
-- Only the server-side Payfast ITN handler may record or activate a purchase.

insert into public.plans (code, name, price_cents, duration_days, project_limit, features, active)
values
  ('free', 'Free', 0, null, 1, '["Account registration", "Basic AI Project Assistant", "1 project photo analysis", "Basic materials calculation", "Hardware quotation requests", "Find suitable artisans", "1 active project", "Basic project budget", "Limited expense tracking and receipt storage"]'::jsonb, true),
  ('basic_30', 'Basic', 2900, 30, 1, '["Everything in Free", "2 project photo analyses", "Full materials calculations", "1 active project", "Expense tracking", "Limited receipt storage", "Limited artisan collaboration", "Basic project budget"]'::jsonb, true),
  ('project_pass_90', 'Home Project Pass', 7900, 90, 3, '["Everything in Basic", "5 project photo analyses", "3 active projects", "Advanced project budget", "Expanded receipt storage", "Project timeline and milestones", "Project reports", "Collaborate with artisans", "Project document export"]'::jsonb, true)
on conflict (code) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  duration_days = excluded.duration_days,
  project_limit = excluded.project_limit,
  features = excluded.features,
  active = excluded.active,
  updated_at = timezone('utc', now());

create table if not exists public.customer_payment_transactions (
  m_payment_id text primary key,
  user_id uuid not null references auth.users(id) on delete restrict,
  plan_code text not null references public.plans(code) on update cascade on delete restrict,
  amount_cents integer not null check (amount_cents > 0),
  currency char(3) not null default 'ZAR',
  processor_status text not null default 'INITIATED',
  payfast_payment_id text null,
  processor_payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customer_payment_events (
  payfast_payment_id text primary key,
  m_payment_id text not null references public.customer_payment_transactions(m_payment_id) on delete cascade,
  received_at timestamptz not null default timezone('utc', now())
);

create index if not exists customer_payment_transactions_user_idx
  on public.customer_payment_transactions (user_id, created_at desc);

alter table public.customer_payment_transactions enable row level security;
alter table public.customer_payment_events enable row level security;
revoke all on public.customer_payment_transactions, public.customer_payment_events from anon, authenticated;
grant all on public.customer_payment_transactions, public.customer_payment_events to service_role;

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

  -- A paid plan supersedes an older active customer plan; purchase history is retained.
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
    (payment_row.user_id, 'supplier_quote_requests', null, 0, timezone('utc', now()) + make_interval(days => plan_row.duration_days), jsonb_build_object('plan_code', payment_row.plan_code))
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
