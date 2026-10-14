-- These records are server-only. Verified Payfast notifications use the
-- service role; browser clients receive no direct table access.
create table if not exists public.payment_transactions (
  m_payment_id text primary key,
  provider_id integer not null references public.artisans(id) on update cascade on delete restrict,
  plan_code text not null,
  plan_kind text not null check (plan_kind in ('subscription', 'lead_pack')),
  amount_cents integer not null check (amount_cents >= 500),
  currency char(3) not null default 'ZAR',
  processor_status text not null default 'INITIATED',
  payfast_payment_id text null,
  subscription_token text null,
  processor_payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payment_events (
  payfast_payment_id text primary key,
  m_payment_id text not null references public.payment_transactions(m_payment_id) on delete cascade,
  received_at timestamptz not null default timezone('utc', now())
);

create index if not exists payment_transactions_provider_idx on public.payment_transactions (provider_id, created_at desc);
alter table public.payment_transactions enable row level security;
alter table public.payment_events enable row level security;
revoke all on public.payment_transactions, public.payment_events from anon, authenticated;
grant all on public.payment_transactions, public.payment_events to service_role;

create or replace function public.grant_provider_payment_entitlement(payment_ref text, processor_ref text)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  payment_row public.payment_transactions%rowtype;
  inserted_event text;
  credit_count integer;
begin
  select * into payment_row from public.payment_transactions where m_payment_id = payment_ref for update;
  if not found then raise exception 'Unknown payment reference'; end if;

  insert into public.payment_events (payfast_payment_id, m_payment_id)
  values (processor_ref, payment_ref)
  on conflict (payfast_payment_id) do nothing
  returning payfast_payment_id into inserted_event;
  if inserted_event is null then return false; end if;

  if payment_row.plan_kind = 'lead_pack' then
    credit_count := case payment_row.plan_code when 'lead_pack_4' then 4 when 'lead_pack_10' then 10 when 'lead_pack_25' then 25 else 0 end;
    if credit_count = 0 then raise exception 'Unknown lead pack'; end if;
    insert into public.subscription_entitlements (subject_type, subject_id, plan_code, status, qualified_leads_used, qualified_leads_limit, starts_at, ends_at, metadata)
    values ('provider', payment_row.provider_id::text, payment_row.plan_code, 'active', 0, credit_count, timezone('utc', now()), null, jsonb_build_object('payment_source', 'payfast'))
    on conflict (subject_type, subject_id, plan_code) do update set
      status = 'active', qualified_leads_limit = public.subscription_entitlements.qualified_leads_limit + excluded.qualified_leads_limit, updated_at = timezone('utc', now());
  else
    insert into public.subscription_entitlements (subject_type, subject_id, plan_code, status, qualified_leads_used, qualified_leads_limit, starts_at, ends_at, metadata)
    values ('provider', payment_row.provider_id::text, payment_row.plan_code, 'active', 0, null, timezone('utc', now()), timezone('utc', now()) + interval '1 month', jsonb_build_object('payment_source', 'payfast'))
    on conflict (subject_type, subject_id, plan_code) do update set
      status = 'active', starts_at = timezone('utc', now()), ends_at = timezone('utc', now()) + interval '1 month', updated_at = timezone('utc', now());
  end if;
  return true;
end;
$$;

revoke all on function public.grant_provider_payment_entitlement(text, text) from public, anon, authenticated;
grant execute on function public.grant_provider_payment_entitlement(text, text) to service_role;
