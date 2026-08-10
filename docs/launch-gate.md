# Launch gate — compliance as application logic

Compliance approvals are not a checklist someone eyeballs before flipping a
switch. They are a **hard gate in application logic**: live campaigns are refused
server-side until every critical approval is complete. It cannot be bypassed
casually from the UI.

```
Branding approved       ✓
Biography approved      ✓
Licensing verified      ✓
Disclosure approved     ✓
Messaging approved      ✓
Data handling approved  ✓
CRM approved            ✓
Calendar approved       ✓
             ↓
      LAUNCH ELIGIBLE

Any critical approval incomplete  ⇒  LIVE CAMPAIGN = BLOCKED
```

Live at **`/launch`**, enforced at **`POST /api/campaigns/launch`**, status at
**`GET /api/launch`**.

---

## Two independent gates

A live campaign is permitted only when **both** pass — so neither approvals
alone nor mode alone can turn campaigns live:

1. **Compliance approvals** — every critical item in `LAUNCH_APPROVAL_ITEMS`
   (branding, biography, licensing, disclosure, messaging, data handling, CRM,
   calendar) is approved. → `launchEligible`.
2. **Runtime mode** — the resolved mode grants the `allowLiveCampaigns`
   capability, which only production does (see [`environments.md`](environments.md)).

`evaluateLiveCampaignGate(state, capabilities)` returns `allowed` only when both
are true, with human-readable `reasons` when blocked.

## Where it lives

- **Items & state types** — [`@aion/types`](../packages/types/src/enums.ts):
  `LAUNCH_APPROVAL_ITEMS` (each `critical: true`), `LaunchApprovalKey`,
  `LaunchApprovalState`.
- **Gate logic** — [`@aion/compliance/launch-gate.ts`](../packages/compliance/src/launch-gate.ts):
  - `evaluateLaunchReadiness(state)` → items, `approvedCritical`,
    `missingCritical`, `launchEligible`.
  - `assertLaunchEligible(state)` — throws `AppError('launch_blocked')` when incomplete.
  - `evaluateLiveCampaignGate(state, caps)` / `assertLiveCampaignAllowed(state, caps)`
    — the combined gate; the assert throws `AppError('live_campaign_blocked')`
    (HTTP 403) and is the enforcement boundary.
- **Per-client approvals** — each advisor's [`ClientConfig`](client-configuration.md)
  carries `launchApprovals` (who signed off, when). Missing keys count as not
  approved.

## Enforcement

`POST /api/campaigns/launch` calls `assertLiveCampaignAllowed(...)` **before**
anything is enabled. When blocked it returns `403` with the reasons; there is no
override flag. The `/launch` page's "Attempt to launch a live campaign" button
hits this endpoint and surfaces the server's refusal — the gate runs on the
server, not in the browser.

## Demo state

| Client | Approvals | Runtime mode | Result |
| --- | --- | --- | --- |
| **Ben Peretz** | all 8 complete → **Launch Eligible** | demo (no live campaigns) | live campaigns **BLOCKED** by Gate 2 |
| **Maria Santos** | disclosure / messaging / data handling pending | demo | **BLOCKED** by Gate 1 (and Gate 2) |

Ben shows the important safety property: even a fully-approved client cannot run
live campaigns outside production mode. To actually go live, both gates must
pass — every approval recorded **and** the deployment promoted to production via
the gated activation runbook.
