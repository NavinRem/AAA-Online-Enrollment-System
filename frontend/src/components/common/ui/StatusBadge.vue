<template>
  <span :class="badgeClass">
    {{ displayStatus }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { isPaid, isCancelled, isPending, isUnpaid } from '@/utils/statusHelper'

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
  if (props.status === undefined || props.status === null) return 'N/A'
  const str = String(props.status)
  const lower = str.toLowerCase()

  if (isPaid(lower)) return 'Paid'
  if (isCancelled(lower)) return 'Cancelled'
  if (isPending(lower)) return 'Pending'
  if (isUnpaid(lower)) return 'Unpaid'

  // Auto-capitalize specific terms
  if (['active', 'inactive', 'studying', 'graduated', 'stopped', 'suspended'].includes(lower)) {
    return lower.charAt(0).toUpperCase() + lower.slice(1)
  }

  return str
})

const statusColor = computed(() => {
  if (props.type) return props.type
  const s = String(props.status).toLowerCase().trim()

  if (s.includes('$') || /monday|tuesday|wednesday|thursday|friday|saturday|sunday/.test(s)) return 'blue'
  if (/:[0-9]{2}\s*(am|pm)/i.test(s)) return 'blue'

  const colorMap = {
    green: ['paid', 'success', 'active', 'studying', 'on-time', 'present', 'excellent', 'parent'],
    yellow: ['unpaid', 'pending', 'deactivated', 'suspended', 'warning', 'permission'],
    red: ['canceled', 'cancelled', 'failed', 'stopped', 'absent', 'serious'],
    orange: ['inactive'],
    blue: ['graduated', 'late', 'good', 'fair', 'guardian'],
    purple: ['make-up', 'makeup', 'intermediate', 'children'],
    magenta: ['unmarked']
  }

  for (const [color, matches] of Object.entries(colorMap)) {
    if (matches.some(m => s.includes(m))) return color
  }

  return 'gray'
})

const badgeClass = computed(() => `status-badge badge-${statusColor.value}`)
</script>

<style scoped>
@import '@/assets/styles/components/StatusBadge.css';
</style>
