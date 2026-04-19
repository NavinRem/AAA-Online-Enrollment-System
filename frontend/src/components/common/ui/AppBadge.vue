<template>
  <span
    class="inline-flex items-center justify-center w-fit px-3 py-[3px] rounded-full text-sm font-bold leading-none whitespace-nowrap text-center transition-all"
    :style="badgeStyle">
    <slot>{{ displayLabel }}</slot>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { getBadgeUI, getBadgeTheme } from '@/utils/badgeUtils'

const props = defineProps({
  value: { type: [String, Number], default: '' },
  status: { type: [String, Number], default: '' },
  type: { type: String, default: '' },
})

const badgeValue = computed(() => props.value || props.status)
const ui = computed(() => getBadgeUI(badgeValue.value, props.type))

const displayLabel = computed(() => ui.value.label || badgeValue.value)
const badgeStyle = computed(() => getBadgeTheme(badgeValue.value, props.type))
</script>
