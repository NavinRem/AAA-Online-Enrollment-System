import { test, expect } from '@playwright/experimental-ct-vue';
import AvatarSelector from './AvatarSelector.vue';

test.use({ viewport: { width: 800, height: 600 } });

test.skip('renders default avatars correctly', async ({ mount }) => {
  const component = await mount(AvatarSelector, {
    props: {
      label: 'Profile Picture',
    },
  });

  await expect(component).toBeVisible();
  await expect(component).toContainText('Profile Picture');
  
  // Should render the two default avatars (man, woman) and the upload button
  const avatarItems = component.locator('.avatar-item');
  await expect(avatarItems).toHaveCount(2); // Two built-in avatars
  await expect(component.locator('.avatar-upload-btn')).toBeVisible();
});

test.skip('emits update:modelValue when an avatar is clicked', async ({ mount }) => {
  let selectedValue = null;
  const component = await mount(AvatarSelector, {
    props: {
      modelValue: '',
    },
    on: {
      'update:modelValue': (v) => { selectedValue = v; },
    },
  });

  // Click the first avatar
  await component.locator('.avatar-item').first().click();
  expect(selectedValue).toContain('avatar-man');
});

test.skip('shows error state when error prop is provided', async ({ mount }) => {
  const component = await mount(AvatarSelector, {
    props: {
      error: 'Avatar is required',
    },
  });

  await expect(component.locator('.avatar-feedback-err')).toContainText('Avatar is required');
  await expect(component.locator('.avatar-selector-container')).toHaveClass(/border-error/);
});
