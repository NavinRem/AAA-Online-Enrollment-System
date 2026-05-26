import { test, expect } from '@playwright/experimental-ct-vue';
import AppSelect from './AppSelect.vue';

test.use({ viewport: { width: 500, height: 500 } });

const mockItems = [
  { id: '1', name: 'Option A' },
  { id: '2', name: 'Option B' },
  { id: '3', name: 'Option C' },
];

test('renders correctly with placeholder', async ({ mount }) => {
  const component = await mount(AppSelect, {
    props: {
      items: mockItems,
      placeholder: 'Select an option',
      label: 'Dropdown',
    },
  });

  await expect(component).toContainText('Dropdown');
  await expect(component).toContainText('Select an option');
});

test('opens dropdown on click and displays items', async ({ mount, page }) => {
  const component = await mount(AppSelect, {
    props: {
      items: mockItems,
    },
  });

  await component.click();
  const dropdown = page.locator('ul');
  await expect(dropdown).toBeVisible();
  await expect(dropdown.locator('li')).toHaveCount(3);
  await expect(dropdown).toContainText('Option B');
});

test('filters items using search query', async ({ mount, page }) => {
  const component = await mount(AppSelect, {
    props: {
      items: mockItems,
      searchable: true,
    },
  });

  await component.click();
  const searchInput = page.locator('input[type="text"]');
  await searchInput.fill('Option C');

  const dropdown = page.locator('ul');
  await expect(dropdown.locator('li')).toHaveCount(1);
  await expect(dropdown).toContainText('Option C');
});

test('emits update:modelValue when an item is selected', async ({ mount, page }) => {
  let selectedValue = null;
  const component = await mount(AppSelect, {
    props: {
      items: mockItems,
      modelValue: '',
    },
    on: {
      'update:modelValue': (v) => { selectedValue = v; },
    },
  });

  await component.click();
  await page.locator('li').filter({ hasText: 'Option B' }).click();

  expect(selectedValue).toBe('2');
});
