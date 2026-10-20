-- Artisan business workspace + hardware quotation marketplace foundation.
-- Staging-first and additive. Public provider profiles remain separate from account roles.

create table if not exists public.hardware_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trading_name text null,
  email text null,
  phone text null,
  service_areas text[] not null default '{}',
  delivery_available boolean not null default true,
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  commission_rate numeric(6,4) not null default 0 check (commission_rate >= 0 and commission_rate <= 0.25),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.hardware_partner_members (
  partner_id uuid not null references public.hardware_partners(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_role text not null default 'owner' check (member_role in ('owner', 'manager', 'quote_clerk')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (partner_id, user_id)
);

create table if not exists public.material_quote_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete restrict,
  request_title text not null,
  delivery_area text not null,
  notes text null,
  status text not null default 'open' check (status in ('draft', 'open', 'awarded', 'closed', 'cancelled')),
  closes_at timestamptz null,
  selected_quote_id uuid null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.material_quote_request_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.material_quote_requests(id) on delete cascade,
  project_material_id uuid null references public.project_materials(id) on delete set null,
  description text not null,
  quantity numeric(12,3) null check (quantity is null or quantity > 0),
  unit text null,
  notes text null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.hardware_quote_invitations (
  request_id uuid not null references public.material_quote_requests(id) on delete cascade,
  partner_id uuid not null references public.hardware_partners(id) on delete cascade,
  status text not null default 'invited' check (status in ('invited', 'viewed', 'quoted', 'declined', 'expired')),
  invited_at timestamptz not null default timezone('utc', now()),
  viewed_at timestamptz null,
  responded_at timestamptz null,
  primary key (request_id, partner_id)
);

create table if not exists public.supplier_quotes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.material_quote_requests(id) on delete cascade,
  partner_id uuid not null references public.hardware_partners(id) on delete restrict,
  submitted_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'submitted' check (status in ('draft', 'submitted', 'accepted', 'declined', 'withdrawn', 'expired')),
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  delivery_fee numeric(12,2) not null default 0 check (delivery_fee >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  valid_until date null,
  notes text null,
  supplier_reference text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (request_id, partner_id)
);

create table if not exists public.supplier_quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.supplier_quotes(id) on delete cascade,
  request_item_id uuid not null references public.material_quote_request_items(id) on delete restrict,
  description text not null,
  brand text null,
  quantity numeric(12,3) null check (quantity is null or quantity > 0),
  unit text null,
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  line_total numeric(12,2) not null default 0 check (line_total >= 0),
  stock_status text not null default 'available' check (stock_status in ('available', 'limited', 'order_in', 'unavailable')),
  notes text null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (quote_id, request_item_id)
);

alter table public.material_quote_requests
  drop constraint if exists material_quote_requests_selected_quote_id_fkey;
alter table public.material_quote_requests
  add constraint material_quote_requests_selected_quote_id_fkey
  foreign key (selected_quote_id) references public.supplier_quotes(id) on delete set null;

create table if not exists public.hardware_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  request_id uuid not null references public.material_quote_requests(id) on delete restrict,
  quote_id uuid not null unique references public.supplier_quotes(id) on delete restrict,
  partner_id uuid not null references public.hardware_partners(id) on delete restrict,
  customer_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'accepted' check (status in ('accepted', 'awaiting_payment', 'paid', 'preparing', 'ready', 'fulfilled', 'cancelled', 'refunded')),
  payment_status text not null default 'not_reported' check (payment_status in ('not_reported', 'reported', 'verified', 'refunded')),
  supplier_reference text null,
  order_total numeric(12,2) not null check (order_total >= 0),
  commission_rate numeric(6,4) not null default 0 check (commission_rate >= 0 and commission_rate <= 0.25),
  commission_amount numeric(12,2) not null default 0 check (commission_amount >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.hardware_commission_ledger (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.hardware_orders(id) on delete cascade,
  partner_id uuid not null references public.hardware_partners(id) on delete restrict,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'payable', 'paid', 'credited', 'cancelled')),
  payable_at timestamptz null,
  paid_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (order_id)
);

