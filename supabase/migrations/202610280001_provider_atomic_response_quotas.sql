-- Provider response entitlement accounting. Applies to staging first.
-- All writes occur in one PostgreSQL transaction. Only the backend
-- service_role may invoke the operation; opportunity tokens are checked
-- in the calling server before providing the invitation UUID.
create table if not exists public.provider_response_usage (
  invitation_id uuid primary key references public.lead_invitations(id) on delete cascade,
  provider_id text not null,
  entitlement_id uuid null references public.subscription_entitlements(id) on delete set null,
  charge_type text not null check (charge_type in ('free', 'subscription', 'lead_pack', 'declined')),
  created_at timestamptz not null default now()
);
create index if not exists provider_response_usage_provider_created_idx
  on public.provider_response_usage(provider_id, created_at desc);
alter table public.provider_response_usage enable row level security;
revoke all on public.provider_response_usage from public, anon, authenticated;
grant all on public.provider_response_usage to service_role;

-- Monthly response limits provide genuine, enforceable differentiation.
-- Unlike priority ranking, this does not change customer or provider matching.
update public.subscription_entitlements
  set qualified_leads_limit = case plan_code
    when 'starter_monthly' then 15
    when 'growth_monthly' then 40
    when 'pro_monthly' then 100
    else qualified_leads_limit end
where subject_type = 'provider'
  and plan_code in ('starter_monthly','growth_monthly','pro_monthly')
  and qualified_leads_limit is null;

