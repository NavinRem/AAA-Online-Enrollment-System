/* global console, document */
import { test } from '@playwright/test';

test('debug page load and console errors', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

  await page.addInitScript(() => {
    globalThis.__playwright_mock_auth__ = true;
  });

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ uid: 'admin-1', role: 'admin', email: 'admin@aaa.com' })
    });
  });

  await page.route('**/api/terms', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ id: 'term-123', name: 'Playwright Test Term', status: 'active', branchIds: [] }])
    });
  });

  console.log('Navigating to /terms...');
  await page.goto('/terms');
  console.log('Navigated! Current URL:', page.url());

  // Wait a bit for async actions to settle
  await page.waitForTimeout(2000);
  console.log('After wait! Current URL:', page.url());

  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  console.log('Body HTML length:', bodyHTML.length);
});
