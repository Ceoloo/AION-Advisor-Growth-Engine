import { describe, expect, it, beforeEach } from 'vitest';
import { resetEnvCache } from '@aion/shared';
import { assertActionAllowed, assertActionPermitted, isDestructive } from '../demo-guard.js';
import { canContactOnChannel } from '../consent.js';

/** A fully-gated pilot environment (outbound + CRM writes permitted). */
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

describe('demo guard', () => {
  it('blocks destructive actions in demo mode', () => {
    expect(() => assertActionAllowed('send_sms', true)).toThrow(/disabled in demo mode/);
    expect(() => assertActionAllowed('submit_application', true)).toThrow();
  });
  it('allows destructive actions when not in demo mode', () => {
    expect(() => assertActionAllowed('send_sms', false)).not.toThrow();
  });
  it('allows non-destructive actions in demo mode', () => {
    expect(() => assertActionAllowed('view_lead', true)).not.toThrow();
    expect(isDestructive('view_lead')).toBe(false);
  });
});

describe('mode-aware guard (assertActionPermitted)', () => {
  beforeEach(() => resetEnvCache());

  it('blocks outbound + destructive actions when the mode resolves to demo', () => {
    // Even requesting production, an unconfigured env resolves to demo caps.
    const env = { RUNTIME_MODE: 'production' } as NodeJS.ProcessEnv;
    expect(() => assertActionPermitted('send_sms', env)).toThrow(/disabled in demo mode/);
    expect(() => assertActionPermitted('delete_lead', env)).toThrow();
  });
  it('permits outbound + CRM writes once a fully-gated pilot is active', () => {
    expect(() => assertActionPermitted('send_sms', PILOT_ENV)).not.toThrow();
    expect(() => assertActionPermitted('push_to_ghl_production', PILOT_ENV)).not.toThrow();
  });
  it('never guards non-destructive actions', () => {
    expect(() => assertActionPermitted('view_lead', {} as NodeJS.ProcessEnv)).not.toThrow();
  });
});

describe('consent', () => {
  it('requires granted, unexpired consent for the channel', () => {
    const consents = [{ type: 'sms' as const, status: 'granted' as const, capturedAt: '2026-01-01' }];
    expect(canContactOnChannel('sms', consents)).toBe(true);
    expect(canContactOnChannel('email', consents)).toBe(false);
  });
  it('rejects revoked or expired consent', () => {
    expect(
      canContactOnChannel('sms', [
        { type: 'sms', status: 'revoked', capturedAt: '2026-01-01' },
      ]),
    ).toBe(false);
    expect(
      canContactOnChannel(
        'sms',
        [{ type: 'sms', status: 'granted', capturedAt: '2020-01-01', expiresAt: '2021-01-01' }],
        new Date('2026-01-01'),
      ),
    ).toBe(false);
  });
});
