# Workflow Automation

`@aion/workflows` provides a small, declarative workflow engine and six initial
workflow definitions. Definitions are **plain data** (JSON) so they can later be
authored in a visual builder — they never contain code. Handlers are registered
with the engine at runtime.

## Model

- **WorkflowDefinition**: `{ key, name, description, trigger, steps[] }`.
- **WorkflowStep**: `{ id, action, label, config?, requiresApproval?, retry? }`.
- **WorkflowEngine**: resolves each step's `action` against a handler registry and runs steps in order.

### Execution semantics

- **Retry**: a step with `retry: { maxAttempts, backoffMs }` retries transient failures with linear backoff, then fails the run (preserving step history for observability / retry).
- **Human approval**: a step with `requiresApproval: true` halts the automated run in an `awaiting_approval` state — automation never proceeds past a compliance gate unattended.
- **Context**: a mutable `WorkflowContext` (`organizationId`, `leadId`, `correlationId`, `data`, `demoMode`) is threaded through; step outputs merge into `ctx.data`.

## Shipped definitions (`src/definitions`)

| Key | Trigger | Purpose |
| --- | --- | --- |
| `new_lead` | `lead.created` | Normalize → dedupe → GHL upsert → source → AI qualify → score → pipeline → notify → nurture |
| `appointment_booking` | `appointment.booked` | Confirm → calendar → intake → **advisor prep brief** → 24h & 1h reminders |
| `post_appointment` | `appointment.completed` | Outcome → summary → advance stage → tasks → *(approval)* follow-up → docs → application |
| `no_show` | `appointment.missed` | Reschedule → advisor task → retry 24h → re-engagement |
| `renewal` | `renewal.approaching` | Notify → review invite → policy review → cross-sell → book renewal |
| `referral` | `client.milestone` | Request review → request referral → track source → reward |

## Running

The `@aion/worker` service registers handlers (`apps/worker/src/handlers.ts`) and
runs workflows. In the skeleton handlers log the action they *would* perform and
respect demo mode; the `generate_advisor_brief` handler calls the real AI
gateway. Run a single pass:

```bash
WORKER_ONCE=true pnpm --filter @aion/worker start
```

## Extending

1. Add a JSON definition under `src/definitions` and export it from `index.ts`.
2. Register a handler for each new `action` on the engine.
3. For a production queue, back the engine with Inngest / Trigger.dev / BullMQ —
   the definition format and handler contract stay the same.
