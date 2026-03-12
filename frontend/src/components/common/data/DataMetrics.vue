<script setup>
import SummaryCard from '@/components/common/cards/SummaryCard.vue'

const props = defineProps({
  stats: {
    type: Array,
    required: true,
    // Expected stat: { label: string, value: any, image: string, color: string }
  }
})
</script>

<template>
  <div class="data-metrics-container" v-if="stats && stats.length > 0">
    <SummaryCard
      v-for="stat in stats"
      :key="stat.label"
      :title="stat.label"
      :value="stat.value"
      :image="stat.image"
      :color="stat.color"
    />
  </div>
</template>

<style scoped>
.data-metrics-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
}
</style>
