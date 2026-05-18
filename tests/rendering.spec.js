/* global console */
import { test, expect } from '@playwright/test'

test.describe('Frontend Rendering Vulnerability & Type Coercion Safety', () => {
  test.beforeEach(async ({ page }) => {
    // Enable browser console & error mirroring
    page.on('console', msg => console.log('RENDER TEST BROWSER LOG:', msg.text()))
    page.on('pageerror', err => console.error('RENDER TEST BROWSER ERROR:', err.message))

    // Inject Mock Auth bypass
    await page.addInitScript(() => {
      globalThis.__playwright_mock_auth__ = true
    })

    // Mock API Auth
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

    // Mock Branches with mixed ID types
    await page.route('**/api/branches**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Main Campus', abbr: 'MC', color: 'blue' },
          { id: 'branch-2', name: 'West Campus', abbr: 'WC', color: 'green' },
        ]),
      })
    })

    // Mock Categories with mixed ID types
    await page.route('**/api/categories**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 101,
            name: 'Robotics',
            profileURL: 'https://images.unsplash.com/photo-robot',
          },
        ]),
      })
    })

    // Mock Levels
    await page.route('**/api/levels**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 201, name: 'Beginner' }]),
      })
    })

    // Mock single program explicitly to guarantee match without glob conflicts
    await page.route('**/api/programs/test-program-mixed', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-program-mixed',
          name: 'Coerced AI Class',
          categoryId: '101', // Stringified numeric ID matching category.id = 101
          category: 'Robotics',
          levelId: 201,
          type: 'Group',
          basePrice: 350,
          totalSessions: 10,
          duration: 90,
          minAge: 8,
          maxAge: 16,
        }),
      })
    })

    // Mock list of programs explicitly
    await page.route('**/api/programs', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'test-program-mixed',
              name: 'Coerced AI Class',
              categoryId: '101',
              category: 'Robotics',
              levelId: 201,
              type: 'Group',
              basePrice: 350,
            },
          ]),
        })
      } else {
        await route.continue()
      }
    })

    // Mock Enrollments
    await page.route('**/api/enrollments**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    // Mock Classes
    await page.route('**/api/classes**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    // Mock Students
    await page.route('**/api/students**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    // Mock Trials
    await page.route('**/api/trials**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    // Mock Terms
    await page.route('**/api/terms**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    // Mock auth profile for topbar to prevent leaking to backend
    await page.route('**/api/auth/profile/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          uid: 'admin-1',
          name: 'Admin User',
          email: 'admin@aaa.com',
          role: 'admin',
        }),
      })
    })

    // Mock auth role to prevent leaking to backend
    await page.route('**/api/auth/role/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ role: 'admin' }),
      })
    })
  })

  test('should render ProgramDetail view correctly with coerced Category ID', async ({
    page,
  }) => {
    // Collect browser console messages and errors
    const errors = []
    page.on('pageerror', (err) => errors.push(err.message))

    // Navigate to program detail
    await page.goto('/programs/test-program-mixed')

    // Expect program name to load correctly
    await expect(page.locator('text=Coerced AI Class')).toBeVisible()

    // Confirm that category has hydrated successfully without crashing
    await expect(page.locator('text=Robotics')).toBeVisible()

    // Confirm no JS console errors were raised during dynamic category lookup hydration
    expect(errors).toHaveLength(0)
  })

  test('should render ProgramActionModal with coerced categories and levels', async ({ page }) => {
    const errors = []
    page.on('pageerror', (err) => errors.push(err.message))

    // Navigate to Programs list page
    await page.goto('/programs')

    // Click "New Program" button to open ProgramActionModal
    await page.click('button:has-text("New Program")')

    // Wait for the modal elements to be visible
    await expect(page.locator('text=Add Program').first()).toBeVisible()

    // Assert that the modal renders and hydrates successfully without any exceptions
    expect(errors).toHaveLength(0)
  })

  test('should handle TrialFormModal parent and student filtering with type coercion', async ({ page }) => {
    const errors = []
    page.on('pageerror', (err) => errors.push(err.message))

    // Mock parents and student list
    await page.route('**/api/parents**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 12345, name: 'Coerced Parent Doe' }])
      })
    })

    await page.route('**/api/students**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 9876, name: 'Coerced Student Doe', parentId: '12345' }]) // parentId is stringified
      })
    })

    // Navigate to Trials page
    await page.goto('/trials')

    // Click "New Trial" button to open TrialFormModal
    await page.click('button:has-text("New Trial")')

    // Verify modal elements are visible
    await expect(page.locator('text=Book New Trial Session')).toBeVisible()

    // Assert no exceptions occurred
    expect(errors).toHaveLength(0)
  })
})
