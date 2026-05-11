<script setup>
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { useRouter } from 'vue-router'

defineProps({
  title: { type: String, required: true },
  items: {
    type: Array,
    default: () => []
    // Each item: { id, name, profileURL, badgeText, badgeType, route }
  }
})

const router = useRouter()

const navigate = (item) => {
  if (item.route) router.push(item.route)
}
</script>

<template>
  <section class="ui-detail-card bg-primary-soft/30 border-primary/10">
    <h6 class="font-bold  text-3xs text-content-muted mb-4">{{ title }}</h6>
    <div class="space-y-4">
      <div v-for="item in items" :key="item.id" @click="navigate(item)"
        class="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-subtle transition-all cursor-pointer group">
        <div class="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm">
          <img :src="item.profileURL" class="w-full h-full object-cover" />
        </div>
        <span class="text-md font-bold text-content-dark group-hover:text-primary transition-colors">
          {{ item.name }}
        </span>
        <AppBadge v-if="item.badgeText" :type="item.badgeType || 'blue'">
          {{ item.badgeText }}
        </AppBadge>
      </div>
      <div v-if="items.length === 0" class="text-xs italic text-content-muted py-2">
        No relationships found.
      </div>
    </div>
  </section>
</template>

<style scoped>
.ui-detail-card {
  @apply bg-white border border-outline-std shadow-sm p-8 rounded-md;
}
</style>
