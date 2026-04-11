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

<style scoped>
.table-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--white);
  border-top: 1px solid var(--bg-light);
  border-radius: 0 0 16px 16px;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.pagination-info span {
  font-weight: 700;
  color: var(--text-dark);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-dark);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--bg-light);
  border-color: var(--text-light);
  color: var(--text-dark);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--bg-light);
}

.btn-icon {
  font-size: 1.2rem;
  line-height: 1;
}

.page-numbers {
  font-size: 0.85rem;
}

.page-numbers strong {
  background: var(--primary-color);
  color: var(--white);
  padding: 2px 8px;
  border-radius: 4px;
  margin: 0 4px;
}

@media (max-width: 640px) {
  .table-pagination {
    flex-direction: column;
    gap: 16px;
    align-items: center;
    padding: 16px;
  }
}
</style>
