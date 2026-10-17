-- Accounts & My Projects foundation for Skills Connect Pro.
-- Additive only: existing guest links, marketplace dispatch and provider flows remain intact.

create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text null,
  phone text null,
  avatar_url text null,
  location_text text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.account_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('customer', 'artisan', 'hardware_partner', 'project_professional', 'admin')),
  status text not null default 'active' check (status in ('pending', 'active', 'suspended')),
  is_primary boolean not null default false,
  linked_artisan_id integer null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, role)
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_role text not null check (member_role in ('owner', 'collaborator', 'artisan', 'project_professional', 'hardware_partner', 'viewer')),
  status text not null default 'active' check (status in ('invited', 'active', 'removed')),
  invited_by uuid null references auth.users(id) on delete set null,
  joined_at timestamptz null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (project_id, user_id)
);

create table if not exists public.project_materials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  quantity numeric(12,3) null check (quantity is null or quantity >= 0),
  unit text null,
  estimated_unit_price numeric(12,2) null check (estimated_unit_price is null or estimated_unit_price >= 0),
  estimated_total numeric(12,2) null check (estimated_total is null or estimated_total >= 0),
  actual_total numeric(12,2) null check (actual_total is null or actual_total >= 0),
  notes text null,
  status text not null default 'planned' check (status in ('planned', 'quoted', 'ordered', 'purchased', 'removed')),
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  uploaded_by uuid null references auth.users(id) on delete set null,
  file_name text not null,
  storage_path text not null unique,
  mime_type text null,
  size_bytes bigint null check (size_bytes is null or size_bytes >= 0),
  document_type text not null default 'other' check (document_type in ('photo', 'floor_plan', 'estimate', 'quotation', 'invoice', 'receipt', 'contract', 'other')),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid null references auth.users(id) on delete set null,
  description text not null,
  category text not null default 'other' check (category in ('materials', 'labour', 'tools', 'transport', 'professional_fee', 'other')),
  amount numeric(12,2) not null check (amount >= 0),
  currency char(3) not null default 'ZAR',
  expense_date date not null default current_date,
  notes text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'blocked', 'completed')),
  due_at timestamptz null,
  completed_at timestamptz null,
  sort_order integer not null default 0,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.plans (
  code text primary key,
  name text not null,
  price_cents integer not null check (price_cents >= 0),
  duration_days integer null check (duration_days is null or duration_days > 0),
  project_limit integer null check (project_limit is null or project_limit > 0),
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.account_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_code text not null references public.plans(code) on update cascade on delete restrict,
  status text not null default 'active' check (status in ('trial', 'active', 'past_due', 'cancelled', 'expired')),
  starts_at timestamptz not null default timezone('utc', now()),
  ends_at timestamptz null,
  payment_reference text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.usage_allowances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  allowance_type text not null check (allowance_type in ('active_projects', 'ai_assessments', 'document_storage_mb', 'supplier_quote_requests')),
  allowed integer null check (allowed is null or allowed >= 0),
  used integer not null default 0 check (used >= 0),
  resets_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, allowance_type)
);

insert into public.plans (code, name, price_cents, duration_days, project_limit, features)
values
  ('basic_30', 'Basic', 2900, 30, 1, '["Save one active project", "Materials and budget workspace", "Document storage"]'::jsonb),
  ('project_pass_90', '90-day Project Pass', 7900, 90, 1, '["Full project workspace for 90 days", "Materials, milestones and expenses", "Documents and supplier quotation preparation"]'::jsonb)
on conflict (code) do update set
  name = excluded.name,
  price_cents = excluded.price_cents,
  duration_days = excluded.duration_days,
  project_limit = excluded.project_limit,
  features = excluded.features,
  active = true,
  updated_at = timezone('utc', now());

create index if not exists account_roles_role_status_idx on public.account_roles (role, status);
create index if not exists project_members_user_idx on public.project_members (user_id, status, created_at desc);
create index if not exists project_materials_project_idx on public.project_materials (project_id, status, created_at);
create index if not exists project_documents_project_idx on public.project_documents (project_id, created_at desc);
create index if not exists project_expenses_project_idx on public.project_expenses (project_id, expense_date desc);
create index if not exists project_milestones_project_idx on public.project_milestones (project_id, sort_order, created_at);
create index if not exists account_subscriptions_user_idx on public.account_subscriptions (user_id, status, ends_at);

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function private.handle_new_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'avatar_url', '')), '')
  )
  on conflict (id) do nothing;

  insert into public.account_roles (user_id, role, status, is_primary)
  values (new.id, 'customer', 'active', true)
  on conflict (user_id, role) do nothing;

  insert into public.usage_allowances (user_id, allowance_type, allowed)
  values
    (new.id, 'active_projects', 1),
    (new.id, 'ai_assessments', 3),
    (new.id, 'document_storage_mb', 25),
    (new.id, 'supplier_quote_requests', 0)
  on conflict (user_id, allowance_type) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_account() from public;

