# Deployment

## Local development

Requires Node ≥ 20 and pnpm ≥ 9.

```bash
pnpm install
cp .env.example .env      # defaults = demo mode, mock AI, no external services
pnpm dev                  # web :3000, api :3001, worker
```

Everything runs offline. To enable git hooks: `pnpm hooks:install`.

### Local database (optional)

Demo mode needs no database. To run the schema locally:

- **Supabase CLI (recommended)** — parity with production auth/RLS:
  ```bash
  supabase start                 # uses infrastructure/supabase/config.toml
  for f in infrastructure/migrations/0*.sql; do psql "$DATABASE_URL" -f "$f"; done
  ```
- **Plain Postgres via Docker** — convenience only (installs an `auth.uid()` shim):
  ```bash
  docker compose -f infrastructure/docker/docker-compose.yml up -d
  ```

## Production (Vercel + Supabase)

Recommended: **Vercel** for `apps/web` (dashboard + API routes) and **Supabase**
for Postgres, Auth, and Storage. The worker runs on a separate always-on host
(Railway/Render/Fly) or is replaced by Inngest/Trigger.dev.

### 1. Supabase

1. Create a project; note the URL, anon key, and service-role key.
2. Apply migrations (`infrastructure/migrations`, in order) via the CLI or SQL editor.
3. Confirm RLS is enabled on all tenant tables (migration `0009`).
4. Create a storage bucket for documents (private; signed URLs only).

### 2. Vercel

- Import the repo. `infrastructure/deployment/vercel.json` sets the build to
  `pnpm turbo run build --filter=@aion/web` with output `apps/web/.next`.
- Set environment variables (see `.env.example`). For production set
  `DEMO_MODE=false` and provide all required secrets — the app refuses to boot
  otherwise.
- Configure the GoHighLevel webhook to point at `https://<domain>/api/webhooks/ghl`.

### 3. Worker

Deploy `apps/worker` to an always-on host, or migrate its handlers to a managed
jobs platform. Provide the same env; protect any trigger endpoints with
`CRON_SECRET`.

## Required environment variables

See [`.env.example`](../.env.example) for the full, annotated list. In production
(`DEMO_MODE=false`) these are **required**: `DATABASE_URL`, `SUPABASE_URL`,
`SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ENCRYPTION_KEY`, `CRON_SECRET`
— plus GHL and AI credentials for live functionality. Validation happens at
startup in `@aion/shared/env`.

## Go-live checklist

- [ ] Migrations applied; RLS verified with a two-tenant test.
- [ ] `DEMO_MODE=false`; all required secrets set; app boots.
- [ ] GHL credentials + webhook configured; signatures verify.
- [ ] `AI_PROVIDER` set to a real provider with an API key.
- [ ] Storage bucket private; signed URLs working.
- [ ] Legal/compliance review complete (see `compliance-considerations.md`).
- [ ] Monitoring wired: Sentry (`SENTRY_DSN`), PostHog (`POSTHOG_KEY`).
