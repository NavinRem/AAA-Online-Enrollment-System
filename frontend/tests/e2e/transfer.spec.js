import { test, expect } from '@playwright/test';

test.describe('Enrollment Transfer Process', () => {
  // We use the live deployed site to get beautiful UI screenshots for the presentation!
  test.use({ baseURL: 'https://aaa-online-registration-e3833.web.app' });

  test('Transfer a student to a new class', async ({ page }) => {
    // 1. Go to the live login page
    await page.goto('/login');

    // Please replace with your actual test account credentials to log in!
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();

    // 2. Wait for login to complete and dashboard to load
    await expect(page).toHaveURL(/.*dashboard/);

    // 3. Navigate to the Enrollments page via the sidebar
    await page.click('text="Enrollments"');
    
    // Wait for the enrollment list to be visible
    await expect(page.locator('table')).toBeVisible();

    // 4. Click the Action Menu (3 dots) of the first enrollment record
    // In our Vue app, the action menu is a button containing '⋮'
    const actionMenuButton = page.locator('button:has-text("⋮")').first();
    await actionMenuButton.click();

    // 5. Click 'Transfer Class' from the dropdown menu to open the Enrollment Action Modal
    await page.click('button:has-text("Transfer Class")');

    // Wait for the modal to fully appear
    await expect(page.locator('text="Transfer Enrollment"')).toBeVisible();

    // 6. Transfer process: Change the Term or Class!
    // We open the 'Available Classes' dropdown (termOfferingId) and select a new class.
    // The placeholder or label contains 'Available Classes'
    await page.locator('text="Available Classes"').locator('..').click();
    
    // Pick the second option in the dropdown (index 1) to simulate a class transfer
    const newClassOption = page.locator('.ui-dropdown-menu li').nth(1);
    await newClassOption.click();

    // 7. (Optional) Set Transferred Sessions Credit
    // Assuming we want to credit 2 previous sessions
    const transferredSessionsInput = page.locator('label:has-text("Prior Paid Sessions Credit")').locator('..').locator('input');
    if (await transferredSessionsInput.isVisible()) {
      await transferredSessionsInput.fill('2');
    }

    // 8. Wait a brief moment to let animations settle for a nice screenshot!
    await page.waitForTimeout(1000);

    // TAKE SCREENSHOT BEFORE SUBMITTING
    await page.screenshot({ path: 'test-results/transfer-process-ready.png' });

    // 9. Click Save to execute the transfer
    await page.click('button:has-text("Save")');

    // 10. Verify the "Successfully transferred enrollment!" toast/message
    const successToast = page.locator('text="Successfully transferred enrollment!"');
    await expect(successToast).toBeVisible({ timeout: 5000 });

    // TAKE FINAL SUCCESS SCREENSHOT
    await page.screenshot({ path: 'test-results/transfer-process-success.png' });
  });
});
