-- Private work-photo examples supplied during AI-assisted provider registration.
-- Uploads and reads are performed by server-only, role-protected API routes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('provider-application-proofs', 'provider-application-proofs', false, 1500000, array['image/jpeg'])
on conflict (id) do update
set public = false, file_size_limit = 1500000, allowed_mime_types = array['image/jpeg'];
