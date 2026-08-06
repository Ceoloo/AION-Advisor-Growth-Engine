# Database migrations

SQL migrations for the AION data model, targeting **Supabase Postgres**. They
are applied in filename order.

| File | Contents |
| --- | --- |
| `0001_extensions_and_helpers.sql` | Extensions, `updated_at` trigger, tenant RLS helper functions |
| `0002_core_tenancy.sql` | organizations, settings, profiles, memberships, roles, permissions, teams, locations |
| `0003_leads_contacts.sql` | contacts, leads, sources, tags, scores, qualification, enrichment, assignments |
| `0004_sales_crm.sql` | pipelines, stages, opportunities, tasks, notes, appointments, conversations, messages, campaigns, workflow_runs |
| `0005_financial_insurance.sql` | needs, goals, interests, recommendations, applications, policies, renewals, commissions, referrals |
| `0006_documents_compliance.sql` | documents, requests, access logs, consent, audit logs, compliance/disclosure records |
| `0007_integrations.sql` | integration connections, webhook_events (idempotency), sync jobs/errors, object mappings, api usage |
| `0008_analytics.sql` | funnel events + pre-aggregated metric tables |
| `0009_row_level_security.sql` | Enables RLS and tenant-isolation policies on every tenant table |
| `0010_rbac_seed.sql` | Global roles, permissions, and role→permission mapping |

## Applying

**Supabase (recommended):**

```bash
# Using the Supabase CLI against a local or linked project
supabase db push            # or apply files manually:
for f in infrastructure/migrations/0*.sql; do
  psql "$DATABASE_URL" -f "$f"
done
```

**Local plain Postgres (via Docker):** `infrastructure/docker/docker-compose.yml`
auto-applies these on first boot after installing an `auth.uid()` shim (see
`infrastructure/docker/init`). This is for convenience only — prefer the
Supabase CLI for auth/RLS parity.

## Row-Level Security

Tenant isolation is enforced by RLS: every tenant table only admits rows whose
`organization_id` belongs to an organization the current user is an active
member of (`public.is_org_member`). Service-role connections bypass RLS by
design and MUST scope every query by `organization_id` in the application layer
(see `@aion/auth`).
