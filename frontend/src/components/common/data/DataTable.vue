<script setup>
import AppTable from '@/components/common/data/AppTable.vue'
import TableToolbar from '@/components/common/data/TableToolbar.vue'
import { useTableActions } from '@/composables/useTableActions'

const props = defineProps({
  headers: { type: Array, required: true },
  items: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  searchQuery: { type: String, default: '' },
  searchPlaceholder: { type: String, default: 'Search...' },
  hasFilter: { type: Boolean, default: false },
  currentFilter: { type: String, default: 'all' },
  filterOptions: { type: Array, default: () => [] },
  hasSearch: { type: Boolean, default: true },
  emptyMessage: { type: String, default: 'No data found.' },
  loadingMessage: { type: String, default: 'Loading...' },
  actionLabel: { type: String, default: 'Action' }
})

const emit = defineEmits(['update:searchQuery', 'update:currentFilter', 'action', 'row-click', 'add-click'])

const { activeMenuId, isMenuAbove, menuStyles, toggleMenu, closeMenu } = useTableActions()

const handleAction = (type, item) => {
  emit('action', { type, item })
  closeMenu()
}

const handleSearchUpdate = (val) => emit('update:searchQuery', val)
const handleFilterUpdate = (val) => emit('update:currentFilter', val)
</script>

<template>
  <div class="generic-data-table-container">
    <TableToolbar
      :hasSearch="hasSearch"
      :searchQuery="searchQuery"
      @update:searchQuery="handleSearchUpdate"
      :searchPlaceholder="searchPlaceholder"
      :hasFilter="hasFilter"
      :currentFilter="currentFilter"
      @update:currentFilter="handleFilterUpdate"
      :filterOptions="filterOptions"
    >
      <template #actions>
        <slot name="toolbar-actions"></slot>
      </template>
    </TableToolbar>

    <AppTable :headers="headers" :loading="loading" :empty="!items || items.length === 0">
      <template #loading>{{ loadingMessage }}</template>
      <template #empty>{{ emptyMessage }}</template>

      <tr
        v-for="(item, index) in items"
        :key="item.id || index"
        class="clickable-row"
        @click="emit('row-click', item.id || item.uid)"
      >
        <slot name="row" :item="item" :index="index" :toggleMenu="toggleMenu" :activeMenuId="activeMenuId" :isMenuAbove="isMenuAbove" :menuStyles="menuStyles" :handleAction="handleAction">
          <!-- Default Row Content if no slot provided -->
          <td v-for="header in headers" :key="header">{{ item[header.toLowerCase().replace(' ', '')] }}</td>
        </slot>
      </tr>
    </AppTable>
  </div>
</template>

<style scoped>
.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s;
}
.clickable-row:hover {
  background-color: #f8fafc;
}
</style>
