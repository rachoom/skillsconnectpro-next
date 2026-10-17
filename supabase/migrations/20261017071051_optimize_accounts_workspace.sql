-- Follow-up from Supabase advisors after the staging accounts rollout.
-- Keep foreign-key maintenance predictable and avoid duplicate permissive
-- SELECT policies on project membership.

create index if not exists projects_customer_id_idx
  on public.projects (customer_id);
create index if not exists account_subscriptions_plan_code_idx
  on public.account_subscriptions (plan_code);
create index if not exists project_documents_uploaded_by_idx
  on public.project_documents (uploaded_by);
create index if not exists project_expenses_created_by_idx
  on public.project_expenses (created_by);
create index if not exists project_materials_created_by_idx
  on public.project_materials (created_by);
create index if not exists project_members_invited_by_idx
  on public.project_members (invited_by);
create index if not exists project_milestones_created_by_idx
  on public.project_milestones (created_by);
create index if not exists project_matches_provider_response_id_idx
  on public.project_matches (provider_response_id);
create index if not exists payment_events_m_payment_id_idx
  on public.payment_events (m_payment_id);

drop policy if exists "Owners manage project membership" on public.project_members;

drop policy if exists "Owners add project members" on public.project_members;
create policy "Owners add project members"
on public.project_members for insert to authenticated
with check ((select private.is_project_owner(project_id)));

drop policy if exists "Owners update project members" on public.project_members;
create policy "Owners update project members"
on public.project_members for update to authenticated
using ((select private.is_project_owner(project_id)))
with check ((select private.is_project_owner(project_id)));

drop policy if exists "Owners remove project members" on public.project_members;
create policy "Owners remove project members"
on public.project_members for delete to authenticated
using ((select private.is_project_owner(project_id)));
