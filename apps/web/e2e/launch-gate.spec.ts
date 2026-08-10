import { test, expect } from '@playwright/test';

/**
 * Compliance as a real launch gate. Live campaigns are blocked in application
 * logic — server-side, not a UI toggle — until every critical approval is
 * complete AND the runtime mode permits live campaigns.
 */
test.describe('Launch gate', () => {
  test('launch readiness page shows the checklist and live-campaign status', async ({ page }) => {
    await page.goto('/launch');
    await expect(page.getByRole('heading', { name: 'Launch Readiness' })).toBeVisible();

    // Ben has every critical approval → Launch Eligible.
    await expect(page.getByText('Launch Eligible')).toBeVisible();

    // But demo mode does not permit live campaigns → BLOCKED (Gate 2).
    await expect(page.getByText('BLOCKED').first()).toBeVisible();
    await expect(page.getByText(/does not permit live campaigns/i)).toBeVisible();

    // The critical approval items are listed.
    for (const label of ['Branding approved', 'Licensing verified', 'Disclosure approved', 'CRM approved']) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }

    await page.screenshot({ path: '../../docs/presentation/screenshots/launch-readiness.png', fullPage: true });
  });

  test('attempting to launch a live campaign is refused by the server', async ({ page }) => {
    await page.goto('/launch');
    await page.getByRole('button', { name: /Attempt to launch a live campaign/i }).click();
    await expect(page.getByText(/Live campaign blocked by the server/i)).toBeVisible();
  });

  test('POST /api/campaigns/launch returns 403 blocked in demo mode', async ({ request }) => {
    const res = await request.post('/api/campaigns/launch');
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe('live_campaign_blocked');
    expect(body.reasons.join(' ')).toMatch(/live campaigns/i);
  });

  test('GET /api/launch reports eligibility and per-item approvals', async ({ request }) => {
    const res = await request.get('/api/launch');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    // Ben: all 8 critical approvals complete → eligible, but live still blocked (demo).
    expect(body.launchEligible).toBe(true);
    expect(body.liveCampaignsAllowed).toBe(false);
    expect(body.approvedCritical).toBe(body.totalCritical);
    expect(body.approvals).toHaveLength(8);
  });

  test('campaigns page shows the blocked launch control', async ({ page }) => {
    await page.goto('/campaigns');
    await expect(page.getByRole('link', { name: /Live campaigns blocked/i })).toBeVisible();
  });
});
