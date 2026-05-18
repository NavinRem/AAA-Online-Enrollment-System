/* global console */
import { test, expect } from '@playwright/test';

test.describe('Students Management & Profiles View', () => {
  const studentId1 = 'student-jimmy';
  const studentId2 = 'student-janey';
  const parentId = 'parent-john';
  const termId = 'term-active';

  let interceptedRequest = null;

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('STUDENT TEST BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.error('STUDENT TEST BROWSER ERROR:', err.message));

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

    // Mock Students GET and POST
    await page.route('**/api/students**', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
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
      } else if (method === 'POST') {
        interceptedRequest = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'student-new-luke', success: true })
        });
      } else {
        await route.continue();
      }
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

  test('should register a new child student linked to a parent successfully', async ({ page }) => {
    // Reset intercepted request
    interceptedRequest = null;

    // Wait for the students overview list to load and display data
    await expect(page.locator('text=Jimmy Doe')).toBeVisible();

    // Click New Student button
    await page.click('button:has-text("New Student")');
    await expect(page.locator('text=Add Child').first()).toBeVisible();

    // Select Parent from dropdown
    await page.click('text=Search Parent');
    await page.waitForTimeout(500); // Wait for transition and event listeners to attach
    const parentOption = page.locator('.fixed.bg-white.border-2.border-primary li', { hasText: 'John Doe' }).first();
    await parentOption.waitFor({ state: 'visible' });
    await parentOption.click({ force: true });

    // Fill Student details
    await page.fill('input[placeholder*="Enter Student Name"]', 'Luke Skywalker');
    await page.fill('input[type="date"]', '2018-05-04');

    // Select Avatar from AvatarSelector
    const avatarItem = page.locator('.avatar-item').first();
    await avatarItem.waitFor({ state: 'visible' });
    await avatarItem.click();

    // Trigger confirmation overlay
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=Please verify details before proceeding.')).toBeVisible();

    // Confirm creation using the overlay's confirm button and wait for POST request to be fired
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/students') && res.request().method() === 'POST'),
      page.click('.app-confirm-overlay button:has-text("Add")')
    ]);

    // Validate request payload
    expect(interceptedRequest).not.toBeNull();
    expect(interceptedRequest.name).toBe('Luke Skywalker');
    expect(interceptedRequest.parentId).toBe(parentId);
    expect(interceptedRequest.dob).toBe('2018-05-04');
  });
});
