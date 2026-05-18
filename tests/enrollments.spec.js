import { test, expect } from '@playwright/test';

test.describe('Enrollments Management & Billing View', () => {
  const enrollmentId1 = 'enroll-paid';
  const enrollmentId2 = 'enroll-unpaid';
  const parentId = 'parent-john';
  const studentId = 'student-jimmy';
  const termId = 'term-active';

  test.beforeEach(async ({ page }) => {
    // Inject Playwright Authentication Mock Flag
    await page.addInitScript(() => {
      globalThis.__playwright_mock_auth__ = true;
    });

    // Mock Authentication
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ uid: 'admin-1', role: 'admin', email: 'admin@aaa.com' })
      });
    });

    // Mock Parents
    await page.route('**/api/parents**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: parentId, name: 'John Doe', phone: '0123456789', email: 'john@doe.com' }
        ])
      });
    });

    // Mock Students
    await page.route('**/api/students**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: studentId, name: 'Jimmy Doe', parentId: parentId, status: 'active', createdAt: new Date().toISOString() }
        ])
      });
    });

    // Mock Enrollments (Jimmy has one paid and one unpaid enrollment)
    await page.route('**/api/enrollments**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: enrollmentId1,
            studentId: studentId,
            parentId: parentId,
            classId: 'c1',
            branchId: 'branch-1',
            termId: termId,
            amount: 250,
            paymentStatus: 'paid',
            status: 'paid',
            enrollAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          },
          {
            id: enrollmentId2,
            studentId: studentId,
            parentId: parentId,
            classId: 'c1',
            branchId: 'branch-1',
            termId: termId,
            amount: 300,
            paymentStatus: 'unpaid',
            status: 'unpaid',
            enrollAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          }
        ])
      });
    });

    // Mock other APIs
    await page.route('**/api/branches**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify([{ id: 'branch-1', name: 'Main Campus', code: 'MC' }])
      });
    });
    await page.route('**/api/terms**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });
    await page.route('**/api/trials**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });
    await page.route('**/api/classes**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });
    await page.route('**/api/programs**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });
    await page.route('**/api/categories**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.route('**/api/schedules**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.goto('/enrollments');
  });

  test('should render the list of enrollments and metrics cards correctly', async ({ page }) => {
    // Assert Overview Title
    await expect(page.locator('h2:has-text("Enrollment Overview")')).toBeVisible();

    // Verify stats cards are rendered with correct calculated statistics
    await expect(page.locator('.ui-metric-card', { hasText: 'Total Enrollment' })).toContainText('2');
    await expect(page.locator('.ui-metric-card', { hasText: 'Total Paid Enrollment' })).toContainText('1');
    await expect(page.locator('.ui-metric-card', { hasText: 'Total Unpaid Enrollment' })).toContainText('1');

    // Verify list values
    await expect(page.locator('text=Jimmy Doe').first()).toBeVisible();
    await expect(page.locator('text=John Doe').first()).toBeVisible();
  });

  test('should filter list items with search searchBox reactively', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search by name"]');
    await searchInput.fill('enroll-paid');

    // Only paid enrollment is visible, unpaid is filtered out
    await expect(page.locator('tr', { hasText: 'Paid' })).toBeVisible();
    await expect(page.locator('tr', { hasText: 'Unpaid' })).not.toBeVisible();
  });
});
