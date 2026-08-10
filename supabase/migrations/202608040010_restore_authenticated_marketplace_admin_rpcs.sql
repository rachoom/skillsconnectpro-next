-- Restore the authenticated admin console's ability to create secure customer
-- and provider links. Both RPCs perform their own public.is_marketplace_admin()
-- check, so anonymous users remain unable to execute them.

revoke execute on function public.create_marketplace_customer_access(uuid) from public;
revoke execute on function public.create_marketplace_customer_access(uuid) from anon;
grant execute on function public.create_marketplace_customer_access(uuid) to authenticated;

revoke execute on function public.create_marketplace_provider_invitation(uuid, integer, integer, text) from public;
revoke execute on function public.create_marketplace_provider_invitation(uuid, integer, integer, text) from anon;
grant execute on function public.create_marketplace_provider_invitation(uuid, integer, integer, text) to authenticated;

comment on function public.create_marketplace_customer_access(uuid)
is 'Creates or refreshes one customer project token for authenticated Skills Connect marketplace administrators only.';

comment on function public.create_marketplace_provider_invitation(uuid, integer, integer, text)
is 'Creates or refreshes one provider invitation for authenticated Skills Connect marketplace administrators while routing remains open.';
