import { test, expect } from '@playwright/experimental-ct-vue';
import SearchBox from './SearchBox.vue';

test.use({ viewport: { width: 500, height: 500 } });

test('renders correctly with placeholder', async ({ mount }) => {
  const component = await mount(SearchBox, {
    props: {
      placeholder: 'Search items...',
    },
  });

  await expect(component.locator('input')).toBeVisible();
  await expect(component.locator('input')).toHaveAttribute('placeholder', 'Search items...');
});

test('emits update:modelValue on input', async ({ mount }) => {
  const component = await mount(SearchBox, {
    props: {
      modelValue: '',
    },
  });

  const input = component.locator('input');
  await input.fill('test query');
  await expect(input).toHaveValue('test query');
});

test('applies variant classes correctly', async ({ mount }) => {
  const component = await mount(SearchBox, {
    props: {
      variant: 'light',
    },
  });

  await expect(component.locator('input')).toHaveClass(/bg-white border-white\/20/);
});
