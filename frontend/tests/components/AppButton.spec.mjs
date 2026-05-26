import { test, expect } from '@playwright/experimental-ct-vue';
import AppButton from './AppButton.vue';

test.use({ viewport: { width: 500, height: 500 } });

test('renders correctly with default props', async ({ mount }) => {
  const component = await mount(AppButton, {
    slots: {
      default: 'Click Me',
    },
  });
  await expect(component).toBeVisible();
  await expect(component).toContainText('Click Me');
  await expect(component).toHaveClass(/bg-primary/);
});

test('applies disabled state correctly', async ({ mount }) => {
  const component = await mount(AppButton, {
    props: {
      disabled: true,
    },
    slots: {
      default: 'Disabled',
    },
  });
  
  await expect(component).toBeDisabled();
  await expect(component).toHaveClass(/opacity-60/);
});

test('emits click event', async ({ mount }) => {
  let clicked = false;
  const component = await mount(AppButton, {
    slots: {
      default: 'Click Action',
    },
    on: {
      click: () => { clicked = true; },
    },
  });
  
  await component.click();
  expect(clicked).toBe(true);
});

test('renders size classes correctly', async ({ mount }) => {
  const component = await mount(AppButton, {
    props: {
      size: 'lg',
    },
    slots: {
      default: 'Large Button',
    },
  });
  await expect(component).toHaveClass(/px-8/);
});
