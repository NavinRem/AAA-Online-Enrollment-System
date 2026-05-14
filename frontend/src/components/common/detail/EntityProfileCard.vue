<script setup>
import { getImageUrl } from '@/utils/assetHelper'

defineProps({
  profileURL: { type: String, default: '' },
  title: { type: String, default: 'Basic Information' },
  fallbackImage: { type: String, default: 'profiles/avatar-student' },
})
</script>

<template>
  <section class="ui-detail-card flex flex-col items-center gap-6">
    <h2 class="w-full font-bold text-2xl text-content-dark text-center">{{ title }}</h2>
    <div class="relative group">
      <div
        class="w-40 h-40 rounded-full overflow-hidden ring-4 ring-white shadow-2xl transition-transform duration-500 group-hover:scale-105 border-2 border-gray-100 bg-surface-subtle"
      >
        <img :src="profileURL || getImageUrl(fallbackImage)" class="w-full h-full object-cover" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.ui-detail-card {
  @apply bg-white border border-outline-std shadow-sm p-8 rounded-md;
}
</style>
