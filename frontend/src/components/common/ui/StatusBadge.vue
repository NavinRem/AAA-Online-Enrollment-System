<template>
  <span class="status-badge" :style="badgeStyle">
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

<style scoped>
@import '@/assets/styles/components/StatusBadge.css';
</style>
