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
  color: {
    type: String,
    default: 'var(--primary-soft)',
  },
})
</script>

<template>
  <div
    class="flex flex-col items-center justify-between gap-xs p-6 rounded-std shadow-sm flex-1 min-w-[200px] transition-all hover:shadow-md text-center group border border-primary/5"
    :style="{ backgroundColor: color || 'var(--accent-light)' }">
    <span class="text-sm font-black text-primary uppercase tracking-widest">{{ label }}</span>

    <div class="w-full h-24 flex items-center justify-center my-1 overflow-hidden">
      <img :src="image" :alt="label"
        class="h-full object-contain transition-transform duration-700 group-hover:scale-110" />
    </div>

    <span class="text-4xl font-black text-content-dark tracking-tighter tabular-nums leading-none">{{ value }}</span>
  </div>
</template>
