import { test, expect } from '@playwright/test';

test.describe('Enrollment Dashboard Flow', () => {
  test('User can log in and view enrollments', async ({ page }) => {
    // 1. Navigate to the app
    await page.goto('/');

    // 2. Log in
    await page.fill('input[type="email"]', 'admin@academy.com');
    await page.fill('input[type="password"]', 'AAA123456');
    await page.click('button[type="submit"]');

    // 3. Wait for dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.locator('text=Dashboard').first()).toBeVisible();

    // 4. Navigate to Enrollments
    // Look for the enrollments link in the sidebar or just go directly
    await page.goto('/enrollments');
    await page.waitForSelector('text=Enrollments', { timeout: 10000 });

    // 5. Verify data table renders
    const table = page.locator('table').first();
    await expect(table).toBeVisible();

    // 6. Verify we have some enrollment rows
    // It should load some data
    await page.waitForSelector('.ui-row', { timeout: 10000 });
    const rows = page.locator('.ui-row');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });
});
