# 04 — SQL Function / RPC / Trigger / RLS Trace

Source of truth: `infrastructure/migrations/0001–0010`. These are applied in filename order
(`infrastructure/docker/init/99_apply_migrations.sh`, `infrastructure/migrations/README.md`).
Total: **1042 SQL lines**, **~61 tables**, **4 functions**, **13 updated_at triggers**, RLS on
all tenant tables. **No views, no materialized views, no stored procedures beyond these
functions, no pg_cron.**

## SQL functions

| FUNCTION | SCHEMA | FILE:LINE | LANG | SECURITY | READS | WRITES | CALLERS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `set_updated_at()` | public | `0001:11` | plpgsql | (trigger) | NEW row | sets `NEW.updated_at` | 13 `before update` triggers |
| `current_profile_id()` | public | `0001:23` | sql stable | invoker | `profiles`, `auth.uid()` | — | (available to RLS/app; not referenced elsewhere in migrations) |
| `is_org_member(org uuid)` | public | `0001:31` | sql stable | **security definer**, `search_path=public` | `memberships`, `profiles` | — | RLS `tenant_isolation` policy on ~50 tables, `webhook_events`, `organizations`, join tables (`0009`) |
| `has_org_role(org uuid, roles text[])` | public | `0001:49` | sql stable | **security definer** | `memberships`, `profiles` | — | RLS `org_admin_write` on `organizations` (`0009:50`) |

- **RPC usage from application code: 0** (no `.rpc(` calls anywhere). These functions are only
  invoked by Postgres itself (triggers + RLS policy evaluation).
- **CANONICAL TARGET / LEGACY SOURCE / MIGRATION ROLE:** none of these functions bridge legacy↔canonical.
  They are tenancy/RLS plumbing. `security definer` on `is_org_member`/`has_org_role` is standard and
  scoped via `search_path=public`.

## Triggers (all `before update … execute set_updated_at()`)

| Trigger | Table | File:Line |
| --- | --- | --- |
| trg_org_updated | organizations | 0002:99 |
| trg_org_settings_updated | organization_settings | 0002:101 |
| trg_profiles_updated | profiles | 0002:103 |
| trg_memberships_updated | memberships | 0002:105 |
| trg_contacts_updated | contacts | 0003:125 |
| trg_leads_updated | leads | 0003:127 |
| trg_qual_sessions_updated | lead_qualification_sessions | 0003:129 |
| trg_opps_updated | opportunities | 0004:152 |
| trg_appointments_updated | appointments | 0004:154 |
| trg_integration_conn_updated | integration_connections | 0007:88 |
| trg_sync_jobs_updated | sync_jobs | 0007:90 |
| trg_applications_updated | applications | 0005:129 |
| trg_policies_updated | policies | 0005:131 |

No business-logic triggers (no event-emitting triggers, no legacy→canonical bridge triggers).

## Full table inventory (~61) by migration

| # | Migration | Tables |
| --- | --- | --- |
| 0002 | core_tenancy | organizations, organization_settings, profiles, memberships, roles, permissions, role_permissions, teams, locations |
| 0003 | leads_contacts | contacts, lead_sources, leads, lead_tags, lead_tag_assignments, lead_scores, lead_qualification_sessions, lead_qualification_answers, lead_enrichment_records, lead_assignments |
| 0004 | sales_crm | pipelines, pipeline_stages, opportunities, opportunity_stage_history, tasks, notes, appointments, conversations, messages, campaigns, workflow_runs |
| 0005 | financial_insurance | needs_profiles, financial_goals, insurance_interests, product_recommendations, applications, application_status_history, policies, policy_reviews, renewals, commissions, referrals |
| 0006 | documents_compliance | documents, document_requests, document_access_logs, consent_records, audit_logs, compliance_reviews, disclosure_records, communication_approvals |
| 0007 | integrations | integration_connections, webhook_events, sync_jobs, sync_errors, external_object_mappings, api_usage_logs |
| 0008 | analytics | funnel_events, conversion_metrics, campaign_metrics, advisor_metrics, revenue_metrics, attribution_records |
| 0010 | rbac_seed | (seed data for roles/permissions — no new tables) |

## Row-Level Security (0009)

- Dynamic loop enables RLS + `tenant_isolation` policy (`using/​with check public.is_org_member(organization_id)`)
  on ~50 tenant tables (`0009:14-41`).
- Special policies: `organizations` (member read / admin write via `has_org_role`),
  `profiles` (own row), `webhook_events` (nullable org_id pre-resolution),
  join tables scoped via parent (`lead_tag_assignments`, `lead_qualification_answers`),
  global reference tables readable by any authenticated user (`roles`, `permissions`, `role_permissions`).
- **Design note (0009:6-8):** *service-role connections bypass RLS and MUST scope by
  `organization_id` in the app layer.* Since no app code currently uses the service role against
  Supabase, this is a **future** obligation, not an active risk — but it is a documented cutover
  requirement (see `10_DANGEROUS_DEPENDENCIES.md`).

## GHL foreign-id columns (integration seams, not FKs)

Columns that will hold GoHighLevel external IDs once the CRM sync goes live:
`pipelines.ghl_pipeline_id` (0004:12), `opportunities.ghl_opportunity_id` (0004:40),
`appointments.ghl_appointment_id` (0004:89), `conversations.ghl_conversation_id` (0004:100),
plus `external_object_mappings` (0007:59) as the generic local↔external id map.

## Bridge classification

| Question | Answer |
| --- | --- |
| Functions that READ legacy sources | none (no legacy AION tables exist here) |
| Functions that WRITE legacy sources | none |
| Functions that READ canonical sources | none (canonical AION tables absent) |
| Functions that WRITE canonical sources | none |
| Functions that BRIDGE legacy → canonical | **none** |
| Functions that BRIDGE canonical → legacy | **none** |

This repository contains **no SQL-level bridge logic** to/from the canonical AION architecture.
