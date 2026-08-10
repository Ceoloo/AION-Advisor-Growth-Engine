/**
 * Runtime operating mode & capability model.
 *
 * The platform runs in one of three modes with a deliberate, GATED promotion
 * path:  DEMO  →  PILOT  →  PRODUCTION.
 *
 * Critically, a single environment variable can NOT flip the system live.
 * `RUNTIME_MODE=production` only expresses *intent*; the effective mode is the
 * highest tier whose full readiness + explicit-approval gates all pass, capped
 * by the request, and it safely falls back to a lower tier otherwise. Reaching
 * a live mode therefore requires several independent signals (real credentials,
 * approved branding/comms, named approvers, explicit activation confirmations,
 * a production activation token, monitoring, and — for production — a prior
 * pilot-ready state). This is enforced here, not left to convention.
 */
import { loadEnv, type Env } from './env.js';

export type RuntimeMode = 'demo' | 'pilot' | 'production';

export interface ModeCapabilities {
  mode: RuntimeMode;
  /** Use seeded demo data instead of live records. */
  useMockData: boolean;
  /** Use the mock AI provider (no external model calls). */
  useMockAI: boolean;
  /** GoHighLevel is simulated (no real CRM API calls). */
  simulateGHL: boolean;
  /** Outbound messages (SMS/email/calls) may be sent. */
  allowOutboundMessages: boolean;
  /** Records may be written to the production CRM (Airtable/GHL). */
  allowProductionCrmWrites: boolean;
  /** Human approval is required before irreversible/outbound actions. */
  requireHumanApproval: boolean;
  /** Live marketing campaigns may run. */
  allowLiveCampaigns: boolean;
  /** Lead volume is intentionally throttled/controlled. */
  controlledLeadVolume: boolean;
  /** Monitoring/observability must be configured for this mode. */
  monitoringRequired: boolean;
}

const CAPS: Record<RuntimeMode, Omit<ModeCapabilities, 'mode'>> = {
  demo: {
    useMockData: true,
    useMockAI: true,
    simulateGHL: true,
    allowOutboundMessages: false,
    allowProductionCrmWrites: false,
    requireHumanApproval: true,
    allowLiveCampaigns: false,
    controlledLeadVolume: true,
    monitoringRequired: false,
  },
  pilot: {
    useMockData: false,
    useMockAI: false,
    simulateGHL: false,
    allowOutboundMessages: true,
    allowProductionCrmWrites: true,
    requireHumanApproval: true, // pilot keeps a human in the loop
    allowLiveCampaigns: false, // controlled volume only
    controlledLeadVolume: true,
    monitoringRequired: true,
  },
  production: {
    useMockData: false,
    useMockAI: false,
    simulateGHL: false,
    allowOutboundMessages: true,
    allowProductionCrmWrites: true,
    requireHumanApproval: false, // fully approved automation
    allowLiveCampaigns: true,
    controlledLeadVolume: false,
    monitoringRequired: true,
  },
};

export interface GateCheck {
  key: string;
  label: string;
  ok: boolean;
}

export interface ModeResolution {
  requestedMode: RuntimeMode;
  effectiveMode: RuntimeMode;
  /** True when DEMO_MODE=true hard-locks the system to demo. */
  demoLocked: boolean;
  pilotReady: boolean;
  productionReady: boolean;
  pilotChecks: GateCheck[];
  productionChecks: GateCheck[];
  /** Human-readable reasons the requested mode was not reached. */
  blockers: string[];
  capabilities: ModeCapabilities;
}

const has = (v?: string | null): boolean => !!(v && String(v).trim());

/** Readiness + approval gates required to leave DEMO and run the PILOT. */
export function computePilotChecks(env: Env): GateCheck[] {
  return [
    { key: 'demo_off', label: 'DEMO_MODE is turned off', ok: !env.DEMO_MODE },
    {
      key: 'ghl',
      label: 'GoHighLevel credentials configured',
      ok: has(env.GHL_CLIENT_ID) && has(env.GHL_CLIENT_SECRET),
    },
    { key: 'airtable', label: 'Airtable access token configured', ok: has(env.AIRTABLE_ACCESS_TOKEN) },
    { key: 'booking', label: 'Booking calendar URL configured', ok: has(env.ADVISOR_GROWTH_REVIEW_URL) },
    { key: 'encryption', label: 'Encryption key set', ok: has(env.ENCRYPTION_KEY) },
    { key: 'branding', label: 'Branding approved (BRANDING_APPROVED)', ok: env.BRANDING_APPROVED },
    { key: 'comms', label: 'Communications approved (COMMS_APPROVED)', ok: env.COMMS_APPROVED },
    {
      key: 'activation',
      label: 'Pilot activation confirmed (PILOT_ACTIVATION_CONFIRMED)',
      ok: env.PILOT_ACTIVATION_CONFIRMED,
    },
    { key: 'approver', label: 'Pilot approver named (PILOT_APPROVED_BY)', ok: has(env.PILOT_APPROVED_BY) },
  ];
}

