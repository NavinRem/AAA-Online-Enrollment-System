<template>
  <div class="table-root">
    <!-- Loading State -->
    <div v-if="loading"
      class="flex-1 flex items-center justify-center p-xl sm:p-3xl text-content-light font-bold text-base animate-pulse">
      <slot name="loading">Loading data...</slot>
    </div>

    <!-- Table Container (Scrollable) -->
    <div v-else :class="['table-container', flexible ? '' : 'flex-1 scrollable-v']">
      <table class="w-full border-separate border-spacing-0 table-fixed">
        <!-- Sticky Header -->
        <thead class="sticky top-0 z-20 bg-white">
          <tr class="w-full">
            <th v-for="(col, index) in headers" :key="index"
              :style="typeof col === 'object' && col.width ? { width: col.width, minWidth: col.width } : {}"
              class="table-header-cell" :class="[
                typeof col === 'object' ? col.class : '',
                typeof col === 'object' && col.align ? `text-${col.align}` : 'text-left',
              ]">
              {{ typeof col === 'object' ? col.label : col }}
            </th>
          </tr>
        </thead>

        <!-- Body -->
        <tbody class="w-full">
          <slot></slot>

          <!-- Empty State -->
          <tr v-if="empty">
            <td :colspan="headers.length" class="table-empty-state">
              <slot name="empty">No records found.</slot>
            </td>
          </tr>

        </tbody>
      </table>
      <!-- Footer Slot (for pagination) -->
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  headers: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  empty: {
    type: Boolean,
    default: false,
  },
  flexible: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
.table-root {
  @apply w-full relative flex flex-1 flex-col min-h-0 overflow-hidden bg-white rounded-md border border-outline-std shadow-sm;
}

.table-container {
  @apply w-full flex flex-col min-h-0;
}

.table-header-cell {
  @apply ui-header-cell backdrop-blur-sm bg-white/95;
}

.table-empty-state {
  @apply text-center p-3xl text-content-light font-semibold text-base py-20;
}

/* Subtle header divider shade on scroll */
.scrollable-v::-webkit-scrollbar {
  width: 6px;
}
</style>
