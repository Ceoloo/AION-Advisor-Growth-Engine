/**
 * Cross-cutting integration tests for the brief's critical scenarios (section
 * 21). These exercise multiple packages together, complementing the unit tests
 * that live inside each package.
 */
import { describe, expect, it } from 'vitest';
import { DemoStore } from '@aion/database/demo';
import { assertSameTenant, scopeToTenant } from '@aion/auth';
import { webhookIdempotencyKey, parseWebhook } from '@aion/ghl';
import {
  AIGateway,
  computeScore,
  extractSignals,
  templateForVertical,
} from '@aion/ai';
import { assertActionAllowed } from '@aion/compliance';
import { redact, REDACTED } from '@aion/shared';
import { WorkflowEngine, getWorkflow } from '@aion/workflows';
import { z } from 'zod';

describe('1. Tenant isolation — one org cannot access another org’s records', () => {
  const store = new DemoStore(42);
  const [a, b] = store.listOrganizations();

  it('store lookups are tenant-scoped', () => {
    const leadId = store.org(a!.id)!.leads[0]!.id;
    expect(store.getLead(b!.id, leadId)).toBeNull();
    expect(store.getLead(a!.id, leadId)!.organizationId).toBe(a!.id);
  });

  it('app-layer guards reject foreign records', () => {
    const foreign = store.org(b!.id)!.leads[0]!;
    expect(() => assertSameTenant({ organizationId: a!.id }, foreign)).toThrow();
    const merged = [...store.org(a!.id)!.leads, foreign];
    expect(scopeToTenant({ organizationId: a!.id }, merged)).not.toContain(foreign);
  });
});

describe('2. Duplicate webhook events are processed only once', () => {
  it('the same delivery dedupes on its idempotency key', () => {
    const raw = JSON.stringify({ type: 'ContactCreate', webhookId: 'wh_1' });
    const env = parseWebhook(raw);
    const key = webhookIdempotencyKey(env, raw);
    const processed = new Set<string>();
    const first = processed.has(key);
    processed.add(key);
    const second = processed.has(key);
    expect(first).toBe(false);
    expect(second).toBe(true);
    // A repeat delivery yields the identical key.
    expect(webhookIdempotencyKey(parseWebhook(raw), raw)).toBe(key);
  });
});

describe('3. Failed workflow steps retry safely', () => {
  it('retries up to maxAttempts then fails without throwing', async () => {
    let calls = 0;
    const engine = new WorkflowEngine().register('flaky', async () => {
      calls++;
      throw new Error('transient');
    });
    const result = await engine.run(
      {
        key: 'k',
        name: 'n',
        description: '',
        trigger: 'lead.created',
        steps: [{ id: 's', action: 'flaky', label: 'S', retry: { maxAttempts: 3, backoffMs: 0 } }],
      },
      { organizationId: 'o', correlationId: 'c', data: {}, demoMode: true },
    );
    expect(calls).toBe(3);
    expect(result.status).toBe('failed');
  });

  it('ships the documented New Lead workflow', () => {
    expect(getWorkflow('new_lead')?.steps.length).toBe(9);
  });
});

describe('4. Lead scoring is deterministic from configured rules', () => {
  it('same answers → same score', () => {
    const answers = { appointment_urgency: 'ASAP', investable_assets: '$1M-$4.9M', estate_planning_needs: true };
    const template = templateForVertical('financial_advisor');
    const s1 = computeScore(extractSignals('financial_advisor', answers, template.questions.length));
    const s2 = computeScore(extractSignals('financial_advisor', answers, template.questions.length));
    expect(s1.total).toBe(s2.total);
    expect(s1.band).toBe(s2.band);
  });
});

describe('5. AI responses fail safely when schema validation fails', () => {
  it('returns ok:false instead of malformed data', async () => {
    const provider = {
      name: 'bad',
      model: 'x',
      async complete() {
        return { text: '{"unexpected":true}', usage: { provider: 'bad', model: 'x', inputTokens: 1, outputTokens: 1, costUsd: 0 } };
      },
    };
    const gateway = new AIGateway(provider);
    const result = await gateway.generateStructured(z.object({ required: z.string() }), { prompt: 'x' });
    expect(result.ok).toBe(false);
  });
});

describe('6. Sensitive information is not exposed in logs', () => {
  it('redacts PII / secrets / health fields deeply', () => {
    const out = redact({
      firstName: 'Ok',
      email: 'a@b.com',
      apiKey: 'sk-1',
      nested: { ssn: '111', prescription: 'x' },
    });
    expect(out.firstName).toBe('Ok');
    expect(out.email).toBe(REDACTED);
    expect(out.apiKey).toBe(REDACTED);
    expect(out.nested.ssn).toBe(REDACTED);
    expect(out.nested.prescription).toBe(REDACTED);
  });
});

describe('7. Demo mode blocks destructive operations', () => {
  it('blocks outbound/irreversible actions in demo mode', () => {
    expect(() => assertActionAllowed('send_sms', true)).toThrow();
    expect(() => assertActionAllowed('submit_application', true)).toThrow();
    expect(() => assertActionAllowed('view_lead', true)).not.toThrow();
  });
});
