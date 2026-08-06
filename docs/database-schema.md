# Database Schema

Postgres (Supabase). Migrations live in `infrastructure/migrations` and are
applied in filename order. Every tenant-scoped table carries `organization_id`,
timestamps (`created_at`, `updated_at`), and — where records can be archived —
`deleted_at` for soft deletion. Provenance columns (`source`, `external_id`,
`external_provider`, `raw`) appear where records may originate externally.

## Conventions

- **Primary keys**: `uuid` via `gen_random_uuid()`.
- **Timestamps**: `timestamptz`, maintained by the `set_updated_at()` trigger.
- **Tenancy**: `organization_id uuid references organizations(id)`.
- **RLS**: enabled on all tenant tables (migration `0009`), policy `is_org_member(organization_id)`.
- **Idempotency**: `webhook_events` has `UNIQUE(provider, idempotency_key)`.

## Table groups

### Organizations & access (`0002`, `0010`)
`organizations`, `organization_settings`, `profiles`, `memberships`, `roles`,
`permissions`, `role_permissions`, `teams`, `locations`.

- A `profile` maps 1:1 to a Supabase `auth.users` row (`auth_user_id`).
- A profile may belong to multiple organizations via `memberships` (each pins a `role`).
- `organization_settings` stores per-org `scoring_weights`, `score_band_thresholds`, and `feature_flags` as JSONB.

### Leads & contacts (`0003`)
`contacts`, `lead_sources`, `leads`, `lead_tags`, `lead_tag_assignments`,
`lead_scores`, `lead_qualification_sessions`, `lead_qualification_answers`,
`lead_enrichment_records`, `lead_assignments`.

- `leads.score` / `score_band` are denormalized for fast listing; `lead_scores` keeps the full breakdown and rule version.
- `lead_qualification_sessions.result` stores the structured AI output as JSONB.

### Sales / CRM (`0004`)
`pipelines`, `pipeline_stages`, `opportunities`, `opportunity_stage_history`,
`tasks`, `notes`, `appointments`, `conversations`, `messages`, `campaigns`,
`workflow_runs`.

- GHL linkage columns: `ghl_pipeline_id`, `ghl_opportunity_id`, `ghl_appointment_id`, `ghl_conversation_id`.
- `messages.author_type` distinguishes `human` / `automation` / `ai` for the activity timeline.

### Financial & insurance (`0005`)
`needs_profiles`, `financial_goals`, `insurance_interests`,
`product_recommendations`, `applications`, `application_status_history`,
`policies`, `policy_reviews`, `renewals`, `commissions`, `referrals`.

- `product_recommendations.requires_advisor_review` defaults to `true` — recommendations are never final without review.

### Documents & compliance (`0006`)
`documents`, `document_requests`, `document_access_logs`, `consent_records`,
`audit_logs`, `compliance_reviews`, `disclosure_records`, `communication_approvals`.

- `document_access_logs` records every read for auditability; files use signed URLs.
- `consent_records` drives outbound-channel gating (TCPA/CAN-SPAM alignment).

### Integrations (`0007`)
`integration_connections`, `webhook_events`, `sync_jobs`, `sync_errors`,
`external_object_mappings`, `api_usage_logs`.

- `integration_connections.encrypted_credentials` holds credentials encrypted at the app layer.
- `api_usage_logs` captures latency, tokens, and cost for AI/GHL usage tracking.

### Analytics (`0008`)
`funnel_events`, `conversion_metrics`, `campaign_metrics`, `advisor_metrics`,
`revenue_metrics`, `attribution_records`.

- The dashboard computes live metrics from operational tables (`@aion/analytics`); these tables hold pre-aggregated snapshots for scale.

## TypeScript contracts

The canonical row shapes are mirrored in `@aion/types` (`packages/types/src/entities.ts`),
so services, API handlers, and the UI share one vocabulary. Generate Supabase
types with `supabase gen types typescript` and reconcile against `@aion/types`.
