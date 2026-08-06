import { describe, expect, it } from 'vitest';
import { assertActionAllowed, isDestructive } from '../demo-guard.js';
import { canContactOnChannel } from '../consent.js';

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
