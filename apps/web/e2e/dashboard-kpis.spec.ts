import { test, expect } from '@playwright/test';

/**
 * The KPI layer: the full revenue funnel, headline conversion rates, and the
 * Baseline-vs-Pilot comparison that becomes the testimonial.
 */
test.describe('Dashboard KPI layer', () => {
  test('renders the funnel, conversion rates, and baseline vs pilot', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Executive Dashboard' })).toBeVisible();

    // Headline conversion rates.
    await expect(page.getByText('Lead → Qualified').first()).toBeVisible();
    await expect(page.getByText('Booked → Show').first()).toBeVisible();

    // Full funnel with all nine stages.
    await expect(page.getByRole('heading', { name: 'Revenue Funnel' })).toBeVisible();
    for (const stage of ['Traffic', 'Qualified', 'Showed', 'Consultations', 'Verified Revenue']) {
      await expect(page.getByText(stage, { exact: true }).first()).toBeVisible();
    }

    // Baseline vs Pilot — the testimonial-maker.
    await expect(page.getByRole('heading', { name: 'Baseline vs Pilot' })).toBeVisible();
    await expect(page.getByText('Before AION').first()).toBeVisible();
    await expect(page.getByText('After AION').first()).toBeVisible();

    // Source + campaign conversion.
    await expect(page.getByRole('heading', { name: 'Source Conversion' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Campaign Conversion' })).toBeVisible();

    await page.screenshot({ path: '../../docs/presentation/screenshots/dashboard-kpis.png', fullPage: true });
  });

  test('GET /api/metrics returns the funnel + baseline comparison', async ({ request }) => {
    const res = await request.get('/api/metrics');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.funnel).toHaveLength(9);
    expect(body.funnel[0].key).toBe('traffic');
    expect(body.conversions.leadToQualified).toBeGreaterThan(0);
    // Baseline comparison present with per-stage lift.
    expect(body.comparison).not.toBeNull();
    const leads = body.comparison.stages.find((s: { key: string }) => s.key === 'leads');
    expect(leads.after).toBeGreaterThan(leads.before);
    expect(body.comparison.responseTime.after).toBeLessThan(body.comparison.responseTime.before);
  });

  test('mobile viewport renders the KPI layer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Baseline vs Pilot' })).toBeVisible();
    await page.screenshot({ path: '../../docs/presentation/screenshots/dashboard-kpis-mobile.png', fullPage: true });
  });
});
