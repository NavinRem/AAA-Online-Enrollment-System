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
  <div class="summary-card-root">
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
  @apply rounded-std p-md sm:p-lg flex flex-col items-center text-center shadow-sm border border-outline-std bg-[var(--accent-light)];
}

.summary-card-root:hover {
  @apply -translate-y-1;
}

.summary-title {
  @apply text-2xs sm:text-xs font-black text-content-muted tracking-widest uppercase mb-1;
}

.summary-image-box {
  @apply w-full h-[60px] sm:h-[85px] flex items-center justify-center my-1 sm:my-2 overflow-hidden;
}

.summary-image {
  @apply w-[80px] h-[80px] object-contain transition-transform duration-500;
}

.group:hover .summary-image {
  @apply scale-110;
}

.summary-value {
  @apply text-2xl sm:text-3xl font-black text-content-dark tracking-tighter;
}
</style>
