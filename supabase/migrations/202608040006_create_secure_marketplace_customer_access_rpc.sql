create or replace function public.create_marketplace_customer_access(
  p_project_id uuid
)
returns table (
  project_id uuid,
  access_token text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_token text;
  v_token_hash text;
begin
  if auth.uid() is null or not public.is_marketplace_admin() then
    raise exception 'Not authorised to create customer project access.' using errcode = '42501';
  end if;

  perform 1
  from public.projects
  where id = p_project_id
  for update;

  if not found then
    raise exception 'Project not found.';
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_token_hash := encode(extensions.digest(v_token, 'sha256'), 'hex');

  update public.projects
  set
    customer_access_token_hash = v_token_hash,
    updated_at = timezone('utc', now())
  where id = p_project_id;

  insert into public.project_status_events (
    project_id,
    event_type,
    actor_type,
    actor_id,
    message,
    event_data
  ) values (
    p_project_id,
    'customer_access_created',
    'admin',
    auth.uid()::text,
    'A secure customer project link was created or refreshed.',
    jsonb_build_object('projectId', p_project_id)
  );

  return query select p_project_id, v_token;
end;
$$;

revoke all on function public.create_marketplace_customer_access(uuid) from public;
grant execute on function public.create_marketplace_customer_access(uuid) to authenticated;

comment on function public.create_marketplace_customer_access(uuid)
is 'Creates or refreshes the opaque guest customer token for one marketplace project and returns the raw token once to a verified marketplace administrator.';
