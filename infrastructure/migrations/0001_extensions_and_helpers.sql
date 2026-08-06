-- =============================================================================
-- 0001 — Extensions & shared helpers
-- =============================================================================
-- Run order: migrations are applied in filename order (0001, 0002, ...).
-- Target: Supabase Postgres. Auth users live in the managed `auth.users` table.

create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "uuid-ossp";

-- Convention: every table has a trigger to maintain updated_at.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Helper: which organizations does the current auth user belong to?
-- Used by Row-Level Security policies to enforce tenant isolation.
create or replace function public.current_profile_id()
returns uuid
language sql
stable
as $$
  select p.id from public.profiles p where p.auth_user_id = auth.uid();
$$;

create or replace function public.is_org_member(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    join public.profiles p on p.id = m.profile_id
    where m.organization_id = org
      and p.auth_user_id = auth.uid()
      and m.is_active = true
      and m.deleted_at is null
  );
$$;

create or replace function public.has_org_role(org uuid, roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    join public.profiles p on p.id = m.profile_id
    where m.organization_id = org
      and p.auth_user_id = auth.uid()
      and m.is_active = true
      and m.role = any(roles)
  );
$$;
