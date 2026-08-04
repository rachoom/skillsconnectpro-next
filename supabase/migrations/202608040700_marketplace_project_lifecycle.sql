create or replace function public.update_marketplace_project_lifecycle(
  p_project_id uuid,
  p_status text,
  p_final_price numeric default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'auth'
as $$
declare
  v_project public.projects%rowtype;
  v_match public.project_matches%rowtype;
  v_now timestamptz := timezone('utc', now());
  v_event_type text;
  v_message text;
begin
  if not public.is_marketplace_admin() then
    raise exception 'Marketplace administrator authorization is required.';
  end if;

  if p_status not in ('in_progress', 'completed', 'cancelled') then
    raise exception 'Unsupported lifecycle status: %.', p_status;
  end if;

  if p_final_price is not null and p_final_price < 0 then
    raise exception 'Final price cannot be negative.';
  end if;

  select * into v_project
  from public.projects
  where id = p_project_id
  for update;

  if not found then
    raise exception 'Project not found.';
  end if;

  select * into v_match
  from public.project_matches
  where project_id = p_project_id
  for update;

  if not found then
    raise exception 'A selected provider record is required before the project lifecycle can be updated.';
  end if;

  if p_status = 'in_progress' then
    if v_project.status not in ('contact_released', 'in_progress') then
      raise exception 'Work can only start after customer and provider contact details have been released.';
    end if;

    update public.projects
    set status = 'in_progress',
        updated_at = v_now
    where id = p_project_id;

    update public.project_matches
    set status = 'in_progress',
        updated_at = v_now
    where id = v_match.id;

    v_event_type := 'work_started';
    v_message := 'The administrator recorded that work has started.';

  elsif p_status = 'completed' then
    if v_project.status not in ('contact_released', 'in_progress', 'completed') then
      raise exception 'Only a connected or active project can be marked completed.';
    end if;

    update public.projects
    set status = 'completed',
        updated_at = v_now
    where id = p_project_id;

    update public.project_matches
    set status = 'completed',
        completion_reported_at = coalesce(completion_reported_at, v_now),
        final_price = coalesce(p_final_price, final_price),
        updated_at = v_now
    where id = v_match.id;

    v_event_type := 'project_completed';
    v_message := 'The administrator recorded the project as completed.';

  else
    if v_project.status = 'completed' then
      raise exception 'A completed project cannot be cancelled.';
    end if;

    if v_project.status not in ('provider_selected', 'contact_released', 'in_progress', 'cancelled') then
      raise exception 'This project is not in a state that can be cancelled from the selected-provider record.';
    end if;

    update public.projects
    set status = 'cancelled',
        updated_at = v_now
    where id = p_project_id;

    update public.project_matches
    set status = 'cancelled',
        updated_at = v_now
    where id = v_match.id;

    v_event_type := 'project_cancelled';
    v_message := 'The administrator recorded the project as cancelled.';
  end if;

  insert into public.project_status_events (
    project_id,
    event_type,
    actor_type,
    actor_id,
    message,
    event_data
  ) values (
    p_project_id,
    v_event_type,
    'admin',
    auth.uid()::text,
    v_message,
    jsonb_strip_nulls(jsonb_build_object(
      'matchId', v_match.id,
      'providerId', v_match.provider_id,
      'previousProjectStatus', v_project.status,
      'status', p_status,
      'finalPrice', p_final_price,
      'note', nullif(trim(coalesce(p_note, '')), '')
    ))
  );

  return jsonb_strip_nulls(jsonb_build_object(
    'projectId', p_project_id,
    'matchId', v_match.id,
    'providerId', v_match.provider_id,
    'previousStatus', v_project.status,
    'status', p_status,
    'finalPrice', p_final_price,
    'updatedAt', v_now
  ));
end;
$$;

revoke all on function public.update_marketplace_project_lifecycle(uuid, text, numeric, text) from public;
grant execute on function public.update_marketplace_project_lifecycle(uuid, text, numeric, text) to authenticated;

comment on function public.update_marketplace_project_lifecycle(uuid, text, numeric, text)
is 'Allows a verified marketplace administrator to mark a selected-provider project in progress, completed, or cancelled while preserving an audit event.';
