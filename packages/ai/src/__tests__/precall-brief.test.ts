import { describe, expect, it } from 'vitest';
import type { QualificationResult } from '@aion/types';
import { generatePreCallBrief, renderPreCallBriefText, type PreCallBriefInput } from '../precall-brief.js';

const marcusQual: QualificationResult = {
  qualificationStatus: 'high_priority',
  intentScore: 82,
  urgencyScore: 88,
  productInterests: ['Income protection', 'Estate planning', 'Retirement income planning'],
  needsSummary: 'Wants to protect family income and leave a clean legacy; open to a structured review.',
  objections: ['Wants to understand fees clearly'],
  missingInformation: ['Existing coverage amounts'],
  recommendedNextAction: 'Call within the hour and confirm the Financial Protection Review appointment.',
  appointmentReady: true,
};

const marcus: PreCallBriefInput = {
  firstName: 'Marcus',
  lastName: 'Johnson',
  state: 'FL',
  vertical: 'financial_advisor',
  score: 86,
  scoreBand: 'high_priority',
  source: 'landing_page',
  entryPoint: 'Financial Protection Checkup',
  appointmentTitle: 'Financial Protection Review',
  qualification: marcusQual,
  answers: { financial_concerns: 'Protecting my family’s income and leaving a clean legacy' },
};

describe('generatePreCallBrief — the eight advisor questions', () => {
  const b = generatePreCallBrief(marcus);

  it('answers "who is this?"', () => {
    expect(b.who).toContain('Marcus Johnson');
    expect(b.who).toMatch(/financial-protection prospect/);
    expect(b.who).toContain('FL');
  });

  it('answers "why did they come?" from the entry point + their own words', () => {
    expect(b.whyTheyCame).toContain('Financial Protection Checkup');
    expect(b.whyTheyCame).toMatch(/family’s income/);
  });

  it('answers "what problem did they identify?" from the needs summary', () => {
    expect(b.problemIdentified).toBe(marcusQual.needsSummary);
  });

  it('carries the score and band', () => {
    expect(b.score).toBe(86);
    expect(b.scoreBand).toBe('high_priority');
  });

  it('names the primary concern (top interest)', () => {
    expect(b.primaryConcern).toBe('Income protection');
  });

  it('maps urgency from the urgency score (88 → high)', () => {
    expect(b.urgency.level).toBe('high');
    expect(b.urgency.score).toBe(88);
  });

  it('builds "what should I ask?" including missing info', () => {
    expect(b.questionsToAsk.some((q) => /existing coverage amounts/i.test(q))).toBe(true);
    expect(b.questionsToAsk.length).toBeGreaterThanOrEqual(3);
  });

  it('builds "what should I avoid assuming?" incl. the objection and a compliance guardrail', () => {
    expect(b.avoidAssuming.some((a) => /fees clearly/.test(a))).toBe(true);
    expect(b.avoidAssuming.some((a) => /financial, investment, tax, or insurance-product advice/i.test(a))).toBe(true);
  });

  it('always requires advisor review', () => {
    expect(b.requiresAdvisorReview).toBe(true);
  });

  it('renders a readable text block with all sections', () => {
    const text = renderPreCallBriefText(b);
    expect(text).toMatch(/Who is this\?/);
    expect(text).toMatch(/What should I avoid assuming\?/);
    expect(text).toMatch(/86 \/ 100/);
  });
});

describe('generatePreCallBrief — resilient with sparse data', () => {
  it('produces a usable brief with no qualification data', () => {
    const b = generatePreCallBrief({
      firstName: 'Jane',
      lastName: 'Doe',
      vertical: 'health_insurance',
      score: 40,
      scoreBand: 'nurture',
    });
    expect(b.who).toContain('Jane Doe');
    expect(b.problemIdentified).toMatch(/confirm their goal/i);
    expect(b.urgency.level).toBe('low');
    expect(b.questionsToAsk.length).toBeGreaterThan(0);
    // Compliance guardrail is always present.
    expect(b.avoidAssuming.some((a) => /suitability review/i.test(a))).toBe(true);
  });
});
