create table if not exists public.marketplace_admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'admin' check (role in ('admin', 'super_admin')),
  is_active boolean not null default true,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.marketplace_admin_users enable row level security;
revoke all on table public.marketplace_admin_users from anon, authenticated;

insert into public.marketplace_admin_users (user_id, email, role, is_active)
select id, email, 'super_admin', true
from auth.users
where lower(email) = lower('rachoom77@gmail.com')
on conflict (user_id) do update
set email = excluded.email,
    role = excluded.role,
    is_active = excluded.is_active,
    updated_at = timezone('utc'::text, now());

comment on table public.marketplace_admin_users is
  'Server-only allowlist of authenticated Supabase users permitted to access SkillsConnect Pro administration.';
