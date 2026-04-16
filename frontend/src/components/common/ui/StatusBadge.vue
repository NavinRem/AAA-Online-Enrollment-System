<template>
  <span
    class="inline-flex items-center justify-center w-fit px-3 py-[3px] rounded-full text-sm font-bold leading-none whitespace-nowrap text-center transition-all"
    :style="badgeStyle">
    <slot>{{ displayStatus }}</slot>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { getStatusDisplay, getStatusTheme } from '@/utils/statusUtils'

const props = defineProps({
  status: {
    type: [String, Number],
    required: true,
  },
  type: {
    type: String,
    default: '',
  },
})

const displayStatus = computed(() => {
  return getStatusDisplay(props.status)
})

const badgeStyle = computed(() => {
  return getStatusTheme(props.status, props.type)
})
</script>
