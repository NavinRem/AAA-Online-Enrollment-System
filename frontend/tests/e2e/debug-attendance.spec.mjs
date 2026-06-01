import { test } from '@playwright/test';

test('Diagnose Attendance Error', async ({ page }) => {
  // Listen for the specific network response
  page.on('response', async response => {
    if (response.url().includes('/attendance/record') && response.request().method() === 'POST') {
      const body = await response.json().catch(() => ({}));
      console.log('Attendance Record Response:', response.status(), body);
    }
  });

  await page.goto('/classes');
  
  // Wait for the class link and click it
  await page.waitForSelector('a.font-bold', { state: 'visible' });
  await page.locator('a.font-bold').first().click();

  // Wait for the table to load
  await page.waitForSelector('.attendance-status-item', { state: 'visible', timeout: 15000 });

  // Click the first attendance badge to mark Present
  const firstBadge = page.locator('.attendance-status-item').first();
  await firstBadge.click();

  // Wait a bit to ensure the network request completes
  await page.waitForTimeout(2000);
});
