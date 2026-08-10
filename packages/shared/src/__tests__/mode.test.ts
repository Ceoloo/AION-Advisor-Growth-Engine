import { describe, expect, it, beforeEach } from 'vitest';
import { resetEnvCache } from '../env.js';
import { resolveRuntimeMode, getCapabilities, isDemoMode } from '../mode.js';

/** Full set of signals required to reach a fully-gated pilot. */
const PILOT_ENV: NodeJS.ProcessEnv = {
  DEMO_MODE: 'false',
  RUNTIME_MODE: 'pilot',
  GHL_CLIENT_ID: 'ghl-client',
  GHL_CLIENT_SECRET: 'ghl-secret',
  AIRTABLE_ACCESS_TOKEN: 'pat_token',
  ADVISOR_GROWTH_REVIEW_URL: 'https://cal.example.com/ben/review',
  ENCRYPTION_KEY: 'a'.repeat(32),
  BRANDING_APPROVED: 'true',
  COMMS_APPROVED: 'true',
  PILOT_ACTIVATION_CONFIRMED: 'true',
  PILOT_APPROVED_BY: 'Ben Peretz',
};

/** Additional signals required to promote pilot → production. */
const PRODUCTION_ENV: NodeJS.ProcessEnv = {
  ...PILOT_ENV,
  RUNTIME_MODE: 'production',
  SENTRY_DSN: 'https://sentry.example.com/1',
  DATABASE_URL: 'postgres://db',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
  CRON_SECRET: 'cron-secret',
  LAUNCH_APPROVED: 'true',
  PRODUCTION_ACTIVATION_CONFIRMED: 'true',
  PRODUCTION_ACTIVATION_TOKEN: 'prod-activation-token',
  PRODUCTION_APPROVED_BY: 'Ben Peretz',
};

describe('resolveRuntimeMode — safe by default', () => {
  beforeEach(() => resetEnvCache());

  it('defaults to demo with an empty environment', () => {
    const r = resolveRuntimeMode({});
    expect(r.requestedMode).toBe('demo');
    expect(r.effectiveMode).toBe('demo');
    expect(isDemoMode({})).toBe(true);
  });

  it('a single RUNTIME_MODE=production var can NOT flip the system live', () => {
    const r = resolveRuntimeMode({ RUNTIME_MODE: 'production' } as NodeJS.ProcessEnv);
    // DEMO_MODE defaults to true → hard demo lock, plus every gate is unmet.
    expect(r.effectiveMode).toBe('demo');
    expect(r.demoLocked).toBe(true);
    expect(r.blockers.length).toBeGreaterThan(0);
  });

  it('DEMO_MODE=true hard-locks to demo even with all other gates passing', () => {
    const r = resolveRuntimeMode({ ...PRODUCTION_ENV, DEMO_MODE: 'true' });
    expect(r.effectiveMode).toBe('demo');
    expect(r.demoLocked).toBe(true);
    expect(r.blockers.some((b) => /hard-locks/.test(b))).toBe(true);
  });
});

describe('resolveRuntimeMode — pilot gating', () => {
  beforeEach(() => resetEnvCache());

  it('requesting pilot without approvals stays in demo and reports blockers', () => {
    const r = resolveRuntimeMode({ DEMO_MODE: 'false', RUNTIME_MODE: 'pilot' });
    expect(r.effectiveMode).toBe('demo');
    expect(r.pilotReady).toBe(false);
    // Named approver + branding/comms/activation are all missing.
    expect(r.blockers).toContain('Pilot approver named (PILOT_APPROVED_BY)');
  });

  it('reaches pilot when every readiness + approval gate passes', () => {
    const r = resolveRuntimeMode(PILOT_ENV);
    expect(r.pilotReady).toBe(true);
    expect(r.effectiveMode).toBe('pilot');
    expect(r.blockers).toHaveLength(0);
  });

  it('a missing single pilot signal blocks promotion', () => {
    const r = resolveRuntimeMode({ ...PILOT_ENV, PILOT_ACTIVATION_CONFIRMED: 'false' });
    expect(r.pilotReady).toBe(false);
    expect(r.effectiveMode).toBe('demo');
  });

  it('pilot capabilities keep a human in the loop and forbid live campaigns', () => {
    const caps = getCapabilities(PILOT_ENV);
    expect(caps.mode).toBe('pilot');
    expect(caps.allowOutboundMessages).toBe(true);
    expect(caps.allowProductionCrmWrites).toBe(true);
    expect(caps.requireHumanApproval).toBe(true);
    expect(caps.allowLiveCampaigns).toBe(false);
    expect(caps.controlledLeadVolume).toBe(true);
  });
});

describe('resolveRuntimeMode — production gating (stepwise)', () => {
  beforeEach(() => resetEnvCache());

  it('production request falls back to pilot when only pilot gates pass', () => {
    // Pilot-complete env, but requesting production without production signals.
    const r = resolveRuntimeMode({ ...PILOT_ENV, RUNTIME_MODE: 'production' });
    expect(r.pilotReady).toBe(true);
    expect(r.productionReady).toBe(false);
    expect(r.effectiveMode).toBe('pilot');
    // Blockers should reference the production gates, not the pilot ones.
    expect(r.blockers).toContain('Production approver named (PRODUCTION_APPROVED_BY)');
  });

  it('reaches production only when pilot AND production gates all pass', () => {
    const r = resolveRuntimeMode(PRODUCTION_ENV);
    expect(r.pilotReady).toBe(true);
    expect(r.productionReady).toBe(true);
    expect(r.effectiveMode).toBe('production');
    expect(r.blockers).toHaveLength(0);
  });

  it('missing the production activation token blocks production', () => {
    const r = resolveRuntimeMode({ ...PRODUCTION_ENV, PRODUCTION_ACTIVATION_TOKEN: '' });
    expect(r.productionReady).toBe(false);
    expect(r.effectiveMode).toBe('pilot');
  });

  it('production capabilities enable full automation', () => {
    const caps = getCapabilities(PRODUCTION_ENV);
    expect(caps.mode).toBe('production');
    expect(caps.requireHumanApproval).toBe(false);
    expect(caps.allowLiveCampaigns).toBe(true);
    expect(caps.controlledLeadVolume).toBe(false);
    expect(caps.monitoringRequired).toBe(true);
  });
});
