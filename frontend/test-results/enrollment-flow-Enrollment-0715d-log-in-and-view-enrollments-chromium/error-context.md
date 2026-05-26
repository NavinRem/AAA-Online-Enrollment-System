# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: enrollment-flow.spec.mjs >> Enrollment Dashboard Flow >> User can log in and view enrollments
- Location: tests/e2e/enrollment-flow.spec.mjs:4:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Dashboard')
Expected: visible
Error: strict mode violation: locator('text=Dashboard') resolved to 3 elements:
    1) <span class="whitespace-nowrap">Dashboard</span> aka getByRole('link', { name: 'Dashboard Dashboard' })
    2) <h1 data-v-ba71bbfd="" class="topbar-title">Dashboard</h1> aka getByRole('heading', { name: 'Dashboard' })
    3) <p data-v-7f773d42="" class="font-semibold text-sm opacity-70">Loading Dashboard Data...</p> aka getByText('Loading Dashboard Data...')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Dashboard')

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - complementary [ref=e5]:
    - generic [ref=e6]:
      - img "Logo" [ref=e8]
      - generic [ref=e10]: Authentic Advanced Academy
    - navigation [ref=e11]:
      - link "Dashboard Dashboard" [ref=e12] [cursor=pointer]:
        - /url: /dashboard
        - img "Dashboard" [ref=e13]
        - generic [ref=e14]: Dashboard
      - link "Enrollments Enrollments" [ref=e15] [cursor=pointer]:
        - /url: /enrollments
        - img "Enrollments" [ref=e16]
        - generic [ref=e17]: Enrollments
      - link "Trials Trials" [ref=e18] [cursor=pointer]:
        - /url: /trials
        - img "Trials" [ref=e19]
        - generic [ref=e20]: Trials
      - link "Branches Branches" [ref=e21] [cursor=pointer]:
        - /url: /branches
        - img "Branches" [ref=e22]
        - generic [ref=e23]: Branches
      - link "Teachers Teachers" [ref=e24] [cursor=pointer]:
        - /url: /teachers
        - img "Teachers" [ref=e25]
        - generic [ref=e26]: Teachers
      - link "Parents Parents" [ref=e27] [cursor=pointer]:
        - /url: /parents
        - img "Parents" [ref=e28]
        - generic [ref=e29]: Parents
      - link "Students Students" [ref=e30] [cursor=pointer]:
        - /url: /students
        - img "Students" [ref=e31]
        - generic [ref=e32]: Students
      - link "Programs Programs" [ref=e33] [cursor=pointer]:
        - /url: /programs
        - img "Programs" [ref=e34]
        - generic [ref=e35]: Programs
      - link "Classes Classes" [ref=e36] [cursor=pointer]:
        - /url: /classes
        - img "Classes" [ref=e37]
        - generic [ref=e38]: Classes
      - link "Payments Payments" [ref=e39] [cursor=pointer]:
        - /url: /payment
        - img "Payments" [ref=e40]
        - generic [ref=e41]: Payments
      - link "Terms Terms" [ref=e42] [cursor=pointer]:
        - /url: /terms
        - img "Terms" [ref=e43]
        - generic [ref=e44]: Terms
      - link "Settings Settings" [ref=e45] [cursor=pointer]:
        - /url: /settings
        - img "Settings" [ref=e46]
        - generic [ref=e47]: Settings
    - button "Log Out" [ref=e49] [cursor=pointer]:
      - generic [ref=e50]: Log Out
  - generic [ref=e51]:
    - banner [ref=e52]:
      - heading "Dashboard" [level=1] [ref=e54]
      - generic [ref=e56]:
        - img
        - textbox "Search something..." [ref=e57]
      - generic [ref=e58]:
        - button "Notifications" [ref=e59] [cursor=pointer]:
          - img "Notifications" [ref=e60]
        - button "Settings" [ref=e61] [cursor=pointer]:
          - img "Settings" [ref=e62]
        - generic [ref=e63] [cursor=pointer]:
          - generic [ref=e64]:
            - generic [ref=e65]: Loading...
            - generic [ref=e66]: ...
          - img "Profile" [ref=e68]
    - main [ref=e69]:
      - paragraph [ref=e72]: Loading Dashboard Data...
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Enrollment Dashboard Flow', () => {
  4  |   test('User can log in and view enrollments', async ({ page }) => {
  5  |     // 1. Navigate to the app
  6  |     await page.goto('/');
  7  | 
  8  |     // 2. Log in
  9  |     await page.fill('input[type="email"]', 'admin@academy.com');
  10 |     await page.fill('input[type="password"]', 'AAA123456');
  11 |     await page.click('button[type="submit"]');
  12 | 
  13 |     // 3. Wait for dashboard
  14 |     await page.waitForURL('**/dashboard');
> 15 |     await expect(page.locator('text=Dashboard')).toBeVisible();
     |                                                  ^ Error: expect(locator).toBeVisible() failed
  16 | 
  17 |     // 4. Navigate to Enrollments
  18 |     // Look for the enrollments link in the sidebar or just go directly
  19 |     await page.goto('/enrollments');
  20 |     await page.waitForSelector('text=Enrollments', { timeout: 10000 });
  21 | 
  22 |     // 5. Verify data table renders
  23 |     const table = page.locator('table').first();
  24 |     await expect(table).toBeVisible();
  25 | 
  26 |     // 6. Verify we have some enrollment rows
  27 |     // It should load some data
  28 |     await page.waitForSelector('.ui-row', { timeout: 10000 });
  29 |     const rows = page.locator('.ui-row');
  30 |     const rowCount = await rows.count();
  31 |     expect(rowCount).toBeGreaterThan(0);
  32 |   });
  33 | });
  34 | 
```