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
  <div
    class="rounded-std p-md sm:p-lg flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 shadow-sm border border-outline-std bg-[var(--accent-light)] group"
  >
    <div class="flex flex-col items-center justify-between h-full w-full gap-xs">
      <h3 class="text-2xs sm:text-xs font-black text-content-muted tracking-widest uppercase mb-1">
        {{ title }}
      </h3>
      <div
        class="w-full h-[60px] sm:h-[85px] flex items-center justify-center my-1 sm:my-2 overflow-hidden"
      >
        <img
          :src="image"
          :alt="title"
          @error="handleImageError"
          class="w-[55px] sm:w-[75px] h-[55px] sm:h-[75px] object-contain transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div class="text-2xl sm:text-3xl font-black text-content-dark tracking-tighter">
        {{ value }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles removed in favor of utility-first Tailwind CSS classes */
</style>
