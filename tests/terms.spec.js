import { test, expect } from '@playwright/test';

test.describe('Terms Management & Metrics View', () => {
  const termId = 'term-123';
  const branchId = 'branch-456';

  test.beforeEach(async ({ page }) => {
    // Inject Playwright Authentication Mock Flag
    await page.addInitScript(() => {
      globalThis.__playwright_mock_auth__ = true;
    });

    // Mock the Terms API
    await page.route(`**/api/terms`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: termId,
            name: 'Playwright Test Term',
            startDate: '2026-05-01',
            endDate: '2026-08-31',
            status: 'active',
            branchIds: [branchId],
            totalSessions: 11,
            branchSettings: [
              {
                branchId: branchId,
                startDate: '2026-05-01',
                endDate: '2026-08-31',
              }
            ]
          }
        ]),
      });
    });

    // Mock Enrollments API with edge cases (valid/unpaid/cancelled/JSON timestamp)
    await page.route('**/api/enrollments**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'e-paid-active',
            studentId: 'student-1',
            termId: termId,
            branchId: branchId,
            amount: 150,
            paymentStatus: 'paid',
            status: 'active',
            enrollAt: { _seconds: 1779028274, _nanoseconds: 0 } // Serialized REST Timestamp
          },
          {
            id: 'e-unpaid-active',
            studentId: 'student-2',
            termId: termId,
            branchId: branchId,
            amount: 200,
            paymentStatus: 'unpaid',
            status: 'active',
            enrollAt: { _seconds: 1779028274, _nanoseconds: 0 }
          },
          {
            id: 'e-paid-cancelled',
            studentId: 'student-3',
            termId: termId,
            branchId: branchId,
            amount: 250,
            paymentStatus: 'paid',
            status: 'cancelled',
            enrollAt: { _seconds: 1779028274, _nanoseconds: 0 }
          }
        ]),
      });
    });

    // Mock remaining APIs
    await page.route('**/api/branches', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: branchId, name: 'Main Campus', code: 'MC' }
        ])
      });
    });

    await page.route('**/api/trials**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.route('**/api/classes**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.route('**/api/students**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.route('**/api/categories**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.route('**/api/programs**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.route('**/api/parents**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.route('**/api/schedules**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    // Mock authentication check
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ uid: 'admin-1', role: 'admin', email: 'admin@aaa.com' })
      });
    });

    // Go to terms page
    await page.goto('/terms');
  });

  test('should render term name and dates correctly with parseDate resiliency', async ({ page }) => {
    // Validate table header/term name
    await expect(page.locator('text=Playwright Test Term').first()).toBeVisible();

    // Check that dates are formatted correctly and do not show "Invalid Date"
    const dateText = page.locator('text=Invalid Date');
    await expect(dateText).not.toBeVisible();

    // Verify start and end dates render beautifully
    await expect(page.locator('text=01 May 26')).toBeVisible();
    await expect(page.locator('text=31 Aug 26')).toBeVisible();
  });

  test('should perform accurate local calculations on metrics', async ({ page }) => {
    // Calculations:
    // - Enrolled student count: 2 (student-1, student-2; student-3 is cancelled and excluded)
    // - Revenue: $150 (only student-1 is paid; student-2 is unpaid and student-3 is cancelled)

    const termRow = page.locator('tr', { hasText: "Playwright Test Term" });
    
    // Check Enrolled Count column
    await expect(termRow.locator('td').nth(7)).toContainText('2');

    // Check Revenue column
    await expect(termRow.locator('td').nth(9)).toContainText('$150');
  });
});
