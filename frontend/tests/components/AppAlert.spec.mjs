import { test, expect } from '@playwright/experimental-ct-vue';
import AppAlert from './AppAlert.vue';

test.use({ viewport: { width: 800, height: 600 } });

test('does not render when show is false', async ({ mount }) => {
  const component = await mount(AppAlert, {
    props: {
      show: false,
    },
  });
  await expect(component).not.toBeVisible();
});

test('renders correctly with default props', async ({ mount }) => {
  const component = await mount(AppAlert, {
    props: {
      message: 'Information alert',
    },
  });
  await expect(component).toBeVisible();
  await expect(component).toContainText('Information alert');
  await expect(component).toHaveClass(/bg-info-soft/);
});

test('applies variant classes correctly', async ({ mount }) => {
  const component = await mount(AppAlert, {
    props: {
      type: 'error',
      message: 'Error message',
    },
  });
  await expect(component).toHaveClass(/bg-error-soft/);
});

test('emits close event when close button is clicked', async ({ mount }) => {
  let closed = false;
  const component = await mount(AppAlert, {
    props: {
      closable: true,
      message: 'Closable alert',
    },
    on: {
      close: () => { closed = true; },
    },
  });
  
  await component.locator('button').click();
  expect(closed).toBe(true);
});
