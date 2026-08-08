drop policy if exists "marketing_campaigns_public_read" on public.marketing_campaigns;
revoke select on table public.marketing_campaigns from anon, authenticated;

comment on table public.marketing_campaigns is
  'Admin-only SkillsConnect Pro marketing-assistance campaign rotation. Public creative assets are served through the dedicated image route using unguessable campaign IDs.';
