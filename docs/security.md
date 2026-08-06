# Security Foundation

AION handles sensitive financial and health-related information. The skeleton
ships technical controls that support (but do not by themselves establish) legal
compliance. See [`compliance-considerations.md`](compliance-considerations.md).

## Tenant isolation (defense in depth)

1. **Row-Level Security** (`infrastructure/migrations/0009`): every tenant table
   only admits rows for organizations the current user is an active member of
   (`is_org_member(organization_id)`). This is the hard boundary.
2. **Service-role discipline**: the service-role key bypasses RLS, so server code
   must scope every query by `organization_id`. `@aion/auth` provides
   `scopeToTenant` and `assertSameTenant` as an app-layer re-check.
3. **RBAC**: `permissionsForRole` (mirrors the SQL `role_permissions` seed) gates
   in-app capabilities and UI affordances.

## Secrets & credentials

- All configuration flows through validated env access (`@aion/shared/env`); no ad-hoc `process.env` reads.
- Integration credentials are stored **encrypted** (`ENCRYPTION_KEY`) in `integration_connections`, never in plaintext or the client bundle.
- The Supabase **service-role key is server-only** and never shipped to the browser.

## Logging & data protection

- **Structured logging** with correlation ids (`@aion/shared/logger`).
- **Automatic redaction** (`redact()`): keys matching PII / secret / health
  patterns (email, phone, SSN, DOB, Medicaid/Medicare id, diagnosis,
  prescription, account/routing/card numbers, tokens, api keys, …) are masked
  before anything is logged. Verified by tests.
- **Sensitive-field masking** (`maskTail`) for controlled display (e.g. last 4).
- **No sensitive information in client logs** — redaction runs at the sink.

## Request & webhook hardening

- **Webhook signature validation** (HMAC-SHA256, constant-time) on all inbound GHL events.
- **Idempotency** via `UNIQUE(provider, idempotency_key)` — replays are no-ops.
- **API request logging** (latency, status, tokens, cost) to `api_usage_logs`.
- **Environment-variable validation** at startup; production refuses to boot without required secrets (unless `DEMO_MODE`).
- **Error redaction**: `AppError.toClient()` returns safe messages; internals stay in logs only.

## Documents

- Files use **signed URLs** (Supabase Storage / S3); direct object access is not exposed.
- **Access logging** on every read (`document_access_logs`).

## Demo-mode safety

`@aion/compliance` blocks destructive/outbound actions (send SMS/email, place
call, delete, charge, submit application, push to GHL production, bulk export)
when `DEMO_MODE=true`, so a sales demo can never touch the real world. Enforced
by `assertActionAllowed` and covered by tests.

## Planned / recommended before production

- Session expiration & refresh policy (Supabase Auth).
- Rate limiting at the edge (per-IP and per-org) on public endpoints.
- Data retention settings, export, and deletion-request workflows (tables exist; wire the flows).
- Secrets management (Vault / platform secret store) instead of `.env` in production.
- Penetration testing and a formal security review.
