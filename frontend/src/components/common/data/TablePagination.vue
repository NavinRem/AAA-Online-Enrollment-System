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

const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return
  emit('update:currentPage', page)
}
</script>

<template>
  <div class="table-pagination">
    <div class="pagination-info">
      Showing <span>{{ startRange }}</span> - <span>{{ endRange }}</span> of
      <span>{{ totalItems }}</span> records
    </div>

    <div class="pagination-controls">
      <button class="pagination-btn prev" :disabled="!canPrev" @click="changePage(currentPage - 1)">
        <span class="btn-icon">‹</span> Previous
      </button>

      <div class="page-numbers">
        Page <strong>{{ currentPage }}</strong> of {{ totalPages }}
      </div>

      <button class="pagination-btn next" :disabled="!canNext" @click="changePage(currentPage + 1)">
        Next <span class="btn-icon">›</span>
      </button>
    </div>
  </div>
</template>
