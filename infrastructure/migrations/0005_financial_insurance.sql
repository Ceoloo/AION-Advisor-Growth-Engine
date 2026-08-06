-- =============================================================================
-- 0005 — Financial / insurance domain
-- =============================================================================

create table if not exists public.needs_profiles (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  lead_id          uuid not null references public.leads(id) on delete cascade,
  summary          text,
  data             jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.financial_goals (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  lead_id          uuid not null references public.leads(id) on delete cascade,
  goal             text not null,
  target_amount    numeric(14,2),
  target_date      date,
  created_at       timestamptz not null default now()
);

create table if not exists public.insurance_interests (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  lead_id          uuid not null references public.leads(id) on delete cascade,
  product_type     text not null,
  notes            text,
  created_at       timestamptz not null default now()
);

create table if not exists public.product_recommendations (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  lead_id          uuid not null references public.leads(id) on delete cascade,
  product_type     text not null,
  rationale        text,
  confidence       numeric(5,2),
  requires_advisor_review boolean not null default true,
  created_at       timestamptz not null default now()
);

create table if not exists public.applications (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  lead_id          uuid not null references public.leads(id) on delete cascade,
  product_type     text not null,
  carrier          text,
  status           text not null default 'not_started',
  face_amount      numeric(14,2),
  submitted_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create table if not exists public.application_status_history (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  application_id   uuid not null references public.applications(id) on delete cascade,
  from_status      text,
  to_status        text not null,
  changed_by       uuid references public.profiles(id),
  changed_at       timestamptz not null default now()
);

create table if not exists public.policies (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  lead_id          uuid not null references public.leads(id) on delete cascade,
  application_id   uuid references public.applications(id),
  policy_number    text not null,
  carrier          text not null,
  product_type     text not null,
  status           text not null default 'active',
  premium          numeric(12,2) not null default 0,
  effective_date   date,
  renewal_date     date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create table if not exists public.policy_reviews (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  policy_id        uuid not null references public.policies(id) on delete cascade,
  reviewed_by      uuid references public.profiles(id),
  outcome          text,
  notes            text,
  reviewed_at      timestamptz not null default now()
);

create table if not exists public.renewals (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  policy_id        uuid not null references public.policies(id) on delete cascade,
  renewal_date     date not null,
  status           text not null default 'upcoming',
  created_at       timestamptz not null default now()
);

create table if not exists public.commissions (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  policy_id        uuid references public.policies(id) on delete cascade,
  advisor_id       uuid references public.profiles(id),
  amount           numeric(12,2) not null default 0,
  status           text not null default 'pending',
  created_at       timestamptz not null default now()
);

create table if not exists public.referrals (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations(id) on delete cascade,
  referring_lead_id     uuid references public.leads(id) on delete set null,
  referred_contact_name text not null,
  status                text not null default 'new',
  reward_issued         boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_applications_org on public.applications(organization_id);
create index if not exists idx_policies_org on public.policies(organization_id);

create trigger trg_applications_updated before update on public.applications
  for each row execute function public.set_updated_at();
create trigger trg_policies_updated before update on public.policies
  for each row execute function public.set_updated_at();
