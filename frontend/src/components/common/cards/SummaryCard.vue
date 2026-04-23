<script setup>
defineProps({
  title: String,
  value: [String, Number],
  image: String,
})

const handleImageError = (e) => {
  e.target.style.opacity = '0.3'
}
</script>

<template>
  <div class="summary-card-root group">
    <div class="flex flex-col items-center justify-between h-full w-full gap-xs">
      <h3 class="summary-title">
        {{ title }}
      </h3>
      <div class="summary-image-box">
        <img :src="image" :alt="title" @error="handleImageError" class="summary-image" />
      </div>
      <div class="summary-value">
        {{ value }}
      </div>
    </div>
  </div>
</template>
<style scoped>
.summary-card-root {
  @apply rounded-std p-6 flex flex-col items-center text-center shadow-sm border border-primary/5 transition-all hover:shadow-md bg-[var(--accent-light)];
}

.summary-title {
  @apply text-[10px] font-bold text-primary tracking-[0.1em] uppercase mb-1 opacity-80;
}

.summary-image-box {
  @apply w-full h-[70px] sm:h-[90px] flex items-center justify-center my-1 overflow-hidden;
}

.summary-image {
  @apply h-full object-contain transition-transform duration-700;
}

.group:hover .summary-image {
  @apply scale-110;
}

.summary-value {
  @apply text-3xl sm:text-4xl font-black text-content-dark tracking-tighter tabular-nums leading-none;
}
</style>
