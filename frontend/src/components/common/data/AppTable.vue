<template>
  <div class="table-container">
    <div v-if="loading" class="loading-state">
      <slot name="loading">Loading data...</slot>
    </div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th 
            v-for="(col, index) in headers" 
            :key="index"
            :style="typeof col === 'object' ? { width: col.width } : {}"
            :class="typeof col === 'object' ? col.class : ''"
          >
            {{ typeof col === 'object' ? col.label : col }}
          </th>
        </tr>
      </thead>
      <tbody>
        <slot></slot>
        <tr v-if="empty">
          <td :colspan="headers?.length || 1" class="empty-state">
            <slot name="empty">No records found.</slot>
          </td>
        </tr>
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
@import '@/assets/styles/components/AppTable.css';
</style>
