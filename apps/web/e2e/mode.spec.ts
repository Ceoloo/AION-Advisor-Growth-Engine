import { test, expect } from '@playwright/test';

/**
 * Runtime-mode governance surface. In the demo build the effective mode is
 * demo, the banner and badge reflect it, and the /mode page shows the gated
 * activation checklist with pending pilot/production gates.
 */
test.describe('Runtime mode governance', () => {
  test('mode badge and demo banner show the demo mode', async ({ page }) => {
    await page.goto('/dashboard');
    // Top-bar badge links to the governance page.
    await expect(page.getByRole('link', { name: /Demo/ }).first()).toBeVisible();
    // Mode banner names demo mode.
    await expect(page.getByText(/Demo mode/i).first()).toBeVisible();
  });

  test('/mode page renders the gated promotion path and checklists', async ({ page }) => {
    await page.goto('/mode');
    await expect(page.getByRole('heading', { name: 'Runtime Mode' })).toBeVisible();

    // Effective mode is demo.
    await expect(page.getByText('Effective mode')).toBeVisible();

    // The three-step promotion path is shown.
    await expect(page.getByText('Step 1')).toBeVisible();
    await expect(page.getByText('Step 3')).toBeVisible();

    // Both gate checklists are present.
    await expect(page.getByRole('heading', { name: 'Pilot activation gates' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Production activation gates' })).toBeVisible();

    // A specific pilot gate is listed as pending.
    await expect(page.getByText(/Pilot activation confirmed/)).toBeVisible();

    await page.screenshot({ path: '../../docs/presentation/screenshots/mode-governance.png', fullPage: true });
  });

  test('GET /api/mode is read-only and reports demo as effective', async ({ request }) => {
    const res = await request.get('/api/mode');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.effectiveMode).toBe('demo');
    expect(body.pilotReady).toBe(false);
    expect(body.productionReady).toBe(false);
    expect(Array.isArray(body.pilotChecks)).toBe(true);
    expect(body.capabilities.allowProductionCrmWrites).toBe(false);
  });
});