create or replace function public.submit_provider_response_billed(
  p_invitation_id uuid,
  p_response_type text,
  p_arrival_window_start timestamptz default null,
  p_arrival_window_end timestamptz default null,
  p_site_visit_fee numeric default null,
  p_estimate_min numeric default null,
  p_estimate_max numeric default null,
  p_estimate_currency text default 'ZAR',
  p_provider_message text default null,
  p_valid_until timestamptz default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inv public.lead_invitations%rowtype;
  proj public.projects%rowtype;
  sub public.subscription_entitlements%rowtype;
  response_uuid uuid;
  used_responses integer;
  source_kind text := 'declined';
  charge_id uuid;
  next_status text;
begin
  select * into inv from public.lead_invitations
    where id = p_invitation_id for update;
  if not found then raise exception 'Opportunity not found'; end if;

  -- Serialize all responses by this provider, including parallel links, so
  -- no two responses spend the same last credit or the same free allowance.
  perform pg_catalog.pg_advisory_xact_lock(482301, pg_catalog.hashtext(inv.provider_id::text));

  if p_response_type not in
    ('available_now','available_today','available_tomorrow',
     'available_this_week','available_next_week',
     'site_visit','estimate','need_information','declined') then
    raise exception 'Invalid response type';
  end if;
  if inv.status in ('cancelled','expired','failed','accepted','declined') then
    raise exception 'Opportunity is not available';
  end if;
  if inv.response_token_expires_at is not null
     and inv.response_token_expires_at <= now() then
    raise exception 'Opportunity response link has expired';
  end if;
  if exists (select 1 from public.provider_responses
             where lead_invitation_id = inv.id) then
    raise exception 'Opportunity already answered';
  end if;
  select * into proj from public.projects where id = inv.project_id for update;
  if not found or proj.status in
    ('provider_selected','contact_released','in_progress','disputed',
     'cancelled','completed','unfulfilled') then
    raise exception 'Customer project is no longer accepting responses';
  end if;
  if p_site_visit_fee < 0 or p_estimate_min < 0 or p_estimate_max < 0
     or (p_estimate_min is not null and p_estimate_max is not null
         and p_estimate_min > p_estimate_max) then
    raise exception 'Invalid price details';
  end if;
  if p_estimate_currency <> 'ZAR' or length(coalesce(p_provider_message,'')) > 2000 then
    raise exception 'Invalid response data';
  end if;

  if p_response_type <> 'declined' then
    -- Only submitted non-declined responses count as complimentary leads.
    select count(*)::integer into used_responses
      from public.provider_responses r
      where r.provider_id::text = inv.provider_id::text
        and r.response_type <> 'declined';
    if used_responses < 3 then
      source_kind := 'free';
    else
      -- Preferred order: active subscription with remaining allowance,
      -- then an available once-off lead pack. All rows are locked.
      select * into sub from public.subscription_entitlements
        where subject_type = 'provider' and subject_id = inv.provider_id::text
          and status = 'active' and starts_at <= now() and ends_at > now()
          and plan_code in ('starter_monthly','growth_monthly','pro_monthly')
          and qualified_leads_used < coalesce(qualified_leads_limit,
            case plan_code when 'starter_monthly' then 15
              when 'growth_monthly' then 40 when 'pro_monthly' then 100 else 0 end)
        order by case plan_code when 'pro_monthly' then 1
          when 'growth_monthly' then 2 else 3 end
        limit 1 for update;
      if found then
        source_kind := 'subscription';
      else
        select * into sub from public.subscription_entitlements
          where subject_type='provider' and subject_id=inv.provider_id::text
            and status='active' and starts_at <= now()
            and (ends_at is null or ends_at > now())
            and plan_code in ('lead_pack_4','lead_pack_10','lead_pack_25')
            and qualified_leads_used < qualified_leads_limit
          order by created_at asc limit 1 for update;
        if not found then
          raise exception 'PROVIDER_RESPONSE_LIMIT';
        end if;
        source_kind := 'lead_pack';
      end if;
      charge_id := sub.id;
      update public.subscription_entitlements
        set qualified_leads_used = qualified_leads_used + 1,
            updated_at = now()
        where id = charge_id;
    end if;
  end if;

  -- No intermediate save is visible: any failure rolls back credit usage,
  -- the response, invitation status and timeline event together.
  insert into public.provider_responses
    (lead_invitation_id, project_id, provider_id, response_type,
     arrival_window_start, arrival_window_end, site_visit_fee, estimate_min,
     estimate_max, estimate_currency, provider_message, valid_until)
  select inv.id, inv.project_id, inv.provider_id, p_response_type,
    p_arrival_window_start, p_arrival_window_end, p_site_visit_fee,
    p_estimate_min, p_estimate_max, p_estimate_currency,
    nullif(pg_catalog.btrim(p_provider_message),''), p_valid_until
  returning id into response_uuid;

  insert into public.provider_response_usage
    (invitation_id, provider_id, entitlement_id, charge_type)
  values (inv.id, inv.provider_id::text, charge_id, source_kind);

  next_status := case when p_response_type = 'declined'
    then 'declined' else 'accepted' end;
  update public.lead_invitations set status=next_status where id=inv.id;
  if p_response_type <> 'declined' and proj.status in
    ('assessment_complete','matching','responses_received') then
    update public.projects set status='responses_received' where id=inv.project_id;
  end if;
  insert into public.project_status_events
    (project_id, event_type, actor_type, actor_id, message, event_data)
  values (inv.project_id,
    case when p_response_type = 'declined' then 'provider_declined'
      else 'provider_response_received' end,
    'provider', inv.provider_id::text,
    case when p_response_type = 'declined' then 'A provider declined the opportunity.'
      else 'A provider submitted an availability or estimate response.' end,
    pg_catalog.jsonb_build_object('invitationId',inv.id,'responseId',response_uuid,
      'responseType',p_response_type,'chargeType',source_kind));
  return pg_catalog.jsonb_build_object('responseId',response_uuid,
    'projectId',inv.project_id,'invitationStatus',next_status,'chargeType',source_kind);
end;
$$;
revoke all on function public.submit_provider_response_billed(
  uuid,text,timestamptz,timestamptz,numeric,numeric,numeric,text,text,timestamptz
) from public,anon,authenticated;
grant execute on function public.submit_provider_response_billed(
  uuid,text,timestamptz,timestamptz,numeric,numeric,numeric,text,text,timestamptz
) to service_role;
