/**
 * Centralized, validated environment access.
 *
 * All external configuration flows through this module so that:
 *  - required variables are validated once, at startup;
 *  - the demo can run without external services (sensible dev fallbacks);
 *  - secrets never get read ad-hoc from `process.env` across the codebase.
 */
import { z } from 'zod';

const booleanish = z
  .string()
  .transform((v) => v === 'true' || v === '1')
  .pipe(z.boolean());

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  DEMO_MODE: booleanish.default('true'),

  DATABASE_URL: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  GHL_CLIENT_ID: z.string().optional(),
  GHL_CLIENT_SECRET: z.string().optional(),
  GHL_REDIRECT_URI: z.string().optional(),
  GHL_WEBHOOK_SECRET: z.string().optional(),
  GHL_API_BASE_URL: z.string().url().default('https://services.leadconnectorhq.com'),

  AI_PROVIDER: z.enum(['mock', 'openai', 'anthropic']).default('mock'),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('claude-sonnet-4-5'),

  SENTRY_DSN: z.string().optional(),
  POSTHOG_KEY: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  ENCRYPTION_KEY: z.string().optional(),
  CRON_SECRET: z.string().optional(),

  // --- Airtable (Revenue & CRM OS) — server-side only ------------------------
  // The token is a secret and must NEVER reach the browser. These are declared
  // without literal defaults so no Airtable identifiers get inlined into any
  // client bundle; the (non-secret) ID defaults live server-side in
  // @aion/integrations (airtable.ts).
  AIRTABLE_ACCESS_TOKEN: z.string().optional(),
  AIRTABLE_API_BASE_URL: z.string().url().optional(),
  AIRTABLE_BASE_ID: z.string().optional(),
  AIRTABLE_LEADS_TABLE_ID: z.string().optional(),
  AIRTABLE_SCORECARD_RESPONSES_TABLE_ID: z.string().optional(),
  AIRTABLE_INTENT_EVENTS_TABLE_ID: z.string().optional(),
  AION_FINANCIAL_ADVISOR_CAMPAIGN_RECORD_ID: z.string().optional(),
  AION_ADVISOR_SCORECARD_ASSET_RECORD_ID: z.string().optional(),

  // Booking / scheduling for the Advisor Growth Review (provider-agnostic URL).
  ADVISOR_GROWTH_REVIEW_URL: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * Variables that MUST be present when running a real (non-demo) production
 * deployment. In demo/dev mode these are optional so the skeleton runs offline.
 */
const PRODUCTION_REQUIRED: (keyof Env)[] = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ENCRYPTION_KEY',
  'CRON_SECRET',
];

let cached: Env | null = null;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  if (cached) return cached;

  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  const env = parsed.data;

  // Enforce production hardening: no silent fallbacks in real deployments.
  if (env.NODE_ENV === 'production' && !env.DEMO_MODE) {
    const missing = PRODUCTION_REQUIRED.filter((key) => !env[key]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required production environment variables: ${missing.join(', ')}. ` +
          `Set them or enable DEMO_MODE for a self-contained demo.`,
      );
    }
  }

  cached = env;
  return env;
}

/** For tests: clear the memoized env so a fresh source can be validated. */
export function resetEnvCache(): void {
  cached = null;
}

export function isDemoMode(source: NodeJS.ProcessEnv = process.env): boolean {
  return loadEnv(source).DEMO_MODE;
}
