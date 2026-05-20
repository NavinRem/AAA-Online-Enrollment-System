import { test, expect } from '@playwright/experimental-ct-vue';
import AppModal from '@/components/common/ui/AppModal.vue';

test.use({
  ctViteConfig: {
    resolve: {
      alias: {
        '@/utils/assetHelper': '/tests/components/mocks/assetHelperMock.js'
      }
    }
  }
});

test.describe('AppModal.vue', () => {
  test('does not render when show is false', async ({ mount }) => {
    const component = await mount(AppModal, {
      props: { show: false }
    });
    
    // The outer div should not be visible
    await expect(component).not.toBeVisible();
  });

  test('renders modal content when show is true', async ({ mount }) => {
    const component = await mount(AppModal, {
      props: {
        show: true,
        title: 'Test Modal'
      },
      slots: {
        default: '<div class="test-body">Body Content</div>'
      }
    });
    
    await expect(component).toBeVisible();
    await expect(component).toContainText('Test Modal');
    await expect(component.locator('.test-body')).toBeVisible();
  });

  test('emits close event when backdrop or close button is clicked', async ({ mount }) => {
    let closeCount = 0;
    const component = await mount(AppModal, {
      props: { show: true },
      on: {
        close: () => closeCount++
      }
    });
    
    // Click backdrop (position is outside the modal box container)
    await component.click({ position: { x: 5, y: 5 }, force: true });
    
    // Click close button
    await component.locator('button.cursor-pointer').click();
    
    // Check if it was emitted twice
    expect(closeCount).toBe(2);
  });

  test('renders footer slot correctly', async ({ mount }) => {
    const component = await mount(AppModal, {
      props: { show: true },
      slots: {
        footer: '<button class="footer-btn">Action</button>'
      }
    });
    
    await expect(component.locator('.footer-btn')).toBeVisible();
  });

  test('renders error alert when error prop is provided', async ({ mount }) => {
    const component = await mount(AppModal, {
      props: {
        show: true,
        error: 'Test Error Message'
      }
    });
    
    await expect(component).toContainText('Test Error Message');
  });
});
