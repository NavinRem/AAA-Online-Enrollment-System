import { test, expect } from '@playwright/test';

test.describe('Dashboard Management & Analytics View', () => {
  const branchId1 = 'branch-main';
  const branchId2 = 'branch-west';
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

    await page.route('**/api/auth/profile/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ uid: 'admin-1', role: 'admin', name: 'Admin User', email: 'admin@aaa.com' })
      });
    });

    // Mock Branches
    await page.route('**/api/branches', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: branchId1, name: 'Main Campus', code: 'MC', color: '#8B5CF6', abbr: 'MC' },
          { id: branchId2, name: 'West Campus', code: 'WC', color: '#10B981', abbr: 'WC' }
        ])
      });
    });

    // Mock Terms
    await page.route('**/api/terms**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: termId,
            name: 'Active Summer Term',
            status: 'active',
            startDate: '2026-05-01',
            endDate: '2026-08-31',
            branchIds: [branchId1],
            totalSessions: 12,
            branchSettings: [
              { branchId: branchId1, startDate: '2026-05-01', endDate: '2026-08-31' }
            ]
          }
        ])
      });
    });

    // Mock Parents
    await page.route('**/api/parents**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'p1', name: 'John Doe', role: 'parent', status: 'Active', createdAt: new Date().toISOString() },
          { id: 'p2', name: 'Jane Smith', role: 'parent', status: 'Inactive', createdAt: new Date().toISOString() }
        ])
      });
    });

    // Mock Students
    await page.route('**/api/students**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 's1', name: 'Jimmy Doe', parentId: 'p1', status: 'active', createdAt: new Date().toISOString() },
          { id: 's2', name: 'Janey Smith', parentId: 'p2', status: 'active', createdAt: new Date().toISOString() }
        ])
      });
    });

    // Mock Enrollments (today, week, total)
    await page.route('**/api/enrollments**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'e1',
            studentId: 's1',
            parentId: 'p1',
            classId: 'c1',
            branchId: branchId1,
            termId: termId,
            amount: 250,
            paymentStatus: 'paid',
            status: 'active',
            enrollAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          },
          {
            id: 'e2',
            studentId: 's2',
            parentId: 'p2',
            classId: 'c1',
            branchId: branchId2,
            termId: termId,
            amount: 300,
            paymentStatus: 'paid',
            status: 'active',
            enrollAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
          }
        ])
      });
    });

    // Mock Trials
    await page.route('**/api/trials**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 't1',
            studentId: 's1',
            branchId: branchId1,
            status: 'active',
            trialDate: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
          }
        ])
      });
    });

    // Mock Classes
    await page.route('**/api/classes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'c1', programId: 'pr1', branchId: branchId1, isDeleted: false }
        ])
      });
    });

    // Mock Programs
    await page.route('**/api/programs**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'pr1', name: 'Coding for Kids', basePrice: 200 }
        ])
      });
    });

    await page.route('**/api/categories**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.route('**/api/schedules**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) });
    });

    await page.goto('/dashboard');
  });

  test('should render the today summary and weekly metrics correctly', async ({ page }) => {
    // Expect header
    await expect(page.locator('h2:has-text("Today Summary")')).toBeVisible();
    await expect(page.locator('h2:has-text("This Week")')).toBeVisible();

    // Verify metric cards exist and contain correct aggregated values
    await expect(page.locator('.ui-metric-card', { hasText: 'Today New Accounts' })).toContainText('2');
    await expect(page.locator('.ui-metric-card', { hasText: 'Today Enrollments' })).toContainText('2');
    await expect(page.locator('.ui-metric-card', { hasText: 'Today Trial Class' })).toContainText('1');
    await expect(page.locator('.ui-metric-card', { hasText: 'Today Payments' })).toContainText('$550');
  });

  test('should calculate sidebar totals correctly', async ({ page }) => {
    // Total Revenue is $550 ($250 + $300)
    const revenueCard = page.locator('.ui-mini-card', { hasText: 'Total Revenue' });
    await expect(revenueCard).toBeVisible();
    await expect(revenueCard).toContainText('$550');

    // Total Parents = 2
    const parentCard = page.locator('.ui-mini-card', { hasText: 'Total Parents' });
    await expect(parentCard).toContainText('2');

    // Total Students = 2
    const studentCard = page.locator('.ui-mini-card', { hasText: 'Total Students' });
    await expect(studentCard).toContainText('2');
  });

  test('should display active academic term correctly in sidebar', async ({ page }) => {
    await expect(page.locator('span:has-text("Active Academic Term")')).toBeVisible();
    await expect(page.locator('span:has-text("Active Summer Term")')).toBeVisible();
  });

  test('should display global active academic term (without branch-specific settings) correctly in sidebar', async ({ page }) => {
    // Override terms route to return a global active term without branchSettings
    await page.route('**/api/terms**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'term-global-active',
            name: 'Global Active Term',
            status: 'active',
            startDate: '2026-05-01',
            endDate: '2026-08-31',
            branchIds: [],
            totalSessions: 12
          }
        ])
      });
    });

    // Reload the page to apply the overridden mock
    await page.goto('/dashboard');

    // Verify it renders the global term panel successfully
    await expect(page.locator('span:has-text("Active Academic Term")')).toBeVisible();
    await expect(page.locator('span:has-text("Global Active Term")')).toBeVisible();
  });
});
