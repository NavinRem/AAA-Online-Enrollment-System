<script setup>
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { useRouter } from 'vue-router'

defineProps({
  title: { type: String, required: true },
  items: {
    type: Array,
    default: () => [],
    // Each item: { id, name, profileURL, badgeText, badgeType, route, programIcons: [] }
  },
})

const router = useRouter()

const navigate = (item) => {
  if (item.route) router.push(item.route)
}
</script>

<template>
  <section class="ui-detail-card bg-primary-soft/30 border-primary/10">
    <div class="flex items-center justify-between mb-4">
      <h2 class="font-bold text-2xl text-content-dark">{{ title }}</h2>
      <slot name="header-action"></slot>
    </div>
    <div class="space-y-4">
      <div
        v-for="item in items"
        :key="item.id"
        @click="navigate(item)"
        class="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-subtle transition-all cursor-pointer group"
      >
        <div
          class="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md bg-surface-subtle flex-shrink-0"
        >
          <img :src="item.profileURL" class="w-full h-full object-cover" />
        </div>
        <div class="flex flex-col flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <span
              class="text-lg font-bold text-content-dark group-hover:text-primary transition-colors truncate"
            >
              {{ item.name }}
            </span>
            <AppBadge v-if="item.badgeText" :type="item.badgeType || 'blue'">
              {{ item.badgeText }}
            </AppBadge>
          </div>
          <span v-if="item.description" class="text-md font-bold text-content-muted truncate">
            {{ item.description }}
          </span>
        </div>
      </div>
      <div v-if="items.length === 0" class="text-xs italic text-content-muted py-2">
        No records found.
      </div>
    </div>
  </section>
</template>

<style scoped>
.ui-detail-card {
  @apply bg-white border border-outline-std shadow-sm p-8 rounded-md;
}
</style>
