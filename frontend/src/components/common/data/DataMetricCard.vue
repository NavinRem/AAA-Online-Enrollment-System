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
    required: true,
  },
})
</script>

<template>
  <div
    class="flex flex-col items-center justify-between gap-xs p-6 rounded-std shadow-sm flex-1 transition-all hover:shadow-md text-center group border border-primary/5"
    :style="{ backgroundColor: color }">
    <span class="text-2xs text-content-dark/60 font-bold uppercase tracking-widest">{{ label }}</span>

    <div class="w-full h-16 flex items-center justify-center my-2 overflow-hidden">
      <img :src="image" :alt="label" class="h-full object-contain" />
    </div>

    <div class="flex flex-col items-center gap-2xs">
      <span class="text-lg text-content-dark font-bold tracking-tight leading-tight line-clamp-2 max-w-full"
        :class="{ 'text-3xl': typeof value === 'number' }">{{
          value }}</span>
      <span v-if="subtitle" class="text-3xs font-bold text-content-dark/40 uppercase tracking-widest">{{ subtitle }}</span>
    </div>
  </div>
</template>
