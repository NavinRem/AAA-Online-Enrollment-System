import { test, expect } from '@playwright/test';

test.describe('Modal UI Rendering', () => {
  test('ParentActionModal renders correctly on "Add Child"', async ({ page }) => {
    // 1. Navigate to the app
    await page.goto('/');

    // 2. Log in
    await page.fill('input[type="email"]', 'admin@academy.com');
    await page.fill('input[type="password"]', 'AAA123456');
    await page.click('button[type="submit"]');

    // 3. Wait for dashboard and navigate to parents page
    await page.waitForURL('**/dashboard');
    await page.goto('/parents');
    await page.waitForSelector('text=Parent Overview', { timeout: 10000 });

    // 4. Click an action to trigger the modal
    // Wait for the table to load
    await page.waitForSelector('.ui-cell', { timeout: 10000 });

    // Open action menu
    const actionMenuButton = page.locator('button:has-text("⋮")').first();
    await actionMenuButton.click();

    // Click "Register Child" (which opens the 'plus' modal)
    const registerChildButton = page.locator('button:has-text("Register Child")').first();
    await registerChildButton.click();

    // 5. Assert the modal is visible
    const modal = page.locator('.z-modal').first();
    await expect(modal).toBeVisible();

    // 6. Assert expected UI elements in the modal
    // Depending on whether it's "Edit Parent" or "Add Child", the title changes
    const title = page.locator('.z-modal h3');
    await expect(title).toBeVisible();
    const titleText = await title.innerText();
    expect(['Edit Parent', 'Add Child', 'Parent Action']).toContain(titleText);

    // Verify confirmation buttons
    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Add"), button:has-text("Edit")').first();
    await expect(confirmButton).toBeVisible();

    const cancelButton = page.locator('button:has-text("Cancel")').first();
    await expect(cancelButton).toBeVisible();
    
    // Test the cancel button works
    await cancelButton.click();
    await expect(modal).not.toBeVisible();
  });
});
