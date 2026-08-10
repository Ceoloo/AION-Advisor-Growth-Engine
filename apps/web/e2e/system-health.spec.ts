import { test, expect } from '@playwright/test';

/**
 * Observability: the AION System Health board and its API — per-component
 * status lights, retry/failure/dead-letter counts, and the structured event log.
 */
const COMPONENTS = ['GHL', 'Airtable', 'Scorecard', 'Workflows', 'Booking', 'AI', 'Analytics', 'Compliance'];

test.describe('AION System Health', () => {
  test('board shows all eight components, all green in demo', async ({ page }) => {
    await page.goto('/system-health');
    await expect(page.getByRole('heading', { name: 'AION System Health' })).toBeVisible();

    // Overall operational.
    await expect(page.getByText('operational', { exact: true }).first()).toBeVisible();

    // All eight subsystems present.
    for (const label of COMPONENTS) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }

    // The structured event stream is shown.
    await expect(page.getByRole('heading', { name: 'Recent operational events' })).toBeVisible();
    await expect(page.getByText(/suppressed/i).first()).toBeVisible(); // demo outbound

    await page.screenshot({ path: '../../docs/presentation/screenshots/system-health.png', fullPage: true });
  });

  test('GET /api/system-health rolls up the eight components', async ({ request }) => {
    const res = await request.get('/api/system-health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.level).toBe('operational');
    expect(body.light).toBe('🟢');
    expect(body.components).toHaveLength(8);
    expect(body.components.map((c: { component: string }) => c.component).sort()).toEqual(
      ['ai', 'airtable', 'analytics', 'booking', 'compliance', 'ghl', 'scorecard', 'workflows'],
    );
    // Events include a recovered-on-retry CRM sync (retry counting works).
    expect(body.eventCount).toBeGreaterThan(0);
    const airtable = body.components.find((c: { component: string }) => c.component === 'airtable');
    expect(airtable.stats.retryCount).toBeGreaterThanOrEqual(1);
  });
});
