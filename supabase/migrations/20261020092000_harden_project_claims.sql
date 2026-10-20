-- Keep guest-project claiming behind authenticated server code.
-- The browser no longer receives EXECUTE permission on privileged claim logic.

drop function if exists public.claim_guest_project(uuid, text);

create or replace function public.claim_guest_project_as_service(
  target_project_id uuid,
  raw_access_token text,
  target_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_project_id uuid;
begin
  if target_user_id is null then
    raise exception 'A target user is required';
  end if;
  if raw_access_token is null or length(raw_access_token) < 32 then
    raise exception 'A valid project access token is required';
  end if;

  update public.projects
  set customer_id = target_user_id,
      updated_at = timezone('utc', now())
  where id = target_project_id
    and (customer_id is null or customer_id = target_user_id)
    and customer_access_token_hash = encode(extensions.digest(raw_access_token, 'sha256'), 'hex')
  returning id into updated_project_id;

  if updated_project_id is null then
    return false;
  end if;

  insert into public.project_members (project_id, user_id, member_role, status)
  values (updated_project_id, target_user_id, 'owner', 'active')
  on conflict (project_id, user_id) do update set
    member_role = 'owner',
    status = 'active',
    updated_at = timezone('utc', now());

  return true;
end;
$$;

revoke all on function public.claim_guest_project_as_service(uuid, text, uuid)
  from public, anon, authenticated;
grant execute on function public.claim_guest_project_as_service(uuid, text, uuid)
  to service_role;

create index if not exists customer_payment_events_payment_idx
  on public.customer_payment_events (m_payment_id);
create index if not exists customer_payment_transactions_plan_idx
  on public.customer_payment_transactions (plan_code);