create index if not exists hardware_partner_members_user_idx on public.hardware_partner_members (user_id, status);
create index if not exists hardware_partners_status_idx on public.hardware_partners (status);
create index if not exists material_quote_requests_project_idx on public.material_quote_requests (project_id, status, created_at desc);
create index if not exists material_quote_requests_requested_by_idx on public.material_quote_requests (requested_by, created_at desc);
create index if not exists material_quote_request_items_request_idx on public.material_quote_request_items (request_id, sort_order);
create index if not exists hardware_quote_invitations_partner_idx on public.hardware_quote_invitations (partner_id, status, invited_at desc);
create index if not exists supplier_quotes_request_idx on public.supplier_quotes (request_id, status, total);
create index if not exists supplier_quotes_partner_idx on public.supplier_quotes (partner_id, created_at desc);
create index if not exists supplier_quote_items_quote_idx on public.supplier_quote_items (quote_id);
create index if not exists hardware_orders_project_idx on public.hardware_orders (project_id, created_at desc);
create index if not exists hardware_orders_partner_idx on public.hardware_orders (partner_id, status, created_at desc);
create index if not exists hardware_commission_partner_idx on public.hardware_commission_ledger (partner_id, status, created_at desc);

create or replace function private.is_hardware_partner_member(target_partner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.hardware_partner_members hpm
    where hpm.partner_id = target_partner_id
      and hpm.user_id = (select auth.uid())
      and hpm.status = 'active'
  );
$$;

create or replace function private.can_manage_material_quote_request(target_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.material_quote_requests r
    where r.id = target_request_id
      and (
        r.requested_by = (select auth.uid())
        or (select private.can_access_project(r.project_id))
      )
  );
$$;

create or replace function private.can_view_material_quote_request(target_request_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.can_manage_material_quote_request(target_request_id))
    or exists (
      select 1
      from public.hardware_quote_invitations i
      join public.hardware_partner_members hpm on hpm.partner_id = i.partner_id
      where i.request_id = target_request_id
        and hpm.user_id = (select auth.uid())
        and hpm.status = 'active'
    );
$$;

