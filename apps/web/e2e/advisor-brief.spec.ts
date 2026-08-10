import { test, expect } from '@playwright/test';

/**
 * The pre-call Advisor Brief turns lead generation into lead PREPARATION: once a
 * lead is booked, the advisor gets a prep sheet answering the eight questions
 * they actually ask before a call.
 */
const MARCUS = 'org_ben-peretz_marcus';
const SECTIONS = [
  'Who is this?',
  'Why did they come?',
  'What problem did they identify?',
  'Score',
  'Primary concern',
  'Urgency',
  'What should I ask?',
  'What should I avoid assuming?',
];

test.describe('Pre-Call Advisor Brief', () => {
  test('lead detail shows the brief with all eight sections', async ({ page }) => {
    await page.goto(`/leads/${MARCUS}`);
    await expect(page.getByRole('heading', { name: 'Pre-Call Advisor Brief' })).toBeVisible();
    for (const s of SECTIONS) {
      await expect(page.getByText(s, { exact: true }).first()).toBeVisible();
    }
    // Built from Marcus's own answers.
    await expect(page.getByText(/Marcus Johnson/).first()).toBeVisible();
    await expect(page.getByText(/Financial Protection Checkup/).first()).toBeVisible();
    // The compliance guardrail is always present in "avoid assuming".
    await expect(page.getByText(/suitability review/i)).toBeVisible();
    await page.screenshot({ path: '../../docs/presentation/screenshots/pre-call-brief.png', fullPage: true });
  });

  test('appointments page links to each lead\'s pre-call brief', async ({ page }) => {
    await page.goto('/appointments');
    const briefLink = page.getByRole('link', { name: /Pre-Call Brief/i }).first();
    await expect(briefLink).toBeVisible();
    await briefLink.click();
    await expect(page.getByRole('heading', { name: 'Pre-Call Advisor Brief' })).toBeVisible();
  });

  test('GET /api/leads/:id/brief returns the eight-section brief', async ({ request }) => {
    const res = await request.get(`/api/leads/${MARCUS}/brief`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    const b = body.brief;
    expect(b.who).toContain('Marcus Johnson');
    expect(b.score).toBeGreaterThan(0);
    expect(b.urgency.level).toBe('high');
    expect(Array.isArray(b.questionsToAsk)).toBe(true);
    expect(b.questionsToAsk.length).toBeGreaterThan(0);
    expect(b.avoidAssuming.some((a: string) => /suitability review/i.test(a))).toBe(true);
    expect(b.requiresAdvisorReview).toBe(true);
  });

  test('returns 404 for an unknown lead', async ({ request }) => {
    const res = await request.get('/api/leads/nope/brief');
    expect(res.status()).toBe(404);
  });
});
