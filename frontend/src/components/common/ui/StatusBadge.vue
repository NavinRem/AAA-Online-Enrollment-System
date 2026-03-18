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
  const lower = str.toLowerCase().trim()

  // 1. Check for specific generic terms FIRST to avoid payment helper overlaps
  const genericTerms = ['active', 'inactive', 'studying', 'graduated', 'stopped', 'suspended']
  if (genericTerms.includes(lower)) {
    return lower.charAt(0).toUpperCase() + lower.slice(1)
  }

  // 2. Then check for payment/enrollment specific statuses
  if (isPaid(lower)) return 'Paid'
  if (isCancelled(lower)) return 'Cancelled'
  if (isPending(lower)) return 'Pending'
  if (isUnpaid(lower)) return 'Unpaid'

  return str
})

const STATUS_CATEGORIES = {
  green: ['paid', 'confirmed', 'active', 'on-time', 'present', 'excellent', 'studying', 'parent', 'create at', 'joined at'],
  yellow: ['unpaid', 'pending', 'deactivated', 'suspended', 'warning', 'permission', 'inactive', 'upcoming'],
  red: ['canceled', 'cancelled', 'failed', 'stopped', 'absent', 'serious'],
  blue: ['graduated', 'late', 'good', 'fair', 'guardian', 'update at'],
  purple: ['make-up', 'makeup', 'intermediate', 'children', 'in progress'],
  magenta: ['unmarked']
}

const statusColor = computed(() => {
  if (props.type) return props.type
  const s = String(props.status).toLowerCase().trim()

  // 1. Check for ad-hoc values like amounts or schedule times
  if (s.includes('$') || /monday|tuesday|wednesday|thursday|friday|saturday|sunday/.test(s)) return 'blue'
  if (/:[0-9]{2}\s*(am|pm)/i.test(s)) return 'blue'

  // 2. Exact match priority (prevents "unpaid" matching "paid")
  for (const [color, matches] of Object.entries(STATUS_CATEGORIES)) {
    if (matches.includes(s)) return color
  }

  // 3. Fallback to partial matches
  for (const [color, matches] of Object.entries(STATUS_CATEGORIES)) {
    if (matches.some(m => s.includes(m))) return color
  }

  return 'gray'
})

const badgeClass = computed(() => `status-badge badge-${statusColor.value}`)
</script>

<style scoped>
@import '@/assets/styles/components/StatusBadge.css';
</style>
