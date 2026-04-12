<script setup>
import SummaryCard from '@/components/common/cards/SummaryCard.vue'

const props = defineProps({
  stats: {
    type: Array,
    required: true,
  },
})
</script>

<template>
  <div
    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md w-full auto-rows-fr"
    v-if="stats && stats.length > 0"
  >
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
