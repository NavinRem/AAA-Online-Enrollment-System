import { test, expect } from '@playwright/experimental-ct-vue';
import AppBadge from './AppBadge.vue';

test.use({ viewport: { width: 500, height: 500 } });

test('renders status text correctly with capitalization', async ({ mount }) => {
  const component = await mount(AppBadge, {
    props: {
      status: 'active',
    },
  });

  await expect(component).toContainText('Active');
});

test('does not capitalize prices', async ({ mount }) => {
  const component = await mount(AppBadge, {
    props: {
      value: '$100.00',
    },
  });

  await expect(component).toContainText('$100.00');
});

test('uses default slot if provided', async ({ mount }) => {
  const component = await mount(AppBadge, {
    props: {
      status: 'active',
    },
    slots: {
      default: 'Custom Label',
    },
  });

  await expect(component).toContainText('Custom Label');
});
