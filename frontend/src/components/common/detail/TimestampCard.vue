<script setup>
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AuditBadge from '@/components/common/ui/AuditBadge.vue'
import { formatDate } from '@/utils/formatUtils'

defineProps({
  createdAt: { type: [String, Object, Date, Number], default: '' },
  updatedAt: { type: [String, Object, Date, Number], default: '' },
  createdBy: { type: Object, default: null },
  modifiedBy: { type: Object, default: null },
  item: { type: Object, default: null },
})
</script>

<template>
  <section class="ui-detail-card bg-primary-soft/30 border-primary/10">
    <h2 class="font-bold text-2xl text-content-dark ">Account Timestamp</h2>
    <div class="space-y-4">
      <div class="flex flex-col gap-2 p-4 bg-white rounded-md border border-outline-std shadow-2xs">
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-bold  text-content-muted">Created At</span>
          <AppBadge type="green">
            {{ formatDate(createdAt) }}
          </AppBadge>
        </div>
        <div class="pt-1.5 border-t border-outline-std/40 mt-1">
          <AuditBadge :meta="createdBy || item?.createdBy" :item="item" />
        </div>
      </div>

      <div class="flex flex-col gap-2 p-4 bg-white rounded-md border border-outline-std shadow-2xs">
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-bold se  text-content-muted">Last Modified</span>
          <AppBadge type="blue">
            {{ formatDate(updatedAt || createdAt) }}
          </AppBadge>
        </div>
        <div class="pt-1.5 border-t border-outline-std/40 mt-1">
          <AuditBadge
            :meta="modifiedBy || item?.modifiedBy || createdBy || item?.createdBy"
            :item="item"
          />
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
