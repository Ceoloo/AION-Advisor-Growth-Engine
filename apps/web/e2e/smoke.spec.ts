import { test, expect } from '@playwright/test';

test.describe('AION demo smoke journey', () => {
  test('dashboard loads with demo banner and KPIs', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('Demo mode')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Executive Dashboard' })).toBeVisible();
    await expect(page.getByText('Total Leads')).toBeVisible();
  });

  test('leads list navigates to a lead detail page', async ({ page }) => {
    await page.goto('/leads');
    await expect(page.getByRole('heading', { name: 'Leads' })).toBeVisible();
    // Open the first lead in the table.
    await page.locator('table tbody tr a').first().click();
    await expect(page.getByText('Recommended next action')).toBeVisible();
    await expect(page.getByText('Score Breakdown')).toBeVisible();
  });

  test('pipeline board renders stages', async ({ page }) => {
    await page.goto('/pipeline');
    await expect(page.getByRole('heading', { name: 'Pipeline' })).toBeVisible();
    await expect(page.getByText('New Lead').first()).toBeVisible();
  });

  test('qualification form scores a lead', async ({ page }) => {
    await page.goto('/qualify?vertical=financial_advisor');
    await expect(page.getByText('Financial Advisor Qualification')).toBeVisible();
    await page.getByRole('button', { name: 'Qualify & score' }).click();
    await expect(page.getByText('Score Breakdown')).toBeVisible({ timeout: 15_000 });
  });

  test('api health endpoint responds', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.demoMode).toBe(true);
  });
});
