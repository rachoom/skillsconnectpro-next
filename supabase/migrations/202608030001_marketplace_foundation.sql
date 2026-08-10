-- Skills Connect Pro marketplace foundation
-- Additive migration: does not alter the existing artisans or application tables.
-- Apply first in a Supabase preview/staging project, then production after review.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid null references auth.users(id) on delete set null,
  guest_name text null,
  guest_phone text null,
  guest_email text null,
  title text not null,
  customer_description text not null,
  ai_summary text null,
  likely_issue text null,
  category text not null,
  urgency text not null default 'planned'
    check (urgency in ('emergency', 'urgent', 'planned', 'large_project')),
  service_level text not null default 'free'
    check (service_level in ('free', 'assisted', 'priority', 'managed')),
  status text not null default 'draft'
    check (status in (
      'draft',
      'assessment_complete',
      'matching',
      'responses_received',
      'provider_selected',
      'contact_released',
      'in_progress',
      'completed',
      'cancelled',
      'unfulfilled'
    )),
  location_text text not null,
  suburb text null,
  city text null,
  province text null,
  latitude double precision null,
  longitude double precision null,
  preferred_date timestamptz null,
  response_target_at timestamptz null,
  estimated_min numeric(12,2) null check (estimated_min is null or estimated_min >= 0),
  estimated_max numeric(12,2) null check (estimated_max is null or estimated_max >= 0),
  estimate_currency char(3) not null default 'ZAR',
  confidence numeric(5,4) null check (confidence is null or confidence between 0 and 1),
  professional_inspection_required boolean not null default true,
  safety_notes text[] not null default '{}',
  materials jsonb not null default '[]'::jsonb,
  assessment_payload jsonb not null default '{}'::jsonb,
  source_channel text not null default 'web'
    check (source_channel in ('web', 'whatsapp', 'admin', 'partner', 'api')),
  consent_to_share boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'audio', 'video', 'document')),
  storage_path text not null,
  mime_type text null,
  caption text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

-- provider_id is text deliberately in the first migration because the live artisans.id
-- type must be confirmed before adding a hard foreign key.
create table if not exists public.provider_availability (
  provider_id text primary key,
  availability_status text not null default 'unknown'
    check (availability_status in ('available_now', 'available_today', 'available_later', 'unavailable', 'unknown')),
  available_from timestamptz null,
  available_until timestamptz null,
  accepts_emergency_jobs boolean not null default false,
  accepts_planned_work boolean not null default true,
  maximum_travel_km numeric(7,2) null check (maximum_travel_km is null or maximum_travel_km >= 0),
  service_areas text[] not null default '{}',
  categories text[] not null default '{}',
  minimum_job_value numeric(12,2) null check (minimum_job_value is null or minimum_job_value >= 0),
  maximum_active_leads integer not null default 3 check (maximum_active_leads > 0),
  last_confirmed_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.lead_invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  provider_id text not null,
  wave_number integer not null default 1 check (wave_number > 0),
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'delivered', 'viewed', 'accepted', 'declined', 'expired', 'cancelled', 'failed')),
  delivery_channel text not null default 'web'
    check (delivery_channel in ('web', 'whatsapp', 'sms', 'email', 'phone', 'admin')),
  delivery_address text null,
  sent_at timestamptz null,
  delivered_at timestamptz null,
  viewed_at timestamptz null,
  response_deadline timestamptz null,
  provider_snapshot jsonb not null default '{}'::jsonb,
  failure_reason text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (project_id, provider_id)
);

create table if not exists public.provider_responses (
  id uuid primary key default gen_random_uuid(),
  lead_invitation_id uuid not null references public.lead_invitations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  provider_id text not null,
  response_type text not null
    check (response_type in ('available_now', 'available_today', 'available_tomorrow', 'site_visit', 'estimate', 'need_information', 'declined')),
  arrival_window_start timestamptz null,
  arrival_window_end timestamptz null,
  site_visit_fee numeric(12,2) null check (site_visit_fee is null or site_visit_fee >= 0),
  estimate_min numeric(12,2) null check (estimate_min is null or estimate_min >= 0),
  estimate_max numeric(12,2) null check (estimate_max is null or estimate_max >= 0),
  estimate_currency char(3) not null default 'ZAR',
  provider_message text null,
  valid_until timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (lead_invitation_id)
);

