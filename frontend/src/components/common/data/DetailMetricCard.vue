<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div
    class="ui-metric-card bg-white rounded-md p-md border border-outline-std shadow-sm hover:shadow-md transition-all duration-300 group"
  >
    <div class="flex items-center gap-4">
      <!-- Icon Container -->
      <div
        class="w-14 h-14 rounded-xl flex items-center justify-center bg-surface-subtle transition-colors shrink-0"
      >
        <img :src="image" :alt="label" class="w-10 h-10 transition-opacity" />
      </div>

      <!-- Content -->
      <div class="flex flex-col min-w-0">
        <span class="text-sm font-bold text-content-muted leading-none mb-1 truncate">
          {{ label }}
        </span>
        <div class="flex items-baseline gap-2">
          <span class="text-2xl font-bold text-content-dark tracking-tight" v-html="value"></span>
        </div>
      </div>
    </div>
  </div>
</template>
