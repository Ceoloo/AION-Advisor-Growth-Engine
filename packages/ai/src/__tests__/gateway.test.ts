import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { AIGateway, extractJson } from '../gateway.js';
import { MockAIProvider } from '../providers/mock.js';
import { qualifyLead } from '../engines.js';

describe('AIGateway.generateStructured', () => {
  const gateway = new AIGateway(new MockAIProvider());

  it('returns validated data for a well-formed response', async () => {
    const result = await qualifyLead(gateway, { vertical: 'financial_advisor', answers: {} });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.qualificationStatus).toBeTruthy();
      expect(result.data.intentScore).toBeGreaterThanOrEqual(0);
    }
  });

  it('fails safe when the model output does not match the schema', async () => {
    // Provider returns a shape that will not satisfy this schema.
    const strict = z.object({ mustExist: z.string() });
    const result = await gateway.generateStructured(strict, {
      prompt: '[[TASK:qualification]] anything',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('schema_validation_failed');
  });

  it('fails safe when no JSON is present', async () => {
    const provider = {
      name: 'broken',
      model: 'x',
      async complete() {
        return {
          text: 'not json at all',
          usage: { provider: 'broken', model: 'x', inputTokens: 1, outputTokens: 1, costUsd: 0 },
        };
      },
    };
    const g = new AIGateway(provider);
    const result = await g.generateStructured(z.object({ a: z.string() }), { prompt: 'x' });
    expect(result.ok).toBe(false);
  });
});

describe('extractJson', () => {
  it('extracts a balanced object embedded in prose', () => {
    expect(extractJson('here you go: {"a":1} thanks')).toEqual({ a: 1 });
  });
  it('returns null when there is no json', () => {
    expect(extractJson('nope')).toBeNull();
  });
});
