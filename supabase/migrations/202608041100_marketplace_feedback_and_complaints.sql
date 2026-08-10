-- Skills Connect Pro verified job reputation and complaint foundation.
-- Feedback is tied to a real marketplace project and its selected provider.
-- A complaint never changes a provider's rating merely because it was submitted.
-- Only published reviews and administratively upheld provider-fault complaints
-- contribute to the separate marketplace reputation metrics.

begin;

alter table public.artisans
  add column if not exists marketplace_rating numeric(3,2) null
    check (marketplace_rating is null or marketplace_rating between 1 and 5),
  add column if not exists marketplace_review_count integer not null default 0
    check (marketplace_review_count >= 0),
  add column if not exists marketplace_upheld_complaint_count integer not null default 0
    check (marketplace_upheld_complaint_count >= 0);

create table if not exists public.marketplace_reviews (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  match_id uuid not null references public.project_matches(id) on delete cascade,
  provider_id integer not null references public.artisans(id) on update cascade on delete restrict,
  overall_rating integer not null check (overall_rating between 1 and 5),
  workmanship_rating integer null check (workmanship_rating between 1 and 5),
  reliability_rating integer null check (reliability_rating between 1 and 5),
  communication_rating integer null check (communication_rating between 1 and 5),
  value_rating integer null check (value_rating between 1 and 5),
  review_text text null check (review_text is null or char_length(review_text) <= 2000),
  moderation_status text not null default 'published'
    check (moderation_status in ('published', 'hidden', 'flagged')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (project_id),
  unique (match_id)
);

create table if not exists public.marketplace_complaints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  match_id uuid not null references public.project_matches(id) on delete cascade,
  provider_id integer not null references public.artisans(id) on update cascade on delete restrict,
  category text not null check (category in (
    'no_show',
    'non_completion',
    'quality',
    'communication',
    'overcharging',
    'damage',
    'safety',
    'misconduct',
    'other'
  )),
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),
  description text not null
    check (char_length(trim(description)) between 10 and 4000),
  status text not null default 'open'
    check (status in ('open', 'in_review', 'resolved', 'dismissed')),
  resolution_outcome text null check (
    resolution_outcome is null or resolution_outcome in (
      'provider_fault',
      'customer_fault',
      'mutual',
      'insufficient_evidence',
      'resolved_directly'
    )
  ),
  admin_notes text null check (admin_notes is null or char_length(admin_notes) <= 4000),
  reviewed_at timestamptz null,
  resolved_at timestamptz null,
  resolved_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (project_id)
);

create index if not exists marketplace_reviews_provider_created_idx
  on public.marketplace_reviews (provider_id, created_at desc);
create index if not exists marketplace_reviews_moderation_idx
  on public.marketplace_reviews (moderation_status, created_at desc);
create index if not exists marketplace_complaints_status_created_idx
  on public.marketplace_complaints (status, created_at desc);
create index if not exists marketplace_complaints_provider_idx
  on public.marketplace_complaints (provider_id, status, created_at desc);

create or replace function public.refresh_marketplace_review_metrics(p_provider_id integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rating numeric(3,2);
  v_count integer;
begin
  select
    round(avg(overall_rating)::numeric, 2),
    count(*)::integer
  into v_rating, v_count
  from public.marketplace_reviews
  where provider_id = p_provider_id
    and moderation_status = 'published';

  update public.artisans
  set
    marketplace_rating = case when v_count > 0 then v_rating else null end,
    marketplace_review_count = coalesce(v_count, 0)
  where id = p_provider_id;
end;
$$;

create or replace function public.refresh_marketplace_complaint_metrics(p_provider_id integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  select count(*)::integer
  into v_count
  from public.marketplace_complaints
  where provider_id = p_provider_id
    and status = 'resolved'
    and resolution_outcome = 'provider_fault';

  update public.artisans
  set marketplace_upheld_complaint_count = coalesce(v_count, 0)
  where id = p_provider_id;
end;
$$;

create or replace function public.marketplace_review_metrics_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_marketplace_review_metrics(old.provider_id);
    return old;
  end if;

  perform public.refresh_marketplace_review_metrics(new.provider_id);
  if tg_op = 'UPDATE' and old.provider_id is distinct from new.provider_id then
    perform public.refresh_marketplace_review_metrics(old.provider_id);
  end if;
  return new;
end;
$$;

create or replace function public.marketplace_complaint_metrics_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_marketplace_complaint_metrics(old.provider_id);
    return old;
  end if;

  perform public.refresh_marketplace_complaint_metrics(new.provider_id);
  if tg_op = 'UPDATE' and old.provider_id is distinct from new.provider_id then
    perform public.refresh_marketplace_complaint_metrics(old.provider_id);
  end if;
  return new;
end;
$$;

drop trigger if exists marketplace_reviews_set_updated_at on public.marketplace_reviews;
create trigger marketplace_reviews_set_updated_at
before update on public.marketplace_reviews
for each row execute function public.set_updated_at();

drop trigger if exists marketplace_complaints_set_updated_at on public.marketplace_complaints;
create trigger marketplace_complaints_set_updated_at
before update on public.marketplace_complaints
for each row execute function public.set_updated_at();

drop trigger if exists marketplace_reviews_refresh_provider_metrics on public.marketplace_reviews;
create trigger marketplace_reviews_refresh_provider_metrics
after insert or update or delete on public.marketplace_reviews
for each row execute function public.marketplace_review_metrics_trigger();

drop trigger if exists marketplace_complaints_refresh_provider_metrics on public.marketplace_complaints;
create trigger marketplace_complaints_refresh_provider_metrics
after insert or update or delete on public.marketplace_complaints
for each row execute function public.marketplace_complaint_metrics_trigger();

alter table public.marketplace_reviews enable row level security;
alter table public.marketplace_complaints enable row level security;

revoke all on public.marketplace_reviews from public, anon;
revoke all on public.marketplace_complaints from public, anon;
grant select, insert, update, delete on public.marketplace_reviews to authenticated;
grant select, insert, update, delete on public.marketplace_complaints to authenticated;

drop policy if exists marketplace_reviews_admin_all on public.marketplace_reviews;
create policy marketplace_reviews_admin_all
on public.marketplace_reviews
for all
to authenticated
using (public.is_marketplace_admin())
with check (public.is_marketplace_admin());

drop policy if exists marketplace_complaints_admin_all on public.marketplace_complaints;
create policy marketplace_complaints_admin_all
on public.marketplace_complaints
for all
to authenticated
using (public.is_marketplace_admin())
with check (public.is_marketplace_admin());

comment on table public.marketplace_reviews is
  'Verified customer feedback tied to a completed Skills Connect Pro project and selected provider.';
comment on table public.marketplace_complaints is
  'Job-linked customer complaint cases. Submission alone never changes provider reputation metrics.';
comment on column public.artisans.marketplace_rating is
  'Average of published reviews from completed marketplace jobs only.';
comment on column public.artisans.marketplace_upheld_complaint_count is
  'Count of complaints resolved by an administrator with provider_fault outcome.';

commit;
