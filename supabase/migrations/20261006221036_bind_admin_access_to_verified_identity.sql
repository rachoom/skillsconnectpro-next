begin;
create or replace function public.is_marketplace_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admin_users a
    join auth.users u on u.id = auth.uid() and lower(u.email) = lower(a.email)
    where a.is_verified = true and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
commit;
