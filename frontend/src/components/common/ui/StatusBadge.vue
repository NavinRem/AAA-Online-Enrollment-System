<template>
  <span :class="badgeClass">
    {{ displayStatus }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { getStatusCategory, getStatusDisplay } from '@/utils/statusHelper'

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

const statusColor = computed(() => {
  if (props.type) return props.type
  return getStatusCategory(props.status)
})

const badgeClass = computed(() => `status-badge badge-${statusColor.value}`)
</script>

<style scoped>
@import '@/assets/styles/components/StatusBadge.css';
</style>
