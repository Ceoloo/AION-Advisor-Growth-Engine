# API Reference

Two surfaces expose the same domain logic:

- **Web API routes** (`apps/web/src/app/api/*`) — served by Next.js at `/api/*` on port 3000.
- **Standalone API service** (`apps/api`) — a dependency-free Node HTTP server on port 3001, reusing the same packages.

All responses are JSON. Errors use `{ ok: false, error: string }` with an
appropriate status. The API service adds an `x-correlation-id` header.

## Web API routes

### `POST /api/ai/qualify`
Deterministic score + AI-assisted qualification.

```jsonc
// request
{ "vertical": "financial_advisor" | "health_insurance", "answers": { "appointment_urgency": "ASAP", ... } }
// response
{ "ok": true,
  "score": { "total": 72, "band": "qualified", "breakdown": { ... } },
  "qualification": { "qualificationStatus": "qualified", "intentScore": 72, "needsSummary": "...", ... },
  "aiProvider": "mock" }
```
Scoring is independent of the AI call — if AI schema validation fails, a
rule-based fallback qualification is returned (still `ok: true`).

### `POST /api/ai/advisor-brief`
```jsonc
{ "leadId": "org_aion-demo_l0" }   // → { "ok": true, "data": { headline, talkingPoints[], complianceReminders[], ... } }
```
Tenant-scoped read; `404` if the lead is not in the active tenant.

### `POST /api/webhooks/ghl`
GoHighLevel webhook ingestion. Headers: `x-ghl-signature` (HMAC-SHA256 of the raw body).
- `401 invalid_signature` when a secret is configured and the signature is wrong.
- `200 { status: "processed", idempotencyKey }` for a new event.
- `200 { status: "duplicate", idempotencyKey }` for a replay (idempotent).

### `GET /api/health`
```jsonc
{ "ok": true, "service": "web", "demoMode": true, "aiProvider": "mock", "integrations": [ { "provider": "gohighlevel", "status": "connected" }, ... ] }
```

## Standalone API service (`apps/api`, port 3001)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Service + integration health |
| POST | `/leads/score` | Deterministic score only (`{ vertical, answers }`) |
| POST | `/ai/qualify` | AI qualification |
| POST | `/webhooks/ghl` | Webhook ingestion (verify + idempotency) |

Run it: `pnpm --filter @aion/api dev`.

## Conventions

- **Validation**: request bodies are validated with Zod; invalid input → `422 invalid_request`.
- **Tenancy**: reads are scoped to the active organization (demo: `org_aion-demo`). In production the tenant is resolved from the authenticated session.
- **Demo mode**: destructive/outbound endpoints are guarded by `@aion/compliance` and blocked when `DEMO_MODE=true`.
