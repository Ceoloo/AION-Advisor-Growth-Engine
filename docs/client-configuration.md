# Client configuration layer

This is what turns AION from a single-client project into a product.

Instead of hardcoding one advisor (Ben) into the codebase, **every advisor is a
declarative `ClientConfig`**. The engine reads the active config to brand
itself, seed its tenant, route leads, wire providers, and gate go-live.

```
Ben          →  ClientConfig  ┐
Advisor #2   →  ClientConfig  ├─→  the SAME AION engine
Advisor #3   →  ClientConfig  ┘
```

Onboarding a new advisor is **adding a config**, not forking the product.

Lives in [`@aion/clients`](../packages/clients). View it live at **`/client`**
(governance page) or **`GET /api/client`**.

---

## The `ClientConfig` shape

Field names read like an onboarding form (see
[`packages/clients/src/types.ts`](../packages/clients/src/types.ts)):

| Field | Purpose |
| --- | --- |
| `clientId`, `organizationId`, `slug` | Identity. `organizationId` must equal `org_${slug}`. |
| `displayName`, `vertical` | Practice name + industry (`financial_advisor` / `health_insurance`). |
| `advisor` | Name, title, bio, headshot, `licensedStates`, `serviceArea`. |
| `brand` | Primary/accent colors, logo, extra asset references. |
| `primaryAudience`, `planningAreas` | Who they serve + what they cover. |
| `bookingUrl` | Provider-agnostic scheduling link. |
| `providers` | `crm` (gohighlevel / airtable / none) + `calendar` (native / gohighlevel / …). |
| `leadSources` | Attribution + reporting inputs. |
| `followupCadence` | Deterministic follow-up steps (a human still approves outbound). |
| `team` | Practice roster; members with `receivesLeads: true` form the assignment pool. |
| `compliance` | `status` + reviewer + notes. |
| `approval` | `status` + approver + timestamp. |
| `isDemo`, `demoLeadVolume`, `seedOffset` | Demo-tenant generation controls. |
| `demoJourney` | Optional scripted journey (e.g. `marcus-johnson`). |

Every config is validated by a Zod schema at registration time
(`parseClientConfig`), so a malformed or half-authored client can never reach
the engine. Guards include kebab-case ids, `organizationId === org_${slug}`, and
"at least one team member receives leads".

## The registry & the active client

[`registry.ts`](../packages/clients/src/registry.ts) holds `CLIENT_CONFIGS` (in
priority order; index 0 is primary) and the resolver:

- `getPrimaryClient()` / `listClients()` / `getClientById()` / `getClientByOrg()`
- `getActiveClient()` — resolves the **active** client from the
  `AION_ACTIVE_CLIENT` env var, falling back to the primary for an unknown or
  empty value (safe by default — the app always has a valid client).
- `defaultLeadOwner()` / `leadPool()` — routing helpers.
- `isClientLiveApproved()` — true only when approval is `approved`/`active` **and**
  compliance is `approved`.

Selecting a client is deliberately separate from going live: a config can be
active while still `pending_approval`. Go-live is governed by the config's
approval/compliance status **and** the runtime-mode gates in
[`docs/environments.md`](environments.md).

## How the engine consumes configs

- **Demo seed** ([`@aion/database`](../packages/database/src/demo/seed.ts)):
  `generateDemoWorld()` builds **one tenant per registered config**. Org
  identity, advisor team, lead routing, lead volume, booking slugs, calendars,
  and the scripted journey all come from the config — there is no `isBenPeretz`
  branch anymore.
- **Web app** ([`apps/web/src/lib/demo.ts`](../apps/web/src/lib/demo.ts)):
  `DEMO_ORG_ID` and the org the app boots into are resolved from
  `getActiveClient()`. The top-bar practice name is config-driven.

## Registered clients (demo)

| Client | Vertical | Status | Notes |
| --- | --- | --- | --- |
| **Ben Peretz** (`ben-peretz`) | Financial protection | active + compliance-approved → **live** | Primary pilot; carries the Marcus Johnson journey. |
| **Maria Santos** (`maria-santos`) | Medicare / health | pending approval + in review → **onboarding** | A second advisor in a different vertical, proving the engine is client-agnostic. |

## Ben is Client Zero

The strategic framing: this is **not "Ben's financial-advisor system"** — it is
the **AION Advisor Growth Engine, and Ben is Client Zero**. His branding,
messaging, checkup, CRM mapping, workflows, and compliance are **tenant
configuration**, not permanent product logic. Ben's config carries
`isClientZero: true` and is the reference every subsequent advisor is cloned
from (`getClientZero()`).

So onboarding the next advisor is:

```
Create Client → Select Vertical → Configure ICP → Configure Offer →
Configure Scorecard → Configure GHL → Configure Compliance → Launch
```

— not *hire a developer → build another app → build another CRM → build another
funnel*.

## The onboarding wizard

`/create-client` walks those eight steps and assembles a `ClientConfig` draft.
On **Launch** it POSTs to `/api/clients/draft`, which runs the draft through the
**same Zod schema every registered client passes** (`parseClientConfig`) and
reports launch readiness (`evaluateLaunchReadiness`). A valid draft is a working
tenant definition — proof that a new advisor is configuration, not code.

The wizard is a **preview** in this build (the registry is code-defined); it
validates and shows the config that would be created. Registering it is:

1. Add `packages/clients/src/configs/<advisor>.ts` exporting the `ClientConfig`.
2. Register it in `CLIENT_CONFIGS` (in `registry.ts`).
3. A demo tenant seeds automatically and the config appears at `/client`. Set
   `AION_ACTIVE_CLIENT=<clientId>` to boot into that advisor.
4. To go live, complete approval/compliance sign-off (the [launch gate](launch-gate.md))
   and satisfy the runtime-mode activation gates (see [`docs/environments.md`](environments.md)).
