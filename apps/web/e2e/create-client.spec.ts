import { test, expect } from '@playwright/test';

/**
 * The strategic shift: onboarding the next advisor is configuration, not code.
 * The wizard walks Create Client → … → Launch and validates the assembled
 * ClientConfig against the same schema every registered client passes.
 */
test.describe('Advisor onboarding (Ben is Client Zero)', () => {
  test('client config page marks Ben as Client Zero and links to Create Client', async ({ page }) => {
    await page.goto('/client');
    await expect(page.getByText('Client Zero', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /Create Client/i }).first()).toBeVisible();
  });

  test('wizard walks all eight steps to Launch', async ({ page }) => {
    await page.goto('/create-client');
    await expect(page.getByRole('heading', { name: 'Create Client' }).first()).toBeVisible();
    for (const step of ['Select Vertical', 'Configure ICP', 'Configure Offer', 'Configure Scorecard', 'Configure GHL', 'Configure Compliance', 'Launch']) {
      await page.getByRole('button', { name: 'Next →' }).click();
      await expect(page.getByRole('heading', { name: step })).toBeVisible();
    }
    await page.screenshot({ path: '../../docs/presentation/screenshots/create-client.png', fullPage: true });
  });

  test('validates the assembled draft as a working tenant config', async ({ page }) => {
    await page.goto('/create-client');
    // Jump straight to Launch via the stepper.
    await page.getByRole('button', { name: '8. Launch' }).click();
    await page.getByRole('button', { name: /Validate & preview client/i }).click();
    await expect(page.getByText('Valid tenant configuration')).toBeVisible();
    // Prefilled example has no approvals ticked → launch pending.
    await expect(page.getByText(/approvals — pending/i)).toBeVisible();
  });

  test('POST /api/clients/draft validates and reports launch readiness', async ({ request }) => {
    const res = await request.post('/api/clients/draft', {
      data: {
        clientId: 'test-advisor',
        displayName: 'Test Advisor — Planning',
        advisorName: 'Test Advisor',
        advisorTitle: 'Advisor',
        advisorBio: 'A test advisor for validation.',
        vertical: 'financial_advisor',
        primaryAudience: 'Families',
        planningAreas: ['Retirement'],
        licensedStates: ['CA'],
        serviceArea: 'CA',
        bookingUrl: 'https://cal.com/test/review',
        leadSources: ['Referral'],
        crmProvider: 'gohighlevel',
        calendarProvider: 'native',
        approvedBy: 'Compliance',
        approvals: { branding: true, biography: true, licensing: true, disclosure: true, messaging: true, data_handling: true, crm: true, calendar: true },
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.valid).toBe(true);
    expect(body.config.organizationId).toBe('org_test-advisor');
    expect(body.launch.eligible).toBe(true); // all approvals ticked
  });

  test('rejects an invalid draft (bad slug) with schema issues', async ({ request }) => {
    const res = await request.post('/api/clients/draft', {
      data: { clientId: 'Bad Slug', displayName: 'X', advisorName: 'X', advisorTitle: 'X', advisorBio: 'X', vertical: 'financial_advisor', primaryAudience: 'X', planningAreas: ['X'], licensedStates: ['CA'], serviceArea: 'X', leadSources: ['X'] },
    });
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(body.issues.length).toBeGreaterThan(0);
  });
});
