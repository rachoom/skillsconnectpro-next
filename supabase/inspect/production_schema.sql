-- Read-only production schema inspection for Skills Connect Pro.
-- Run in Supabase SQL Editor and export/copy the result grids.
-- This script does not modify data or schema.

-- 1. Existing public tables and columns
select
  c.table_name,
  c.ordinal_position,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name in (
    'artisans',
    'artisan_applications',
    'reviews',
    'featured_ads',
    'projects',
    'project_media',
    'provider_availability',
    'lead_invitations',
    'provider_responses',
    'project_matches',
    'project_status_events',
    'subscription_entitlements'
  )
order by c.table_name, c.ordinal_position;

-- 2. Primary keys, foreign keys, unique constraints, and checks
select
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name as referenced_table,
  ccu.column_name as referenced_column
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.constraint_schema = kcu.constraint_schema
left join information_schema.constraint_column_usage ccu
  on tc.constraint_name = ccu.constraint_name
 and tc.constraint_schema = ccu.constraint_schema
where tc.table_schema = 'public'
order by tc.table_name, tc.constraint_type, tc.constraint_name, kcu.ordinal_position;

-- 3. Row-level security status
-- pg_tables exposes rowsecurity but not FORCE ROW LEVEL SECURITY, so read both flags from pg_class.
select
  n.nspname as schemaname,
  c.relname as tablename,
  c.relrowsecurity as rowsecurity,
  c.relforcerowsecurity as force_row_security
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
order by c.relname;

-- 4. Existing RLS policies
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 5. Indexes
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;

-- 6. Current artisan ID type: needed before adding hard provider foreign keys
select
  a.attname as column_name,
  pg_catalog.format_type(a.atttypid, a.atttypmod) as postgres_type
from pg_catalog.pg_attribute a
join pg_catalog.pg_class c on c.oid = a.attrelid
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'artisans'
  and a.attname = 'id'
  and a.attnum > 0
  and not a.attisdropped;
