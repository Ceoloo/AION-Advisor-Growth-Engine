-- Auth shim for LOCAL plain-Postgres development only.
-- Supabase provides the `auth` schema, `auth.users`, `auth.uid()`, and
-- `auth.role()` in production. This shim emulates just enough of that surface
-- so the migrations (which reference auth.uid()/auth.role()) can be created and
-- RLS can be exercised locally. DO NOT use this in production.

create schema if not exists auth;

-- Session-scoped current user id. Set with:  select set_config('request.jwt.claim.sub', '<uuid>', false);
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create or replace function auth.role()
returns text
language sql
stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'authenticated');
$$;
