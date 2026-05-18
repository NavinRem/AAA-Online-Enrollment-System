import { test, expect } from '@playwright/test';

test.describe('Trials Management & Bookings View', () => {
  const branchId = 'branch-main';
  const programId = 'prog-robotics';
  const parentId = 'parent-1';
  const studentId = 'student-1';
  const trialId = 'trial-1';

  let interceptedCreateRequest = null;

  test.beforeEach(async ({ page }) => {
    // Inject Playwright Authentication Mock Flag
    await page.addInitScript(() => {
      globalThis.__playwright_mock_auth__ = true;
    });

    // Mock Authentication and Profile
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

    await page.route('**/api/auth/role/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ role: 'admin' })
      });
    });

    // Mock Branches
    await page.route('**/api/branches**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: branchId, name: 'Main Campus', code: 'MC', abbr: 'MC', color: 'blue' }
        ])
      });
    });

    // Mock Categories & Programs
    await page.route('**/api/categories**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'cat-1', name: 'Robotics', profileURL: 'profiles/avatar-boy' }
        ])
      });
    });

    await page.route('**/api/programs**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: programId, name: 'Advanced Robotics', category: 'Robotics', categoryId: 'cat-1', type: 'Group' }
        ])
      });
    });

    // Mock Parents & Students
    await page.route('**/api/parents**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: parentId, name: 'John Smith', phone: '0123456789', email: 'john@smith.com' }
        ])
      });
    });

    await page.route('**/api/students**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: studentId, name: 'Alice Smith', parentId: parentId, age: 9, status: 'active' }
        ])
      });
    });

    // Mock Empty lists for remaining dependencies
    await page.route('**/api/enrollments**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('**/api/classes**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('**/api/levels**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('**/api/schedules**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.route('**/api/terms**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    // Mock Trials API (GET and POST)
    await page.route('**/api/trials**', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: trialId,
              studentId: studentId,
              parentId: parentId,
              trialDate: '2026-05-18',
              trialTime: '14:30',
              trialType: 'booked',
              status: 'pending',
              isSuccessful: false,
              program: { id: programId, name: 'Advanced Robotics' },
              branch: { id: branchId, name: 'Main Campus', abbr: 'MC', color: 'blue' },
              student: { id: studentId, name: 'Alice Smith', profileURL: 'profiles/avatar-boy' },
              parent: { id: parentId, name: 'John Smith', profileURL: 'profiles/avatar-man' }
            }
          ])
        });
      } else if (method === 'POST') {
        interceptedCreateRequest = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'trial-new-guest', success: true })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/trials');
  });

  test('should display metric cards and trials list correctly', async ({ page }) => {
    // Assert Overview Title
    await expect(page.locator('h2:has-text("Trial Overview")')).toBeVisible();

    // Verify stats cards
    await expect(page.locator('.ui-metric-card', { hasText: 'Total Trials' })).toContainText('1');
    await expect(page.locator('.ui-metric-card', { hasText: 'Booked Trials' })).toContainText('1');
    await expect(page.locator('.ui-metric-card', { hasText: 'Walk-in Trials' })).toContainText('0');
    await expect(page.locator('.ui-metric-card', { hasText: 'Successful Trials' })).toContainText('0');

    // Verify row rendering
    await expect(page.locator('text=John Smith')).toBeVisible();
    await expect(page.locator('text=Alice Smith')).toBeVisible();
    await expect(page.locator('text=Advanced Robotics')).toBeVisible();
  });

  test('should filter by booking type reactively', async ({ page }) => {
    // Wait for the rows to render
    await expect(page.locator('text=Alice Smith')).toBeVisible();

    // Click filter dropdown
    await page.click('button:has-text("Filter")');

    // Select Walk-in from the dropdown filters
    const walkinOption = page.locator('.toolbar-filter-option', { hasText: 'Walk-in' });
    await walkinOption.waitFor({ state: 'visible' });
    await walkinOption.click();

    // The list should now be empty because the mocked trial is "booked" type
    await expect(page.locator('text=Alice Smith')).not.toBeVisible();
  });

  test('should book a new guest walk-in trial successfully', async ({ page }) => {
    // Wait for stability
    await expect(page.locator('text=Alice Smith')).toBeVisible();

    interceptedCreateRequest = null;

    // Click New Trial
    await page.click('button:has-text("New Trial")');
    await expect(page.locator('text=Book New Trial Session').first()).toBeVisible();

    // Toggle from Registered to Guest/Walk-in strategy
    await page.click('button:has-text("Guest/Walk-in")');

    // Fill Guest Parent Form
    await page.fill('input[placeholder="Parent full name..."]', 'Obi-Wan Kenobi');
    await page.fill('input[placeholder="Primary phone number..."]', '0555555555');
    await page.fill('input[placeholder="e.g. parent@example.com"]', 'obiwan@jedi.org');

    // Select Guest Parent Avatar (first avatar option)
    const parentAvatar = page.locator('.avatar-item').first();
    await parentAvatar.waitFor({ state: 'visible' });
    await parentAvatar.click();

    // Fill Guest Student Form
    await page.fill('input[placeholder="Student full name..."]', 'Luke Skywalker');
    await page.fill('input[placeholder="Select DOB..."]', '2016-05-18');

    // Select Guest Student Avatar (the child avatar choices)
    const studentAvatar = page.locator('.avatar-item').nth(2); // Index 2 (boy)
    await studentAvatar.waitFor({ state: 'visible' });
    await studentAvatar.click();

    // Select Program from dropdown
    await page.click('text=Select Program...');
    const progOption = page.locator('li:has-text("Advanced Robotics")').first();
    await progOption.waitFor({ state: 'visible' });
    await progOption.click();

    // Select Branch from dropdown
    await page.click('text=Select Branch...');
    const branchOption = page.locator('li:has-text("Main Campus")').first();
    await branchOption.waitFor({ state: 'visible' });
    await branchOption.click();

    // Click Add to bring up confirmation overlay
    await page.click('button:has-text("Add")');
    await expect(page.locator('text=Please review trial details carefully before confirming.')).toBeVisible();

    // Confirm Booking in the overlay
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/trials') && res.request().method() === 'POST'),
      page.click('.app-confirm-overlay button:has-text("Add")')
    ]);

    // Verify structured payload sent to the backend
    expect(interceptedCreateRequest).not.toBeNull();
    expect(interceptedCreateRequest.isGuest).toBe(true);
    expect(interceptedCreateRequest.guestParentName).toBe('Obi-Wan Kenobi');
    expect(interceptedCreateRequest.guestParentPhone).toBe('0555555555');
    expect(interceptedCreateRequest.guestParentEmail).toBe('obiwan@jedi.org');
    expect(interceptedCreateRequest.guestStudentName).toBe('Luke Skywalker');
    expect(interceptedCreateRequest.guestStudentDOB).toBe('2016-05-18');
    expect(interceptedCreateRequest.programId).toBe(programId);
    expect(interceptedCreateRequest.branchId).toBe(branchId);
    expect(interceptedCreateRequest.trialType).toBe('walk-in');
  });
});
