revoke execute on function public.create_marketplace_customer_access(uuid) from public;
revoke execute on function public.create_marketplace_customer_access(uuid) from anon;
revoke execute on function public.create_marketplace_customer_access(uuid) from authenticated;
grant execute on function public.create_marketplace_customer_access(uuid) to service_role;

revoke execute on function public.create_marketplace_provider_invitation(uuid, integer, integer, text) from public;
revoke execute on function public.create_marketplace_provider_invitation(uuid, integer, integer, text) from anon;
revoke execute on function public.create_marketplace_provider_invitation(uuid, integer, integer, text) from authenticated;
grant execute on function public.create_marketplace_provider_invitation(uuid, integer, integer, text) to service_role;
