begin;

-- Replace legacy public write policies with verified administrator access.
do $$
declare item record; table_name text;
begin
  for item in select tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in
      ('artisans','artisan_reviews','advertisements','contact_messages','search_requests','service_suggestions')
  loop execute format('drop policy %I on public.%I', item.policyname, item.tablename); end loop;
  foreach table_name in array array['artisans','artisan_reviews','advertisements','contact_messages','search_requests','service_suggestions']
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from public, anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
    execute format('create policy verified_admin_access on public.%I for all to authenticated using ((select public.is_marketplace_admin())) with check ((select public.is_marketplace_admin()))', table_name);
  end loop;
end $$;

-- Only the directory fields may be read directly by anonymous visitors.
grant select (id,name,first_name,last_name,category,location,image_url,verified,status,bio,marketplace_rating,marketplace_review_count)
  on public.artisans to anon;
create policy public_directory_fields on public.artisans for select to anon
  using (status is distinct from 'inactive');
grant select on public.advertisements to anon;
create policy active_public_ads on public.advertisements for select to anon, authenticated
  using (is_active = true and (expiry_date is null or expiry_date > now()));
grant select on public.artisan_reviews to anon;
create policy approved_public_reviews on public.artisan_reviews for select to anon, authenticated
  using (status = 'approved');

alter view public.artisans_with_featured set (security_invoker = true);
revoke all on public.artisans_with_featured from public, anon, authenticated;
grant select on public.artisans_with_featured to authenticated;

create policy verified_admin_applications on public.artisan_applications for all to authenticated
  using ((select public.is_marketplace_admin())) with check ((select public.is_marketplace_admin()));
alter policy "Allow users to submit their own applications" on public.artisan_applications
  with check (auth.uid() = user_id and status = 'pending');

-- Public image URLs stay readable; file mutation requires a verified admin.
do $$
declare item record;
begin
  for item in select policyname from pg_policies where schemaname = 'storage'
    and tablename = 'objects' and cmd in ('INSERT','UPDATE','DELETE','ALL')
    and (roles && array['public','anon']::name[])
  loop execute format('drop policy %I on storage.objects', item.policyname); end loop;
end $$;
create policy verified_admin_storage_write on storage.objects for all to authenticated
  using ((select public.is_marketplace_admin())) with check ((select public.is_marketplace_admin()));

alter function public.count_recent_signups(inet,text,integer) set search_path = '';
alter function public.count_signup_attempts(inet,timestamptz) set search_path = '';

create table public.public_request_limits (
  bucket text not null,
  key_hash text not null,
  window_start timestamptz not null,
  requests integer not null,
  primary key (bucket,key_hash)
);
create index public_request_limits_expiry on public.public_request_limits(window_start);
alter table public.public_request_limits enable row level security;
revoke all on public.public_request_limits from public,anon,authenticated;
grant select,insert,update,delete on public.public_request_limits to service_role;

create function public.consume_public_request_limit(p_bucket text,p_key_hash text,p_limit integer,p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare current_requests integer;
begin
  if p_bucket !~ '^[a-z_]{1,40}$' or p_key_hash !~ '^[a-f0-9]{64}$'
     or p_limit not between 1 and 1000 or p_window_seconds not between 60 and 86400 then
    raise exception 'Invalid request limit configuration';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_bucket || ':' || p_key_hash,0));
  insert into public.public_request_limits as limits (bucket,key_hash,window_start,requests)
    values (p_bucket,p_key_hash,now(),1)
    on conflict (bucket,key_hash) do update
      set window_start = case when limits.window_start <= now() - make_interval(secs => p_window_seconds) then now() else limits.window_start end,
          requests = case when limits.window_start <= now() - make_interval(secs => p_window_seconds) then 1 else least(limits.requests+1,p_limit+1) end
    returning requests into current_requests;
  delete from public.public_request_limits where window_start < now() - interval '1 day';
  return current_requests <= p_limit;
end $$;
revoke all on function public.consume_public_request_limit(text,text,integer,integer) from public,anon,authenticated;
grant execute on function public.consume_public_request_limit(text,text,integer,integer) to service_role;

commit;
