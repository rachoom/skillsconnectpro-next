-- Trigger-support functions must not be exposed as public RPC endpoints.
-- Table triggers continue to execute them as the function owner.

begin;

revoke execute on function public.refresh_marketplace_review_metrics(integer)
  from public, anon, authenticated;
revoke execute on function public.refresh_marketplace_complaint_metrics(integer)
  from public, anon, authenticated;
revoke execute on function public.marketplace_review_metrics_trigger()
  from public, anon, authenticated;
revoke execute on function public.marketplace_complaint_metrics_trigger()
  from public, anon, authenticated;

commit;
