import { test, expect } from '@playwright/test'

test.describe('Dashboard Management & Analytics View', () => {
  const branchId1 = 'branch-main'
  const branchId2 = 'branch-west'
  const termId = 'term-active'

  test.beforeEach(async ({ page }) => {
    // Inject Playwright Authentication Mock Flag
    await page.addInitScript(() => {
      globalThis.__playwright_mock_auth__ = true
    })

    // Mock Authentication
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          uid: 'admin-1',
          role: 'admin',
          email: 'admin@aaa.com',
        }),
      })
    })

    await page.route('**/api/auth/profile/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          uid: 'admin-1',
          role: 'admin',
          name: 'Admin User',
          email: 'admin@aaa.com',
        }),
      })
    })

    // Mock Branches
    await page.route('**/api/branches', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: branchId1,
            name: 'Main Campus',
            code: 'MC',
            color: '#8B5CF6',
            abbr: 'MC',
          },
          {
            id: branchId2,
            name: 'West Campus',
            code: 'WC',
            color: '#10B981',
            abbr: 'WC',
          },
        ]),
      })
    })

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
              {
                branchId: branchId1,
                startDate: '2026-05-01',
                endDate: '2026-08-31',
              },
            ],
          },
        ]),
      })
    })

    // Mock Parents
    await page.route('**/api/parents**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'p1',
            name: 'John Doe',
            role: 'parent',
            status: 'Active',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'p2',
            name: 'Jane Smith',
            role: 'parent',
            status: 'Inactive',
            createdAt: new Date().toISOString(),
          },
        ]),
      })
    })

    // Mock Students
    await page.route('**/api/students**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 's1',
            name: 'Jimmy Doe',
            parentId: 'p1',
            status: 'active',
            createdAt: new Date().toISOString(),
          },
          {
            id: 's2',
            name: 'Janey Smith',
            parentId: 'p2',
            status: 'active',
            createdAt: new Date().toISOString(),
          },
        ]),
      })
    })

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
            createdAt: new Date().toISOString(),
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
            createdAt: new Date().toISOString(),
          },
        ]),
      })
    })

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
            createdAt: new Date().toISOString(),
          },
        ]),
      })
    })

    // Mock Classes
    await page.route('**/api/classes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'c1', programId: 'pr1', branchId: branchId1, isDeleted: false },
        ]),
      })
    })

    // Mock Programs
    await page.route('**/api/programs**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'pr1', name: 'Coding for Kids', basePrice: 200 },
        ]),
      })
    })

    await page.route('**/api/categories**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) })
    })

    await page.route('**/api/schedules**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) })
    })

    const termsPromise = page.waitForResponse('**/api/terms**')
    await page.goto('/dashboard')
    await termsPromise
  })

  test('should render the today summary and weekly metrics correctly', async ({
    page,
  }) => {
    // Expect header
    await expect(page.locator('h2:has-text("Today Summary")')).toBeVisible()
    await expect(page.locator('h2:has-text("This Week")')).toBeVisible()

    // Verify metric cards exist and contain correct aggregated values
    await expect(
      page.locator('.ui-metric-card', { hasText: 'Today New Accounts' }),
    ).toContainText('2')
    await expect(
      page.locator('.ui-metric-card', { hasText: 'Today Enrollments' }),
    ).toContainText('2')
    await expect(
      page.locator('.ui-metric-card', { hasText: 'Today Trial Class' }),
    ).toContainText('1')
    await expect(
      page.locator('.ui-metric-card', { hasText: 'Today Payments' }),
    ).toContainText('$550')
  })

  test('should calculate sidebar totals correctly', async ({ page }) => {
    // Total Revenue is $550 ($250 + $300)
    const revenueCard = page.locator('.ui-mini-card', {
      hasText: 'Total Revenue',
    })
    await expect(revenueCard).toBeVisible()
    await expect(revenueCard).toContainText('$550')

    // Total Parents = 2
    const parentCard = page.locator('.ui-mini-card', {
      hasText: 'Total Parents',
    })
    await expect(parentCard).toContainText('2')

    // Total Students = 2
    const studentCard = page.locator('.ui-mini-card', {
      hasText: 'Total Students',
    })
    await expect(studentCard).toContainText('2')
  })

  test('should display active academic term correctly in sidebar', async ({
    page,
  }) => {
    await expect(
      page.locator('span:has-text("Active Academic Term")'),
    ).toBeVisible()
    await expect(
      page.locator('span:has-text("Active Summer Term")'),
    ).toBeVisible()
  })

  test('should display global active academic term (without branch-specific settings) correctly in sidebar', async ({
    page,
  }) => {
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
            totalSessions: 12,
          },
        ]),
      })
    })

    // Reload the page to apply the overridden mock
    const responsePromise = page.waitForResponse('**/api/terms**')
    await page.goto('/dashboard')
    await responsePromise

    // Verify it renders the global term panel successfully
    await expect(
      page.locator('span:has-text("Active Academic Term")'),
    ).toBeVisible()
    await expect(
      page.locator('span:has-text("Global Active Term")'),
    ).toBeVisible()
  })

  test('should display branch-specific archived and active terms with correct styles and handle upcoming terms', async ({
    page,
  }) => {
    // Override terms route to return:
    // 1. A partially archived active term (Main Campus MC is archived, West Campus WC is active)
    // 2. An upcoming term starting in the future
    await page.route('**/api/terms**', async (route) => {
      const today = new Date()

      const archivedEndDate = new Date()
      archivedEndDate.setDate(today.getDate() - 10) // 10 days ago

      const activeEndDate = new Date()
      activeEndDate.setDate(today.getDate() + 30) // 30 days from now

      const upcomingStartDate = new Date()
      upcomingStartDate.setDate(today.getDate() + 60) // 60 days from now
      const upcomingEndDate = new Date()
      upcomingEndDate.setDate(today.getDate() + 90) // 90 days from now

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'term-partially-archived',
            name: 'Term 1 - Partial',
            status: 'active',
            startDate: '2026-01-01',
            endDate: activeEndDate.toISOString().split('T')[0],
            branchIds: [branchId1, branchId2],
            totalSessions: 12,
            branchSettings: [
              {
                branchId: branchId1,
                startDate: '2026-01-01',
                endDate: archivedEndDate.toISOString().split('T')[0],
              },
              {
                branchId: branchId2,
                startDate: '2026-01-01',
                endDate: activeEndDate.toISOString().split('T')[0],
              },
            ],
          },
          {
            id: 'term-upcoming',
            name: 'Term 2 - Future',
            status: 'upcoming',
            startDate: upcomingStartDate.toISOString().split('T')[0],
            endDate: upcomingEndDate.toISOString().split('T')[0],
            branchIds: [branchId1],
            totalSessions: 12,
            branchSettings: [
              {
                branchId: branchId1,
                startDate: upcomingStartDate.toISOString().split('T')[0],
                endDate: upcomingEndDate.toISOString().split('T')[0],
              },
            ],
          },
        ]),
      })
    })

    // Reload the page to apply the overridden mock
    const responsePromise = page.waitForResponse('**/api/terms**')
    await page.goto('/dashboard')
    await responsePromise

    // 1. Verify Term 1 (Partial) renders first
    await expect(
      page.locator('span:has-text("Active Academic Term")'),
    ).toBeVisible()
    await expect(
      page.locator('span:has-text("Term 1 - Partial")'),
    ).toBeVisible()

    // Scope to the specific Academic Term card container
    const termCard = page.locator('.relative.overflow-hidden', {
      hasText: 'Academic Term',
    })

    // 2. Verify archived vs active branch setting styles
    // The group for branchId1 (Main Campus / MC) is archived, so it should have the 'bg-surface-subtle' and 'opacity-60' classes
    const mcGroup = termCard
      .locator('div[class*="pb-3"], div[class*="last:pb-0"]', {
        has: page.locator('span', { hasText: 'MC' }),
      })
      .first()
    const archivedGroup = mcGroup.locator('div.rounded-full')
    await expect(archivedGroup).toHaveClass(/bg-surface-subtle/)
    await expect(archivedGroup).toHaveClass(/opacity-60/)

    // The group for branchId2 (West Campus / WC) is active, so it should not be muted/archived
    const wcGroup = termCard
      .locator('div[class*="pb-3"], div[class*="last:pb-0"]', {
        has: page.locator('span', { hasText: 'WC' }),
      })
      .first()
    const activeGroup = wcGroup.locator('div.rounded-full')
    await expect(activeGroup).not.toHaveClass(/bg-surface-subtle/)
    await expect(activeGroup).not.toHaveClass(/opacity-60/)

    // 3. Verify cycling transition (runs every 5 seconds)
    // Wait for the term to cycle to "Term 2 - Future"
    await page.waitForTimeout(6000)

    // 4. Verify Term 2 (Upcoming) is now displayed
    await expect(
      page.locator('span:has-text("Upcoming Academic Term")'),
    ).toBeVisible()
    await expect(page.locator('span:has-text("Term 2 - Future")')).toBeVisible()
  })
})
