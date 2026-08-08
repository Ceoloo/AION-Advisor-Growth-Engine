-- =============================================================================
-- 0010 — RBAC reference seed (roles, permissions, role→permission mapping)
-- =============================================================================
-- Global reference data. Safe to re-run (idempotent upserts).

insert into public.roles (key, label, description) values
  ('organization_owner','Organization Owner','Full control over the organization'),
  ('agency_administrator','Agency Administrator','Manages members, settings, integrations'),
  ('financial_advisor','Financial Advisor','Works assigned leads and clients'),
  ('insurance_agent','Insurance Agent','Works assigned leads and applications'),
  ('appointment_setter','Appointment Setter','Qualifies leads and books appointments'),
  ('sales_manager','Sales Manager','Oversees pipeline and advisor performance'),
  ('compliance_reviewer','Compliance Reviewer','Reviews communications and disclosures'),
  ('client_success_representative','Client Success Representative','Handles retention and renewals'),
  ('read_only_analyst','Read-Only Analyst','View-only access to analytics')
on conflict (key) do update set label = excluded.label, description = excluded.description;

insert into public.permissions (key, label, description) values
  ('org:manage','Manage organization',null),
  ('org:view','View organization',null),
  ('members:manage','Manage members',null),
  ('leads:view','View leads',null),
  ('leads:create','Create leads',null),
  ('leads:update','Update leads',null),
  ('leads:delete','Delete leads',null),
  ('leads:assign','Assign leads',null),
  ('pipelines:manage','Manage pipelines',null),
  ('opportunities:manage','Manage opportunities',null),
  ('appointments:manage','Manage appointments',null),
  ('conversations:view','View conversations',null),
  ('conversations:send','Send messages',null),
  ('workflows:manage','Manage workflows',null),
  ('campaigns:manage','Manage campaigns',null),
  ('documents:view','View documents',null),
  ('documents:request','Request documents',null),
  ('applications:manage','Manage applications',null),
  ('compliance:review','Review compliance',null),
  ('analytics:view','View analytics',null),
  ('integrations:manage','Manage integrations',null),
  ('settings:manage','Manage settings',null)
on conflict (key) do nothing;

-- Owner & admin get everything.
insert into public.role_permissions (role_key, permission_key)
select r.key, p.key
from public.roles r cross join public.permissions p
where r.key in ('organization_owner','agency_administrator')
on conflict do nothing;

-- Advisors / agents: work leads, appointments, conversations, applications.
insert into public.role_permissions (role_key, permission_key)
select r.key, p.key
from public.roles r cross join public.permissions p
where r.key in ('financial_advisor','insurance_agent')
  and p.key in ('org:view','leads:view','leads:update','leads:assign','opportunities:manage',
                'appointments:manage','conversations:view','conversations:send','documents:view',
                'documents:request','applications:manage','analytics:view')
on conflict do nothing;

-- Appointment setters: qualify + book.
insert into public.role_permissions (role_key, permission_key)
select 'appointment_setter', p.key
from public.permissions p
where p.key in ('org:view','leads:view','leads:create','leads:update','appointments:manage',
                'conversations:view','conversations:send')
on conflict do nothing;

-- Sales managers: pipeline oversight + analytics.
insert into public.role_permissions (role_key, permission_key)
select 'sales_manager', p.key
from public.permissions p
where p.key in ('org:view','leads:view','leads:assign','pipelines:manage','opportunities:manage',
                'appointments:manage','workflows:manage','campaigns:manage','analytics:view')
on conflict do nothing;

-- Compliance reviewers.
insert into public.role_permissions (role_key, permission_key)
select 'compliance_reviewer', p.key
from public.permissions p
where p.key in ('org:view','leads:view','conversations:view','documents:view','compliance:review','analytics:view')
on conflict do nothing;

-- Client success: renewals + conversations.
insert into public.role_permissions (role_key, permission_key)
select 'client_success_representative', p.key
from public.permissions p
where p.key in ('org:view','leads:view','leads:update','appointments:manage','conversations:view',
                'conversations:send','documents:view','analytics:view')
on conflict do nothing;

-- Read-only analyst.
insert into public.role_permissions (role_key, permission_key)
select 'read_only_analyst', p.key
from public.permissions p
where p.key in ('org:view','leads:view','analytics:view')
on conflict do nothing;
