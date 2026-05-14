<script setup>
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { formatDate } from '@/utils/formatUtils'

defineProps({
  createdAt: { type: [String, Object, Date, Number], default: '' },
  updatedAt: { type: [String, Object, Date, Number], default: '' },
})
</script>

<template>
  <section class="ui-detail-card bg-primary-soft/30 border-primary/10">
    <h2 class="font-bold text-2xl text-content-dark mb-2">Account Timestamp</h2>
    <div class="space-y-6">
      <div class="flex justify-between items-center gap-1">
        <span class="text-lg font-bold text-content-dark">Created At:</span>
        <div class="flex items-center gap-2">
          <AppBadge type="green">
            {{ formatDate(createdAt) }}
          </AppBadge>
        </div>
      </div>

      <div class="flex justify-between items-center gap-1">
        <span class="text-lg font-bold text-content-dark">Updated At:</span>
        <div class="flex items-center gap-2">
          <AppBadge type="blue">
            {{ formatDate(updatedAt || createdAt) }}
          </AppBadge>
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
