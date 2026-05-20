import { test, expect } from '@playwright/experimental-ct-vue';
import AppBadge from '@/components/common/ui/AppBadge.vue';

test.describe('AppBadge.vue', () => {
  test('renders default slot content', async ({ mount }) => {
    const component = await mount(AppBadge, {
      slots: {
        default: 'Custom Slot Badge'
      }
    });
    await expect(component).toContainText('Custom Slot Badge');
  });

  test('formats displayLabel from status prop correctly', async ({ mount }) => {
    const component = await mount(AppBadge, {
      props: {
        status: 'pending review'
      }
    });
    await expect(component).toContainText('Pending Review');
  });

  test('does not capitalize all uppercase acronyms', async ({ mount }) => {
    const component = await mount(AppBadge, {
      props: {
        status: 'USD'
      }
    });
    await expect(component).toContainText('USD');
  });

  test('does not capitalize price strings', async ({ mount }) => {
    const component = await mount(AppBadge, {
      props: {
        status: '$100'
      }
    });
    await expect(component).toContainText('$100');
  });

  test('renders as empty if no props are passed', async ({ mount }) => {
    const component = await mount(AppBadge);
    // Since it trims empty whitespace, we check that it is completely empty text
    await expect(component).toHaveText('');
  });
});
