import { test, expect, type Page } from '@playwright/test';

/**
 * Native calendar system: round-robin booking links, shared team calendar,
 * and shared tasks. Verifies the public booking flow end to end.
 */
const SHOTS = '../../docs/scheduling/screenshots';
const shot = (page: Page, name: string) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });

test.describe('Native scheduling', () => {
  test('booking calendars page lists shareable links', async ({ page }) => {
    await page.goto('/calendars');
    await expect(page.getByRole('heading', { name: 'Booking Calendars' })).toBeVisible();
    await expect(page.getByText('Advisor Growth Review')).toBeVisible();
    await expect(page.getByText('Round-robin').first()).toBeVisible();
    await expect(page.getByText('/book/ben-peretz-growth-review')).toBeVisible();
    await shot(page, 'calendars');
  });

  test('shared team calendar renders the week with a member legend', async ({ page }) => {
    await page.goto('/calendar');
    await expect(page.getByRole('heading', { name: 'Team Calendar' })).toBeVisible();
    await expect(page.getByText('Ben Peretz').first()).toBeVisible();
    await shot(page, 'team-calendar');
  });

  test('public booking flow assigns a member via round-robin', async ({ page }) => {
    await page.goto('/book/ben-peretz-growth-review');
    await expect(page.getByRole('heading', { name: 'Advisor Growth Review' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/next available team member/i).first()).toBeVisible();
    await shot(page, 'booking-pick');

    // Pick the first available time slot (formatted like "9:00 AM").
    await page.getByRole('button', { name: /\d{1,2}:\d{2}\s?(AM|PM)/ }).first().click();
    await page.getByPlaceholder('Full name *').fill('Dana Prospect');
    await page.getByPlaceholder('Email *').fill('dana.prospect@example.com');
    await shot(page, 'booking-form');
    await page.getByRole('button', { name: 'Confirm booking' }).click();

    await expect(page.getByRole('heading', { name: /booked/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Ben Peretz|Dana Cohen|Rachel Adler/)).toBeVisible();
    await shot(page, 'booking-confirmed');
  });

  test('shows a not-found state for an unknown booking link', async ({ page }) => {
    await page.goto('/book/does-not-exist');
    await expect(page.getByText('Booking link not found')).toBeVisible({ timeout: 15_000 });
  });

  test('shared tasks board: create and move a task', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page.getByRole('heading', { name: 'Shared Tasks' })).toBeVisible();
    await expect(page.getByText('Open').first()).toBeVisible({ timeout: 15_000 });

    const title = `E2E task ${Date.now()}`;
    await page.getByPlaceholder(/New task|Confirm/).fill(title);
    await page.getByRole('button', { name: '+ Add' }).click();
    await expect(page.getByText(title)).toBeVisible();

    // Move it to In Progress.
    await page.getByText(title).locator('..').getByRole('button', { name: '→ In Progress' }).click();
    await shot(page, 'tasks');
    await expect(page.getByText(title)).toBeVisible();
  });

  test('mobile booking view', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/book/ben-peretz-growth-review');
    await expect(page.getByRole('heading', { name: 'Advisor Growth Review' })).toBeVisible({ timeout: 15_000 });
    await shot(page, 'booking-mobile');
  });
});
