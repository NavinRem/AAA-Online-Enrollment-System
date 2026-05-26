import { test, expect } from '@playwright/experimental-ct-vue';
import AppConfirmOverlay from './AppConfirmOverlay.vue';

test.use({ viewport: { width: 800, height: 600 } });

test('does not render when show is false', async ({ mount }) => {
  const component = await mount(AppConfirmOverlay, {
    props: {
      show: false,
    },
  });
  await expect(component).not.toBeVisible();
});

test('renders correctly with props', async ({ mount }) => {
  const component = await mount(AppConfirmOverlay, {
    props: {
      show: true,
      title: 'Confirm Payment',
      subtitle: 'Review before submitting',
      rows: [
        { key: 'Amount', value: '$150.00' },
        { key: 'Status', value: 'Pending', badge: true },
      ],
      totalAmount: 150,
      totalLabel: 'Total Due',
      confirmLabel: 'Pay Now',
    },
  });

  await expect(component).toBeVisible();
  await expect(component.locator('h3')).toContainText('Confirm Payment');
  await expect(component.locator('p')).toContainText('Review before submitting');

  // Verify rows
  await expect(component.locator('.app-confirm-key').nth(0)).toContainText('Amount');
  await expect(component.locator('.app-confirm-val').nth(0)).toContainText('$150.00');

  // Verify total row
  await expect(component.locator('.app-confirm-row--total')).toContainText('Total Due');
  await expect(component.locator('.app-confirm-total')).toContainText('$150');

  // Verify confirm button text
  await expect(component.locator('button', { hasText: 'Pay Now' })).toBeVisible();
});

test('emits confirm and back events', async ({ mount }) => {
  let confirmed = false;
  let back = false;

  const component = await mount(AppConfirmOverlay, {
    props: {
      show: true,
      title: 'Test Events',
    },
    on: {
      confirm: () => { confirmed = true; },
      back: () => { back = true; },
    },
  });

  await component.locator('button', { hasText: 'Confirm & Submit' }).click();
  expect(confirmed).toBe(true);

  await component.locator('button', { hasText: 'Go back' }).click();
  expect(back).toBe(true);
});
