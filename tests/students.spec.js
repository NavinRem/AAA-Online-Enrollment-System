import { test, expect } from '@playwright/test';

test.describe('Students Management & Profiles View', () => {
  const studentId1 = 'student-jimmy';
  const studentId2 = 'student-janey';
  const parentId = 'parent-john';
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
          {
            id: studentId1,
            name: 'Jimmy Doe',
            parentId: parentId,
            status: 'active',
            gender: 'Male',
            dob: '2015-05-10',
            createdAt: new Date().toISOString()
          },
          {
            id: studentId2,
            name: 'Janey Smith',
            parentId: 'parent-unknown',
            status: 'inactive',
            gender: 'Female',
            dob: '2016-08-15',
            createdAt: new Date().toISOString()
          }
        ])
      });
    });

    // Mock Enrollments (Jimmy is enrolled, Janey is not)
    await page.route('**/api/enrollments**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'e1',
            studentId: studentId1,
            parentId: parentId,
            classId: 'c1',
            branchId: 'branch-1',
            termId: termId,
            amount: 250,
            paymentStatus: 'paid',
            status: 'active',
            enrollAt: new Date().toISOString()
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

    await page.goto('/students');
  });

  test('should render the list of students correctly', async ({ page }) => {
    // Check Header and Tables
    await expect(page.locator('h2:has-text("Student Overview")')).toBeVisible();
    await expect(page.locator('text=Jimmy Doe')).toBeVisible();
    await expect(page.locator('text=Janey Smith')).toBeVisible();
  });

  test('should compute total and active metrics accurately', async ({ page }) => {
    // Total Students = 2
    const totalCard = page.locator('.ui-metric-card', { hasText: 'Total Students' });
    await expect(totalCard).toContainText('2');

    // Enrolled Students = 1 (Jimmy Doe has active status)
    const enrolledCard = page.locator('.ui-metric-card', { hasText: 'Active (Studying)' });
    await expect(enrolledCard).toContainText('1');

    // Not Enrolled = 1 (Janey Smith has inactive status)
    const notEnrolledCard = page.locator('.ui-metric-card', { hasText: 'Inactive (Stopped)' });
    await expect(notEnrolledCard).toContainText('1');
  });

  test('should filter student names reactively using search searchBox', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search by name"]');
    await searchInput.fill('Jimmy');

    await expect(page.locator('text=Jimmy Doe')).toBeVisible();
    await expect(page.locator('text=Janey Smith')).not.toBeVisible();
  });
});
