import { test, expect } from '@playwright/experimental-ct-vue';
import DetailMetricCard from './DetailMetricCard.vue';

test.use({ viewport: { width: 500, height: 500 } });

test('renders correctly with props', async ({ mount }) => {
  const component = await mount(DetailMetricCard, {
    props: {
      label: 'Active Sessions',
      value: '42',
      image: '/mock-icon.png',
    },
  });

  await expect(component).toContainText('Active Sessions');
  await expect(component).toContainText('42');
  await expect(component.locator('img')).toHaveAttribute('src', '/mock-icon.png');
});
