<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  totalItems: { type: Number, default: 0 },
})

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
  <div class="flex items-center justify-between px-2xl py-lg bg-surface-subtle/30 border-t border-outline-std w-full group">
    <div class="flex items-center gap-xs text-sm text-content-muted font-medium">
      <span class="opacity-60 italic">Showing</span>
      <span class="font-black text-content-dark bg-white px-2 py-0.5 rounded-sm shadow-sm ring-1 ring-black/5">{{ startRange }}</span>
      <span class="opacity-40 select-none">to</span>
      <span class="font-black text-content-dark bg-white px-2 py-0.5 rounded-sm shadow-sm ring-1 ring-black/5">{{ endRange }}</span>
      <span class="opacity-40 select-none">of</span>
      <span class="font-black text-content-dark">{{ totalItems }}</span>
      <span class="opacity-60 italic">records</span>
    </div>

    <div class="flex items-center gap-2">
      <!-- Previous Button -->
      <button 
        class="pagination-nav-btn group/btn" 
        :disabled="!canPrev" 
        @click="changePage(currentPage - 1)"
        title="Previous Page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform group-hover/btn:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <!-- Numeric Pages -->
      <div class="flex items-center gap-1.5 px-1">
        <template v-for="(page, idx) in pages" :key="idx">
          <button 
            v-if="page !== '...'"
            class="min-w-[36px] h-9 px-2 rounded-lg text-sm font-black transition-all duration-200 shadow-sm border"
            :class="[
              page === currentPage 
                ? 'bg-primary border-primary text-white shadow-primary/20 scale-105 z-10' 
                : 'bg-white border-outline-std text-content-muted hover:border-primary hover:text-primary hover:bg-primary-soft/30'
            ]"
            @click="changePage(page)"
          >
            {{ page }}
          </button>
          <span 
            v-else 
            class="w-8 text-center text-content-muted/40 font-black tracking-widest select-none pt-1"
          >
            ...
          </span>
        </template>
      </div>

      <!-- Next Button -->
      <button 
        class="pagination-nav-btn group/btn" 
        :disabled="!canNext" 
        @click="changePage(currentPage + 1)"
        title="Next Page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transition-transform group-hover/btn:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.pagination-nav-btn {
  @apply w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-outline-std text-content-muted 
         transition-all duration-200 hover:border-primary hover:text-primary hover:bg-primary-soft/50 
         disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-outline-std shadow-sm;
}
</style>
