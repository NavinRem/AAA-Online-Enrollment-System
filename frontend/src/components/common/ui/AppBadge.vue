<script setup>
import { computed } from 'vue'
import { getStatusTheme, resolveBranchBadgeProps } from '@/utils/badgeUtils'

const props = defineProps({
  value: { type: [String, Number], default: '' },
  status: { type: [String, Number], default: '' },
  type: { type: String, default: '' },
  colorValue: { type: [String, Number], default: '' },
  branch: { type: [String, Number, Object], default: null },
})

const resolvedBranch = computed(() => {
  if (!props.branch) return null
  return resolveBranchBadgeProps(props.branch)
})

const badgeValue = computed(() => {
  if (resolvedBranch.value) return resolvedBranch.value.status
  return props.value || props.status
})

const badgeStyle = computed(() => {
  if (resolvedBranch.value && !props.type) {
    return getStatusTheme(resolvedBranch.value.type, resolvedBranch.value.type)
  }
  return getStatusTheme(props.colorValue || badgeValue.value, props.type)
})

const displayLabel = computed(() => {
  if (badgeValue.value === null || badgeValue.value === undefined || badgeValue.value === '')
    return ''

  const val = String(badgeValue.value)

  // Don't capitalize if it's a price or already has multiple caps
  if (val.startsWith('$') || /^[A-Z]{2,}/.test(val)) return val

  // Capitalize first letter of each word
  return val
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
})
</script>

<template>
  <span
    class="inline-flex items-center justify-center w-fit px-3.5 py-1 rounded-full text-sm font-bold leading-none whitespace-nowrap text-center transition-all"
    :style="badgeStyle"
  >
    <slot>{{ displayLabel }}</slot>
  </span>
</template>
