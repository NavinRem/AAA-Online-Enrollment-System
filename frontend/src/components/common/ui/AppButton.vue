<script setup>
import { computed } from 'vue'
import { getStatusUI } from '@/utils/badgeUtils'

const props = defineProps({
  type: { type: String, default: 'button' },
  variant: { type: String, default: 'primary' },
  icon: { type: String, default: '' },
  iconOnly: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

const variantClasses = {
  primary: 'bg-primary text-white hover:bg-primary-dark shadow-md',
  secondary: 'bg-primary-light/30 text-content-deep border border-primary-light/50 hover:bg-primary-light',
  danger: 'bg-error text-white hover:bg-error-deep',
  success: 'bg-success text-white hover:bg-success-deep',
  cancel: 'bg-surface-light text-content-muted hover:bg-surface-subtle hover:text-content-dark',
  ghost: 'bg-transparent text-content-muted hover:bg-surface-subtle hover:text-content-deep',
  outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary-soft',
  light: 'bg-primary-soft text-primary hover:bg-primary-light',
  logout: 'bg-error text-white hover:bg-error-deep hover:scale-95 active:scale-90 shadow-md',
}

const buttonStyle = computed(() => {
  if (props.disabled || props.loading) return {}

  const ui = getStatusUI(props.variant)

  if (ui.color !== 'gray' || props.variant === 'gray') {
    return {
      backgroundColor: ui.theme.backgroundColor,
      color: ui.theme.color,
      borderColor: 'transparent',
    }
  }

  return {}
})

const isSemantic = computed(() => {
  if (variantClasses[props.variant]) return false
  const ui = getStatusUI(props.variant)
  return ui.color !== 'gray' || props.variant === 'gray'
})

defineEmits(['click'])
</script>

<template>
  <button
    class="flex items-center justify-center gap-xs font-extrabold px-6 py-2.5 text-sm cursor-pointer whitespace-nowrap transition-all duration-200 active:scale-[0.98] select-none"
    :class="[
      !isSemantic ? (variantClasses[variant] || variantClasses.primary) : 'border border-transparent hover:brightness-95',
      {
        'opacity-60 cursor-not-allowed pointer-events-none grayscale-[0.2]': disabled || loading,
        'p-xs rounded-full': iconOnly,
        'rounded-std': !iconOnly,
        'shadow-sm': !isSemantic && !['ghost', 'cancel'].includes(variant) && !disabled,
      },
    ]" :style="buttonStyle" :type="type" :disabled="disabled || loading" @click="$emit('click', $event)">
    <span v-if="loading"
      class="w-4 h-4 border-2 border-white/40 border-t-current rounded-full animate-spin mr-[-4px]"></span>

    <span v-if="$slots['icon-left'] && !loading" class="flex items-center justify-center">
      <slot name="icon-left"></slot>
    </span>

    <span v-if="icon && !loading" class="flex items-center justify-center text-[1.25em] translate-y-[0.5px]">
      <img v-if="icon.includes('/')" :src="icon" class="w-[1em] h-[1em] object-contain" />
      <span v-else>{{ icon }}</span>
    </span>

    <span v-if="!iconOnly && $slots.default"
      class="w-full flex items-center justify-center gap-xs transition-opacity duration-200"
      :class="{ 'opacity-30': loading }">
      <slot></slot>
    </span>

    <span v-if="$slots['icon-right'] && !loading" class="flex items-center justify-center">
      <slot name="icon-right"></slot>
    </span>
  </button>
</template>

<style scoped>
.rounded-std {
  border-radius: var(--radius-std);
}

.bg-primary {
  background-color: var(--color-primary);
}

.bg-primary-dark {
  background-color: var(--color-primary-dark);
}

.text-primary {
  color: var(--color-primary);
}
</style>
