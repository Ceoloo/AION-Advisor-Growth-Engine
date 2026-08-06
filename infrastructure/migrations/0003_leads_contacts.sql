-- =============================================================================
-- 0003 — Leads, contacts, sources, tags, scores, qualification, enrichment
-- =============================================================================

create table if not exists public.contacts (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations(id) on delete cascade,
  first_name         text not null default '',
  last_name          text not null default '',
  email              text,
  phone              text,
  state              text,
  timezone           text,
  source             text,
  external_id        text,
  external_provider  text,
  raw                jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  deleted_at         timestamptz
);

create table if not exists public.lead_sources (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  name             text not null,
  type             text not null,
  cost_per_lead    numeric(12,2) default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.leads (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  contact_id            uuid not null references public.contacts(id) on delete cascade,
  lead_source_id        uuid references public.lead_sources(id),
  vertical              text not null default 'financial_advisor',
  status                text not null default 'new',
  qualification_status  text not null default 'unqualified',
  score                 integer not null default 0,
  score_band            text not null default 'low_priority',
  assigned_advisor_id   uuid references public.profiles(id),
  pipeline_stage_id     uuid,
  source                text,
  external_id           text,
  external_provider     text,
  raw                   jsonb,
  last_activity_at      timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);

create table if not exists public.lead_tags (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  name             text not null,
  color            text default '#64748b',
  unique (organization_id, name)
);

create table if not exists public.lead_tag_assignments (
  lead_id  uuid not null references public.leads(id) on delete cascade,
  tag_id   uuid not null references public.lead_tags(id) on delete cascade,
  primary key (lead_id, tag_id)
);

create table if not exists public.lead_scores (
  id                       uuid primary key default gen_random_uuid(),
  organization_id          uuid not null references public.organizations(id) on delete cascade,
  lead_id                  uuid not null references public.leads(id) on delete cascade,
  total                    integer not null,
  band                     text not null,
  breakdown                jsonb not null default '{}'::jsonb,
  computed_by_rule_version text not null default 'v1',
  created_at               timestamptz not null default now()
);

create table if not exists public.lead_qualification_sessions (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  lead_id          uuid not null references public.leads(id) on delete cascade,
  vertical         text not null,
  template_id      text not null,
  answers          jsonb not null default '{}'::jsonb,
  result           jsonb,
  completed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.lead_qualification_answers (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.lead_qualification_sessions(id) on delete cascade,
  question_key text not null,
  answer       jsonb,
  created_at   timestamptz not null default now()
);

create table if not exists public.lead_enrichment_records (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  lead_id          uuid not null references public.leads(id) on delete cascade,
  provider         text not null,
  data             jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);

create table if not exists public.lead_assignments (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  lead_id          uuid not null references public.leads(id) on delete cascade,
  advisor_id       uuid references public.profiles(id),
  assigned_by      uuid references public.profiles(id),
  assigned_at      timestamptz not null default now()
);

create index if not exists idx_leads_org on public.leads(organization_id);
create index if not exists idx_leads_status on public.leads(organization_id, status);
create index if not exists idx_leads_advisor on public.leads(assigned_advisor_id);
create index if not exists idx_contacts_org on public.contacts(organization_id);
create index if not exists idx_lead_scores_lead on public.lead_scores(lead_id);

create trigger trg_contacts_updated before update on public.contacts
  for each row execute function public.set_updated_at();
create trigger trg_leads_updated before update on public.leads
  for each row execute function public.set_updated_at();
create trigger trg_qual_sessions_updated before update on public.lead_qualification_sessions
  for each row execute function public.set_updated_at();
