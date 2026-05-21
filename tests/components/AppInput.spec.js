import { test, expect } from '@playwright/experimental-ct-vue'
import AppInput from '@/components/common/ui/AppInput.vue'

// Mock utility used by AppInput
test.use({
  ctViteConfig: {
    resolve: {
      alias: {
        '@/utils/assetHelper': '/tests/components/mocks/assetHelperMock.js',
      },
    },
  },
})

test.describe('AppInput.vue', () => {
  test('renders input with correct props', async ({ mount }) => {
    const component = await mount(AppInput, {
      props: {
        label: 'Username',
        placeholder: 'Enter username',
        modelValue: 'JohnDoe',
        type: 'text',
      },
    })

    await expect(component.locator('label')).toContainText('Username')
    const input = component.locator('input')
    await expect(input).toBeVisible()
    await expect(input).toHaveValue('JohnDoe')
    await expect(input).toHaveAttribute('placeholder', 'Enter username')
  })

  test('emits update:modelValue on input change', async ({ mount }) => {
    let emittedValue = ''
    const component = await mount(AppInput, {
      props: {
        modelValue: '',
      },
      on: {
        'update:modelValue': (val) => (emittedValue = val),
      },
    })

    const input = component.locator('input')
    await input.fill('JaneDoe')

    expect(emittedValue).toBe('JaneDoe')
  })

  test('renders error message when error prop is provided', async ({
    mount,
  }) => {
    const component = await mount(AppInput, {
      props: {
        error: 'This field is required',
      },
    })

    const errorMsg = component.locator('p.text-error')
    await expect(errorMsg).toBeVisible()
    await expect(errorMsg).toHaveText('This field is required')
    await expect(component.locator('input')).toHaveClass(/ui-input-invalid/)
  })

  test('renders textarea when type is textarea', async ({ mount }) => {
    const component = await mount(AppInput, {
      props: {
        type: 'textarea',
        modelValue: 'Some long text',
      },
    })

    await expect(component.locator('textarea')).toBeVisible()
    await expect(component.locator('input')).not.toBeVisible()
    await expect(component.locator('textarea')).toHaveValue('Some long text')
  })

  test('toggles password visibility when toggle button is clicked', async ({
    mount,
  }) => {
    const component = await mount(AppInput, {
      props: {
        type: 'password',
        modelValue: 'secret',
      },
    })

    const input = component.locator('input')
    const btn = component.locator('button')

    await expect(input).toHaveAttribute('type', 'password')
    await expect(btn).toBeVisible()

    await btn.click()
    await expect(input).toHaveAttribute('type', 'text')

    await btn.click()
    await expect(input).toHaveAttribute('type', 'password')
  })
})
