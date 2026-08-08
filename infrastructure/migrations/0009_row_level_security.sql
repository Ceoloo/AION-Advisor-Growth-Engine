-- =============================================================================
-- 0009 — Row-Level Security (tenant isolation)
-- =============================================================================
-- Strategy: every table carrying an `organization_id` gets a policy that only
-- admits rows for organizations the current auth user is an active member of
-- (via public.is_org_member). Global reference tables and the profile table are
-- handled explicitly. Service-role connections bypass RLS by design and MUST
-- therefore always scope queries by organization_id in the application layer.

-- --- Tenant tables: enable RLS + membership policy via dynamic loop ----------
do $$
declare
  t text;
  tenant_tables text[] := array[
    'organization_settings','memberships','teams','locations',
    'contacts','lead_sources','leads','lead_tags','lead_scores',
    'lead_qualification_sessions','lead_enrichment_records','lead_assignments',
    'pipelines','pipeline_stages','opportunities','opportunity_stage_history',
    'tasks','notes','appointments','conversations','messages','campaigns','workflow_runs',
    'needs_profiles','financial_goals','insurance_interests','product_recommendations',
    'applications','application_status_history','policies','policy_reviews','renewals',
    'commissions','referrals',
    'documents','document_requests','document_access_logs','consent_records',
    'audit_logs','compliance_reviews','disclosure_records','communication_approvals',
    'integration_connections','sync_jobs','sync_errors','external_object_mappings',
    'api_usage_logs','funnel_events','conversion_metrics','campaign_metrics',
    'advisor_metrics','revenue_metrics','attribution_records'
  ];
begin
  foreach t in array tenant_tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists tenant_isolation on public.%I;', t);
    execute format(
      'create policy tenant_isolation on public.%I
         using (public.is_org_member(organization_id))
         with check (public.is_org_member(organization_id));',
      t
    );
  end loop;
end;
$$;

-- --- organizations: members can see orgs they belong to ----------------------
alter table public.organizations enable row level security;
drop policy if exists org_member_read on public.organizations;
create policy org_member_read on public.organizations
  for select using (public.is_org_member(id));

drop policy if exists org_admin_write on public.organizations;
create policy org_admin_write on public.organizations
  for update using (public.has_org_role(id, array['organization_owner','agency_administrator']))
  with check (public.has_org_role(id, array['organization_owner','agency_administrator']));

-- --- profiles: a user can always read/update their own profile ---------------
alter table public.profiles enable row level security;
drop policy if exists own_profile on public.profiles;
create policy own_profile on public.profiles
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- --- webhook_events: nullable organization_id (pre-resolution) ----------------
alter table public.webhook_events enable row level security;
drop policy if exists webhook_tenant on public.webhook_events;
create policy webhook_tenant on public.webhook_events
  using (organization_id is null or public.is_org_member(organization_id))
  with check (organization_id is null or public.is_org_member(organization_id));

-- --- lead_tag_assignments: join table, scope via parent lead -----------------
alter table public.lead_tag_assignments enable row level security;
drop policy if exists tag_assignment_tenant on public.lead_tag_assignments;
create policy tag_assignment_tenant on public.lead_tag_assignments
  using (exists (
    select 1 from public.leads l
    where l.id = lead_id and public.is_org_member(l.organization_id)
  ));

-- --- lead_qualification_answers: scope via parent session --------------------
alter table public.lead_qualification_answers enable row level security;
drop policy if exists qual_answer_tenant on public.lead_qualification_answers;
create policy qual_answer_tenant on public.lead_qualification_answers
  using (exists (
    select 1 from public.lead_qualification_sessions s
    where s.id = session_id and public.is_org_member(s.organization_id)
  ));

-- --- Global reference tables: readable by any authenticated user -------------
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;

drop policy if exists roles_read on public.roles;
create policy roles_read on public.roles for select using (auth.role() = 'authenticated');
drop policy if exists permissions_read on public.permissions;
create policy permissions_read on public.permissions for select using (auth.role() = 'authenticated');
drop policy if exists role_permissions_read on public.role_permissions;
create policy role_permissions_read on public.role_permissions for select using (auth.role() = 'authenticated');
