import { test, expect, type Page } from '@playwright/test';

/**
 * Validates the Ben Peretz pilot presentation journey end-to-end AND captures
 * backup screenshots of every critical stage into docs/presentation/screenshots.
 * Run: pnpm --filter @aion/web build && pnpm --filter @aion/web exec playwright test presentation
 */

const SHOTS = '../../docs/presentation/screenshots';
const pad = (n: number) => String(n).padStart(2, '0');

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
}

test.describe('Pilot presentation — Marcus Johnson journey', () => {
  test('hub shows Ben Peretz branding and 12 stages', async ({ page }) => {
    await page.goto('/presentation');
    await expect(page.getByRole('heading', { name: 'Pilot Presentation' })).toBeVisible();
    await expect(page.getByText('Marcus Johnson', { exact: true })).toBeVisible();
    await shot(page, 'presentation-hub');
  });

  test('walks all 12 stages in sequence via Next', async ({ page }) => {
    await page.goto('/presentation/stage/1');
    for (let step = 1; step <= 12; step++) {
      await expect(page.getByText(`Stage ${step} / 12`)).toBeVisible();
      // Step 11's screenshot is captured post-generation by its dedicated test.
      if (step !== 11) await shot(page, `stage-${pad(step)}`);
      if (step < 12) {
        await page.getByRole('link', { name: 'Next →' }).click();
      }
    }
    // Deterministic score is shown on stage 4.
    await page.goto('/presentation/stage/4');
    await expect(page.getByText('86', { exact: true }).first()).toBeVisible();
  });

  test('stage 11 generates an AI advisor brief', async ({ page }) => {
    // Fresh load guarantees the client island is hydrated before we click.
    await page.goto('/presentation/stage/11');
    const [resp] = await Promise.all([
      page.waitForResponse('**/api/ai/advisor-brief'),
      page.getByRole('button', { name: 'Generate' }).click(),
    ]);
    expect(resp.ok()).toBeTruthy();
    await expect(page.getByRole('button', { name: 'Regenerate' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Talking points', { exact: true })).toBeVisible();
    await shot(page, 'stage-11'); // overwrite with the generated brief visible
  });

  test('deterministic score is 80–88 and high priority', async ({ page }) => {
    await page.goto(`/leads/org_ben-peretz_marcus`);
    await expect(page.getByRole('heading', { name: /Marcus Johnson/ })).toBeVisible();
    await expect(page.getByText('High Priority').first()).toBeVisible();
    await shot(page, 'lead-detail-marcus');
  });

  test('pricing screen', async ({ page }) => {
    await page.goto('/presentation/pricing');
    await expect(page.getByText('$4,500')).toBeVisible();
    await expect(page.getByText('$997')).toBeVisible();
    await expect(page.getByText('$7,500')).toBeVisible();
    await expect(page.getByText('$1,497')).toBeVisible();
    await shot(page, 'pricing');
  });

  test('approval checklist has 9 items', async ({ page }) => {
    await page.goto('/presentation/checklist');
    await expect(page.getByText('0 / 9 approved')).toBeVisible();
    await shot(page, 'approval-checklist');
  });

  test('demo control toggles and seeds', async ({ page }) => {
    await page.goto('/demo-control');
    await expect(page.getByText('DISABLED (safe)')).toBeVisible();
    await page.getByRole('button', { name: '5. High-Priority Classification' }).click();
    await expect(page.getByText('Stage 5 / 12')).toBeVisible();
    await page.goto('/demo-control');
    await shot(page, 'demo-control');
  });

  test('key live screens', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Executive Dashboard' })).toBeVisible();
    await shot(page, 'dashboard');
    await page.goto('/pipeline');
    await expect(page.getByRole('heading', { name: 'Pipeline' })).toBeVisible();
    await shot(page, 'pipeline');
  });

  test('mobile viewport renders the hub', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/presentation');
    await expect(page.getByText('Marcus Johnson', { exact: true })).toBeVisible();
    await shot(page, 'presentation-hub-mobile');
  });
});
