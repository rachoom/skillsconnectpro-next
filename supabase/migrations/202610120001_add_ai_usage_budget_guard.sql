begin;

create extension if not exists pgcrypto;

create table public.ai_usage_months (
  month_start date primary key,
  reserved_cents integer not null default 0 check (reserved_cents >= 0),
  settled_cents integer not null default 0 check (settled_cents >= 0),
  updated_at timestamptz not null default now()
);

create table public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  settled_at timestamptz,
  session_hash text not null,
  ip_hash text not null,
  usage_kind text not null,
  has_image boolean not null default false,
  model text,
  reserved_cents integer not null check (reserved_cents > 0),
  settled_cents integer check (settled_cents >= 0),
  input_tokens integer check (input_tokens >= 0),
  output_tokens integer check (output_tokens >= 0),
  project_id uuid references public.projects(id) on delete set null,
  status text not null default 'reserved' check (status in ('reserved', 'settled', 'released'))
);

create index ai_usage_events_session_window_idx on public.ai_usage_events (session_hash, usage_kind, created_at desc);
create index ai_usage_events_ip_window_idx on public.ai_usage_events (ip_hash, usage_kind, created_at desc);
create index ai_usage_events_unlinked_idx on public.ai_usage_events (session_hash, created_at desc) where project_id is null;

alter table public.ai_usage_months enable row level security;
alter table public.ai_usage_events enable row level security;
revoke all on public.ai_usage_months from public, anon, authenticated;
revoke all on public.ai_usage_events from public, anon, authenticated;
grant select, insert, update, delete on public.ai_usage_months to service_role;
grant select, insert, update, delete on public.ai_usage_events to service_role;

create function public.reserve_ai_usage(
  p_session_hash text,
  p_ip_hash text,
  p_usage_kind text,
  p_has_image boolean,
  p_session_limit integer,
  p_image_limit integer,
  p_window_seconds integer,
  p_monthly_budget_cents integer,
  p_reserve_cents integer
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_month date := (date_trunc('month', now() at time zone 'Africa/Johannesburg'))::date;
  v_started timestamptz := now() - make_interval(secs => p_window_seconds);
  v_count integer;
  v_image_count integer;
  v_reserved integer;
  v_settled integer;
  v_id uuid;
begin
  if p_session_hash !~ '^[a-f0-9]{64}$' or p_ip_hash !~ '^[a-f0-9]{64}$'
    or p_usage_kind !~ '^[a-z_]{1,40}$'
    or p_session_limit not between 1 and 100
    or p_image_limit not between 0 and 100
    or p_window_seconds not between 60 and 2592000
    or p_monthly_budget_cents not between 100 and 1000000
    or p_reserve_cents not between 1 and 10000 then
    raise exception 'Invalid AI usage guard configuration';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('ai_budget:' || v_month::text, 0));
  perform pg_advisory_xact_lock(hashtextextended('ai_session:' || p_usage_kind || ':' || p_session_hash, 0));

  select count(*) into v_count
  from public.ai_usage_events
  where usage_kind = p_usage_kind
    and created_at >= v_started
    and status <> 'released'
    and (session_hash = p_session_hash or ip_hash = p_ip_hash);
  if v_count >= p_session_limit then
    return jsonb_build_object('allowed', false, 'reason', 'session_limit');
  end if;

  if p_has_image then
    select count(*) into v_image_count
    from public.ai_usage_events
    where usage_kind = p_usage_kind
      and has_image = true
      and created_at >= v_started
      and status <> 'released'
      and (session_hash = p_session_hash or ip_hash = p_ip_hash);
    if v_image_count >= p_image_limit then
      return jsonb_build_object('allowed', false, 'reason', 'photo_limit');
    end if;
  end if;

  insert into public.ai_usage_months as months (month_start)
    values (v_month)
    on conflict (month_start) do update set updated_at = now()
    returning reserved_cents, settled_cents into v_reserved, v_settled;
  if v_reserved + v_settled + p_reserve_cents > p_monthly_budget_cents then
    return jsonb_build_object('allowed', false, 'reason', 'monthly_budget');
  end if;

  insert into public.ai_usage_events (session_hash, ip_hash, usage_kind, has_image, reserved_cents)
    values (p_session_hash, p_ip_hash, p_usage_kind, p_has_image, p_reserve_cents)
    returning id into v_id;
  update public.ai_usage_months
    set reserved_cents = reserved_cents + p_reserve_cents, updated_at = now()
    where month_start = v_month;

  return jsonb_build_object('allowed', true, 'reservation_id', v_id);
