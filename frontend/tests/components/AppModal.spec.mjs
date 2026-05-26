import { test, expect } from '@playwright/experimental-ct-vue';
import AppModal from './AppModal.vue';

test.use({ viewport: { width: 800, height: 600 } });

test('does not render when show is false', async ({ mount }) => {
  const component = await mount(AppModal, {
    props: {
      show: false,
    },
  });

  await expect(component).not.toBeVisible();
});

test('renders correctly when show is true', async ({ mount }) => {
  const component = await mount(AppModal, {
    props: {
      show: true,
      title: 'Modal Title',
    },
    slots: {
      default: 'Modal Content',
      footer: '<button>Save</button>',
    },
  });

  await expect(component).toBeVisible();
  await expect(component.locator('h3')).toContainText('Modal Title');
  await expect(component).toContainText('Modal Content');
  await expect(component.locator('button', { hasText: 'Save' })).toBeVisible();
});

test('emits close event when clicking outside or close button', async ({ mount }) => {
  let closed = false;
  const component = await mount(AppModal, {
    props: {
      show: true,
      title: 'Test Close',
    },
    on: {
      close: () => { closed = true; },
    },
  });

  // Click the close button
  await component.locator('button').first().click();
  expect(closed).toBe(true);

  // Reset and click backdrop
  closed = false;
  // Click backdrop (outside the inner div)
  await component.click({ position: { x: 10, y: 10 } });
  expect(closed).toBe(true);
});

test('shows error and success messages', async ({ mount }) => {
  const component = await mount(AppModal, {
    props: {
      show: true,
      error: 'Something went wrong',
      success: 'Operation successful',
    },
  });

  await expect(component).toContainText('Something went wrong');
  await expect(component).toContainText('Operation successful');
});
