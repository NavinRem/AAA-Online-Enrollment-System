import { test, expect } from '@playwright/test';

test.describe('TermSessionModal Component Logic & Rendering Spec', () => {
  const termId = 'term-1';
  const branchMainId = 'branch-main';
  const programId = 'prog-1';
  const offeringId = 'off-1';
  const teacher1Id = 't-1';
  const teacher2Id = 't-2';

  test.beforeEach(async ({ page }) => {
    // Inject Playwright Authentication Mock Flag
    await page.addInitScript(() => {
      globalThis.__playwright_mock_auth__ = true;
    });

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ uid: 'admin-1', role: 'admin' })
      });
    });

    await page.route('**/api/branches**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: branchMainId, name: 'Main Campus', color: 'blue' }])
      });
    });

    // Mock Programs
    await page.route('**/api/programs**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: programId, name: 'Advanced Mathematics', category: 'Math' }
        ])
      });
    });

    // Mock Teachers
    await page.route('**/api/teachers**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: teacher1Id, name: 'Mr. Smith', branchAbbr: 'MC', programIds: [programId] },
          { id: teacher2Id, name: 'Ms. Johnson', branchAbbr: 'MC', programIds: [programId] }
        ])
      });
    });

    await page.route('**/api/trials**', async (route) => route.fulfill({ status: 200, body: '[]' }));
    await page.route('**/api/enrollments**', async (route) => route.fulfill({ status: 200, body: '[]' }));
    await page.route('**/api/students**', async (route) => route.fulfill({ status: 200, body: '[]' }));
  });

  test('should render session weeks correctly and allow updating teacher', async ({ page }) => {
    // Mock the specific term endpoint
    await page.route(`**/api/terms/${termId}**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: termId,
          name: 'Fall 2026',
          startDate: '2026-09-01',
          endDate: '2026-11-01',
          totalSessions: 5,
          branchIds: [branchMainId],
          offerings: [
            {
              offeringId,
              branchId: branchMainId,
              programId: programId,
              classId: programId, // FIX: Need classId to group correctly in TermDetail
              program: { id: programId, name: 'Advanced Mathematics', category: { name: 'Math' } }, // FIX: Need program to render correctly
              schedule: { day: 'Monday', time: '10:00 AM' },
              teacherIds: [teacher1Id],
              // Mock that week 1 already has a teacher, but other 4 weeks don't
              sessionTeachers: [
                { id: teacher1Id, name: 'Mr. Smith' },
                null, null, null, null
              ]
            }
          ]
        })
      });
    });

    // We mock the PUT request that will happen when we change the teacher
    await page.route(`**/api/terms/${termId}/offerings/${offeringId}`, async (route) => {
      if (route.request().method() === 'PUT') {
        const postData = JSON.parse(route.request().postData());
        // Verify that the payload contains the new teacher in the sessionTeachers array for week 2
        expect(postData.sessionTeachers).toBeDefined();
        expect(postData.sessionTeachers[1].id).toBe(teacher2Id); // Week 2 changed
        await route.fulfill({ status: 200, body: '{"success":true}' });
      } else {
        await route.fulfill({ status: 200, body: '{"success":true}' });
      }
    });

    // Navigate to the TermDetail page for our mock term
    await page.goto(`/terms/${termId}`);

    // Wait for the classes table to render the Advanced Mathematics class
    const classNameCell = page.locator('text=Advanced Mathematics');
    await expect(classNameCell).toBeVisible();

    // Click the triple dot menu to open actions
    const menuButton = page.locator('button:has-text("⋮")').first();
    await menuButton.dispatchEvent('click');
    await page.waitForTimeout(500); // Wait for menu transition

    // Click "Manage Faculty" in the dropdown
    const manageFacultyButton = page.locator('button', { hasText: 'Manage Faculty' });
    await expect(manageFacultyButton).toBeVisible();
    await manageFacultyButton.click({ force: true });

    // Wait for Modal to open
    const modalTitle = page.locator('h3:has-text("Weekly Faculty Assignment")');
    await expect(modalTitle).toBeVisible();

    // Verify it renders 5 session weeks (based on totalSessions = 5)
    for (let i = 1; i <= 5; i++) {
      await expect(page.locator(`text=Week ${i}`).first()).toBeVisible();
    }

    // Assign Ms. Johnson to Week 2
    const week2Container = page.locator('div.group\\/session').filter({ hasText: 'Week 2' });
    
    // The dropdown has placeholder "Select Specialist..." or default text "Mr. Smith"
    const dropdownTrigger = week2Container.locator('button, .ui-select-trigger').first();
    await dropdownTrigger.click({ force: true });

    // Select "Ms. Johnson" from the dropdown overlay (might be teleported to body, so search globally)
    const msJohnsonOption = page.locator('text=Ms. Johnson').last();
    await expect(msJohnsonOption).toBeVisible();
    await msJohnsonOption.click({ force: true });

    // The API request should be triggered (we asserted it above in page.route)
    // Now verify the UI for Week 2 updated to Ms. Johnson
    await expect(week2Container.locator('text=Ms. Johnson').first()).toBeVisible();

    // Click Finish
    const finishButton = page.locator('button:has-text("Finish")');
    await finishButton.click();

    // Modal should close
    await expect(modalTitle).not.toBeVisible();
  });
});
