<script setup>
defineProps({
  title: String,
  value: [String, Number],
  subtitle: String,
  image: String,
})

const handleImageError = (e) => {
  e.target.style.display = 'none'
}
</script>

<template>
  <div
    class="flex items-center gap-md bg-[var(--accent-light)] p-md rounded-sm w-full border border-outline-std transition-all hover:bg-white hover:shadow-md hover:border-primary/20 group"
  >
    <div
      class="w-10 h-10 flex items-center justify-center rounded-sm bg-white shadow-sm ring-1 ring-border flex-shrink-0 group-hover:scale-110 transition-transform"
    >
      <img :src="image" :alt="title" @error="handleImageError" class="w-7 h-7 object-contain" />
    </div>
    <div class="flex flex-col gap-0.5 overflow-hidden">
      <h4 class="text-3xs font-black uppercase tracking-widest text-content-muted truncate">
        {{ title }}
      </h4>
      <div class="text-base font-black text-content-dark leading-tight tracking-tighter">
        {{ value }}
      </div>
      <div v-if="subtitle" class="text-3xs text-content-muted font-bold truncate">
        {{ subtitle }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles removed in favor of Tailwind CSS utility classes */
</style>
