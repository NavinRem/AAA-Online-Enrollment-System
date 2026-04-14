<script setup>
import { computed } from 'vue'
import AppTable from '@/components/common/data/AppTable.vue'
import TableToolbar from '@/components/common/data/TableToolbar.vue'
import { useTableActions } from '@/composables/useTableActions'
import StatusBadge from '../ui/StatusBadge.vue'
import TablePagination from './TablePagination.vue'
import { getStatusCategory, getStatusDisplay } from '@/utils/statusUtils'

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
  loadingMessage: { type: String, default: 'Loading data...' },
  emptyMessage: { type: String, default: 'No records found.' },
  title: { type: String, default: '' },
  rowClass: { type: Function, default: () => '' },
  currentPage: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  totalItems: { type: Number, default: 0 },
  hasPagination: { type: Boolean, default: false },
  entityName: { type: String, default: 'record' },
})

const emit = defineEmits([
  'update:searchQuery',
  'update:currentFilter',
  'update:currentPage',
  'row-click',
  'action',
])

const { activeMenuId, isMenuAbove, menuStyles, toggleMenu, closeMenu } = useTableActions()

const displayEmptyMessage = computed(() => {
  if (props.loading) return props.loadingMessage
  return props.emptyMessage
})

const emptyState = computed(() => {
  if (props.loading) return { prefix: props.loadingMessage, label: '', suffix: '' }

  const entity = props.entityName?.toLowerCase() || 'record'

  if (props.searchQuery) {
    return {
      prefix: `No matching ${entity} found for `,
      label: `"${props.searchQuery}"`,
      suffix: '',
    }
  }

  if (props.currentFilter !== 'all' && props.filterOptions.length > 0) {
    const option = props.filterOptions.find((o) => o.value === props.currentFilter)
    if (option) {
      return {
        prefix: 'no',
        label: option.value,
        suffix: `${entity} record found`,
      }
    }
  }

  return {
    prefix: 'No ',
    label: '',
    suffix: `${entity} records found.`,
  }
})

const handleAction = (type, item) => {
  emit('action', { type, item })
  closeMenu()
}
</script>

<template>
  <div class="flex-1 min-h-0 flex flex-col w-full">
    <TableToolbar :hasSearch="hasSearch" :searchQuery="searchQuery"
      @update:searchQuery="emit('update:searchQuery', $event)" :searchPlaceholder="searchPlaceholder"
      :hasFilter="hasFilter" :currentFilter="currentFilter" @update:currentFilter="emit('update:currentFilter', $event)"
      :filterOptions="filterOptions" :title="title">
      <template #actions>
        <slot name="toolbar-actions"></slot>
      </template>
    </TableToolbar>

    <div class="flex-1 min-h-0 flex flex-col w-full p-xs overflow-hidden">
      <AppTable :headers="headers" :loading="loading" :empty="!items || items.length === 0">
        <template #loading>{{ displayEmptyMessage }}</template>
        <template #empty>
          <div class="flex items-center justify-center gap-sm text-content-muted text-sm font-semibold italic">
            <span v-if="emptyState.prefix">{{ emptyState.prefix }}</span>
            <StatusBadge v-if="emptyState.label" :status="currentFilter" :type="getStatusCategory(currentFilter)">
              {{ getStatusDisplay(emptyState.label) }}
            </StatusBadge>
            <span v-if="emptyState.suffix">{{ emptyState.suffix }}</span>
          </div>
        </template>

        <tr v-for="(item, index) in items" :key="item.id || index" class="ui-row group" :class="rowClass(item)"
          @click="emit('row-click', item)">
          <slot name="row" :item="item" :index="index" :toggleMenu="toggleMenu" :activeMenuId="activeMenuId"
            :isMenuAbove="isMenuAbove" :menuStyles="menuStyles" :handleAction="handleAction" :closeMenu="closeMenu"
            :headers="headers">
            <td v-for="(header, hIdx) in headers" :key="hIdx" class="ui-cell"
              :class="typeof header === 'object' && header.align ? `text-${header.align}` : ''"
              :style="typeof header === 'object' && header.width ? { width: header.width, minWidth: header.width } : {}">
              {{
                item[
                typeof header === 'object'
                  ? header.key || header.label.toLowerCase().replace(' ', '')
                  : header.toLowerCase().replace(' ', '')
                ]
              }}
            </td>
          </slot>
        </tr>

        <template #footer>
          <tr v-if="hasPagination && items && items.length > 0" class="mt-4 block w-full">
            <td :colspan="headers.length" class="p-0 border-none bg-transparent w-full block">
              <TablePagination :currentPage="currentPage" :pageSize="pageSize" :totalItems="totalItems"
                @update:currentPage="emit('update:currentPage', $event)" />
            </td>
          </tr>
        </template>
      </AppTable>
    </div>
  </div>
</template>
