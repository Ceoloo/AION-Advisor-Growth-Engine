import { describe, expect, it } from 'vitest';
import { QUESTIONS } from '../questions.js';
import { SECTIONS, SECTION_ORDER } from '../sections.js';
import { computeScorecard, maxTotalPoints } from '../scoring.js';
import { bandForScore, BANDS } from '../bands.js';
import { DEMO_ANSWERS } from '../demo.js';
import type { Answers } from '../types.js';

const perfect = (): Answers =>
  Object.fromEntries(QUESTIONS.map((q) => [q.id, q.options.length - 1])) as Answers;
const zero = (): Answers => Object.fromEntries(QUESTIONS.map((q) => [q.id, 0])) as Answers;

describe('question bank integrity', () => {
  it('has 18 questions', () => {
    expect(QUESTIONS).toHaveLength(18);
  });

  it('all question max scores total exactly 100', () => {
    expect(maxTotalPoints()).toBe(100);
  });

  it('section totals equal 15 / 15 / 20 / 20 / 15 / 15', () => {
    const byOrder = SECTION_ORDER.map((sid) =>
      QUESTIONS.filter((q) => q.section === sid).reduce((s, q) => s + q.maxPoints, 0),
    );
    expect(byOrder).toEqual([15, 15, 20, 20, 15, 15]);
    // config maxPoints must match the question bank
    for (const sid of SECTION_ORDER) {
      const sum = QUESTIONS.filter((q) => q.section === sid).reduce((s, q) => s + q.maxPoints, 0);
      expect(SECTIONS[sid].maxPoints).toBe(sum);
    }
  });

  it('each question maxPoints equals its highest option', () => {
    for (const q of QUESTIONS) {
      expect(q.maxPoints).toBe(Math.max(...q.options.map((o) => o.points)));
    }
  });
});

describe('scoring extremes', () => {
  it('a perfect assessment scores 100', () => {
    expect(computeScorecard(perfect()).total).toBe(100);
  });
  it('a zero assessment scores 0', () => {
    expect(computeScorecard(zero()).total).toBe(0);
  });
});

describe('score bands at boundaries', () => {
  const cases: [number, string][] = [
    [29, 'critical'],
    [30, 'high_leakage'],
    [49, 'high_leakage'],
    [50, 'conversion_gaps'],
    [69, 'conversion_gaps'],
    [70, 'strong_foundation'],
    [84, 'strong_foundation'],
    [85, 'optimized'],
  ];
  it.each(cases)('score %i → %s', (score, key) => {
    expect(bandForScore(score).key).toBe(key);
  });
  it('bands are contiguous and cover 0..100', () => {
    expect(BANDS[0]!.min).toBe(0);
    expect(BANDS[BANDS.length - 1]!.max).toBe(100);
    for (let i = 1; i < BANDS.length; i++) {
      expect(BANDS[i]!.min).toBe(BANDS[i - 1]!.max + 1);
    }
  });
});

describe('weakest normalized section', () => {
  it('picks the lowest section by percentage, not raw points', () => {
    // Acquisition full (15/15), everything else moderate, Booking lowest by %.
    const a = zero();
    // give qualification 14/20 (0.7), booking 3/15 (0.2) → booking is weakest by %
    a.q1 = 3; a.q2 = 3; a.q3 = 3; // acquisition 15/15
    a.q7 = 3; a.q8 = 3; a.q9 = 3; // qualification 20/20
    a.q13 = 1; a.q14 = 0; a.q15 = 0; // booking 2/15 ≈ 0.13
    a.q16 = 3; a.q17 = 3; a.q18 = 3; // crm 15/15
    a.q4 = 3; a.q5 = 3; a.q6 = 3; // speed 15/15
    a.q10 = 3; a.q11 = 3; a.q12 = 3; // follow 20/20
    const r = computeScorecard(a);
    expect(r.primaryLeak.key).toBe('booking');
    expect(r.leakSection).toBe('booking');
  });

  it('demo submission scores 57 with Follow-Up as the clear leak', () => {
    const r = computeScorecard(DEMO_ANSWERS);
    expect(r.total).toBe(57);
    expect(r.bandKey).toBe('conversion_gaps');
    expect(r.primaryLeak.key).toBe('follow_up');
    expect(r.findings).toHaveLength(3);
    expect(r.recommendedFirstFix).toBe(SECTIONS.follow_up.firstFix);
    expect(r.plan30Day).toEqual([...SECTIONS.follow_up.plan30Day]);
  });
});

describe('systemic / tie handling', () => {
  it('collapses to Multiple / Systemic when the two lowest sections are tied', () => {
    // Make acquisition and speed both 0% and everything else strong.
    const a = zero();
    a.q7 = 3; a.q8 = 3; a.q9 = 3; // qualification 20/20
    a.q10 = 3; a.q11 = 3; a.q12 = 3; // follow 20/20
    a.q13 = 3; a.q14 = 3; a.q15 = 3; // booking 15/15
    a.q16 = 3; a.q17 = 3; a.q18 = 3; // crm 15/15
    // acquisition (q1-3) and speed (q4-6) left at 0 → both 0% → tie
    const r = computeScorecard(a);
    expect(r.primaryLeak.key).toBe('multiple_systemic');
    expect(r.primaryLeak.label).toBe('Multiple / Systemic');
    // still exposes a concrete section to drive the first fix
    expect(SECTION_ORDER).toContain(r.leakSection);
    expect(r.recommendedFirstFix).toMatch(/several places at once/i);
  });

  it('a single clear lowest section is NOT systemic', () => {
    const r = computeScorecard(DEMO_ANSWERS);
    expect(r.primaryLeak.key).not.toBe('multiple_systemic');
  });
});

describe('recommendations & strengths mapping', () => {
  it('first fix maps to the primary leak section', () => {
    const a = zero();
    // Everything strong except CRM → CRM is the leak.
    for (const q of QUESTIONS) a[q.id] = q.options.length - 1;
    a.q16 = 0; a.q17 = 0; a.q18 = 0;
    const r = computeScorecard(a);
    expect(r.primaryLeak.key).toBe('crm');
    expect(r.recommendedFirstFix).toBe(SECTIONS.crm.firstFix);
  });

  it('strengths only include genuinely strong sections (pct >= 0.6)', () => {
    const r = computeScorecard(zero());
    expect(r.strengths).toHaveLength(0); // nothing is strong at all-zero
    const p = computeScorecard(
      Object.fromEntries(QUESTIONS.map((q) => [q.id, q.options.length - 1])) as Answers,
    );
    expect(p.strengths.length).toBeGreaterThan(0);
  });

  it('findings are ordered by largest normalized gap first', () => {
    const r = computeScorecard(DEMO_ANSWERS);
    // q12 has a 100% gap (0/7) and must be the first finding
    expect(r.findings[0]!.questionId).toBe('q12');
  });
});
