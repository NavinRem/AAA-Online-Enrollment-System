import { test, expect } from '@playwright/experimental-ct-vue';
import AppInput from './AppInput.vue';

test.use({ viewport: { width: 500, height: 500 } });

test('renders correctly with default props', async ({ mount }) => {
  const component = await mount(AppInput, {
    props: {
      modelValue: '',
      label: 'Email Address',
      placeholder: 'Enter your email',
    },
  });

  await expect(component.locator('label')).toContainText('Email Address');
  await expect(component.locator('input')).toHaveAttribute('placeholder', 'Enter your email');
});

test('emits update:modelValue on input', async ({ mount }) => {
  let emittedValue = '';
  const component = await mount(AppInput, {
    props: {
      modelValue: '',
    },
    on: {
      'update:modelValue': (v) => { emittedValue = v; },
    },
  });

  const input = component.locator('input');
  await input.fill('test@example.com');
  await expect(input).toHaveValue('test@example.com');
});

test('shows error message and error styling', async ({ mount }) => {
  const component = await mount(AppInput, {
    props: {
      modelValue: '',
      error: 'Invalid email',
    },
  });

  await expect(component.locator('p')).toContainText('Invalid email');
  await expect(component.locator('p')).toHaveClass(/text-error/);
  await expect(component.locator('input')).toHaveClass(/ui-input-invalid/);
});

test('toggles password visibility', async ({ mount }) => {
  const component = await mount(AppInput, {
    props: {
      modelValue: 'secret',
      type: 'password',
    },
  });

  const input = component.locator('input');
  await expect(input).toHaveAttribute('type', 'password');

  const toggleBtn = component.locator('button');
  await toggleBtn.click();
  
  await expect(input).toHaveAttribute('type', 'text');
});
