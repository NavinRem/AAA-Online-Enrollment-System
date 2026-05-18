import { test, expect } from '@playwright/test';
import { setTimeout } from 'timers/promises';

test.describe('Component Hydration Resilience & Defensive Rendering Tests', () => {
  const branchId = 'branch-main';
  const programId = 'prog-robotics';
  const parentId = 'parent-1';
  const studentId = 'student-1';
  const classId = 'class-1';
  const termId = 'term-1';

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
          { id: branchId, name: 'Main Campus', abbr: 'MC', color: 'blue' }
        ])
      });
    });

    // Mock Programs
    await page.route('**/api/programs**', async (route) => {
      const url = route.request().url();
      if (url.endsWith('/api/programs') || url.includes('/api/programs?')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: programId, name: 'Advanced Robotics', category: 'Robotics', level: 'Beginner' }
          ])
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: programId,
            name: 'Advanced Robotics',
            category: 'Robotics',
            level: 'Beginner'
          })
        });
      }
    });

    // Mock Attendance
    await page.route('**/api/attendance/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({})
      });
    });

    // Mock Parents & Students
    await page.route('**/api/parents**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: parentId, name: 'John Smith', phone: '0123456789', email: 'john@smith.com', status: 'Active' }
        ])
      });
    });

    await page.route('**/api/students**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: studentId, name: 'Alice Smith', parentId: parentId, dob: '2016-05-18', status: 'Active', profileURL: 'profiles/avatar-girl' }
        ])
      });
    });

    // Mock Enrollments (Alice has one active enrollment)
    await page.route('**/api/enrollments**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'enroll-1',
            studentId: studentId,
            parentId: parentId,
            classId: classId,
            branchId: branchId,
            termId: termId,
            amount: 250,
            status: 'active',
            programName: 'Advanced Robotics',
            termName: 'Summer 2026',
            branchAbbr: 'MC',
            class: {
              id: classId,
              term: {
                id: termId,
                name: 'Summer 2026',
                startDate: '2026-05-01',
                endDate: '2026-08-31',
                totalSessions: 12
              },
              schedule: { id: 'sched-1', day: 'Saturday', time: '10:00 - 11:30' }
            }
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
          { id: classId, name: 'Advanced Robotics Sat 10am', programId: programId }
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
            name: 'Summer 2026',
            startDate: '2026-05-01',
            endDate: '2026-08-31',
            isCurrent: true,
            totalSessions: 12,
            offerings: [
              {
                classId: classId,
                branchId: branchId,
                scheduleId: 'sched-1',
                capacity: 10,
                currentCount: 1,
                branch: { id: branchId, name: 'Main Campus', abbr: 'MC', color: 'blue' }
              }
            ]
          }
        ])
      });
    });
  });

  test('should render StudentDetail profile with delayed network hydration', async ({ page }) => {
    // Intercept individual student fetch and add 1-second delay
    await page.route(`**/api/students/${studentId}`, async (route) => {
      await setTimeout(500);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: studentId,
          name: 'Alice Smith',
          parentId: parentId,
          dob: '2016-05-18',
          status: 'Active',
          profileURL: 'profiles/avatar-girl'
        })
      });
    });

    // Collect runtime console errors
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Navigate to student profile detail page
    await page.goto(`/students/${studentId}`);

    // Wait for the detail content to hydate and loading overlays to disappear
    await expect(page.locator('text=Alice Smith').first()).toBeVisible();

    // Verify there are no runtime JS crashes during mounting or delayed state updates
    expect(errors).toHaveLength(0);
  });

  test('should render ClassDetail profile with delayed network hydration', async ({ page }) => {
    // Intercept individual class fetch and add 1-second delay
    await page.route(`**/api/classes/${classId}`, async (route) => {
      await setTimeout(500);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: classId,
          name: 'Advanced Robotics Sat 10am',
          programId: programId,
          schedules: [{ id: 'sched-1', day: 'Saturday', time: '10:00 - 11:30' }]
        })
      });
    });

    // Collect runtime console errors
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Navigate to class analytics detail page
    await page.goto(`/classes/${classId}`);

    // Verify there are no runtime JS crashes first (helps diagnose hydration issues)
    expect(errors).toEqual([]);
    
    // Wait for content hydration
    await expect(page.locator('text=Class Detail').first()).toBeVisible();
  });

  test('should handle atypical attendance status codes gracefully in StudentDetail', async ({ page }) => {
    // Intercept individual student fetch
    await page.route(`**/api/students/${studentId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: studentId,
          name: 'Alice Smith',
          parentId: parentId,
          dob: '2016-05-18',
          status: 'Active',
          profileURL: 'profiles/avatar-girl'
        })
      });
    });

    // Mock parent fetch
    await page.route(`**/api/parents/${parentId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: parentId,
          name: 'John Smith',
          phone: '0123456789',
          email: 'john@smith.com',
          status: 'Active'
        })
      });
    });

    // Mock tracking attendance with atypical/unrecognized status e.g., "Present" or undefined/empty
    await page.route('**/api/tracking/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, sessionId: 1, studentId: studentId, status: 'Present' } // atypical status "Present" instead of P/A/L/M/N
        ])
      });
    });

    // Mock class attendance with atypical status
    await page.route('**/api/attendance/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          '1': { [studentId]: 'Present' }
        })
      });
    });

    // Collect runtime console errors
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Navigate to student profile detail page
    await page.goto(`/students/${studentId}`);

    // Wait for page load
    await expect(page.locator('text=Alice Smith').first()).toBeVisible();

    // Verify there are no runtime JS crashes
    expect(errors).toHaveLength(0);
  });
});
