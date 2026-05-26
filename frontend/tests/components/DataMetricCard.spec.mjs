import { test, expect } from '@playwright/experimental-ct-vue';
import DataMetricCard from './DataMetricCard.vue';

test.use({ viewport: { width: 500, height: 500 } });

test('renders correctly with props', async ({ mount }) => {
  const component = await mount(DataMetricCard, {
    props: {
      label: 'Total Users',
      value: '1,234',
      subtitle: '+5% this week',
      image: '/mock-image.png',
      color: '#ff0000',
    },
  });

  await expect(component).toContainText('Total Users');
  await expect(component).toContainText('1,234');
  await expect(component).toContainText('+5% this week');
  await expect(component.locator('img')).toHaveAttribute('src', '/mock-image.png');
});

test('shows loading state when loading is true', async ({ mount }) => {
  const component = await mount(DataMetricCard, {
    props: {
      label: 'Total Users',
      value: '1,234',
      image: '/mock-image.png',
      loading: true,
    },
  });

  await expect(component.locator('.animate-pulse').first()).toBeVisible();
  await expect(component).not.toContainText('Total Users');
  await expect(component).not.toContainText('1,234');
});
