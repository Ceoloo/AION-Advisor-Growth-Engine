/**
 * AION API service entrypoint. Mounts the core endpoints from the brief,
 * reusing the same domain packages as the web app. Run with `pnpm --filter
 * @aion/api dev`.
 */
import { z } from 'zod';
import { AIGateway, computeScore, createProvider, extractSignals, qualifyLead, templateForVertical } from '@aion/ai';
import { parseWebhook, verifyWebhookSignature, webhookIdempotencyKey } from '@aion/ghl';
import { listAdapters } from '@aion/integrations';
import { loadEnv } from '@aion/shared';
import { ApiServer } from './server.js';

const env = loadEnv();
const gateway = new AIGateway(
  createProvider({
    provider: env.AI_PROVIDER,
    model: env.AI_MODEL,
    openaiApiKey: env.OPENAI_API_KEY,
    anthropicApiKey: env.ANTHROPIC_API_KEY,
  }),
);

// In-memory idempotency guard (mirrors the DB UNIQUE constraint in production).
const processedWebhooks = new Set<string>();

const QualifySchema = z.object({
  vertical: z.enum(['financial_advisor', 'health_insurance']),
  answers: z.record(z.unknown()),
});

const server = new ApiServer();

server
  .route('GET', '/health', async () => ({
    status: 200,
    body: {
      ok: true,
      service: 'api',
      demoMode: env.DEMO_MODE,
      aiProvider: env.AI_PROVIDER,
      integrations: await Promise.all(listAdapters().map((a) => a.healthCheck())),
    },
  }))

  .route('POST', '/leads/score', (ctx) => {
    const parsed = QualifySchema.safeParse(ctx.json());
    if (!parsed.success) return { status: 422, body: { ok: false, error: 'invalid_request' } };
    const { vertical, answers } = parsed.data;
    const template = templateForVertical(vertical);
    const signals = extractSignals(vertical, answers, template.questions.length);
    const score = computeScore(signals);
    return { status: 200, body: { ok: true, score } };
  })

  .route('POST', '/ai/qualify', async (ctx) => {
    const parsed = QualifySchema.safeParse(ctx.json());
    if (!parsed.success) return { status: 422, body: { ok: false, error: 'invalid_request' } };
    const result = await qualifyLead(gateway, parsed.data);
    return result.ok
      ? { status: 200, body: { ok: true, data: result.data } }
      : { status: 502, body: { ok: false, error: result.error } };
  })

  .route('POST', '/webhooks/ghl', (ctx) => {
    const sig = (ctx.headers['x-ghl-signature'] as string) ?? null;
    if (env.GHL_WEBHOOK_SECRET && !verifyWebhookSignature(ctx.rawBody, sig, env.GHL_WEBHOOK_SECRET)) {
      return { status: 401, body: { ok: false, error: 'invalid_signature' } };
    }
    let envelope;
    try {
      envelope = parseWebhook(ctx.rawBody);
    } catch {
      return { status: 400, body: { ok: false, error: 'invalid_payload' } };
    }
    const key = webhookIdempotencyKey(envelope, ctx.rawBody);
    if (processedWebhooks.has(key)) {
      return { status: 200, body: { ok: true, status: 'duplicate', idempotencyKey: key } };
    }
    processedWebhooks.add(key);
    return { status: 200, body: { ok: true, status: 'processed', idempotencyKey: key } };
  });

const port = Number(process.env.API_PORT ?? 3001);
server.listen(port);
