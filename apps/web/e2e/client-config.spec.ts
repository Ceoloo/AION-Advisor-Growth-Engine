import { test, expect } from '@playwright/test';

/**
 * Client configuration layer. The app boots into the active ClientConfig (Ben by
 * default) and the governance page shows the full registered roster — proving
 * the product is client-agnostic: each advisor is a config on the same engine.
 */
test.describe('Client configuration layer', () => {
  test('app boots into the active client (Ben) branding', async ({ page }) => {
    await page.goto('/dashboard');
    // Org name in the top bar comes from the active ClientConfig, not a hardcode.
    await expect(page.getByText(/Ben Peretz/).first()).toBeVisible();
  });

  test('/client governance page lists the registered roster', async ({ page }) => {
    await page.goto('/client');
    await expect(page.getByRole('heading', { name: 'Client Configuration' })).toBeVisible();

    // Primary client + the second advisor both appear.
    await expect(page.getByRole('heading', { name: 'Ben Peretz' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Maria Santos' })).toBeVisible();

    // Ben is active + live-approved; Maria is onboarding.
    await expect(page.getByText('Active', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Onboarding', { exact: true }).first()).toBeVisible();

    await page.screenshot({ path: '../../docs/presentation/screenshots/client-config.png', fullPage: true });
  });

  test('GET /api/client is read-only and reports the roster', async ({ request }) => {
    const res = await request.get('/api/client');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.activeClientId).toBe('ben-peretz');
    expect(body.clients.length).toBeGreaterThanOrEqual(2);
    const ben = body.clients.find((c: { clientId: string }) => c.clientId === 'ben-peretz');
    const maria = body.clients.find((c: { clientId: string }) => c.clientId === 'maria-santos');
    expect(ben.liveApproved).toBe(true);
    expect(maria.liveApproved).toBe(false);
  });
});