/** Additional gates required to promote PILOT → PRODUCTION. */
export function computeProductionChecks(env: Env): GateCheck[] {
  return [
    { key: 'monitoring', label: 'Error monitoring configured (SENTRY_DSN)', ok: has(env.SENTRY_DSN) },
    {
      key: 'database',
      label: 'Production database configured',
      ok: has(env.DATABASE_URL) && has(env.SUPABASE_SERVICE_ROLE_KEY),
    },
    { key: 'cron', label: 'Cron/worker secret set (CRON_SECRET)', ok: has(env.CRON_SECRET) },
    { key: 'launch', label: 'Launch approved (LAUNCH_APPROVED)', ok: env.LAUNCH_APPROVED },
    {
      key: 'prod_activation',
      label: 'Production activation confirmed (PRODUCTION_ACTIVATION_CONFIRMED)',
      ok: env.PRODUCTION_ACTIVATION_CONFIRMED,
    },
    {
      key: 'prod_token',
      label: 'Production activation token set (PRODUCTION_ACTIVATION_TOKEN)',
      ok: has(env.PRODUCTION_ACTIVATION_TOKEN),
    },
    {
      key: 'prod_approver',
      label: 'Production approver named (PRODUCTION_APPROVED_BY)',
      ok: has(env.PRODUCTION_APPROVED_BY),
    },
  ];
}

const failing = (checks: GateCheck[]): string[] => checks.filter((c) => !c.ok).map((c) => c.label);

/**
 * Resolve the effective runtime mode and capabilities. Safe by construction:
 * anything short of a fully-gated pilot/production configuration resolves to a
 * lower, safer tier — never silently live.
 */
export function resolveRuntimeMode(source: NodeJS.ProcessEnv = process.env): ModeResolution {
  const env = loadEnv(source);
  const requestedMode = env.RUNTIME_MODE;
  const demoLocked = env.DEMO_MODE;

  const pilotChecks = computePilotChecks(env);
  const productionChecks = computeProductionChecks(env);
  const pilotReady = pilotChecks.every((c) => c.ok);
  const productionReady = pilotReady && productionChecks.every((c) => c.ok);

  let effectiveMode: RuntimeMode = 'demo';
  if (!demoLocked) {
    if (requestedMode === 'production' && productionReady) effectiveMode = 'production';
    else if ((requestedMode === 'pilot' || requestedMode === 'production') && pilotReady) effectiveMode = 'pilot';
  }

  const blockers: string[] = [];
  if (demoLocked && requestedMode !== 'demo') {
    blockers.push('DEMO_MODE=true hard-locks the system to demo; set DEMO_MODE=false to promote.');
  }
  if (!demoLocked && requestedMode !== effectiveMode) {
    if (requestedMode === 'pilot') {
      blockers.push(...failing(pilotChecks));
    } else if (requestedMode === 'production') {
      // Production requires pilot readiness first (stepwise), then its own gates.
      blockers.push(...(pilotReady ? failing(productionChecks) : failing(pilotChecks)));
    }
  }

  return {
    requestedMode,
    effectiveMode,
    demoLocked,
    pilotReady,
    productionReady,
    pilotChecks,
    productionChecks,
    blockers,
    capabilities: { mode: effectiveMode, ...CAPS[effectiveMode] },
  };
}

export function getRuntimeMode(source?: NodeJS.ProcessEnv): RuntimeMode {
  return resolveRuntimeMode(source).effectiveMode;
}

export function getCapabilities(source?: NodeJS.ProcessEnv): ModeCapabilities {
  return resolveRuntimeMode(source).capabilities;
}

/** Canonical demo check — true only when the EFFECTIVE mode is demo. */
export function isDemoMode(source?: NodeJS.ProcessEnv): boolean {
  return getRuntimeMode(source) === 'demo';
}

export const MODE_LABEL: Record<RuntimeMode, string> = {
  demo: 'Demo',
  pilot: 'Pilot',
  production: 'Production',
};