create table if not exists public.project_matches (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  provider_id text not null,
  provider_response_id uuid null references public.provider_responses(id) on delete set null,
  status text not null default 'selected'
    check (status in ('selected', 'contact_released', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed')),
  selected_at timestamptz not null default timezone('utc', now()),
  contact_released_at timestamptz null,
  completion_reported_at timestamptz null,
  final_price numeric(12,2) null check (final_price is null or final_price >= 0),
  final_price_currency char(3) not null default 'ZAR',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (project_id)
);

create table if not exists public.project_status_events (
  id bigint generated by default as identity primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  event_type text not null,
  actor_type text not null default 'system'
    check (actor_type in ('customer', 'provider', 'admin', 'system', 'partner')),
  actor_id text null,
  message text null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.subscription_entitlements (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('customer', 'provider', 'partner')),
  subject_id text not null,
  plan_code text not null,
  status text not null default 'trial'
    check (status in ('trial', 'active', 'past_due', 'paused', 'cancelled', 'expired')),
  qualified_leads_used integer not null default 0 check (qualified_leads_used >= 0),
  qualified_leads_limit integer null check (qualified_leads_limit is null or qualified_leads_limit >= 0),
  starts_at timestamptz not null default timezone('utc', now()),
  ends_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (subject_type, subject_id, plan_code)
);

create index if not exists projects_status_created_idx
  on public.projects (status, created_at desc);
create index if not exists projects_category_location_idx
  on public.projects (category, city, suburb);
create index if not exists projects_urgency_target_idx
  on public.projects (urgency, response_target_at)
  where status in ('assessment_complete', 'matching');
create index if not exists project_media_project_idx
  on public.project_media (project_id, created_at);
create index if not exists provider_availability_status_idx
  on public.provider_availability (availability_status, last_confirmed_at desc);
create index if not exists lead_invitations_project_status_idx
  on public.lead_invitations (project_id, status, wave_number);
create index if not exists lead_invitations_provider_status_idx
  on public.lead_invitations (provider_id, status, created_at desc);
create index if not exists provider_responses_project_idx
  on public.provider_responses (project_id, created_at);
create index if not exists project_status_events_project_idx
  on public.project_status_events (project_id, created_at);
create index if not exists subscription_entitlements_subject_idx
  on public.subscription_entitlements (subject_type, subject_id, status);

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger provider_availability_set_updated_at
before update on public.provider_availability
for each row execute function public.set_updated_at();

create trigger lead_invitations_set_updated_at
before update on public.lead_invitations
for each row execute function public.set_updated_at();

create trigger provider_responses_set_updated_at
before update on public.provider_responses
for each row execute function public.set_updated_at();

create trigger project_matches_set_updated_at
before update on public.project_matches
for each row execute function public.set_updated_at();

create trigger subscription_entitlements_set_updated_at
before update on public.subscription_entitlements
for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.project_media enable row level security;
alter table public.provider_availability enable row level security;
alter table public.lead_invitations enable row level security;
alter table public.provider_responses enable row level security;
alter table public.project_matches enable row level security;
alter table public.project_status_events enable row level security;
alter table public.subscription_entitlements enable row level security;

comment on table public.projects is 'Customer repair or service requests created from AI, web, WhatsApp, admin, or partner intake.';
comment on table public.lead_invitations is 'Auditable routing of one project opportunity to one provider.';
comment on table public.provider_responses is 'Structured provider availability, site visit, or estimate response.';
comment on table public.project_matches is 'Customer-selected provider and contact-release record.';
comment on column public.provider_availability.provider_id is 'Stored as text until the production artisans.id type is confirmed and a foreign key migration is added.';
