import { test, expect } from '@playwright/test';

test.describe('Teachers Management & Assignments View', () => {
  const teacherId1 = 'teacher-1';
  const teacherId2 = 'teacher-2';
  const programId = 'prog-1';
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

    // Mock Programs
    await page.route('**/api/programs**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: programId, name: 'Advanced Robotics', category: 'STEM', level: 'Advanced' }
        ])
      });
    });

    // Mock Classes
    await page.route('**/api/classes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
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
            name: 'Summer Semester 2026',
            status: 'active',
            offerings: [
              {
                offeringId: 'offering-1',
                termId: termId,
                program: { id: programId, name: 'Advanced Robotics' },
                schedule: { day: 'Saturday', time: '10:00 AM' },
                teachers: [{ id: teacherId1, name: 'Alice Smith' }]
              }
            ]
          }
        ])
      });
    });

    // Mock Teachers
    await page.route('**/api/teachers**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: teacherId1,
            name: 'Alice Smith',
            email: 'alice@aaa.com',
            phone: '0123456789',
            status: 'active',
            programIds: [programId],
            createdAt: new Date().toISOString()
          },
          {
            id: teacherId2,
            name: 'Bob Jones',
            email: 'bob@aaa.com',
            phone: '0987654321',
            status: 'inactive',
            programIds: [],
            createdAt: new Date().toISOString()
          }
        ])
      });
    });

    await page.goto('/teachers');
  });

  test('should display metric cards and teachers list correctly', async ({ page }) => {
    // Assert Overview Title
    await expect(page.locator('h2:has-text("Teacher Overview")')).toBeVisible();

    // Verify stats cards
    await expect(page.locator('.ui-metric-card', { hasText: 'Total Teachers' })).toContainText('2');
    await expect(page.locator('.ui-metric-card', { hasText: 'Active Teachers' })).toContainText('1');

    // Verify row rendering
    await expect(page.locator('text=Alice Smith')).toBeVisible();
    await expect(page.locator('text=Bob Jones')).toBeVisible();
  });

  test('should filter by active / inactive status successfully', async ({ page }) => {
    // Click DataTable filters
    await page.click('button:has-text("Filter")');
    
    // Explicitly wait for the filter option to be visible before clicking (fixes Firefox timing)
    const inactiveOption = page.locator('.toolbar-filter-option', { hasText: 'Inactive' });
    await inactiveOption.waitFor({ state: 'visible' });
    await inactiveOption.click();

    // Bob Jones is inactive; Alice is active
    await expect(page.locator('text=Bob Jones')).toBeVisible();
    await expect(page.locator('text=Alice Smith')).not.toBeVisible();
  });

  test('should display assigned classes and program linkages', async ({ page }) => {
    // Alice has Advanced Robotics assigned
    const row = page.locator('tr', { hasText: 'Alice Smith' });
    await expect(row.locator('text=Advanced Robotics')).toBeVisible();
    await expect(row.locator('text=Saturday')).toBeVisible();
  });
});
