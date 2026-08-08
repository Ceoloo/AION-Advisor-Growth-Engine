-- =============================================================================
-- 0004 — Sales / CRM: pipelines, stages, opportunities, tasks, notes,
--        appointments, conversations, messages, campaigns, workflow runs
-- =============================================================================

create table if not exists public.pipelines (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  name             text not null,
  vertical         text not null,
  is_default       boolean not null default false,
  ghl_pipeline_id  text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create table if not exists public.pipeline_stages (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  pipeline_id      uuid not null references public.pipelines(id) on delete cascade,
  name             text not null,
  position         integer not null default 0,
  is_won           boolean not null default false,
  is_lost          boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.opportunities (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations(id) on delete cascade,
  lead_id              uuid not null references public.leads(id) on delete cascade,
  pipeline_id          uuid not null references public.pipelines(id),
  stage_id             uuid not null references public.pipeline_stages(id),
  name                 text not null,
  monetary_value       numeric(12,2) not null default 0,
  status               text not null default 'open',
  assigned_advisor_id  uuid references public.profiles(id),
  ghl_opportunity_id   text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz
);

create table if not exists public.opportunity_stage_history (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  opportunity_id   uuid not null references public.opportunities(id) on delete cascade,
  from_stage_id    uuid references public.pipeline_stages(id),
  to_stage_id      uuid not null references public.pipeline_stages(id),
  changed_by       uuid references public.profiles(id),
  changed_at       timestamptz not null default now()
);

create table if not exists public.tasks (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations(id) on delete cascade,
  lead_id              uuid references public.leads(id) on delete cascade,
  assigned_profile_id  uuid references public.profiles(id),
  title                text not null,
  due_at               timestamptz,
  completed_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create table if not exists public.notes (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations(id) on delete cascade,
  lead_id            uuid not null references public.leads(id) on delete cascade,
  author_profile_id  uuid references public.profiles(id),
  body               text not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.appointments (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  lead_id          uuid not null references public.leads(id) on delete cascade,
  advisor_id       uuid references public.profiles(id),
  title            text not null,
  starts_at        timestamptz not null,
  ends_at          timestamptz not null,
  status           text not null default 'scheduled',
  location         text,
  meeting_url      text,
  ghl_appointment_id text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create table if not exists public.conversations (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  lead_id          uuid not null references public.leads(id) on delete cascade,
  channel          text not null,
  ghl_conversation_id text,
  last_message_at  timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  lead_id          uuid not null references public.leads(id) on delete cascade,
  channel          text not null,
  direction        text not null,
  body             text not null default '',
  author_type      text not null default 'human',
  sent_at          timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

create table if not exists public.campaigns (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  name             text not null,
  channel          text not null default 'multi',
  status           text not null default 'active',
  spend            numeric(12,2) not null default 0,
  leads_generated  integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.workflow_runs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  workflow_key     text not null,
  lead_id          uuid references public.leads(id) on delete cascade,
  status           text not null default 'pending',
  attempts         integer not null default 0,
  started_at       timestamptz,
  finished_at      timestamptz,
  error            text,
  context          jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_opps_org on public.opportunities(organization_id);
create index if not exists idx_stages_pipeline on public.pipeline_stages(pipeline_id);
create index if not exists idx_appointments_org on public.appointments(organization_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_workflow_runs_org on public.workflow_runs(organization_id);

create trigger trg_opps_updated before update on public.opportunities
  for each row execute function public.set_updated_at();
create trigger trg_appointments_updated before update on public.appointments
  for each row execute function public.set_updated_at();
