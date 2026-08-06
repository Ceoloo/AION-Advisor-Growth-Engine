-- =============================================================================
-- 0006 — Documents & compliance
-- =============================================================================

create table if not exists public.documents (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations(id) on delete cascade,
  lead_id              uuid references public.leads(id) on delete cascade,
  name                 text not null,
  storage_path         text not null,
  mime_type            text not null default 'application/octet-stream',
  size_bytes           bigint not null default 0,
  uploaded_by_profile_id uuid references public.profiles(id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  deleted_at           timestamptz
);

create table if not exists public.document_requests (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  lead_id          uuid not null references public.leads(id) on delete cascade,
  document_type    text not null,
  status           text not null default 'requested',
  requested_by     uuid references public.profiles(id),
  fulfilled_at     timestamptz,
  created_at       timestamptz not null default now()
);

create table if not exists public.document_access_logs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  document_id      uuid not null references public.documents(id) on delete cascade,
  accessed_by      uuid references public.profiles(id),
  access_type      text not null default 'view',
  accessed_at      timestamptz not null default now()
);

create table if not exists public.consent_records (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  lead_id          uuid not null references public.leads(id) on delete cascade,
  type             text not null,
  status           text not null default 'granted',
  captured_source  text not null default 'web_form',
  captured_at      timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id),
  actor_type       text not null default 'human',
  action           text not null,
  entity_type      text not null,
  entity_id        uuid,
  metadata         jsonb,
  correlation_id   text,
  created_at       timestamptz not null default now()
);

create table if not exists public.compliance_reviews (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  entity_type      text not null,
  entity_id        uuid,
  reviewer_id      uuid references public.profiles(id),
  status           text not null default 'pending',
  notes            text,
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now()
);

create table if not exists public.disclosure_records (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  lead_id          uuid references public.leads(id) on delete cascade,
  disclosure_type  text not null,
  version          text not null default 'v1',
  acknowledged_at  timestamptz,
  created_at       timestamptz not null default now()
);

create table if not exists public.communication_approvals (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  message_body     text not null,
  channel          text not null,
  status           text not null default 'pending',
  approved_by      uuid references public.profiles(id),
  approved_at      timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists idx_audit_logs_org on public.audit_logs(organization_id, created_at desc);
create index if not exists idx_consent_lead on public.consent_records(lead_id);
create index if not exists idx_documents_org on public.documents(organization_id);
