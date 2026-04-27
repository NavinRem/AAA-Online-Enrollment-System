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
  subValue: {
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
    <span class="text-xs text-primary-deep font-black uppercase tracking-widest opacity-80">{{ label }}</span>

    <div class="w-full h-16 flex items-center justify-center my-2 overflow-hidden">
      <img :src="image" :alt="label" class="h-full object-contain" />
    </div>

    <div class="flex flex-col items-center gap-1">
      <span class="text-xl text-black font-black tracking-tight leading-tight line-clamp-2 max-w-full"
        :class="{ 'text-4xl': typeof value === 'number' }">{{
          value }}</span>
      <span v-if="subValue" class="text-xs font-black text-primary uppercase tracking-widest">{{ subValue }}</span>
    </div>
  </div>
</template>
