import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppButton from '../AppButton.vue'

describe('AppButton.vue', () => {
  it('renders default slot content', () => {
    const wrapper = mount(AppButton, {
      slots: {
        default: 'Click Me'
      }
    })
    expect(wrapper.text()).toContain('Click Me')
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(AppButton)
    await wrapper.trigger('click')
    expect(wrapper.emitted()).toHaveProperty('click')
    expect(wrapper.emitted().click).toHaveLength(1)
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(AppButton, {
      props: { disabled: true }
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted()).not.toHaveProperty('click')
    // Vue test utils trigger bypasses native disabled, but we check if button has disabled attribute
    expect(wrapper.attributes('disabled')).toBeDefined()
  })

  it('shows loading spinner and disables click when loading is true', async () => {
    const wrapper = mount(AppButton, {
      props: { loading: true }
    })
    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.find('.animate-spin').exists()).toBe(true)
  })

  it('applies variant classes correctly', () => {
    const wrapper = mount(AppButton, {
      props: { variant: 'danger' }
    })
    // From variantClasses mapping in AppButton.vue
    expect(wrapper.classes()).toContain('bg-error')
  })

  it('hides default slot when iconOnly is true', () => {
    const wrapper = mount(AppButton, {
      props: { iconOnly: true },
      slots: { default: 'Hidden Text' }
    })
    expect(wrapper.text()).not.toContain('Hidden Text')
  })
})
