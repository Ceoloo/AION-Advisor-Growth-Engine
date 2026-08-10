import { NextResponse } from 'next/server';
import { parseWebhook, verifyWebhookSignature, webhookIdempotencyKey } from '@aion/ghl';
import { loadEnv, logger } from '@aion/shared';
import { recordWebhook } from '@/lib/webhook-store';
import { recordOps } from '@/lib/observability';

/**
 * GoHighLevel webhook ingestion.
 *  1. Verify the HMAC signature (when a secret is configured).
 *  2. Derive a stable idempotency key.
 *  3. Dedupe — a repeated delivery is acknowledged but not reprocessed.
 *  4. Hand off to processing (mocked here: would enqueue the New Lead workflow).
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const env = loadEnv();
  const log = logger.child({ component: 'ghl-webhook' });

  // Signature verification. In demo mode without a configured secret we accept
  // the event but flag it as unverified so the behavior is explicit.
  const signature = request.headers.get('x-ghl-signature') ?? request.headers.get('x-wh-signature');
  let verified = false;
  if (env.GHL_WEBHOOK_SECRET) {
    verified = verifyWebhookSignature(raw, signature, env.GHL_WEBHOOK_SECRET);
    if (!verified) {
      log.warn('rejected webhook: bad signature');
      recordOps({
        component: 'ghl',
        type: 'webhook',
        status: 'failure',
        retryCount: 1,
        message: 'Webhook rejected',
        error: 'Invalid signature',
      });
      return NextResponse.json({ ok: false, error: 'invalid_signature' }, { status: 401 });
    }
  }

  let envelope;
  try {
    envelope = parseWebhook(raw);
  } catch {
    recordOps({
      component: 'ghl',
      type: 'webhook',
      status: 'failure',
      retryCount: 1,
      message: 'Webhook rejected',
      error: 'Invalid payload',
    });
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 });
  }

  const key = webhookIdempotencyKey(envelope, raw);
  const result = recordWebhook(key, envelope.type);

  if (result.status === 'duplicate') {
    log.info('duplicate webhook ignored', { key, type: envelope.type });
    return NextResponse.json({ ok: true, status: 'duplicate', idempotencyKey: key });
  }

  // Real processing would: normalize → upsert contact/lead → enqueue New Lead
  // workflow. Kept as a log in the skeleton (demo mode never mutates prod).
  log.info('webhook accepted', { key, type: envelope.type, verified });
  recordOps({
    component: 'ghl',
    type: 'webhook',
    status: 'success',
    retryCount: 1,
    message: `Webhook accepted: ${envelope.type}${verified ? ' (verified)' : ''}`,
    correlationId: key,
  });

  return NextResponse.json({
    ok: true,
    status: 'processed',
    idempotencyKey: key,
    eventType: envelope.type,
    verified,
  });
}
