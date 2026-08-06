/**
 * Webhook verification and normalization for inbound GoHighLevel events.
 * Verification uses an HMAC-SHA256 signature over the raw request body with the
 * shared GHL_WEBHOOK_SECRET, compared in constant time.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { idempotencyKey } from '@aion/shared';

export interface GHLWebhookEnvelope {
  type: string;
  locationId?: string;
  webhookId?: string;
  timestamp?: string;
  [key: string]: unknown;
}

/** Verify the signature of a raw webhook body. Constant-time comparison. */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const provided = signature.replace(/^sha256=/, '');
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Derive a stable idempotency key for a webhook so repeated deliveries dedupe.
 * Prefers the provider's webhookId; otherwise hashes type + timestamp + body.
 */
export function webhookIdempotencyKey(envelope: GHLWebhookEnvelope, rawBody: string): string {
  if (envelope.webhookId) return idempotencyKey('ghl', envelope.webhookId);
  const digest = createHmac('sha256', 'idem').update(rawBody).digest('hex').slice(0, 32);
  return idempotencyKey('ghl', envelope.type, envelope.timestamp ?? '', digest);
}

export function parseWebhook(rawBody: string): GHLWebhookEnvelope {
  const parsed = JSON.parse(rawBody) as GHLWebhookEnvelope;
  return parsed;
}
