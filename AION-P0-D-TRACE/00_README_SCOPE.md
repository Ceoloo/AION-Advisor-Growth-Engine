# AION P0-D — Edge Function + Repository Consumer Trace

**Mission:** READ-ONLY architecture forensics. Discover, trace, document, classify, export evidence.
**Status:** Complete for the in-scope repository. NO production systems were modified.
**Date:** 2026-08-12
**Analyst runtime:** Claude Code (read-only sweep)

---

## Scope of this sweep

This session had exactly **one** AION repository in its workspace and GitHub scope:

| Repository | In this workspace? | Notes |
| --- | --- | --- |
| `Ceoloo/AION-Advisor-Growth-Engine` | ✅ YES (cloned, analyzed) | This trace covers it in full. |
| `Ceoloo/aion-company-os` | ❌ NOT present / not in scope | Requires a separate session with repo access. |
| `Ceoloo/AION-Revenue-Factory` | ❌ NOT present / not in scope | Requires a separate session with repo access. |
| `Ceoloo/AION-VPS-Empire-Command.V1` | ❌ NOT present / not in scope | Requires a separate session with repo access. |

> **Evidence standard honored:** every dependency below cites `file:line` + symbol + reference.
> Where the mission's target objects were **searched for and not found**, that absence is
> recorded as evidence (grep count = 0), not guessed.

## The single most important finding (read this first)

`AION-Advisor-Growth-Engine` is an **MVP skeleton** (its own README, line 7: *"This is an MVP skeleton. It runs fully offline on seeded demo data"*). Three facts dominate the entire trace:

1. **There are NO Supabase Edge Functions.** No `supabase/functions/` directory exists.
   The "edge/serverless compute" is **Next.js App-Router API route handlers**
   (`apps/web/src/app/api/*`), a standalone Node HTTP service (`apps/api`), and a
   background worker (`apps/worker`).

2. **No application code queries Supabase.** `createDatabaseHandle()` is a stub that
   returns a config handle and warns (`packages/database/src/client.ts:30-42`). There are
   **zero** `supabase.from(...)` / `.rpc(...)` calls in the codebase. The ~61-table SQL
   schema in `infrastructure/migrations/0001–0010` is **defined but dormant** — not yet
   wired to any consumer. Runtime data comes from an in-memory demo store.

3. **None of the canonical AION event / memory / registry tables exist here.**
   `aion_events`, `aion_events_v2`, `operational_events`, `memory_events`, `event_memory`,
   `aion_memories`, `learning_lessons`, `leep*`, `founder_memory`, `aion_system_registry*`,
   `aion_producer_consumer_trace`, `aion_repository_edge_trace`, `revenue_sync_events` —
   **all grep = 0** across the repo. This repository is currently **disconnected** from the
   canonical AION event bus and knowledge/memory layer.

The **only live external write path** in the whole repository is **Airtable** (the
"Revenue & CRM OS" base), and it is gated off in demo mode.

## File index

| File | Contents |
| --- | --- |
| `01_REPOSITORY_INVENTORY.md` | Repo metadata, framework, entrypoints, directories |
| `02_EDGE_FUNCTION_INVENTORY.md` | "Edge functions" = API routes / worker (no Supabase functions) |
| `03_SUPABASE_DEPENDENCY_TRACE.md` | Producer/consumer trace of every DB object reference |
| `04_SQL_FUNCTION_TRACE.md` | SQL functions, triggers, views, RLS |
| `05_WORKFLOW_TRACE.md` | Orchestration: Vercel cron, worker, workflow engine |
| `06_EXTERNAL_SYSTEM_TRACE.md` | External systems reading/writing AION |
| `07_LEGACY_SOURCE_TRACE.md` | The mission's legacy sources, answered 1–14 each |
| `08_CANONICAL_MAPPING.md` | Legacy → canonical target mapping |
| `09_MIGRATION_DEPENDENCY_GRAPH.md` | Machine-readable dependency graph + anomalies |
| `10_DANGEROUS_DEPENDENCIES.md` | Risk-ranked migration hazards |
| `11_P0_D_FINDINGS.md` | Executive findings + recommended next P0 |
| `12_UNRESOLVED_DEPENDENCIES.md` | What could not be resolved and why |
| `*.json` | Machine-readable traces (7 files) |
