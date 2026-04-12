<template>
  <div
    class="relative flex items-center w-full transition-all group"
    :class="[variant === 'light' ? 'max-w-[300px]' : 'max-w-[400px]']"
  >
    <img
      :src="getActionIcon('search')"
      class="absolute left-md w-4.5 h-4.5 z-10 pointer-events-none transition-opacity duration-200"
      :class="variant === 'light' ? 'opacity-60 invert brightness-0' : 'opacity-40'"
    />
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      type="text"
      class="w-full pl-11 pr-md py-3 border-2 rounded-2xl text-sm font-medium outline-none transition-all"
      :class="[
        variant === 'light'
          ? 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:bg-white/20 focus:border-white/40 focus:ring-4 focus:ring-white/10'
          : 'bg-surface-subtle border-outline-std text-content-dark placeholder-text-muted focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5',
      ]"
      :placeholder="placeholder"
    />
  </div>
</template>

<script setup>
import { getActionIcon } from '@/utils/assetHelper'

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Search...',
  },
  variant: {
    type: String,
    default: 'default',
  },
})

defineEmits(['update:modelValue'])
</script>
