import { test, expect } from '@playwright/experimental-ct-vue';
import DataTable from './DataTable.vue';

test.use({ viewport: { width: 800, height: 600 } });

const mockHeaders = [
  { label: 'Name', key: 'name' },
  { label: 'Role', key: 'role' },
  { label: 'Status', key: 'status' },
];

const mockItems = [
  { id: 1, name: 'Alice', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Bob', role: 'User', status: 'Inactive' },
];

test('renders table headers and items correctly', async ({ mount }) => {
  const component = await mount(DataTable, {
    props: {
      headers: mockHeaders,
      items: mockItems,
      title: 'Users Table',
    },
  });

  await expect(component).toContainText('Users Table');
  
  // Check headers
  const headers = component.locator('th');
  await expect(headers.first()).toContainText('Name');
  await expect(headers.nth(1)).toContainText('Role');

  // Check rows
  const rows = component.locator('tbody tr');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('Alice');
  await expect(rows.first()).toContainText('Admin');
  await expect(rows.nth(1)).toContainText('Bob');
});

test('shows loading state when loading is true', async ({ mount }) => {
  const component = await mount(DataTable, {
    props: {
      headers: mockHeaders,
      items: [],
      loading: true,
      loadingMessage: 'Fetching data...',
    },
  });

  await expect(component).toContainText('Fetching data...');
  // The table body should not have normal rows, but instead the empty/loading slot
  await expect(component.locator('tbody tr.ui-row')).toHaveCount(0);
});

test('emits row-click event', async ({ mount }) => {
  let clickedItem = null;
  const component = await mount(DataTable, {
    props: {
      headers: mockHeaders,
      items: mockItems,
    },
    on: {
      'row-click': (item) => { clickedItem = item; },
    },
  });

  await component.locator('tbody tr').first().click();
  expect(clickedItem.name).toBe('Alice');
});

test('renders pagination when hasPagination is true', async ({ mount }) => {
  const component = await mount(DataTable, {
    props: {
      headers: mockHeaders,
      items: mockItems,
      hasPagination: true,
      currentPage: 1,
      totalItems: 20,
      pageSize: 2,
    },
  });

  const pagination = component.locator('.pagination-root');
  await expect(pagination).toBeVisible();
  await expect(pagination.locator('.pagination-range-box').first()).toHaveText('1');
  await expect(pagination.locator('.pagination-range-box').nth(1)).toHaveText('2');
  await expect(pagination.locator('.pagination-total')).toHaveText('20');
});
