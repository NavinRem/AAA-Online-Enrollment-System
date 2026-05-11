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
})

const handleImageError = (e) => {
  e.target.style.display = 'none'
}
</script>

<template>
  <div class="ui-mini-card group">
    <div
      class="w-10 h-10 flex items-center justify-center rounded-sm bg-white shadow-sm ring-1 ring-border flex-shrink-0 group-hover:scale-110 transition-transform">
      <img :src="image" :alt="title" @error="handleImageError" class="w-7 h-7 object-contain" />
    </div>
    <div class="flex flex-col gap-0.5 overflow-hidden">
      <h4 class="text-xs font-semibold  text-content-muted truncate">
        {{ title }}
      </h4>
      <div class="text-lg font-bold text-content-dark leading-tight tracking-tighter">
        {{ value }}
      </div>
    </div>
  </div>
</template>
