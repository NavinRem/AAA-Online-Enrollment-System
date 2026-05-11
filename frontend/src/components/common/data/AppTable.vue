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

<template>
  <div class="table-root">
    <div v-if="$slots.toolbar" class="table-toolbar-container">
      <slot name="toolbar"></slot>
    </div>

    <div v-if="loading"
      class="flex-1 flex items-center justify-center p-xl sm:p-3xl text-content-light font-bold text-base animate-pulse">
      <slot name="loading">Loading data...</slot>
    </div>
    <div v-else :class="['table-content-area', flexible ? '' : 'flex-1 scrollable-v']">
      <table class="w-full border-separate border-spacing-0 table-auto">
        <thead class="sticky top-0 z-20 bg-white">
          <tr class="w-full">
            <th v-for="(col, index) in headers" :key="index"
              :style="typeof col === 'object' && col.width ? { width: col.width, minWidth: col.width } : {}"
              class="table-header-cell" :class="[
                typeof col === 'object' ? col.class : '',
                typeof col === 'object' && col.align ? `text-${col.align}` : 'text-left',
                typeof col === 'object' && col.hideOnMobile ? 'hidden-on-mobile' : '',
              ]">
              <slot :name="`header-${(typeof col === 'object' ? col.label : col).toLowerCase().replace(/\s+/g, '-') || 'index-' + index}`" :column="col" :index="index">
                <div class="flex flex-col gap-0.5">
                  <span class="block">{{ typeof col === 'object' ? col.label : col }}</span>
                  <span v-if="typeof col === 'object' && col.subLabel"
                    class="block text-xs opacity-60 font-bold normal-case">{{ col.subLabel }}</span>
                </div>
              </slot>
            </th>
          </tr>
        </thead>
        <tbody class="w-full">
          <slot></slot>
          <tr v-if="empty">
            <td :colspan="headers.length" class="table-empty-state">
              <slot name="empty">No records found.</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="$slots.footer" class="table-footer-container">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<style scoped>
.table-root {
  @apply w-full relative flex flex-1 flex-col min-h-0 overflow-hidden bg-white rounded-md border border-outline-std shadow-sm p-4 sm:p-6;
}

.table-toolbar-container {
  @apply w-full flex-shrink-0 border-b border-outline-std/50;
}

.table-content-area {
  @apply w-full flex flex-col min-h-0 overflow-x-auto;
}

.table-footer-container {
  @apply w-full flex-shrink-0 border-t border-outline-std/50;
}

.table-header-cell {
  @apply px-md py-sm text-content-muted text-sm font-bold border-b border-outline-std bg-surface-subtle/50 backdrop-blur-sm sticky top-0 whitespace-nowrap;
}

.table-empty-state {
  @apply text-center p-3xl text-content-light font-semibold text-base py-20;
}

.scrollable-v::-webkit-scrollbar {
  width: 6px;
}

.table-content-area::-webkit-scrollbar {
  height: 6px;
}

.table-content-area::-webkit-scrollbar-track {
  @apply bg-surface-subtle/50;
}

.table-content-area::-webkit-scrollbar-thumb {
  @apply bg-outline-std/50 rounded-full hover:bg-outline-std;
}
</style>
