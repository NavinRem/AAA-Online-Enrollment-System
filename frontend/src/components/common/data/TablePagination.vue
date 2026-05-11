<script setup>
import { computed } from 'vue'
import { getIconUrl } from '@/utils/assetHelper'

const props = defineProps({
  currentPage: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  totalItems: { type: Number, default: 0 },
})

const prevIcon = getIconUrl('navigation/prev.svg')
const nextIcon = getIconUrl('navigation/next.svg')

const emit = defineEmits(['update:currentPage'])

const totalPages = computed(() => Math.ceil(props.totalItems / props.pageSize))

const startRange = computed(() => (props.currentPage - 1) * props.pageSize + 1)
const endRange = computed(() => Math.min(props.currentPage * props.pageSize, props.totalItems))

const canPrev = computed(() => props.currentPage > 1)
const canNext = computed(() => props.currentPage < totalPages.value)

const pages = computed(() => {
  const current = props.currentPage
  const total = totalPages.value
  const delta = 2
  const left = current - delta
  const right = current + delta + 1
  const range = []
  const rangeWithDots = []
  let l

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= left && i < right)) {
      range.push(i)
    }
  }

  for (const i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1)
      } else if (i - l !== 1) {
        rangeWithDots.push('...')
      }
    }
    rangeWithDots.push(i)
    l = i
  }

  return rangeWithDots
})

const changePage = (page) => {
  if (typeof page !== 'number') return
  if (page < 1 || page > totalPages.value) return
  emit('update:currentPage', page)
}
</script>

<template>
  <div class="pagination-root">
    <div class="pagination-info">
      <span class="pagination-italic">Showing</span>
      <span class="pagination-range-box">{{ startRange }}</span>
      <span class="pagination-separator">to</span>
      <span class="pagination-range-box">{{ endRange }}</span>
      <span class="pagination-separator">of</span>
      <span class="pagination-total">{{ totalItems }}</span>
      <span class="pagination-italic">records</span>
    </div>

    <div class="pagination-actions">
      <!-- Previous Button -->
      <button class="pagination-nav-btn group/btn" :disabled="!canPrev" @click="changePage(currentPage - 1)"
        title="Previous Page">
        <img :src="prevIcon" alt="Previous" class="w-4 h-4 transition-transform group-hover/btn:-translate-x-0.5">
      </button>

      <!-- Numeric Pages -->
      <div class="flex items-center gap-1.5 px-1">
        <template v-for="(page, idx) in pages" :key="idx">
          <button v-if="page !== '...'" class="pagination-number-btn" :class="[
            page === currentPage
              ? 'pagination-number-btn--active'
              : 'pagination-number-btn--inactive'
          ]" @click="changePage(page)">
            {{ page }}
          </button>
          <span v-else class="pagination-ellipsis">
            ...
          </span>
        </template>
      </div>

      <button class="pagination-nav-btn group/btn" :disabled="!canNext" @click="changePage(currentPage + 1)"
        title="Next Page">
        <img :src="nextIcon" alt="Next" class="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5">
      </button>
    </div>
  </div>
</template>

<style scoped>
.pagination-root {
  @apply flex items-center justify-between px-xl py-md bg-surface-subtle/30 border-t border-outline-std w-full;
}

.pagination-info {
  @apply flex items-center gap-xs text-sm text-content-muted font-medium;
}

.pagination-italic {
  @apply opacity-60 italic;
}

.pagination-range-box {
  @apply font-bold text-content-dark bg-white px-2 py-0.5 rounded-sm shadow-sm ring-1 ring-black/5;
}

.pagination-separator {
  @apply opacity-40 select-none;
}

.pagination-total {
  @apply font-bold text-content-dark;
}

.pagination-actions {
  @apply flex items-center gap-2;
}

.pagination-nav-btn {
  @apply w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-outline-std text-content-muted transition-all duration-200 shadow-sm;
}

.pagination-nav-btn:hover:not(:disabled) {
  @apply border-primary text-primary bg-primary-soft/50 transform scale-105;
}

.pagination-nav-btn:disabled {
  @apply opacity-20 cursor-not-allowed;
}

.pagination-number-btn {
  @apply min-w-[32px] h-8 px-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm border;
}

.pagination-number-btn--active {
  @apply bg-primary border-primary text-white shadow-primary/20 scale-105 z-10;
}

.pagination-number-btn--inactive {
  @apply bg-white border-outline-std text-content-muted hover:border-primary hover:text-primary hover:bg-primary-soft/30;
}

.pagination-ellipsis {
  @apply w-8 text-center text-content-muted/40 font-bold select-none pt-1;
}
</style>
