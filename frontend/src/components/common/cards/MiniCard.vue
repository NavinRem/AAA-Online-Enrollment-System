<script setup>
defineProps({
  title: {
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

const handleImageError = (e) => {
  e.target.style.display = 'none'
}
</script>

<template>
  <div class="flex items-center gap-md p-md rounded-sm w-full border border-outline-std transition-all"
    :style="{ backgroundColor: color }">
    <div
      class="w-10 h-10 flex items-center justify-center rounded-sm bg-white shadow-sm ring-1 ring-border flex-shrink-0 group-hover:scale-110 transition-transform">
      <img :src="image" :alt="title" @error="handleImageError" class="w-7 h-7 object-contain" />
    </div>
    <div class="flex flex-col gap-0.5 overflow-hidden">
      <h4 class="text-3xs font-black uppercase tracking-widest text-content-muted truncate">
        {{ title }}
      </h4>
      <div class="text-base font-black text-content-dark leading-tight tracking-tighter">
        {{ value }}
      </div>
    </div>
  </div>
</template>
