-- =============================================================================
-- 0002 — Core tenancy: organizations, settings, profiles, memberships, RBAC
-- =============================================================================

create table if not exists public.organizations (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique,
  type              text not null,
  primary_vertical  text not null default 'financial_advisor',
  is_demo           boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create table if not exists public.organization_settings (
  id                     uuid primary key default gen_random_uuid(),
  organization_id        uuid not null references public.organizations(id) on delete cascade,
  timezone               text not null default 'America/New_York',
  brand_color_primary    text not null default '#2563eb',
  -- Scoring weights and band thresholds are configurable per organization.
  scoring_weights        jsonb not null default '{}'::jsonb,
  score_band_thresholds  jsonb not null default '{}'::jsonb,
  feature_flags          jsonb not null default '{}'::jsonb,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (organization_id)
);

-- Application profile mapped 1:1 to a Supabase auth user.
create table if not exists public.profiles (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid not null unique,
  full_name     text not null default '',
  email         text not null,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

-- A profile may belong to multiple organizations (multi-tenant membership).
create table if not exists public.memberships (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  profile_id       uuid not null references public.profiles(id) on delete cascade,
  role             text not null,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz,
  unique (organization_id, profile_id)
);

-- Reference tables for RBAC. Roles/permissions are global definitions;
-- role_permissions maps them. Memberships pin a role per org.
create table if not exists public.roles (
  key          text primary key,
  label        text not null,
  description  text
);

create table if not exists public.permissions (
  key          text primary key,
  label        text not null,
  description  text
);

create table if not exists public.role_permissions (
  role_key        text not null references public.roles(key) on delete cascade,
  permission_key  text not null references public.permissions(key) on delete cascade,
  primary key (role_key, permission_key)
);

create table if not exists public.teams (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  name             text not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create table if not exists public.locations (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  name             text not null,
  ghl_location_id  text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create index if not exists idx_memberships_org on public.memberships(organization_id);
create index if not exists idx_memberships_profile on public.memberships(profile_id);
create index if not exists idx_settings_org on public.organization_settings(organization_id);

create trigger trg_org_updated before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger trg_org_settings_updated before update on public.organization_settings
  for each row execute function public.set_updated_at();
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_memberships_updated before update on public.memberships
  for each row execute function public.set_updated_at();
