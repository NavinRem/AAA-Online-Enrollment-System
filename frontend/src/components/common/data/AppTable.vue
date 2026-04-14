<template>
  <div
    class="w-full relative flex flex-1 flex-col min-h-0 overflow-hidden bg-white rounded-md border border-outline-std group shadow-sm">
    <!-- Loading State -->
    <div v-if="loading"
      class="flex-1 flex items-center justify-center p-xl sm:p-3xl text-content-light font-bold text-base animate-pulse">
      <slot name="loading">Loading data...</slot>
    </div>

    <!-- Table Container (Scrollable) -->
    <div v-else class="flex-1 flex flex-col min-h-0 w-full scrollable-v">
      <table class="w-full border-separate border-spacing-0 table-fixed">
        <!-- Sticky Header -->
        <thead class="sticky top-0 z-20 bg-white">
          <tr class="w-full">
            <th v-for="(col, index) in headers" :key="index"
              :style="typeof col === 'object' && col.width ? { width: col.width, minWidth: col.width } : {}"
              class="ui-header-cell shadow-[0_1px_rgba(0,0,0,0.05)] backdrop-blur-sm bg-white/95" :class="[
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
            <td :colspan="headers.length" class="text-center p-3xl text-content-light font-semibold text-base py-20">
              <slot name="empty">No records found.</slot>
            </td>
          </tr>

          <!-- Footer Slot (for pagination) -->
          <slot name="footer"></slot>
        </tbody>
      </table>
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
})
</script>

<style scoped>
/* Ensure table layout is consistent */
table {
  border-collapse: separate;
}

thead th {
  transition: background-color 0.2s;
}

/* Subtle header divider shade on scroll */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}
</style>
