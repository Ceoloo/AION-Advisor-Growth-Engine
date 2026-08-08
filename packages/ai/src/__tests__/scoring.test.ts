import { describe, expect, it } from 'vitest';
import { computeScore, bandForScore, DEFAULT_WEIGHTS } from '../scoring.js';

describe('computeScore', () => {
  const signals = {
    intent: 80,
    urgency: 70,
    fit: 60,
    engagement: 50,
    completeness: 90,
    appointment_readiness: 85,
    financial_potential: 75,
    product_eligibility: 80,
    response_activity: 40,
    referral_quality: 50,
  };

  it('is deterministic for identical inputs', () => {
    const a = computeScore(signals);
    const b = computeScore(signals);
    expect(a).toEqual(b);
  });

  it('produces a total within 0..100', () => {
    const { total } = computeScore(signals);
    expect(total).toBeGreaterThanOrEqual(0);
    expect(total).toBeLessThanOrEqual(100);
  });

  it('clamps out-of-range and missing signals', () => {
    const { total, breakdown } = computeScore({ intent: 999, urgency: -50 });
    expect(breakdown.intent).toBe(100);
    expect(breakdown.urgency).toBe(0);
    expect(total).toBeGreaterThanOrEqual(0);
    expect(total).toBeLessThanOrEqual(100);
  });

  it('normalizes partial weight maps without breaking range', () => {
    const { total } = computeScore(signals, { intent: 1 });
    expect(total).toBeGreaterThanOrEqual(0);
    expect(total).toBeLessThanOrEqual(100);
  });

  it('maps totals to the correct band', () => {
    expect(bandForScore(10)).toBe('low_priority');
    expect(bandForScore(40)).toBe('nurture');
    expect(bandForScore(60)).toBe('qualified');
    expect(bandForScore(80)).toBe('high_priority');
    expect(bandForScore(95)).toBe('immediate_follow_up');
  });

  it('default weights sum to ~1', () => {
    const sum = Object.values(DEFAULT_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });
});