drop trigger if exists on_auth_user_created_scp_account on auth.users;
create trigger on_auth_user_created_scp_account
after insert on auth.users
for each row execute function private.handle_new_account();

insert into public.profiles (id, display_name, avatar_url)
select
  id,
  nullif(trim(coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', '')), ''),
  nullif(trim(coalesce(raw_user_meta_data ->> 'avatar_url', '')), '')
from auth.users
on conflict (id) do nothing;

insert into public.account_roles (user_id, role, status, is_primary)
select id, 'customer', 'active', true from auth.users
on conflict (user_id, role) do nothing;

create or replace function private.can_access_project(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    exists (
      select 1 from public.projects p
      where p.id = target_project_id and p.customer_id = (select auth.uid())
    )
    or exists (
      select 1 from public.project_members pm
      where pm.project_id = target_project_id
        and pm.user_id = (select auth.uid())
        and pm.status = 'active'
    )
  );
$$;

create or replace function private.is_project_owner(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.projects p
    where p.id = target_project_id and p.customer_id = (select auth.uid())
  );
$$;

revoke all on function private.can_access_project(uuid) from public;
revoke all on function private.is_project_owner(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.can_access_project(uuid) to authenticated;
grant execute on function private.is_project_owner(uuid) to authenticated;

create or replace function public.claim_guest_project(target_project_id uuid, raw_access_token text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  updated_project_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  if raw_access_token is null or length(raw_access_token) < 32 then
    raise exception 'A valid project access token is required';
  end if;

  update public.projects
  set customer_id = current_user_id,
      updated_at = timezone('utc', now())
  where id = target_project_id
    and (customer_id is null or customer_id = current_user_id)
    and customer_access_token_hash = encode(extensions.digest(raw_access_token, 'sha256'), 'hex')
  returning id into updated_project_id;

  if updated_project_id is null then return false; end if;

  insert into public.project_members (project_id, user_id, member_role, status)
  values (updated_project_id, current_user_id, 'owner', 'active')
  on conflict (project_id, user_id) do update set
    member_role = 'owner', status = 'active', updated_at = timezone('utc', now());

  return true;
end;
$$;

revoke all on function public.claim_guest_project(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_guest_project(uuid, text) to authenticated;

create or replace function private.attach_project_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.customer_id is not null then
    insert into public.project_members (project_id, user_id, member_role, status)
    values (new.id, new.customer_id, 'owner', 'active')
    on conflict (project_id, user_id) do update set
      member_role = 'owner', status = 'active', updated_at = timezone('utc', now());
  end if;
  return new;
end;
$$;

revoke all on function private.attach_project_owner() from public;

drop trigger if exists projects_attach_owner on public.projects;
create trigger projects_attach_owner
after insert or update of customer_id on public.projects
for each row execute function private.attach_project_owner();

insert into public.project_members (project_id, user_id, member_role, status)
select id, customer_id, 'owner', 'active'
from public.projects
where customer_id is not null
on conflict (project_id, user_id) do nothing;

insert into public.project_materials (
  project_id, name, quantity, unit, estimated_unit_price, estimated_total, notes
)
select
  p.id,
  coalesce(nullif(item ->> 'name', ''), 'Material'),
  case when (item ->> 'quantity') ~ '^[0-9]+(?:\\.[0-9]+)?$' then (item ->> 'quantity')::numeric else null end,
  nullif(item ->> 'unit', ''),
  case when (item ->> 'estimatedUnitPrice') ~ '^[0-9]+(?:\\.[0-9]+)?$' then (item ->> 'estimatedUnitPrice')::numeric else null end,
  case when (item ->> 'estimatedTotal') ~ '^[0-9]+(?:\\.[0-9]+)?$' then (item ->> 'estimatedTotal')::numeric else null end,
  nullif(item ->> 'notes', '')
from public.projects p
cross join lateral jsonb_array_elements(coalesce(p.materials, '[]'::jsonb)) item
where not exists (select 1 from public.project_materials pm where pm.project_id = p.id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'account_roles', 'project_members', 'project_materials',
    'project_documents', 'project_expenses', 'project_milestones',
    'plans', 'account_subscriptions', 'usage_allowances'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end;
$$;

alter table public.projects enable row level security;

drop policy if exists "Account holders read own profile" on public.profiles;
create policy "Account holders read own profile" on public.profiles for select to authenticated
using ((select auth.uid()) = id);
drop policy if exists "Account holders update own profile" on public.profiles;
create policy "Account holders update own profile" on public.profiles for update to authenticated
using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "Account holders read own roles" on public.account_roles;
create policy "Account holders read own roles" on public.account_roles for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Members read accessible projects" on public.projects;
create policy "Members read accessible projects" on public.projects for select to authenticated
using ((select private.can_access_project(id)));
drop policy if exists "Customers create owned projects" on public.projects;
create policy "Customers create owned projects" on public.projects for insert to authenticated
with check ((select auth.uid()) = customer_id);
drop policy if exists "Owners update projects" on public.projects;
create policy "Owners update projects" on public.projects for update to authenticated
using ((select private.is_project_owner(id))) with check ((select private.is_project_owner(id)));

drop policy if exists "Members read project membership" on public.project_members;
create policy "Members read project membership" on public.project_members for select to authenticated
using ((select private.can_access_project(project_id)));
drop policy if exists "Owners manage project membership" on public.project_members;
create policy "Owners manage project membership" on public.project_members for all to authenticated
using ((select private.is_project_owner(project_id))) with check ((select private.is_project_owner(project_id)));

drop policy if exists "Members manage project materials" on public.project_materials;
create policy "Members manage project materials" on public.project_materials for all to authenticated
using ((select private.can_access_project(project_id))) with check ((select private.can_access_project(project_id)));
drop policy if exists "Members manage project documents" on public.project_documents;
create policy "Members manage project documents" on public.project_documents for all to authenticated
using ((select private.can_access_project(project_id))) with check ((select private.can_access_project(project_id)));
drop policy if exists "Members manage project expenses" on public.project_expenses;
create policy "Members manage project expenses" on public.project_expenses for all to authenticated
using ((select private.can_access_project(project_id))) with check ((select private.can_access_project(project_id)));
drop policy if exists "Members manage project milestones" on public.project_milestones;
create policy "Members manage project milestones" on public.project_milestones for all to authenticated
using ((select private.can_access_project(project_id))) with check ((select private.can_access_project(project_id)));

drop policy if exists "Public reads active plans" on public.plans;
create policy "Public reads active plans" on public.plans for select to anon, authenticated using (active);
drop policy if exists "Account holders read own subscriptions" on public.account_subscriptions;
create policy "Account holders read own subscriptions" on public.account_subscriptions for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists "Account holders read own allowances" on public.usage_allowances;
create policy "Account holders read own allowances" on public.usage_allowances for select to authenticated
using ((select auth.uid()) = user_id);

grant select, update on public.profiles to authenticated;
grant select on public.account_roles to authenticated;
grant select, insert, update on public.projects to authenticated;
grant select, insert, update, delete on public.project_members, public.project_materials, public.project_documents, public.project_expenses, public.project_milestones to authenticated;
grant select on public.plans to anon, authenticated;
grant select on public.account_subscriptions, public.usage_allowances to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-documents',
  'project-documents',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.project_id_from_storage_path(object_name text)
returns uuid
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  first_segment text := split_part(object_name, '/', 1);
begin
  if first_segment ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return first_segment::uuid;
  end if;
  return null;
end;
$$;

grant execute on function private.project_id_from_storage_path(text) to authenticated;

drop policy if exists "Members read project documents storage" on storage.objects;
create policy "Members read project documents storage" on storage.objects for select to authenticated
using (bucket_id = 'project-documents' and (select private.can_access_project(private.project_id_from_storage_path(name))));
drop policy if exists "Members upload project documents storage" on storage.objects;
create policy "Members upload project documents storage" on storage.objects for insert to authenticated
with check (bucket_id = 'project-documents' and (select private.can_access_project(private.project_id_from_storage_path(name))));
drop policy if exists "Members update project documents storage" on storage.objects;
create policy "Members update project documents storage" on storage.objects for update to authenticated
using (bucket_id = 'project-documents' and (select private.can_access_project(private.project_id_from_storage_path(name))))
with check (bucket_id = 'project-documents' and (select private.can_access_project(private.project_id_from_storage_path(name))));
drop policy if exists "Members delete project documents storage" on storage.objects;
create policy "Members delete project documents storage" on storage.objects for delete to authenticated
using (bucket_id = 'project-documents' and (select private.can_access_project(private.project_id_from_storage_path(name))));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'account_roles', 'project_members', 'project_materials',
    'project_expenses', 'project_milestones', 'plans',
    'account_subscriptions', 'usage_allowances'
  ] loop
    execute format('drop trigger if exists %I_touch_updated_at on public.%I', table_name, table_name);
    execute format(
      'create trigger %I_touch_updated_at before update on public.%I for each row execute function private.touch_updated_at()',
      table_name,
      table_name
    );
  end loop;
end;
$$;

comment on table public.project_members is 'Private account access to a project; public provider profiles remain separate.';
comment on table public.project_materials is 'Editable project materials workspace derived from AI estimates and later supplier quotations.';
comment on table public.account_subscriptions is 'Customer and business workspace access. Provider lead entitlements remain in subscription_entitlements.';
