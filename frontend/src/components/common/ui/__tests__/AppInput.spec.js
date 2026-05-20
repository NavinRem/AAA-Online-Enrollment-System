import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppInput from '../AppInput.vue'

describe('AppInput.vue', () => {
  it('renders input with correct props', () => {
    const wrapper = mount(AppInput, {
      props: {
        label: 'Username',
        placeholder: 'Enter username',
        modelValue: 'JohnDoe',
        type: 'text'
      }
    })
    
    expect(wrapper.find('label').text()).toContain('Username')
    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect(input.element.value).toBe('JohnDoe')
    expect(input.attributes('placeholder')).toBe('Enter username')
  })

  it('emits update:modelValue on input change', async () => {
    const wrapper = mount(AppInput, {
      props: {
        modelValue: ''
      }
    })
    
    const input = wrapper.find('input')
    await input.setValue('JaneDoe')
    
    expect(wrapper.emitted()).toHaveProperty('update:modelValue')
    expect(wrapper.emitted()['update:modelValue'][0]).toEqual(['JaneDoe'])
  })

  it('renders error message when error prop is provided', () => {
    const wrapper = mount(AppInput, {
      props: {
        error: 'This field is required'
      }
    })
    
    const errorMsg = wrapper.find('p.text-error')
    expect(errorMsg.exists()).toBe(true)
    expect(errorMsg.text()).toBe('This field is required')
    expect(wrapper.find('input').classes()).toContain('ui-input-invalid')
  })

  it('renders textarea when type is textarea', () => {
    const wrapper = mount(AppInput, {
      props: {
        type: 'textarea',
        modelValue: 'Some long text'
      }
    })
    
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.find('textarea').element.value).toBe('Some long text')
  })

  it('toggles password visibility when toggle button is clicked', async () => {
    const wrapper = mount(AppInput, {
      props: {
        type: 'password',
        modelValue: 'secret'
      }
    })
    
    const input = wrapper.find('input')
    const btn = wrapper.find('button')
    
    expect(input.attributes('type')).toBe('password')
    expect(btn.exists()).toBe(true)
    
    await btn.trigger('click')
    expect(input.attributes('type')).toBe('text')
    
    await btn.trigger('click')
    expect(input.attributes('type')).toBe('password')
  })
})
