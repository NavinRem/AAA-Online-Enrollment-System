<script setup>
import { computed } from 'vue'
import { getStatusTheme } from '@/utils/badgeUtils'

const props = defineProps({
  value: { type: [String, Number], default: '' },
  status: { type: [String, Number], default: '' },
  type: { type: String, default: '' },
  colorValue: { type: [String, Number], default: '' },
})

const badgeValue = computed(() => props.value || props.status)
const badgeStyle = computed(() => getStatusTheme(props.colorValue || badgeValue.value, props.type))

const displayLabel = computed(() => {
  const val = String(badgeValue.value || '')
  if (!val) return ''
  
  // Don't capitalize if it's a price or already has multiple caps
  if (val.startsWith('$') || /^[A-Z]{2,}/.test(val)) return val
  
  // Capitalize first letter of each word
  return val.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
})
</script>

<template>
  <span
    class="inline-flex items-center justify-center w-fit px-3 py-[3px] rounded-full text-sm font-semibold leading-none whitespace-nowrap text-center transition-all"
    :style="badgeStyle">
    <slot>{{ displayLabel }}</slot>
  </span>
</template>
