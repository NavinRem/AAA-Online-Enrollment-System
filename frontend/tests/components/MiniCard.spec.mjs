import { test, expect } from '@playwright/experimental-ct-vue';
import MiniCard from '../cards/MiniCard.vue';

test.use({ viewport: { width: 500, height: 500 } });

test('renders correctly with props', async ({ mount }) => {
  const component = await mount(MiniCard, {
    props: {
      title: 'Revenue',
      value: '$500',
      image: '/mock-revenue.png',
    },
  });

  await expect(component).toContainText('Revenue');
  await expect(component).toContainText('$500');
  await expect(component.locator('img')).toHaveAttribute('src', '/mock-revenue.png');
});
