revoke all on function public.update_marketplace_project_lifecycle(uuid, text, numeric, text) from public;
revoke all on function public.update_marketplace_project_lifecycle(uuid, text, numeric, text) from anon;
grant execute on function public.update_marketplace_project_lifecycle(uuid, text, numeric, text) to authenticated;
