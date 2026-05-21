import { test, expect } from '@playwright/experimental-ct-vue'
import MiniCard from '@/components/common/cards/MiniCard.vue'

test.describe('MiniCard.vue', () => {
  test('renders title and value props correctly', async ({ mount }) => {
    const component = await mount(MiniCard, {
      props: {
        title: 'Total Students',
        value: 150,
        image: '/test-image.png',
      },
    })

    await expect(component.locator('h4')).toHaveText('Total Students')
    await expect(component).toContainText('150')
  })

  test('renders the image with correct src and alt attributes', async ({
    mount,
  }) => {
    const validImage =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    const component = await mount(MiniCard, {
      props: {
        title: 'Total Students',
        value: 150,
        image: validImage,
      },
    })

    const img = component.locator('img')
    await expect(img).toBeVisible()
    await expect(img).toHaveAttribute('src', validImage)
    await expect(img).toHaveAttribute('alt', 'Total Students')
  })

  test('hides the image on error', async ({ mount }) => {
    const component = await mount(MiniCard, {
      props: {
        title: 'Total Students',
        value: 150,
        image: '/non-existent-image.png',
      },
    })

    const img = component.locator('img')
    await expect(img).toBeHidden()
  })
})
