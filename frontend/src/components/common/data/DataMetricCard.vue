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
    class="flex items-center gap-md p-5 rounded-std shadow-sm flex-1 min-w-[180px] transition-shadow hover:shadow-md"
    :style="{ backgroundColor: color }"
  >
    <div
      class="w-11 h-11 bg-white rounded-sm flex items-center justify-center shadow-md shadow-black/5 flex-shrink-0"
    >
      <img :src="image" :alt="label" class="w-6 h-6 object-contain" />
    </div>
    <div class="flex flex-col leading-tight">
      <span class="text-3xs font-black text-content-muted uppercase tracking-widest opacity-80">{{
        label
      }}</span>
      <span class="text-xl font-black text-content-dark tracking-tighter">{{ value }}</span>
    </div>
  </div>
</template>

