import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MiniCard from '../MiniCard.vue'

describe('MiniCard.vue', () => {
  it('renders title and value props correctly', () => {
    const wrapper = mount(MiniCard, {
      props: {
        title: 'Total Students',
        value: 150,
        image: '/test-image.png',
      },
    })

    expect(wrapper.find('h4').text()).toBe('Total Students')
    expect(wrapper.text()).toContain('150')
  })

  it('renders the image with correct src and alt attributes', () => {
    const wrapper = mount(MiniCard, {
      props: {
        title: 'Total Students',
        value: 150,
        image: '/test-image.png',
      },
    })

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/test-image.png')
    expect(img.attributes('alt')).toBe('Total Students')
  })

  it('hides the image on error', async () => {
    const wrapper = mount(MiniCard, {
      props: {
        title: 'Total Students',
        value: 150,
        image: '/test-image.png',
      },
    })

    const img = wrapper.find('img')
    await img.trigger('error')

    // Check if the inline style display: none was applied by the handler
    expect(img.element.style.display).toBe('none')
  })
})
