-- Cover complaint foreign keys used by joins and administrative case queries.

begin;

create index if not exists marketplace_complaints_match_id_idx
  on public.marketplace_complaints (match_id);
create index if not exists marketplace_complaints_resolved_by_idx
  on public.marketplace_complaints (resolved_by)
  where resolved_by is not null;

commit;
