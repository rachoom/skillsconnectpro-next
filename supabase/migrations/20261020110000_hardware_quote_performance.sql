-- Hardware quotation performance cleanup from Supabase advisors.

create index if not exists hardware_orders_customer_idx
  on public.hardware_orders (customer_id);
create index if not exists hardware_orders_request_idx
  on public.hardware_orders (request_id);
create index if not exists material_quote_request_items_project_material_idx
  on public.material_quote_request_items (project_material_id);
create index if not exists material_quote_requests_selected_quote_idx
  on public.material_quote_requests (selected_quote_id);
create index if not exists supplier_quote_items_request_item_idx
  on public.supplier_quote_items (request_item_id);
create index if not exists supplier_quotes_submitted_by_idx
  on public.supplier_quotes (submitted_by);

drop policy if exists "Project users manage invitations" on public.hardware_quote_invitations;
drop policy if exists "Quote participants read invitations" on public.hardware_quote_invitations;
drop policy if exists "Hardware members update own invitations" on public.hardware_quote_invitations;

create policy "Quote participants read invitations"
on public.hardware_quote_invitations for select to authenticated
using (
  (select private.can_manage_material_quote_request(request_id))
  or (select private.is_hardware_partner_member(partner_id))
);

create policy "Quote participants update invitations"
on public.hardware_quote_invitations for update to authenticated
using (
  (select private.can_manage_material_quote_request(request_id))
  or (select private.is_hardware_partner_member(partner_id))
)
with check (
  (select private.can_manage_material_quote_request(request_id))
  or (select private.is_hardware_partner_member(partner_id))
);

create policy "Project users create invitations"
on public.hardware_quote_invitations for insert to authenticated
with check ((select private.can_manage_material_quote_request(request_id)));

create policy "Project users remove invitations"
on public.hardware_quote_invitations for delete to authenticated
using ((select private.can_manage_material_quote_request(request_id)));

drop policy if exists "Project users manage request items" on public.material_quote_request_items;
drop policy if exists "Quote participants read request items" on public.material_quote_request_items;

create policy "Quote participants read request items"
on public.material_quote_request_items for select to authenticated
using ((select private.can_view_material_quote_request(request_id)));

create policy "Project users create request items"
on public.material_quote_request_items for insert to authenticated
with check ((select private.can_manage_material_quote_request(request_id)));

create policy "Project users update request items"
on public.material_quote_request_items for update to authenticated
using ((select private.can_manage_material_quote_request(request_id)))
with check ((select private.can_manage_material_quote_request(request_id)));

create policy "Project users delete request items"
on public.material_quote_request_items for delete to authenticated
using ((select private.can_manage_material_quote_request(request_id)));

drop policy if exists "Hardware members manage supplier quote items" on public.supplier_quote_items;
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

create policy "Hardware members create supplier quote items"
on public.supplier_quote_items for insert to authenticated
with check (
  exists (
    select 1 from public.supplier_quotes q
    where q.id = quote_id and (select private.is_hardware_partner_member(q.partner_id))
  )
);

create policy "Hardware members update supplier quote items"
on public.supplier_quote_items for update to authenticated
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

create policy "Hardware members delete supplier quote items"
on public.supplier_quote_items for delete to authenticated
using (
  exists (
    select 1 from public.supplier_quotes q
    where q.id = quote_id and (select private.is_hardware_partner_member(q.partner_id))
  )
);
