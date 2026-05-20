import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppBadge from '../AppBadge.vue'

describe('AppBadge.vue', () => {
  it('renders default slot content', () => {
    const wrapper = mount(AppBadge, {
      slots: {
        default: 'Custom Slot Badge'
      }
    })
    expect(wrapper.text()).toContain('Custom Slot Badge')
  })

  it('formats displayLabel from status prop correctly', () => {
    const wrapper = mount(AppBadge, {
      props: {
        status: 'pending review'
      }
    })
    // Expect "Pending review" or "Pending Review" based on component logic
    expect(wrapper.text()).toBe('Pending Review')
  })

  it('does not capitalize all uppercase acronyms', () => {
    const wrapper = mount(AppBadge, {
      props: {
        status: 'USD'
      }
    })
    expect(wrapper.text()).toBe('USD')
  })

  it('does not capitalize price strings', () => {
    const wrapper = mount(AppBadge, {
      props: {
        status: '$100'
      }
    })
    expect(wrapper.text()).toBe('$100')
  })

  it('renders as empty if no props are passed', () => {
    const wrapper = mount(AppBadge)
    expect(wrapper.text()).toBe('')
  })
})
