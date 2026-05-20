import { test, expect } from '@playwright/experimental-ct-vue';
import AppButton from '@/components/common/ui/AppButton.vue';

test.describe('AppButton.vue', () => {
  test('renders default slot content', async ({ mount }) => {
    const component = await mount(AppButton, {
      slots: {
        default: 'Click Me'
      }
    });
    await expect(component).toContainText('Click Me');
  });

  test('emits click event when clicked', async ({ mount }) => {
    let clickCount = 0;
    const component = await mount(AppButton, {
      on: {
        click: () => clickCount++
      }
    });
    await component.click();
    expect(clickCount).toBe(1);
  });

  test('does not emit click when disabled', async ({ mount }) => {
    let clickCount = 0;
    const component = await mount(AppButton, {
      props: { disabled: true },
      on: {
        click: () => clickCount++
      }
    });
    
    // Playwright natively respects disabled buttons
    await component.click({ force: true });
    expect(clickCount).toBe(0);
    await expect(component).toBeDisabled();
  });

  test('shows loading spinner and disables click when loading is true', async ({ mount }) => {
    const component = await mount(AppButton, {
      props: { loading: true }
    });
    await expect(component).toBeDisabled();
    await expect(component.locator('.animate-spin')).toBeAttached();
  });

  test('applies variant classes correctly', async ({ mount }) => {
    const component = await mount(AppButton, {
      props: { variant: 'danger' }
    });
    // Checks that the tailwind class mapped to "danger" is present
    await expect(component).toHaveClass(/bg-error/);
  });

  test('hides default slot when iconOnly is true', async ({ mount }) => {
    const component = await mount(AppButton, {
      props: { iconOnly: true },
      slots: { default: 'Hidden Text' }
    });
    await expect(component).not.toContainText('Hidden Text');
  });
});
