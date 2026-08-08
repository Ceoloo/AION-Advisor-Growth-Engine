-- =============================================================================
-- 0007 — Integrations, webhook ingestion, sync framework, API usage
-- =============================================================================

create table if not exists public.integration_connections (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations(id) on delete cascade,
  provider             text not null,
  status               text not null default 'not_configured',
  external_account_id  text,
  -- Credentials are encrypted at the application layer before storage.
  encrypted_credentials text,
  last_synced_at       timestamptz,
  last_error_at        timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (organization_id, provider)
);

-- Webhook events carry an idempotency_key so duplicate deliveries are a no-op.
create table if not exists public.webhook_events (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid references public.organizations(id) on delete cascade,
  provider         text not null,
  event_type       text not null,
  idempotency_key  text not null,
  payload          jsonb not null default '{}'::jsonb,
  status           text not null default 'received',
  processed_at     timestamptz,
  created_at       timestamptz not null default now(),
  -- The unique constraint is what makes duplicate processing impossible.
  unique (provider, idempotency_key)
);

create table if not exists public.sync_jobs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  provider         text not null,
  job_type         text not null,
  status           text not null default 'queued',
  attempts         integer not null default 0,
  max_attempts     integer not null default 5,
  next_run_at      timestamptz,
  payload          jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.sync_errors (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  sync_job_id      uuid references public.sync_jobs(id) on delete cascade,
  provider         text not null,
  message          text not null,
  details          jsonb,
  created_at       timestamptz not null default now()
);

create table if not exists public.external_object_mappings (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  provider         text not null,
  local_entity     text not null,
  local_id         uuid not null,
  external_id      text not null,
  created_at       timestamptz not null default now(),
  unique (provider, local_entity, local_id),
  unique (provider, local_entity, external_id)
);

create table if not exists public.api_usage_logs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid references public.organizations(id) on delete cascade,
  provider         text not null,
  endpoint         text not null,
  method           text not null,
  status_code      integer,
  latency_ms       integer,
  tokens_used      integer,
  cost_usd         numeric(12,6),
  created_at       timestamptz not null default now()
);

create index if not exists idx_webhook_events_status on public.webhook_events(status, created_at);
create index if not exists idx_sync_jobs_status on public.sync_jobs(status, next_run_at);
create index if not exists idx_api_usage_org on public.api_usage_logs(organization_id, created_at desc);

create trigger trg_integration_conn_updated before update on public.integration_connections
  for each row execute function public.set_updated_at();
create trigger trg_sync_jobs_updated before update on public.sync_jobs
  for each row execute function public.set_updated_at();