end $$;

create function public.settle_ai_usage(
  p_reservation_id uuid,
  p_settled_cents integer,
  p_input_tokens integer,
  p_output_tokens integer,
  p_model text
) returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_event public.ai_usage_events%rowtype;
  v_month date;
  v_actual integer;
begin
  if p_reservation_id is null or p_settled_cents < 0 or p_input_tokens < 0 or p_output_tokens < 0
    or coalesce(length(p_model), 0) > 100 then
    raise exception 'Invalid AI usage settlement';
  end if;
  select * into v_event from public.ai_usage_events where id = p_reservation_id for update;
  if not found then return false; end if;
  if v_event.status <> 'reserved' then return true; end if;
  v_month := (date_trunc('month', v_event.created_at at time zone 'Africa/Johannesburg'))::date;
  perform pg_advisory_xact_lock(hashtextextended('ai_budget:' || v_month::text, 0));
  v_actual := least(p_settled_cents, v_event.reserved_cents);
  update public.ai_usage_events
    set status = 'settled', settled_at = now(), settled_cents = v_actual,
        input_tokens = p_input_tokens, output_tokens = p_output_tokens, model = p_model
    where id = p_reservation_id;
  update public.ai_usage_months
    set reserved_cents = greatest(0, reserved_cents - v_event.reserved_cents),
        settled_cents = settled_cents + v_actual, updated_at = now()
    where month_start = v_month;
  return true;
end $$;

create function public.release_ai_usage(p_reservation_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_event public.ai_usage_events%rowtype;
  v_month date;
begin
  select * into v_event from public.ai_usage_events where id = p_reservation_id for update;
  if not found then return false; end if;
  if v_event.status <> 'reserved' then return true; end if;
  v_month := (date_trunc('month', v_event.created_at at time zone 'Africa/Johannesburg'))::date;
  perform pg_advisory_xact_lock(hashtextextended('ai_budget:' || v_month::text, 0));
  update public.ai_usage_events set status = 'released', settled_at = now() where id = p_reservation_id;
  update public.ai_usage_months
    set reserved_cents = greatest(0, reserved_cents - v_event.reserved_cents), updated_at = now()
    where month_start = v_month;
  return true;
end $$;

create function public.link_ai_usage_to_project(p_session_hash text, p_project_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_updated integer;
begin
  if p_session_hash !~ '^[a-f0-9]{64}$' or p_project_id is null then
    raise exception 'Invalid AI usage project link';
  end if;
  update public.ai_usage_events
    set project_id = p_project_id
    where session_hash = p_session_hash and project_id is null and created_at >= now() - interval '7 days';
  get diagnostics v_updated = row_count;
  return v_updated;
end $$;

revoke all on function public.reserve_ai_usage(text,text,text,boolean,integer,integer,integer,integer,integer) from public, anon, authenticated;
revoke all on function public.settle_ai_usage(uuid,integer,integer,integer,text) from public, anon, authenticated;
revoke all on function public.release_ai_usage(uuid) from public, anon, authenticated;
revoke all on function public.link_ai_usage_to_project(text,uuid) from public, anon, authenticated;
grant execute on function public.reserve_ai_usage(text,text,text,boolean,integer,integer,integer,integer,integer) to service_role;
grant execute on function public.settle_ai_usage(uuid,integer,integer,integer,text) to service_role;
grant execute on function public.release_ai_usage(uuid) to service_role;
grant execute on function public.link_ai_usage_to_project(text,uuid) to service_role;

comment on table public.ai_usage_events is 'Server-only AI cost ledger. HMAC hashes prevent storage of client IPs or session tokens.';
commit;
