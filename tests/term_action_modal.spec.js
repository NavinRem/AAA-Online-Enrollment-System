import { test, expect } from '@playwright/test'

test.describe('TermActionModal Component Rendering & Date Mathematics Spec', () => {
  const branchMainId = 'branch-main'
  const branchWestId = 'branch-west'
  const termId = 'term-1'

  test.beforeEach(async ({ page }) => {
    // Inject Playwright Authentication Mock Flag
    await page.addInitScript(() => {
      globalThis.__playwright_mock_auth__ = true
    })

    // Mock Authentication and Profile
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

    await page.route('**/api/auth/role/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ role: 'admin' }),
      })
    })

    // Mock Branches
    await page.route('**/api/branches**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: branchMainId, name: 'Main Campus', abbr: 'MC', color: 'blue' },
          { id: branchWestId, name: 'West Campus', abbr: 'WC', color: 'green' },
        ]),
      })
    })

    // Mock Programs, Classes, Categories, Schedules, Trials
    await page.route('**/api/programs**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      })
    })
    await page.route('**/api/categories**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      })
    })
    await page.route('**/api/schedules**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      })
    })
    await page.route('**/api/classes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      })
    })
    await page.route('**/api/trials**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      })
    })
    await page.route('**/api/parents**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      })
    })
    await page.route('**/api/students**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      })
    })
    await page.route('**/api/enrollments**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
      })
    })
  })

  test('should accurately calculate date math and handle empty vs populated branches', async ({
    page,
  }) => {
    // Mock terms list returning an active term
    await page.route('**/api/terms**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: termId,
            name: 'Summer 2026',
            startDate: '2026-05-01',
            endDate: '2026-07-17',
            totalSessions: 12,
            status: 'active',
            branchIds: [branchMainId],
          },
        ]),
      })
    })

    await page.goto('/terms')

    // Wait for the term list page to load and trigger the action modal
    const toolbarNewButton = page.locator('button:has-text("Add Term")').first()
    await expect(toolbarNewButton).toBeVisible()
    await toolbarNewButton.click()

    // Verify modal has rendered with correct "Add Term" title
    const modalTitle = page.locator('h3:has-text("Add Term")').first()
    await expect(modalTitle).toBeVisible()

    // 1. Boundary Checklist B: Empty branch state (Global Start Date Input is visible)
    const globalStartDateInput = page
      .locator('form > div:not(.border-t) input[type="date"]')
      .first()
    await expect(globalStartDateInput).toBeVisible()

    // 2. Boundary Checklist C: Calculated Data Math (totalSessions watch calculation)
    // Populate Term Name
    const nameInput = page
      .locator('div:has(> label:has-text("Term Name")) input')
      .first()
    await nameInput.fill('Autumn 2026 Test')

    // Populate global startDate = 2026-05-01
    await globalStartDateInput.fill('2026-05-01')

    // Verify that global endDate is automatically calculated as: 2026-05-01 + (11 - 1) * 7 days = 2026-07-10
    const calculatedEndDateInput = page
      .locator('div:has(> label:has-text("Auto-calculated End Date")) input')
      .first()
    await expect(calculatedEndDateInput).toHaveValue('2026-07-10')

    // Change total sessions from 11 to 12
    const sessionsInput = page
      .locator('div:has(> label:has-text("Total Sessions")) input')
      .first()
    await sessionsInput.fill('12')

    // Verify that global endDate reactively changes to: 2026-05-01 + (12 - 1) * 7 days = 2026-07-17
    await expect(calculatedEndDateInput).toHaveValue('2026-07-17')

    // 3. Boundary Checklist B: Populated branch state (Branch-Specific Scheduling Grid)
    // Open Branch selection dropdown
    const dropdownTrigger = page.locator('text=Select branches...').first()
    await expect(dropdownTrigger).toBeVisible()
    await dropdownTrigger.click()

    // Select "Main Campus" from the options list
    const branchCheckbox = page.locator('input[type="checkbox"]').first()
    await expect(branchCheckbox).toBeVisible()
    await branchCheckbox.check()

    // Click outside to close dropdown
    await nameInput.click()

    // Verify that global startDate is now hidden and Branch-Specific Scheduling block is rendered
    await expect(globalStartDateInput).not.toBeVisible()

    const branchSchedulingSection = page
      .locator('text=Branch-Specific Scheduling')
      .first()
    await expect(branchSchedulingSection).toBeVisible()

    // Verify that the branch-specific row inherits our configured global startDate (2026-05-01) and calculates endDate correctly
    const branchStartDateInput = page.locator('.p-4 input[type="date"]').first()
    await expect(branchStartDateInput).toHaveValue('2026-05-01')

    const branchEndDateInput = page.locator('.p-4 input[type="date"]').last()
    await expect(branchEndDateInput).toHaveValue('2026-07-17')
  })
})
