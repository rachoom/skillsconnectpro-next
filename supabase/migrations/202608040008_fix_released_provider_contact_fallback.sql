create or replace function public.release_marketplace_contacts(
  p_project_id uuid,
  p_customer_access_token_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_project public.projects%rowtype;
  v_match public.project_matches%rowtype;
  v_provider public.artisans%rowtype;
  v_now timestamptz := timezone('utc', now());
  v_first_release boolean := false;
begin
  if p_customer_access_token_hash is null or length(trim(p_customer_access_token_hash)) < 20 then
    raise exception 'A valid customer access token is required.';
  end if;

  select * into v_project
  from public.projects
  where id = p_project_id
    and customer_access_token_hash = p_customer_access_token_hash
  for update;

  if not found then
    raise exception 'Project not found.';
  end if;

  if v_project.status in ('completed', 'cancelled', 'unfulfilled') then
    raise exception 'Contacts cannot be released while the project is %.', v_project.status;
  end if;

  if nullif(trim(coalesce(v_project.guest_phone, '')), '') is null then
    raise exception 'A customer phone number is required before contact details can be released.';
  end if;

  select * into v_match
  from public.project_matches
  where project_id = p_project_id
  for update;

  if not found then
    raise exception 'Select a provider before releasing contact details.';
  end if;

  if v_match.status not in ('selected', 'contact_released', 'accepted', 'in_progress') then
    raise exception 'The selected provider is not eligible for contact release.';
  end if;

  select * into v_provider
  from public.artisans
  where id = v_match.provider_id;

  if not found then
    raise exception 'Selected provider not found.';
  end if;

  if coalesce(
    nullif(trim(v_provider.whatsapp), ''),
    nullif(trim(v_provider.phone), '')
  ) is null then
    raise exception 'The selected provider has no usable contact number.';
  end if;

  v_first_release := v_match.contact_released_at is null;

  if v_first_release then
    update public.project_matches
    set status = 'contact_released',
        contact_released_at = v_now,
        updated_at = v_now
    where id = v_match.id;

    update public.projects
    set status = 'contact_released',
        consent_to_share = true,
        updated_at = v_now
    where id = p_project_id;

    update public.lead_invitations
    set status = 'cancelled',
        failure_reason = 'Customer selected another provider.',
        response_token_expires_at = v_now,
        updated_at = v_now
    where project_id = p_project_id
      and provider_id <> v_match.provider_id
      and status in ('queued', 'sent', 'delivered', 'viewed', 'accepted');

    update public.lead_invitations
    set status = 'accepted',
        response_token_expires_at = greatest(
          coalesce(response_token_expires_at, v_now),
          v_now + interval '7 days'
        ),
        updated_at = v_now
    where project_id = p_project_id
      and provider_id = v_match.provider_id;

    insert into public.project_status_events (
      project_id,
      event_type,
      actor_type,
      actor_id,
      message,
      event_data
    ) values (
      p_project_id,
      'contact_released',
      'customer',
      v_project.customer_id::text,
      'The customer confirmed the selected provider and released contact details.',
      jsonb_build_object(
        'matchId', v_match.id,
        'providerId', v_match.provider_id,
        'providerResponseId', v_match.provider_response_id
      )
    );
  end if;

  return jsonb_build_object(
    'projectId', p_project_id,
    'matchId', v_match.id,
    'status', 'contact_released',
    'contactReleasedAt', coalesce(v_match.contact_released_at, v_now),
    'provider', jsonb_build_object(
      'id', v_provider.id,
      'name', coalesce(
        nullif(trim(v_provider.name), ''),
        nullif(trim(concat_ws(' ', v_provider.first_name, v_provider.last_name)), ''),
        'Service provider'
      ),
      'phone', nullif(trim(v_provider.phone), ''),
      'whatsapp', coalesce(nullif(trim(v_provider.whatsapp), ''), nullif(trim(v_provider.phone), '')),
      'email', nullif(trim(v_provider.email), '')
    ),
    'customer', jsonb_build_object(
      'name', coalesce(nullif(trim(v_project.guest_name), ''), 'Customer'),
      'phone', nullif(trim(v_project.guest_phone), ''),
      'email', nullif(trim(v_project.guest_email), ''),
      'location', v_project.location_text,
      'suburb', v_project.suburb,
      'city', v_project.city
    )
  );
end;
$$;

revoke all on function public.release_marketplace_contacts(uuid, text) from public;
revoke all on function public.release_marketplace_contacts(uuid, text) from anon;
revoke all on function public.release_marketplace_contacts(uuid, text) from authenticated;
grant execute on function public.release_marketplace_contacts(uuid, text) to service_role;
