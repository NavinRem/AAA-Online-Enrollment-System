<script setup>
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'

defineProps({
  stats: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <div
    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-xl w-full auto-rows-fr"
    v-if="stats && stats.length > 0"
  >
    <DataMetricCard v-for="stat in stats" :key="stat.label" v-bind="stat" />
  </div>
</template>
