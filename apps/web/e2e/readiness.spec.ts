import { test, expect, type Page } from '@playwright/test';

/**
 * Pre-call readiness: confirm the demo controls, verify no broken/slow screens,
 * and rehearse the full five-minute flow three times with timings. Console
 * errors on any page fail the run.
 */

// Every internal route the presenter can reach during the call.
const ROUTES = [
  '/presentation',
  '/presentation/pricing',
  '/presentation/checklist',
  '/demo-control',
  '/dashboard',
  '/analytics',
  '/leads',
  '/leads/org_ben-peretz_marcus',
  '/pipeline',
  '/appointments',
  '/clients',
  '/conversations',
  '/campaigns',
  '/workflows',
  '/referrals',
  '/applications',
  '/documents',
  '/compliance',
  '/integrations',
  '/team',
  '/settings',
  '/qualify?vertical=financial_advisor',
  '/qualify?vertical=health_insurance',
  ...Array.from({ length: 12 }, (_, i) => `/presentation/stage/${i + 1}`),
];

const SLOW_MS = 3000;

test.describe('Pre-call readiness', () => {
  test('demo-control restore works and external sending is disabled', async ({ page }) => {
    await page.goto('/demo-control');
    // Seed to a mid stage, then restore.
    await page.getByRole('button', { name: '6. Personalized Education' }).click();
    await expect(page.getByText('Stage 6 / 12')).toBeVisible();
    await page.getByRole('button', { name: '⟳ Restore demo state' }).click();
    await expect(page.getByText('Not started')).toBeVisible();
    // External sending must read DISABLED (safe).
    await expect(page.getByText('DISABLED (safe)')).toBeVisible();

    // Confirm at the API level too.
    const res = await page.request.get('/api/demo-control');
    const json = await res.json();
    expect(json.state.externalSendingEnabled).toBe(false);
    expect(json.demoMode).toBe(true);
  });

  test('pricing and approval checklist load with the right content', async ({ page }) => {
    await page.goto('/presentation/pricing');
    for (const money of ['$4,500', '$997', '$7,500', '$1,497']) {
      await expect(page.getByText(money).first()).toBeVisible();
    }
    await expect(page.getByText('Closing question')).toBeVisible();

    await page.goto('/presentation/checklist');
    await expect(page.getByText('0 / 9 approved')).toBeVisible();
    for (const label of ['Branding', 'Licensing', 'Compliance', 'CRM', 'Calendar', 'Launch Approval']) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
  });

  test('no broken links or slow screens across every route', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });

    const timings: { route: string; ms: number; status: number }[] = [];
    for (const route of ROUTES) {
      const start = Date.now();
      const resp = await page.goto(route, { waitUntil: 'domcontentloaded' });
      const ms = Date.now() - start;
      const status = resp?.status() ?? 0;
      timings.push({ route, ms, status });
      expect(status, `status for ${route}`).toBeLessThan(400);
      // The 404 page renders with a soft status; assert it's not the not-found copy.
      await expect(page.getByText("This record doesn't exist"), `not-found on ${route}`).toHaveCount(0);
    }

    // Report timings sorted slowest-first.
    timings.sort((a, b) => b.ms - a.ms);
    console.log('\n=== Route load times (slowest first) ===');
    for (const t of timings) console.log(`  ${t.ms.toString().padStart(5)}ms  [${t.status}]  ${t.route}`);

    const slow = timings.filter((t) => t.ms > SLOW_MS);
    expect(slow, `slow screens (> ${SLOW_MS}ms): ${slow.map((s) => s.route).join(', ')}`).toEqual([]);
    expect(errors, `console errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('rehearse the full flow three times, each under five minutes', async ({ page }) => {
    const FIVE_MIN = 5 * 60 * 1000;
    const runs: number[] = [];

    for (let run = 1; run <= 3; run++) {
      const start = Date.now();
      await runPresentation(page);
      const elapsed = Date.now() - start;
      runs.push(elapsed);
      console.log(`Rehearsal ${run}: ${(elapsed / 1000).toFixed(1)}s`);
      expect(elapsed, `run ${run} under 5 min`).toBeLessThan(FIVE_MIN);
    }
    const avg = runs.reduce((a, b) => a + b, 0) / runs.length;
    console.log(`\nAverage automated run: ${(avg / 1000).toFixed(1)}s (navigation only; live narration adds time)`);
  });
});

/** One full presentation pass: hub → 12 stages → pricing → checklist → close. */
async function runPresentation(page: Page) {
  await page.goto('/presentation');
  await expect(page.getByText('Marcus Johnson', { exact: true })).toBeVisible();

  await page.goto('/presentation/stage/1');
  for (let step = 1; step <= 12; step++) {
    await expect(page.getByText(`Stage ${step} / 12`)).toBeVisible();
    if (step === 11) {
      await page.getByRole('button', { name: 'Generate' }).click();
      await expect(page.getByRole('button', { name: 'Regenerate' })).toBeVisible({ timeout: 15_000 });
    }
    if (step < 12) await page.getByRole('link', { name: 'Next →' }).click();
  }
  // Clean transition into pricing, then the close.
  await page.getByRole('link', { name: 'Review pilot pricing →' }).click();
  await expect(page.getByText('Closing question')).toBeVisible();
  await page.goto('/presentation/checklist');
  await expect(page.getByText('0 / 9 approved')).toBeVisible();
}
