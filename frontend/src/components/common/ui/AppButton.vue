<template>
  <button class="flex items-center justify-center gap-xs font-bold cursor-pointer whitespace-nowrap" :class="[
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    {
      'opacity-60 cursor-not-allowed pointer-events-none': disabled || loading,
      'opacity-80 cursor-wait': loading,
      'p-xs rounded-full': iconOnly,
      'rounded-std': !iconOnly && size !== 'lg' && size !== 'sm',
      'rounded-sm': !iconOnly && size === 'sm',
      'rounded-[14px]': !iconOnly && size === 'lg',
    },
  ]" :style="buttonStyle" :type="type" :disabled="disabled || loading" @click="$emit('click', $event)">
    <!-- Loading Spinner -->
    <span v-if="loading"
      class="w-4 h-4 border-2 border-white/40 border-t-current rounded-full animate-spin mr-[-4px]"></span>

    <!-- Left Icon Slot -->
    <span v-if="$slots['icon-left'] && !loading" class="flex items-center justify-center">
      <slot name="icon-left"></slot>
    </span>

    <!-- Standard Icon -->
    <span v-if="icon && !loading" class="flex items-center justify-center text-[1.25em]">{{
      icon }}</span>

    <!-- Content -->
    <span v-if="!iconOnly && ($slots.default || text)"
      class="w-full flex items-center justify-center gap-xs transition-opacity duration-200"
      :class="{ 'opacity-30': loading }">
      <slot>{{ text }}</slot>
    </span>

    <!-- Right Icon Slot -->
    <span v-if="$slots['icon-right'] && !loading" class="flex items-center justify-center">
      <slot name="icon-right"></slot>
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { getStatusTheme } from '@/utils/statusUtils'

const props = defineProps({
  text: { type: String, default: '' },
  type: { type: String, default: 'button' },
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  icon: { type: String, default: '' },
  iconOnly: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  status: { type: String, default: '' },
})

const variantClasses = {
  primary: 'bg-primary text-white hover:bg-primary-dark hover:shadow-md',
  secondary: 'bg-primary-light/30 text-content-deep border-primary-light hover:bg-primary-light',
  danger: 'bg-error-soft text-error hover:brightness-95',
  cancel: 'bg-surface-light text-content-muted hover:bg-surface-subtle hover:text-content-dark',
  ghost: 'bg-transparent text-content-muted hover:bg-surface-subtle hover:text-content-deep',
  outline: 'bg-transparent border-primary text-primary hover:bg-primary-soft',
  light: 'bg-primary-soft text-primary hover:bg-primary-light',
  logout: 'bg-error text-white hover:bg-error-deep hover:scale-95 active:scale-90',
}

const sizeClasses = {
  sm: 'px-3 py-1 text-xs',
  md: 'px-5 py-3 text-sm',
  lg: 'px-8 py-3 text-base font-black',
}

const buttonStyle = computed(() => {
  if (!props.status) return {}
  return getStatusTheme(props.status)
})

defineEmits(['click'])
</script>
