-- The public API calls these functions as anon. Existing artisan row policies
-- determine which profiles contribute to both the service menu and the results.
create function public.public_directory_categories()
returns text[] language sql stable security invoker set search_path = '' as $$
  select coalesce(array_agg(distinct a.category) filter (where a.category is not null), '{}'::text[])
  from public.artisans a where a.status = 'active';
$$;

create function public.public_directory_matches(
  search_text text, service_categories text[], search_categories text[]
)
returns table(id integer, verified boolean, marketplace_review_count integer)
language sql stable security invoker set search_path = '' as $$
  select a.id, a.verified, a.marketplace_review_count
  from public.artisans a
  where a.status = 'active'
    and (service_categories is null or a.category = any(service_categories))
    and (search_text = ''
      or strpos(lower(concat_ws(' ', coalesce(nullif(trim(concat_ws(' ', a.first_name, a.last_name)), ''), 'Local service provider'), a.category, a.location)), lower(search_text)) > 0
      or a.category = any(search_categories));
$$;

revoke all on function public.public_directory_categories() from public;
revoke all on function public.public_directory_matches(text,text[],text[]) from public;
grant execute on function public.public_directory_categories() to anon;
grant execute on function public.public_directory_matches(text,text[],text[]) to anon;
