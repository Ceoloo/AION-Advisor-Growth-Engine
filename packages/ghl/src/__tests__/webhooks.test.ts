import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { verifyWebhookSignature, webhookIdempotencyKey, parseWebhook } from '../webhooks.js';

const SECRET = 'test-secret';
const body = JSON.stringify({ type: 'ContactCreate', webhookId: 'wh_123', locationId: 'loc_1' });
const sig = createHmac('sha256', SECRET).update(body).digest('hex');

describe('verifyWebhookSignature', () => {
  it('accepts a valid signature', () => {
    expect(verifyWebhookSignature(body, sig, SECRET)).toBe(true);
    expect(verifyWebhookSignature(body, `sha256=${sig}`, SECRET)).toBe(true);
  });
  it('rejects a tampered body', () => {
    expect(verifyWebhookSignature(body + 'x', sig, SECRET)).toBe(false);
  });
  it('rejects a missing signature', () => {
    expect(verifyWebhookSignature(body, null, SECRET)).toBe(false);
  });
});

describe('webhookIdempotencyKey', () => {
  it('is stable for the same webhookId', () => {
    const env = parseWebhook(body);
    expect(webhookIdempotencyKey(env, body)).toBe(webhookIdempotencyKey(env, body));
    expect(webhookIdempotencyKey(env, body)).toBe('ghl:wh_123');
  });
  it('falls back to a content hash when webhookId is absent', () => {
    const raw = JSON.stringify({ type: 'ContactUpdate', timestamp: '2026-01-01' });
    const env = parseWebhook(raw);
    const key = webhookIdempotencyKey(env, raw);
    expect(key).toContain('ghl:ContactUpdate');
    expect(webhookIdempotencyKey(env, raw)).toBe(key);
  });
});
