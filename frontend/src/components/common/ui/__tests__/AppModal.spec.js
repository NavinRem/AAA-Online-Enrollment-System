import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppModal from '../AppModal.vue'

describe('AppModal.vue', () => {
  it('does not render when show is false', () => {
    const wrapper = mount(AppModal, {
      props: { show: false }
    })
    
    // The outer div should not exist if show is false
    expect(wrapper.find('div.fixed.inset-0').exists()).toBe(false)
  })

  it('renders modal content when show is true', () => {
    const wrapper = mount(AppModal, {
      props: {
        show: true,
        title: 'Test Modal'
      },
      slots: {
        default: '<div class="test-body">Body Content</div>'
      }
    })
    
    expect(wrapper.find('div.fixed.inset-0').exists()).toBe(true)
    expect(wrapper.text()).toContain('Test Modal')
    expect(wrapper.find('.test-body').exists()).toBe(true)
  })

  it('emits close event when backdrop or close button is clicked', async () => {
    const wrapper = mount(AppModal, {
      props: { show: true }
    })
    
    // Find the backdrop
    const backdrop = wrapper.find('div.fixed.inset-0')
    await backdrop.trigger('click')
    
    expect(wrapper.emitted()).toHaveProperty('close')
    
    // Find close button
    const closeBtn = wrapper.find('button.cursor-pointer')
    await closeBtn.trigger('click')
    
    expect(wrapper.emitted().close).toHaveLength(2)
  })

  it('renders footer slot correctly', () => {
    const wrapper = mount(AppModal, {
      props: { show: true },
      slots: {
        footer: '<button class="footer-btn">Action</button>'
      }
    })
    
    expect(wrapper.find('.footer-btn').exists()).toBe(true)
  })

  it('renders error alert when error prop is provided', () => {
    const wrapper = mount(AppModal, {
      props: {
        show: true,
        error: 'Test Error Message'
      }
    })
    
    // AppAlert component renders the message inside a span or p, depending on implementation
    // We check if the text is present in the wrapper
    expect(wrapper.text()).toContain('Test Error Message')
  })
})
