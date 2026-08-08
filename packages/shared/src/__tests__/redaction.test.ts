import { describe, expect, it } from 'vitest';
import { redact, maskTail, REDACTED } from '../redaction.js';

describe('redact', () => {
  it('masks sensitive keys anywhere in the object tree', () => {
    const input = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '555-123-4567',
      nested: { apiKey: 'sk-live-123', prescription: 'atorvastatin' },
      list: [{ ssn: '111-22-3333' }],
    };
    const out = redact(input);
    expect(out.name).toBe('Jane Doe');
    expect(out.email).toBe(REDACTED);
    expect(out.phone).toBe(REDACTED);
    expect(out.nested.apiKey).toBe(REDACTED);
    expect(out.nested.prescription).toBe(REDACTED);
    expect(out.list[0]?.ssn).toBe(REDACTED);
  });

  it('does not mutate the original object', () => {
    const input = { token: 'abc' };
    redact(input);
    expect(input.token).toBe('abc');
  });

  it('maskTail keeps only the last N chars', () => {
    expect(maskTail('5551234567', 4)).toBe('******4567');
    expect(maskTail('12', 4)).toBe(REDACTED);
  });
});
