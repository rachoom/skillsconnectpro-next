alter policy public_directory_fields on public.artisans using (status = 'active' and approval_status is distinct from 'rejected');
