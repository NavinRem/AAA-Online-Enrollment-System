import { test, expect } from '@playwright/test'

test.describe('Program Detail View', () => {
  const programId = 'test-program-123'

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

    // Mock the Program Data API
    await page.route(`**/api/programs/${programId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: programId,
          name: 'Playwright Test Program',
          category: 'Automation',
          level: 'Advanced',
          type: 'Group',
          basePrice: 500,
          totalSessions: 12,
          minAge: 5,
          maxAge: 12,
          duration: 60,
          status: 'active',
          description: 'A program created for automated testing logic.',
        }),
      })
    })

    // Mock Enrollments API to test revenue calculation logic
    await page.route('**/api/enrollments**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'e1',
            programId: programId,
            amount: 500,
            paymentStatus: 'paid',
            status: 'paid',
            studentId: 's1',
          },
          {
            id: 'e2',
            programId: programId,
            amount: 500,
            paymentStatus: 'paid',
            status: 'paid',
            studentId: 's2',
          },
          {
            id: 'e3',
            programId: 'other-id',
            amount: 999,
            paymentStatus: 'paid',
            status: 'paid',
            studentId: 's3',
          }, // Should be filtered out
        ]),
      })
    })

    // Mock other necessary APIs with empty or minimal data
    await page.route('**/api/classes**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) })
    })
    await page.route('**/api/students**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) })
    })
    await page.route('**/api/trials**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) })
    })
    await page.route('**/api/categories**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) })
    })
    await page.route('**/api/branches**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) })
    })
    await page.route('**/api/terms**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify([]) })
    })

    // Go to the program detail page
    await page.goto(`/programs/${programId}`)
  })

  test('should render basic program information correctly', async ({
    page,
  }) => {
    // Check Title
    await expect(page.locator('h2:has-text("Basic Information")')).toBeVisible()

    // Check Program Name in details
    await expect(page.locator('text=Program Name:')).toBeVisible()
    await expect(page.locator('text=Playwright Test Program')).toBeVisible()

    // Check Price rendering logic
    await expect(page.locator('text=$500')).toBeVisible()
  })

  test('should calculate metrics correctly from mocked data', async ({
    page,
  }) => {
    // Logic: 2 enrollments of $500 each = $1,000 Total Revenue
    // Unique students = 2

    const revenueCard = page.locator('.ui-metric-card', {
      hasText: 'Total Revenue',
    })
    await expect(revenueCard).toContainText('$1,000')

    const studentCard = page.locator('.ui-metric-card', {
      hasText: 'Total Students',
    })
    await expect(studentCard).toContainText('2')
  })

  test('should switch tabs and update table content', async ({ page }) => {
    // Default tab is usually 'schedule' (based on ProgramDetail.vue code)
    await expect(page.locator('text=Program Schedule')).toBeVisible()

    // Click 'Teachers' tab
    await page.click('button:has-text("Teachers")')
    await expect(page.locator('text=Faculty Registry')).toBeVisible()

    // Click 'Students' tab
    await page.click('button:has-text("Students")')
    await expect(page.locator('text=Student Roster')).toBeVisible()
  })
})
