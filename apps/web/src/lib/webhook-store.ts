/**
 * In-memory webhook processing log for the MVP. In production this is a
 * database table with a UNIQUE(provider, idempotency_key) constraint (see
 * infrastructure/migrations/0007_integrations.sql) — the constraint is what
 * guarantees a duplicate delivery is processed at most once. Here we emulate
 * that with a Set so the behavior (and its test) is identical.
 */
export interface WebhookProcessResult {
  status: 'processed' | 'duplicate';
  idempotencyKey: string;
}

const processed = new Map<string, { at: string; eventType: string }>();

export function recordWebhook(idempotencyKey: string, eventType: string): WebhookProcessResult {
  if (processed.has(idempotencyKey)) {
    return { status: 'duplicate', idempotencyKey };
  }
  processed.set(idempotencyKey, { at: new Date().toISOString(), eventType });
  return { status: 'processed', idempotencyKey };
}

export function processedCount(): number {
  return processed.size;
}

/** Test helper. */
export function _resetWebhookStore(): void {
  processed.clear();
}
