import { describe, expect, it } from 'vitest';
import {
  AI_CAPABILITIES,
  CAPABILITY_ENGINE,
  RULE_BASED_CAPABILITIES,
  engineFor,
  isRuleBased,
} from '../decision-boundary.js';

describe('decision boundary manifest', () => {
  it('keeps the correctness-critical capabilities rule-based', () => {
    for (const c of [
      'scoring',
      'qualification',
      'routing',
      'compliance',
      'consent',
      'lifecycle_state',
      'kpi_calculations',
    ] as const) {
      expect(engineFor(c)).toBe('rules');
      expect(isRuleBased(c)).toBe(true);
    }
  });

  it('reserves AI for the language capabilities', () => {
    for (const c of [
      'summarization',
      'personalization',
      'advisor_briefs',
      'recommendations',
      'content_variations',
      'sales_call_preparation',
      'pattern_detection',
    ] as const) {
      expect(engineFor(c)).toBe('ai');
    }
  });

  it('partitions every capability into exactly one engine', () => {
    const all = Object.keys(CAPABILITY_ENGINE);
    expect(RULE_BASED_CAPABILITIES.length + AI_CAPABILITIES.length).toBe(all.length);
    expect(new Set([...RULE_BASED_CAPABILITIES, ...AI_CAPABILITIES]).size).toBe(all.length);
  });

  it('every policy carries a rationale', () => {
    for (const p of Object.values(CAPABILITY_ENGINE)) {
      expect(p.rationale.length).toBeGreaterThan(10);
    }
  });
});
