-- =============================================================================
-- 0008 — Analytics: funnel events and pre-aggregated metric tables
-- =============================================================================

create table if not exists public.funnel_events (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  lead_id          uuid references public.leads(id) on delete cascade,
  stage            text not null,
  occurred_at      timestamptz not null default now(),
  metadata         jsonb,
  created_at       timestamptz not null default now()
);

create table if not exists public.conversion_metrics (
  id                       uuid primary key default gen_random_uuid(),
  organization_id          uuid not null references public.organizations(id) on delete cascade,
  period_start             date not null,
  period_end               date not null,
  lead_to_appointment_rate numeric(6,4) default 0,
  appointment_to_close_rate numeric(6,4) default 0,
  show_rate                numeric(6,4) default 0,
  created_at               timestamptz not null default now()
);

create table if not exists public.campaign_metrics (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  campaign_id      uuid references public.campaigns(id) on delete cascade,
  period_start     date not null,
  period_end       date not null,
  spend            numeric(12,2) default 0,
  leads            integer default 0,
  appointments     integer default 0,
  closes           integer default 0,
  created_at       timestamptz not null default now()
);

create table if not exists public.advisor_metrics (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  advisor_id       uuid references public.profiles(id) on delete cascade,
  period_start     date not null,
  period_end       date not null,
  leads_assigned   integer default 0,
  appointments     integer default 0,
  closes           integer default 0,
  revenue          numeric(14,2) default 0,
  created_at       timestamptz not null default now()
);

create table if not exists public.revenue_metrics (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  period_start     date not null,
  period_end       date not null,
  closed_revenue   numeric(14,2) default 0,
  pipeline_value   numeric(14,2) default 0,
  policies_issued  integer default 0,
  created_at       timestamptz not null default now()
);

create table if not exists public.attribution_records (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  lead_id          uuid references public.leads(id) on delete cascade,
  first_touch_source text,
  last_touch_source  text,
  campaign_id      uuid references public.campaigns(id),
  created_at       timestamptz not null default now()
);

create index if not exists idx_funnel_events_org on public.funnel_events(organization_id, occurred_at);
