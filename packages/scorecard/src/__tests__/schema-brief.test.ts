import { describe, expect, it } from 'vitest';
import { SubmissionSchema, ContactSchema, AnswersSchema } from '../types.js';
import { computeScorecard } from '../scoring.js';
import { generateAdvisorBrief, renderAdvisorBriefText } from '../brief.js';
import { DEMO_SUBMISSION, DEMO_ANSWERS, DEMO_CONTACT } from '../demo.js';
import { intentPointsFor, EVENT_TO_INTENT } from '../intent.js';

describe('validation schemas', () => {
  it('accepts a complete valid submission', () => {
    expect(SubmissionSchema.safeParse(DEMO_SUBMISSION).success).toBe(true);
  });

  it('rejects answers missing a question', () => {
    const partial = { ...DEMO_ANSWERS };
    delete (partial as Record<string, number>).q5;
    expect(AnswersSchema.safeParse(partial).success).toBe(false);
  });

  it('rejects an out-of-range answer index', () => {
    expect(AnswersSchema.safeParse({ ...DEMO_ANSWERS, q1: 99 }).success).toBe(false);
  });

  it('requires name, email, and company', () => {
    expect(ContactSchema.safeParse({ fullName: '', email: 'x', company: '' }).success).toBe(false);
    expect(ContactSchema.safeParse({ fullName: 'A', email: 'not-an-email', company: 'C' }).success).toBe(
      false,
    );
  });

  it('defaults consent to false (opt-in, not pre-checked)', () => {
    const parsed = ContactSchema.parse({ fullName: 'A', email: 'a@b.com', company: 'C' });
    expect(parsed.consentToFollowUp).toBe(false);
  });
});

describe('advisor brief', () => {
  it('builds a structured, deterministic brief', () => {
    const result = computeScorecard(DEMO_ANSWERS);
    const brief = generateAdvisorBrief(DEMO_CONTACT, result, DEMO_SUBMISSION.attribution);
    expect(brief.advisor).toBe('Marcus Johnson');
    expect(brief.firm).toBe('Johnson Wealth Planning');
    expect(brief.score).toBe(57);
    expect(brief.primaryLeak).toBe('Follow-Up & Nurture');
    expect(brief.topFindings).toHaveLength(3);
    expect(brief.consentStatus).toBe('No marketing consent');
    expect(renderAdvisorBriefText(brief)).toContain('Score: 57 / 100');
  });
});

describe('intent config', () => {
  it('maps completion and booking to intent points', () => {
    expect(intentPointsFor('Scorecard Completed')).toBeGreaterThan(0);
    expect(EVENT_TO_INTENT.advisor_scorecard_completed).toBe('Scorecard Completed');
    expect(EVENT_TO_INTENT.advisor_scorecard_booking_clicked).toBe('Booking Page Viewed');
  });
});
