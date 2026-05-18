import { test, expect } from '@playwright/test';

test.describe('Teachers Management & Assignments View', () => {
  const teacherId1 = 'teacher-1';
  const teacherId2 = 'teacher-2';
  const programId = 'prog-1';
  const termId = 'term-active';

  let interceptedCreateRequest = null;
  let interceptedEditRequest = null;

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

    // Mock Teachers GET, POST, and PATCH to avoid multiple pattern routing issues
    await page.route('**/api/teachers**', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
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
              profileURL: 'profiles/avatar-teacher-woman',
              createdAt: new Date().toISOString()
            },
            {
              id: teacherId2,
              name: 'Bob Jones',
              email: 'bob@aaa.com',
              phone: '0987654321',
              status: 'inactive',
              programIds: [],
              profileURL: 'profiles/avatar-teacher-man',
              createdAt: new Date().toISOString()
            }
          ])
        });
      } else if (method === 'POST') {
        interceptedCreateRequest = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'teacher-new-yoda', success: true })
        });
      } else if (method === 'PATCH' && route.request().url().includes('/teachers/teacher-1')) {
        interceptedEditRequest = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } else {
        await route.continue();
      }
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
    // Wait for page to be stable and mounted
    await expect(page.locator('text=Alice Smith')).toBeVisible();

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
    // Wait for page to be stable and mounted
    await expect(page.locator('text=Alice Smith')).toBeVisible();

    // Alice has Advanced Robotics assigned
    const row = page.locator('tr', { hasText: 'Alice Smith' });
    await expect(row.locator('text=Advanced Robotics')).toBeVisible();
    await expect(row.locator('text=Saturday')).toBeVisible();
  });

  test('should validate form inputs and handle errors on create', async ({ page }) => {
    // Wait for page to be stable and mounted
    await expect(page.locator('text=Alice Smith')).toBeVisible();

    await page.click('button:has-text("New Teacher")');
    await expect(page.locator('text=New Teacher Registration').first()).toBeVisible();

    // Click submit with empty fields
    await page.click('button:has-text("Add Teacher")');

    // Confirm that error messages render dynamically
    await expect(page.locator('text=This field is required').first()).toBeVisible();
  });

  test('should add a new teacher successfully with correct payload', async ({ page }) => {
    // Wait for page to be stable and mounted
    await expect(page.locator('text=Alice Smith')).toBeVisible();

    interceptedCreateRequest = null;

    await page.click('button:has-text("New Teacher")');
    await expect(page.locator('text=New Teacher Registration').first()).toBeVisible();

    // Fill form
    await page.fill('input[placeholder*="Dr. John Doe"]', 'Master Yoda');
    await page.fill('input[placeholder*="teacher@aaa.edu"]', 'yoda@jedi.edu');
    await page.fill('input[placeholder*="e.g. 012 345 678"]', '0909090909');

    // Choose Program from dropdown
    await page.click('text=Choose programs...');
    const programOption = page.locator('.fixed.bg-white.border-2.border-primary li').locator('text="Advanced Robotics"').first();
    await programOption.waitFor({ state: 'visible' });
    await programOption.click();

    // Select Avatar from AvatarSelector
    const avatarItem = page.locator('.avatar-item').first();
    await avatarItem.waitFor({ state: 'visible' });
    await avatarItem.click();

    // Trigger overlay confirmation modal
    await page.click('button:has-text("Add Teacher")');
    await expect(page.locator('text=Verify details before proceeding.')).toBeVisible();

    // Confirm creation using the overlay's confirm button and wait for POST request to be fired
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/teachers') && res.request().method() === 'POST'),
      page.click('.app-confirm-overlay button:has-text("Add Teacher")')
    ]);

    // Validate request payload
    expect(interceptedCreateRequest).not.toBeNull();
    expect(interceptedCreateRequest.name).toBe('Master Yoda');
    expect(interceptedCreateRequest.email).toBe('yoda@jedi.edu');
    expect(interceptedCreateRequest.phone).toBe('0909090909');
    expect(interceptedCreateRequest.programIds).toContain(programId);
  });

  test('should edit an existing teacher successfully', async ({ page }) => {
    // Wait for page to be stable and mounted
    await expect(page.locator('text=Alice Smith')).toBeVisible();

    interceptedEditRequest = null;

    // Locate row for Alice Smith and trigger action dropdown
    const row = page.locator('tr', { hasText: 'Alice Smith' });
    const actionButton = row.locator('.ui-action-menu button').first();
    await expect(actionButton).toBeVisible();
    await actionButton.click({ force: true });

    // Click Edit with proper visibility waiting to avoid detaching from DOM
    const editOption = page.locator('.ui-dropdown-item:has-text("Edit")').first();
    await expect(editOption).toBeVisible();
    await editOption.click({ force: true });
    await expect(page.locator('text=Edit Teacher Profile').first()).toBeVisible();

    // Wait for modal to open and fill in new phone number
    const phoneInput = page.locator('input[placeholder*="e.g. 012 345 678"]');
    await phoneInput.fill('0777777777');

    // Trigger confirmation overlay
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('text=Verify details before proceeding.')).toBeVisible();

    // Confirm submit using the overlay's confirm button and wait for PATCH request to be fired
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/teachers/teacher-1') && res.request().method() === 'PATCH'),
      page.click('.app-confirm-overlay button:has-text("Save Changes")')
    ]);

    // Validate payload
    expect(interceptedEditRequest).not.toBeNull();
    expect(interceptedEditRequest.phone).toBe('0777777777');
  });
});
