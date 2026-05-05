<script setup>
import AppBadge from '@/components/common/ui/AppBadge.vue'

defineProps({
  title: { type: String, required: true },
  fields: {
    type: Array,
    default: () => []
    // Each field: { label: string, value: any, isBadge: boolean, status: string }
  }
})
</script>

<template>
  <section class="ui-detail-card bg-primary-soft/30 border-primary/10">
    <h6 class="font-bold uppercase tracking-widest text-content-muted mb-4">{{ title }}</h6>

    <div class="space-y-5">
      <div v-for="field in fields" :key="field.label" class="flex justify-between gap-2 items-start">
        <span class="text-lg font-bold text-content-dark whitespace-nowrap">{{ field.label }}:</span>
        <div class="flex justify-end text-right">
          <AppBadge v-if="field.isBadge" :status="field.status || field.value" />
          <span v-else class="text-md font-bold text-content-muted leading-tight">{{ field.value }}</span>
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
