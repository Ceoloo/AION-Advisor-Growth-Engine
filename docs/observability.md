# Observability — know when something breaks

Before real leads flow through AION, we need to see failures the moment they
happen. Every meaningful operation emits a structured **ops event** with a
status and a retry count; those events roll up into a simple 🟢/🟡/🔴 board.

```
AION System Health
GHL             🟢
Airtable        🟢
Scorecard       🟢
Workflows       🟢
Booking         🟢
AI              🟢
Analytics       🟢
Compliance      🟢
```

Live at **`/system-health`**, API at **`GET /api/system-health`**. Engine:
[`@aion/observability`](../packages/observability).

---

## What is recorded

Each `OpsEvent` carries a `component`, an operation `type`, a `status`, a
`retryCount`, an optional `error`, and a `correlationId`:

| Concern | How it shows up |
| --- | --- |
| **Structured logs** | Every ops event is mirrored to the structured logger (`recordOps`). |
| **Workflow execution status** | `workflow_execution` events (success / retry / failure). |
| **Integration health** | per-component roll-up on the board (GHL, Airtable, …). |
| **Failed CRM sync** | `crm_sync` `failure` (from `scorecard-sync`). |
| **Failed webhook** | `webhook` `failure` (bad signature / invalid payload). |
| **Failed booking event** | `booking_event` `failure`. |
| **AI failure** | `ai_call` `failure` (degrades to the rule-based fallback, still recorded). |
| **Retry count** | `retryCount` per event; the board sums retries per component. |
| **Outbound message status** | `outbound_message` — `suppressed` in demo (not sent), `success` when sent. |
| **Dead-letter / error state** | `dead_letter` status → the component (and system) go 🔴. |

### Status semantics

- `success` — completed cleanly.
- `retry` — failed, will be retried (carries the attempt count).
- `failure` — failed after retries; a recoverable error state.
- `dead_letter` — permanently failed, parked for manual intervention.
- `suppressed` — intentionally not performed (e.g. outbound blocked in demo). Never a fault.

## Health rules

`computeSystemHealth` is deterministic and worst-wins per component:

- any **dead-letter** in the window → **down** 🔴
- the **most recent** event is a failure/retry → **degraded** 🟡
- earlier failures but the latest is OK → **operational** (recovered) 🟢
- no events → operational baseline

The overall system level is the worst component level.

## Where it's wired

The recorder is a process-local rolling window
([`apps/web/src/lib/observability.ts`](../apps/web/src/lib/observability.ts)),
seeded with representative demo telemetry so the board is alive on boot.
Instrumented boundaries:

- `crm_sync` — `lib/scorecard-sync.ts` (success / failure / suppressed).
- `webhook` — `api/webhooks/ghl` (accepted / bad-signature / invalid-payload).
- `booking_event` — `api/scorecard/booking-confirmed`.
- `ai_call` — `api/ai/qualify` (success / AI-failure→fallback).

`/api/system-health` combines the recorder with the runtime capabilities so the
board notes when GHL/AI are simulated (mock) versus live.

## Production

Telemetry is in-memory in the demo — a rolling window, mirrored to the log
stream. In production the sink swaps for durable storage + alerting
(Sentry/PostHog wiring is stubbed in `env`) **without changing call sites**,
exactly like the structured logger. A `dead_letter` event is the signal to page
someone; the board and the `/api/system-health` endpoint are ready for an uptime
check to poll.
