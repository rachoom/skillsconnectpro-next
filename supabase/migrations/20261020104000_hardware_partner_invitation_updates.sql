-- Allow an invited hardware partner to update only its own invitation status.
drop policy if exists "Hardware members update own invitations" on public.hardware_quote_invitations;
create policy "Hardware members update own invitations"
on public.hardware_quote_invitations for update to authenticated
using ((select private.is_hardware_partner_member(partner_id)))
with check ((select private.is_hardware_partner_member(partner_id)));
