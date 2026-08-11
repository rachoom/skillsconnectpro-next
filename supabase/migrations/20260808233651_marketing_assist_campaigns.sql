create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  campaign_type text not null default 'daily_feature'
    check (campaign_type in ('daily_feature', 'manual')),
  campaign_date date not null,
  provider_id integer not null references public.artisans(id) on delete cascade,
  status text not null default 'ready'
    check (status in ('queued', 'ready', 'sent', 'failed', 'skipped')),
  delivery_mode text not null default 'whatsapp_link'
    check (delivery_mode in ('whatsapp_link', 'whatsapp_cloud_api')),
  provider_snapshot jsonb not null default '{}'::jsonb,
  creative_copy jsonb not null default '{}'::jsonb,
  asset_variants jsonb not null default '["poster", "business_card", "whatsapp_status"]'::jsonb,
  generated_at timestamp with time zone,
  sent_at timestamp with time zone,
  whatsapp_message_ids jsonb not null default '[]'::jsonb,
  failure_reason text,
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create unique index if not exists marketing_campaigns_one_daily_feature_per_day
  on public.marketing_campaigns (campaign_date)
  where campaign_type = 'daily_feature';

create index if not exists marketing_campaigns_provider_history_idx
  on public.marketing_campaigns (provider_id, campaign_date desc);

alter table public.marketing_campaigns enable row level security;

revoke insert, update, delete on table public.marketing_campaigns from anon, authenticated;
grant select on table public.marketing_campaigns to anon, authenticated;

create policy "marketing_campaigns_public_read"
  on public.marketing_campaigns
  for select
  to anon, authenticated
  using (true);

comment on table public.marketing_campaigns is
  'Daily SkillsConnect Pro provider marketing-assistance rotation and generated creative metadata.';
comment on column public.marketing_campaigns.provider_snapshot is
  'Non-sensitive creative snapshot used to keep generated artwork stable if the provider later edits their profile.';
