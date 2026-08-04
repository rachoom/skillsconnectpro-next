create or replace function public.create_marketplace_provider_invitation(
  p_project_id uuid,
  p_provider_id integer,
  p_wave_number integer default 1,
  p_delivery_channel text default 'whatsapp'
)
returns table (
  invitation_id uuid,
  response_token text,
  response_deadline timestamptz,
  provider_contact text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_project public.projects%rowtype;
  v_deadline timestamptz;
  v_token text;
  v_token_hash text;
  v_invitation_id uuid;
  v_provider_contact text;
  v_provider_snapshot jsonb;
begin
  if auth.uid() is null or not public.is_marketplace_admin() then
    raise exception 'Not authorised to create marketplace invitations.' using errcode = '42501';
  end if;

  if p_wave_number < 1 then
    raise exception 'Wave number must be a positive integer.';
  end if;

  if p_delivery_channel not in ('web', 'whatsapp', 'sms', 'email', 'phone', 'admin') then
    raise exception 'Unsupported delivery channel.';
  end if;

  select * into v_project
  from public.projects
  where id = p_project_id
  for update;

  if not found then
    raise exception 'Project not found.';
  end if;

  if not v_project.consent_to_share then
    raise exception 'Customer consent is required before sharing this project.';
  end if;

  if v_project.status in ('provider_selected', 'contact_released', 'in_progress', 'completed', 'cancelled', 'unfulfilled')
     or exists (
       select 1
       from public.project_matches pm
       where pm.project_id = p_project_id
         and pm.status in ('selected', 'contact_released', 'accepted', 'in_progress', 'completed')
     ) then
    raise exception 'New providers cannot be invited after a provider has been selected for this project.';
  end if;

  select
    coalesce(nullif(trim(a.whatsapp), ''), nullif(trim(a.phone), '')),
    jsonb_build_object(
      'id', a.id,
      'name', coalesce(
        nullif(trim(a.name), ''),
        nullif(trim(concat_ws(' ', a.first_name, a.last_name)), ''),
        'Provider ' || a.id::text
      ),
      'category', a.category,
      'location', a.location,
      'rating', a.rating,
      'verified', coalesce(a.verified, false),
      'phone', coalesce(nullif(trim(a.whatsapp), ''), nullif(trim(a.phone), ''))
    )
  into v_provider_contact, v_provider_snapshot
  from public.artisans a
  where a.id = p_provider_id;

  if not found then
    raise exception 'Provider not found.';
  end if;

  v_deadline := timezone('utc', now()) + case v_project.urgency
    when 'emergency' then interval '15 minutes'
    when 'urgent' then interval '60 minutes'
    when 'large_project' then interval '24 hours'
    else interval '4 hours'
  end;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_token_hash := encode(extensions.digest(v_token, 'sha256'), 'hex');

  insert into public.lead_invitations (
    project_id,
    provider_id,
    wave_number,
    status,
    delivery_channel,
    delivery_address,
    response_deadline,
    response_token_hash,
    response_token_expires_at,
    provider_snapshot,
    updated_at
  ) values (
    p_project_id,
    p_provider_id,
    p_wave_number,
    'queued',
    p_delivery_channel,
    v_provider_contact,
    v_deadline,
    v_token_hash,
    v_deadline,
    v_provider_snapshot,
    timezone('utc', now())
  )
  on conflict (project_id, provider_id)
  do update set
    wave_number = excluded.wave_number,
    status = 'queued',
    delivery_channel = excluded.delivery_channel,
    delivery_address = excluded.delivery_address,
    sent_at = null,
    delivered_at = null,
    viewed_at = null,
    response_deadline = excluded.response_deadline,
    response_token_hash = excluded.response_token_hash,
    response_token_expires_at = excluded.response_token_expires_at,
    provider_snapshot = excluded.provider_snapshot,
    failure_reason = null,
    updated_at = timezone('utc', now())
  returning id into v_invitation_id;

  update public.projects
  set status = 'matching', updated_at = timezone('utc', now())
  where id = p_project_id
    and status in ('draft', 'assessment_complete', 'matching', 'responses_received');

  insert into public.project_status_events (
    project_id,
    event_type,
    actor_type,
    actor_id,
    message,
    event_data
  ) values (
    p_project_id,
    'provider_invitation_created',
    'admin',
    auth.uid()::text,
    'A secure provider invitation was created.',
    jsonb_build_object(
      'invitationId', v_invitation_id,
      'providerId', p_provider_id,
      'waveNumber', p_wave_number,
      'deliveryChannel', p_delivery_channel,
      'responseDeadline', v_deadline
    )
  );

  return query select v_invitation_id, v_token, v_deadline, v_provider_contact;
end;
$$;

revoke all on function public.create_marketplace_provider_invitation(uuid, integer, integer, text) from public;
grant execute on function public.create_marketplace_provider_invitation(uuid, integer, integer, text) to authenticated;

comment on function public.create_marketplace_provider_invitation(uuid, integer, integer, text)
is 'Creates or refreshes a secure provider invitation only while a project is still in the matching stage, preserving any later provider-selection state.';
