import { test, expect, type Page } from '@playwright/test';

/**
 * Advisor Conversion Scorecard funnel — full journey at desktop and mobile,
 * plus backup screenshots. Verifies the Definition of Done end to end.
 */
const SHOTS = '../../docs/scorecard/screenshots';
const shot = (page: Page, name: string) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });

async function answerAll(page: Page, perfect: boolean) {
  for (let i = 1; i <= 18; i++) {
    await expect(page.getByText(`Question ${i} of 18`)).toBeVisible();
    const radios = page.getByRole('radio');
    await (perfect ? radios.last() : radios.first()).click();
    await page.getByRole('button', { name: /Continue|See my results/ }).click();
  }
}

test.describe('Advisor Conversion Scorecard', () => {
  test('landing screen renders the offer and disclaimer', async ({ page }) => {
    await page.goto('/advisor-scorecard');
    await expect(
      page.getByRole('heading', { name: /How Much Opportunity Is Leaking/i }),
    ).toBeVisible();
    await expect(page.getByText(/does not evaluate investment performance/i).first()).toBeVisible();
    await shot(page, 'landing');
  });

  test('full desktop journey: 18 questions → contact → results (perfect = 100)', async ({ page }) => {
    await page.goto('/advisor-scorecard');
    await page.getByRole('button', { name: 'Get My Conversion Score' }).click();

    await expect(page.getByText('Question 1 of 18')).toBeVisible();
    await shot(page, 'assessment-q1');
    await answerAll(page, true);

    // Contact capture
    await expect(page.getByText(/Where should we send your results/i)).toBeVisible();
    await page.getByLabel('Full name *').fill('Jamie Rivera');
    await page.getByLabel('Work email *').fill('jamie@riverawealth.example');
    await page.getByLabel('Company / practice *').fill('Rivera Wealth');
    await shot(page, 'contact');
    await page.getByRole('button', { name: 'Reveal My Conversion Score' }).click();

    // Results
    await expect(page.getByText('Your Advisor Conversion Infrastructure Score')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Optimized Growth Engine')).toBeVisible();
    await expect(page.getByText('Your six sections')).toBeVisible();
    await expect(page.getByText('Your top 3 findings')).toBeVisible();
    await expect(page.getByText('Recommended first fix')).toBeVisible();
    await expect(page.getByText('Your 30-day priority plan')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Book My 15-Minute Advisor Growth Review' }),
    ).toBeVisible();
    // Demo mode wrote nothing.
    await expect(page.getByText(/no CRM records were written/i)).toBeVisible();
  });

  test('validation blocks submit without required fields', async ({ page }) => {
    await page.goto('/advisor-scorecard');
    await page.getByRole('button', { name: 'Get My Conversion Score' }).click();
    await answerAll(page, false);
    await page.getByRole('button', { name: 'Reveal My Conversion Score' }).click();
    await expect(page.getByText('Name is required.')).toBeVisible();
    await expect(page.getByText('A valid email is required.')).toBeVisible();
  });

  test('sample mode shows the deterministic Marcus result (57 / Conversion Gaps)', async ({ page }) => {
    await page.goto('/advisor-scorecard?sample=1');
    await expect(page.getByText('Conversion Gaps')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('57')).toBeVisible();
    await expect(page.getByText('Follow-Up & Nurture').first()).toBeVisible();
    await shot(page, 'results-sample');
  });

  test('progress persists across a refresh', async ({ page }) => {
    await page.goto('/advisor-scorecard');
    await page.getByRole('button', { name: 'Get My Conversion Score' }).click();
    // answer 3 questions
    for (let i = 0; i < 3; i++) {
      await page.getByRole('radio').first().click();
      await page.getByRole('button', { name: /Continue|See my results/ }).click();
    }
    await expect(page.getByText('Question 4 of 18')).toBeVisible();
    await page.reload();
    await expect(page.getByText('Question 4 of 18')).toBeVisible();
  });

  test('personalized proposal (sample) shows ROI, plan, and next step', async ({ page }) => {
    await page.goto('/advisor-scorecard/proposal?sample=1');
    await expect(page.getByRole('heading', { name: /Your Advisor Growth Plan/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('The opportunity', { exact: true })).toBeVisible();
    // Observed → Modeled → Verified tiers are all clearly distinguished.
    await expect(page.getByText('Observed').first()).toBeVisible();
    await expect(page.getByText('Modeled').first()).toBeVisible();
    await expect(page.getByText('Verified').first()).toBeVisible();
    await expect(page.getByText('Modeled annual upside')).toBeVisible();
    // Verified is honestly shown as pending for a prospect (not modeled-as-fact).
    await expect(page.getByText(/Populated during your pilot/i)).toBeVisible();
    await expect(page.getByText('Recommended plan')).toBeVisible();
    await expect(page.getByText('Pilot').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Book My 15-Minute Advisor Growth Review' })).toBeVisible();
    await shot(page, 'proposal-sample');
  });

  test('results → personalized plan handoff works', async ({ page }) => {
    await page.goto('/advisor-scorecard');
    await page.getByRole('button', { name: 'Get My Conversion Score' }).click();
    await answerAll(page, true);
    await page.getByLabel('Full name *').fill('Jamie Rivera');
    await page.getByLabel('Work email *').fill('jamie@riverawealth.example');
    await page.getByLabel('Company / practice *').fill('Rivera Wealth');
    await page.getByRole('button', { name: 'Reveal My Conversion Score' }).click();
    await expect(page.getByText('Your Advisor Conversion Infrastructure Score')).toBeVisible({ timeout: 15_000 });
    await page.getByRole('link', { name: /personalized growth plan/i }).click();
    await expect(page.getByRole('heading', { name: /Your Advisor Growth Plan/i })).toBeVisible();
  });

  test('booked confirmation records the discovery booking', async ({ page }) => {
    const [resp] = await Promise.all([
      page.waitForResponse('**/api/scorecard/booking-confirmed'),
      page.goto('/advisor-scorecard/booked?submissionId=e2e-booked-0001'),
    ]);
    expect(resp.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: /booked/i })).toBeVisible();
    await expect(page.getByText('Confirmation recorded.')).toBeVisible();
    await shot(page, 'booked');
  });

  test('mobile viewport journey', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/advisor-scorecard');
    await expect(page.getByRole('heading', { name: /How Much Opportunity Is Leaking/i })).toBeVisible();
    await shot(page, 'landing-mobile');
    await page.getByRole('button', { name: 'Get My Conversion Score' }).click();
    await expect(page.getByText('Question 1 of 18')).toBeVisible();
    await shot(page, 'assessment-mobile');
    await page.goto('/advisor-scorecard?sample=1');
    await expect(page.getByText('Conversion Gaps')).toBeVisible({ timeout: 15_000 });
    await shot(page, 'results-mobile');
  });
});