revoke all on function private.is_hardware_partner_member(uuid) from public;
revoke all on function private.can_manage_material_quote_request(uuid) from public;
revoke all on function private.can_view_material_quote_request(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_hardware_partner_member(uuid) to authenticated;
grant execute on function private.can_manage_material_quote_request(uuid) to authenticated;
grant execute on function private.can_view_material_quote_request(uuid) to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'hardware_partners', 'hardware_partner_members', 'material_quote_requests',
    'material_quote_request_items', 'hardware_quote_invitations', 'supplier_quotes',
    'supplier_quote_items', 'hardware_orders', 'hardware_commission_ledger'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end;
$$;

drop policy if exists "Users read active hardware partners" on public.hardware_partners;
create policy "Users read active hardware partners"
on public.hardware_partners for select to authenticated
using (status = 'active' or (select private.is_hardware_partner_member(id)));

drop policy if exists "Members read own hardware memberships" on public.hardware_partner_members;
create policy "Members read own hardware memberships"
on public.hardware_partner_members for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Project users and invited partners read quote requests" on public.material_quote_requests;
create policy "Project users and invited partners read quote requests"
on public.material_quote_requests for select to authenticated
using ((select private.can_view_material_quote_request(id)));

drop policy if exists "Project users create quote requests" on public.material_quote_requests;
create policy "Project users create quote requests"
on public.material_quote_requests for insert to authenticated
with check (
  requested_by = (select auth.uid())
  and (select private.can_access_project(project_id))
);

drop policy if exists "Project users update quote requests" on public.material_quote_requests;
create policy "Project users update quote requests"
on public.material_quote_requests for update to authenticated
using ((select private.can_manage_material_quote_request(id)))
with check ((select private.can_manage_material_quote_request(id)));

drop policy if exists "Quote participants read request items" on public.material_quote_request_items;
create policy "Quote participants read request items"
on public.material_quote_request_items for select to authenticated
using ((select private.can_view_material_quote_request(request_id)));

drop policy if exists "Project users manage request items" on public.material_quote_request_items;
create policy "Project users manage request items"
on public.material_quote_request_items for all to authenticated
using ((select private.can_manage_material_quote_request(request_id)))
with check ((select private.can_manage_material_quote_request(request_id)));

drop policy if exists "Quote participants read invitations" on public.hardware_quote_invitations;
create policy "Quote participants read invitations"
on public.hardware_quote_invitations for select to authenticated
using (
  (select private.can_manage_material_quote_request(request_id))
  or (select private.is_hardware_partner_member(partner_id))
);

drop policy if exists "Project users manage invitations" on public.hardware_quote_invitations;
create policy "Project users manage invitations"
on public.hardware_quote_invitations for all to authenticated
using ((select private.can_manage_material_quote_request(request_id)))
with check ((select private.can_manage_material_quote_request(request_id)));

drop policy if exists "Quote participants read supplier quotes" on public.supplier_quotes;
create policy "Quote participants read supplier quotes"
on public.supplier_quotes for select to authenticated
using (
  (select private.can_manage_material_quote_request(request_id))
  or (select private.is_hardware_partner_member(partner_id))
);

drop policy if exists "Hardware members create supplier quotes" on public.supplier_quotes;
create policy "Hardware members create supplier quotes"
on public.supplier_quotes for insert to authenticated
with check (
  submitted_by = (select auth.uid())
  and (select private.is_hardware_partner_member(partner_id))
  and exists (
    select 1 from public.hardware_quote_invitations i
    where i.request_id = request_id and i.partner_id = partner_id
  )
);

drop policy if exists "Hardware members update supplier quotes" on public.supplier_quotes;
create policy "Hardware members update supplier quotes"
on public.supplier_quotes for update to authenticated
using ((select private.is_hardware_partner_member(partner_id)))
with check ((select private.is_hardware_partner_member(partner_id)));

drop policy if exists "Quote participants read supplier quote items" on public.supplier_quote_items;
create policy "Quote participants read supplier quote items"
on public.supplier_quote_items for select to authenticated
using (
  exists (
    select 1 from public.supplier_quotes q
    where q.id = quote_id
      and (
        (select private.can_manage_material_quote_request(q.request_id))
        or (select private.is_hardware_partner_member(q.partner_id))
      )
  )
);

drop policy if exists "Hardware members manage supplier quote items" on public.supplier_quote_items;
create policy "Hardware members manage supplier quote items"
on public.supplier_quote_items for all to authenticated
using (
  exists (
    select 1 from public.supplier_quotes q
    where q.id = quote_id and (select private.is_hardware_partner_member(q.partner_id))
  )
)
with check (
  exists (
    select 1 from public.supplier_quotes q
    where q.id = quote_id and (select private.is_hardware_partner_member(q.partner_id))
  )
);

drop policy if exists "Order participants read hardware orders" on public.hardware_orders;
create policy "Order participants read hardware orders"
on public.hardware_orders for select to authenticated
using (
  (select private.can_access_project(project_id))
  or (select private.is_hardware_partner_member(partner_id))
);

drop policy if exists "Partner members read commission ledger" on public.hardware_commission_ledger;
create policy "Partner members read commission ledger"
on public.hardware_commission_ledger for select to authenticated
using ((select private.is_hardware_partner_member(partner_id)));

grant select on public.hardware_partners, public.hardware_partner_members to authenticated;
grant select, insert, update on public.material_quote_requests to authenticated;
grant select, insert, update, delete on public.material_quote_request_items, public.hardware_quote_invitations to authenticated;
grant select, insert, update on public.supplier_quotes to authenticated;
grant select, insert, update, delete on public.supplier_quote_items to authenticated;
grant select on public.hardware_orders, public.hardware_commission_ledger to authenticated;

-- Hardware quote requests are useful even on the free account. New accounts get one
-- active request; paid project passes may be unlimited.
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
    (new.id, 'supplier_quote_requests', 1)
  on conflict (user_id, allowance_type) do nothing;

  return new;
end;
$$;

update public.usage_allowances ua
set allowed = 1,
    updated_at = timezone('utc', now())
where allowance_type = 'supplier_quote_requests'
  and allowed = 0
  and not exists (
    select 1 from public.account_subscriptions s
    where s.user_id = ua.user_id
      and s.status = 'active'
      and (s.ends_at is null or s.ends_at > timezone('utc', now()))
  );

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'hardware_partners', 'hardware_partner_members', 'material_quote_requests',
    'supplier_quotes', 'hardware_orders', 'hardware_commission_ledger'
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

comment on table public.hardware_partners is 'Hardware suppliers participating in project material quotations. Pending partners are not customer-visible.';
comment on table public.material_quote_requests is 'Project-scoped requests for hardware quotations created by customers or artisans.';
comment on table public.hardware_orders is 'Accepted supplier quotations. Supplier remains seller of record; Skills Connect Pro tracks the referral and commission.';
