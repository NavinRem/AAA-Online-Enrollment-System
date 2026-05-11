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
  <section class="ui-summary-card">
    <div v-if="title" class="ui-summary-card-title">{{ title }}</div>

    <div class="flex flex-col gap-md">
      <div v-for="field in fields" :key="field.label" class="ui-data-item">
        <span class="ui-data-label">{{ field.label }}</span>
        <div class="flex items-center gap-xs">
          <AppBadge v-if="field.isBadge" :status="field.status || field.value" />
          <span v-else class="ui-data-value">{{ field.value }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

