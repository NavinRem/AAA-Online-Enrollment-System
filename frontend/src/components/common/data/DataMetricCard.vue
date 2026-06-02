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
  subtitle: {
    type: [String, Number],
    default: '',
  },
  image: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: 'var(--color-primary-light)',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div
    class="ui-metric-card flex flex-col items-center justify-between gap-xs p-6 rounded-std shadow-sm flex-1 transition-all hover:shadow-md text-center group border border-primary/5 min-h-44"
    :style="{ backgroundColor: loading ? 'var(--surface-subtle)' : color }"
  >
    <template v-if="loading">
      <div class="w-24 h-3 bg-content-dark/5 animate-pulse rounded-full"></div>
      <div class="w-16 h-16 bg-content-dark/5 animate-pulse rounded-full my-2"></div>
      <div class="flex flex-col items-center gap-2">
        <div class="w-12 h-6 bg-content-dark/5 animate-pulse rounded-md"></div>
        <div class="w-20 h-2 bg-content-dark/5 animate-pulse rounded-full"></div>
      </div>
    </template>

    <template v-else>
      <span class="text-md text-content-dark font-bold">{{ label }}</span>

      <div class="w-full h-16 flex items-center justify-center my-2 overflow-hidden">
        <img :src="image" :alt="label" class="h-full object-contain" />
      </div>

      <div class="flex flex-col items-center gap-2xs">
        <span
          class="text-content-dark font-bold leading-tight line-clamp-2 max-w-full"
          :class="String(value).length > 8 ? 'text-2xl' : 'text-3xl'"
        >
          {{ value }}
        </span>
        <span v-if="subtitle" class="text-sm font-semibold text-content-light">{{ subtitle }}</span>
      </div>
    </template>
  </div>
</template>
