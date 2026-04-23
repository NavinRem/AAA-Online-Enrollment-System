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
    required: true,
  },
})
</script>

<template>
  <div
    class="flex flex-col items-center justify-between gap-xs p-6 rounded-std shadow-sm flex-1 transition-all hover:shadow-md text-center group border border-primary/5"
    :style="{ backgroundColor: color }">
    <span class="text-sm text-primary-deep font-bold uppercase tracking-widest">{{ label }}</span>

    <div class="w-full h-24 flex items-center justify-center my-1 overflow-hidden">
      <img :src="image" :alt="label" class="h-full object-contain" />
    </div>

    <span class="text-4xl text-black font-semibold tracking-tighter tabular-nums leading-none">{{
      value }}</span>
  </div>
</template>
