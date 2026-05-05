<script setup>
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { formatDate } from '@/utils/formatUtils'

defineProps({
  createdAt: { type: [String, Object, Date, Number], default: '' },
  updatedAt: { type: [String, Object, Date, Number], default: '' }
})
</script>

<template>
  <section class="ui-detail-card bg-surface-subtle/50">
    <h6 class="font-bold uppercase tracking-widest text-content-muted mb-6">Account Timestamp</h6>
    <div class="space-y-6">
      <div class="flex items-center gap-3">
        <AppBadge type="green" class="text-md px-2 py-xs">Created At</AppBadge>
        <div class="text-sm font-semibold text-content-muted leading-tight tabular-nums">
          {{ formatDate(createdAt) }}
        </div>
      </div>

      <div class="flex items-center gap-3">
        <AppBadge type="blue" class="text-md px-2 py-xs">Updated At</AppBadge>
        <div class="text-sm font-semibold text-content-muted leading-tight tabular-nums">
          {{ formatDate(updatedAt || createdAt) }}
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ui-detail-card {
  @apply bg-white border border-outline-std shadow-sm p-8 rounded-md;
}
</style>
