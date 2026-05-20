import { test, expect } from '@playwright/test';

test.describe('Component UI Rendering & Calculation Consistency Tests', () => {
  const branchId = 'branch-main';
  const parentId = 'parent-1';
  const studentId = 'student-1';
  const programId = 'prog-robotics';
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
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: programId, name: 'Advanced Robotics', category: 'Robotics', level: 'Beginner' }
        ])
      });
    });

    // Mock Categories
    await page.route('**/api/categories**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'cat-1', name: 'Robotics', profileURL: 'profiles/cat-robotics' }
        ])
      });
    });

    // Mock Schedules
    await page.route('**/api/schedules**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'sched-1', day: 'Saturday', time: '10:00 - 11:30' }
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

    // Mock Trials
    await page.route('**/api/trials**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // Mock Students
    await page.route('**/api/students**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // Mock Enrollments
    await page.route('**/api/enrollments**', async (route) => {
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
        body: JSON.stringify([])
      });
    });
  });

  test('should render DataMetricCard with styling consistency across different modules', async ({ page }) => {
    // Mock standard data
    await page.route('**/api/parents**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: parentId, name: 'John Smith', phone: '0123456789', email: 'john@smith.com', status: 'Active' }
        ])
      });
    });

    // Mock terms list
    await page.route('**/api/terms**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: termId, name: 'Summer 2026', startDate: '2026-05-01', endDate: '2026-08-31', status: 'active', branchIds: [branchId] }
        ])
      });
    });

    // 1. Check Styling in Parents module
    await Promise.all([
      page.waitForResponse('**/api/parents**'),
      page.goto('/parents')
    ]);
    const parentsCard = page.locator('.ui-metric-card').first();
    await expect(parentsCard).toBeVisible();
    await expect(parentsCard).toHaveClass(/ui-metric-card flex flex-col items-center/);
    await expect(parentsCard).toHaveClass(/rounded-std shadow-sm flex-1/);

    // 2. Check Styling in Terms module (reusable component consistency)
    await page.goto('/terms');
    const termsCard = page.locator('.ui-metric-card').first();
    await expect(termsCard).toBeVisible();
    await expect(termsCard).toHaveClass(/ui-metric-card flex flex-col items-center/);
    await expect(termsCard).toHaveClass(/rounded-std shadow-sm flex-1/);
  });

  test('should render calculated data and font optimizations on the Dashboard', async ({ page }) => {
    const todayStr = new Date().toISOString();

    // 1. Mock high revenue ($12,456,800.00 - value length > 8) to trigger dynamic text sizing (text-2xl)
    // Make sure we include paymentStatus: 'paid' and correct createdAt date to satisfy calculations!
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
            amount: 12456800,
            status: 'active',
            paymentStatus: 'paid',
            createdAt: todayStr
          }
        ])
      });
    });

    await page.route('**/api/parents**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: parentId, name: 'John Smith', phone: '0123456789', email: 'john@smith.com', status: 'Active', role: 'parent', createdAt: todayStr }
        ])
      });
    });

    await page.route('**/api/students**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: studentId, name: 'Alice Smith', parentId: parentId, status: 'Active' }
        ])
      });
    });

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
            status: 'active',
            branchIds: [branchId],
            branchSettings: [
              { branchId: branchId, startDate: '2026-05-01', endDate: '2026-08-31' }
            ]
          }
        ])
      });
    });

    // Navigate to Dashboard
    await Promise.all([
      page.waitForResponse('**/api/enrollments**'),
      page.waitForResponse('**/api/parents**'),
      page.waitForResponse('**/api/students**'),
      page.waitForResponse('**/api/terms**'),
      page.goto('/dashboard')
    ]);

    // 2. Verify calculated Weekly/Total stats are displayed accurately inside DataMetricCards
    const thisWeekSection = page.locator('section:has-text("This Week")');
    await expect(thisWeekSection).toBeVisible();

    // Verify dynamic text-2xl is applied to the long revenue value ($12,456,800.00) on the dashboard metrics
    const weeklyRevenueCard = thisWeekSection.locator('.ui-metric-card:has-text("Payments")');
    await expect(weeklyRevenueCard).toBeVisible();
    
    // Revenue formatted as "$12456800" -> string length is 9 (> 8) -> text-2xl font class should be applied
    const longValueResized = weeklyRevenueCard.locator('.text-2xl');
    await expect(longValueResized).toBeVisible();
    await expect(longValueResized).toHaveText('$12456800');

    // 3. Verify Active Term Panel is rendering on the Dashboard Sidebar
    const activeTermPanel = page.locator('span:has-text("Active Academic Term")');
    await expect(activeTermPanel).toBeVisible();
    
    // Validate initial active term name
    const activeTermName = page.locator('.relative.overflow-hidden span:has-text("Summer 2026")').first();
    await expect(activeTermName).toBeVisible();
  });

  test('should render fetched data accurately inside the ParentActionModal', async ({ page }) => {
    // Mock parents list
    await page.route('**/api/parents**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: parentId, name: 'John Smith', phone: '0123456789', email: 'john@smith.com', status: 'Active' }
        ])
      });
    });

    await Promise.all([
      page.waitForResponse('**/api/parents**'),
      page.goto('/parents')
    ]);

    // Wait for row to render before executing actions
    const parentRow = page.locator('text=John Smith').first();
    await expect(parentRow).toBeVisible();

    // Click row action menu button (⋮) to trigger the row actions
    const actionMenuButton = page.locator('.ui-action-menu button').first();
    await expect(actionMenuButton).toBeVisible();
    await actionMenuButton.click();

    // Click "Edit" action inside action menu
    const editButton = page.locator('.ui-dropdown-menu button:has-text("Edit")');
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Verify Parent modal loaded and renders fetched parent inputs
    const modalTitle = page.locator('text=Edit Parent').first();
    await expect(modalTitle).toBeVisible();

    // Validate that inputs display fetched parent data correctly
    const nameInput = page.locator('input[placeholder="Registry name"]').first();
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveValue('John Smith');

    const emailInput = page.locator('input[placeholder="email@address.com"]').first();
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveValue('john@smith.com');
  });
});
