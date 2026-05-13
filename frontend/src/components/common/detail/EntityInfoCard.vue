<script setup>
import AppBadge from '@/components/common/ui/AppBadge.vue'

defineProps({
  title: { type: String, required: true },
  fields: {
    type: Array,
    default: () => []
    // Each field: { label: string, value: any, isBadge: boolean, status: string, image?: string }
  }
})
</script>

<template>
  <section class="ui-detail-card">
    <h2 class="font-bold text-2xl text-content-dark mb-2">{{ title }}</h2>

    <div class="space-y-5">
      <div v-for="field in fields" :key="field.label" class="flex justify-between items-center gap-1">
        <span class="text-lg font-bold text-content-dark">{{ field.label }}:</span>
        <div class="flex items-center gap-2">
          <template v-if="field.isBadge">
            <AppBadge :status="field.status || field.value" :type="field.type" />
          </template>
          <template v-else>
            <div v-if="field.image" class="w-8 h-8 rounded-full overflow-hidden border border-outline-std bg-surface-subtle">
              <img :src="field.image" class="w-full h-full object-cover" />
            </div>
            <span class="text-md font-bold text-content-muted">{{ field.value || '-' }}</span>
          </template>
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

