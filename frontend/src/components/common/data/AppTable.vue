<template>
  <div class="w-full px-2xs relative mt-xl flex flex-1 flex-col min-h-0">
    <div
      v-if="loading"
      class="text-center p-xl sm:p-3xl text-content-light font-bold text-base bg-white rounded-std border border-outline-std animate-pulse"
    >
      <slot name="loading">Loading data...</slot>
    </div>

    <table v-else class="ui-table group">
      <!-- Fixed Header -->
      <thead class="flex-none block w-full z-10 bg-white">
        <tr class="flex w-full">
          <th
            v-for="(col, index) in headers"
            :key="index"
            :style="typeof col === 'object' ? { width: col.width } : { flex: 1 }"
            class="ui-header-cell flex items-center"
            :class="[
              typeof col === 'object' ? col.class : '',
              typeof col === 'object' && col.align ? `text-${col.align}` : 'text-left',
              index === 0 ? 'pl-md sm:pl-xl' : '',
              index === headers.length - 1 ? 'pr-md sm:pr-xl' : '',
            ]"
          >
            {{ typeof col === 'object' ? col.label : col }}
          </th>
        </tr>
      </thead>

      <!-- Scrollable Body -->
      <tbody class="flex-1 block w-full overflow-y-auto min-h-0 scrollable-v pr-1">
        <slot></slot>
        <tr v-if="empty" class="w-full flex">
          <td
            class="text-center p-3xl text-content-light font-semibold text-base w-full bg-white rounded-std border border-outline-std mt-2 flex items-center justify-center min-h-[200px]"
          >
            <slot name="empty">No records found.</slot>
          </td>
        </tr>
        <slot name="footer"></slot>
      </tbody>
    </table>
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
/* Scoped styles removed in favor of centralized UI pattern classes in main.css */
</style>
