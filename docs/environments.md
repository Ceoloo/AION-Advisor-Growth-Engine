# Runtime modes & gated activation

The platform runs in exactly one of three operating modes, with a deliberate,
**gated** promotion path:

```
DEMO  →  PILOT  →  PRODUCTION
```

The single most important rule:

> **A developer can NOT flip `DEMO → LIVE` with one environment variable.**
> Production activation is an explicit, multi-signal, gated process.

`RUNTIME_MODE` only expresses *intent*. The **effective mode** is the highest
tier whose full readiness + explicit-approval gates all pass, capped by the
requested mode — and it safely falls back to a lower, safer tier otherwise.
Setting `RUNTIME_MODE=production` on its own resolves to **demo** (because
`DEMO_MODE` defaults to `true` and none of the gates are met).

The resolution logic lives in [`packages/shared/src/mode.ts`](../packages/shared/src/mode.ts)
and is fully unit-tested. Live status is visible in-app at **`/mode`** and via
**`GET /api/mode`** (both read-only — there is no way to promote over HTTP).

---

## The three modes

| | DEMO 🧪 | PILOT 🚀 | PRODUCTION 🌐 |
| --- | --- | --- | --- |
| Data | Seeded demo store | Live records | Live records |
| AI | Mock provider | Real provider | Real provider |
| GoHighLevel | Simulated | Live | Live |
| Outbound messages | ❌ blocked | ✅ (human-approved) | ✅ |
| Production CRM writes | ❌ blocked | ✅ | ✅ |
| Human approval on outbound | Required | Required (in the loop) | Released |
| Live campaigns | ❌ | ❌ (controlled volume) | ✅ |
| Lead volume | Controlled | Controlled | Unthrottled |
| Monitoring | Optional | Required | Required |

Capabilities are enforced in code — not by convention:

- `apps/web/src/lib/scorecard-sync.ts`, `/api/scorecard/event`, and
  `/api/scorecard/booking-confirmed` gate every CRM write on
  `getCapabilities().allowProductionCrmWrites`.
- `@aion/compliance`'s `assertActionPermitted(action)` blocks outbound &
  destructive actions unless the resolved mode grants the matching capability.

Anything short of a fully-gated configuration resolves to demo capabilities, so
these gates fail closed.

---

## Promotion runbook

Promotion happens **only** by setting environment signals in the deployment and
redeploying. Verify each step at `/mode` — every gate is listed with its
pass/fail state and any blockers are named explicitly.

### Step 1 — DEMO → PILOT

Set **all** of the following:

| Signal | Meaning |
| --- | --- |
| `DEMO_MODE=false` | Release the hard demo lock. |
| `RUNTIME_MODE=pilot` | Request pilot. |
| `GHL_CLIENT_ID`, `GHL_CLIENT_SECRET` | Live GoHighLevel credentials. |
| `AIRTABLE_ACCESS_TOKEN` | Server-side CRM token (never sent to the browser). |
| `ADVISOR_GROWTH_REVIEW_URL` | Booking calendar URL. |
| `ENCRYPTION_KEY` | 32-byte key for credentials at rest. |
| `BRANDING_APPROVED=true` | Ben's branding reviewed & approved. |
| `COMMS_APPROVED=true` | Outbound copy reviewed & approved. |
| `PILOT_ACTIVATION_CONFIRMED=true` | Explicit activation confirmation. |
| `PILOT_APPROVED_BY="<name>"` | Named human who authorized the pilot. |

When every gate passes, the effective mode becomes **pilot**. A human-approval
gate remains on outbound actions, and lead volume stays controlled.

### Step 2 — PILOT → PRODUCTION

Production requires a **prior pilot-ready state** (all Step 1 gates) **plus**:

| Signal | Meaning |
| --- | --- |
| `RUNTIME_MODE=production` | Request production. |
| `SENTRY_DSN` | Error monitoring configured. |
| `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Production database. |
| `CRON_SECRET` | Worker/cron trigger secret. |
| `LAUNCH_APPROVED=true` | Launch sign-off. |
| `PRODUCTION_ACTIVATION_CONFIRMED=true` | Explicit activation confirmation. |
| `PRODUCTION_ACTIVATION_TOKEN="<random>"` | Deliberate out-of-band activation token. |
| `PRODUCTION_APPROVED_BY="<name>"` | Named human who authorized go-live. |

Only when **all** pilot *and* production gates pass does the effective mode
become **production**, releasing the human-approval gate and enabling live
campaigns.

---

## Why this is safe by construction

- **Multiple independent signals.** No single variable is sufficient; live
  modes require credentials, approvals, named approvers, explicit confirmations,
  and an activation token.
- **Stepwise.** Production can't be reached without first satisfying every
  pilot gate.
- **Fail closed.** Any missing or malformed signal drops the effective mode to
  a lower tier; the capability gates then block outbound/CRM writes.
- **Hard demo lock.** `DEMO_MODE=true` overrides everything and pins the system
  to demo, so a demo deployment can never touch the real world by accident.
- **Read-only surfaces.** `/mode` and `/api/mode` report status but cannot
  change it — promotion is a deployment action, not an in-app toggle.

## Verifying the current mode

```bash
curl -s http://localhost:3000/api/mode | jq
```

Returns `requestedMode`, `effectiveMode`, `pilotReady`, `productionReady`, the
full `pilotChecks` / `productionChecks` gate arrays, resolved `capabilities`,
and any `blockers`.
