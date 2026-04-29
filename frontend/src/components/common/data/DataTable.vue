<script setup>
import { computed } from 'vue'
import AppTable from '@/components/common/data/AppTable.vue'
import TableToolbar from '@/components/common/data/TableToolbar.vue'
import { useTableActions } from '@/composables/useTableActions'
import AppBadge from '../ui/AppBadge.vue'
import TablePagination from './TablePagination.vue'

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
  flexible: { type: Boolean, default: false },
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
  if (props.loading) return { prefix: props.loadingMessage, label: '', suffix: '', showBadge: false }

  const entity = props.entityName?.toLowerCase()

  if (props.searchQuery) {
    return {
      prefix: 'No',
      label: `"${props.searchQuery}"`,
      suffix: `found in ${entity} records.`,
      showBadge: false
    }
  }

  if (props.currentFilter && props.currentFilter !== 'all') {
    const option = props.filterOptions.find((o) => o.value === props.currentFilter)
    return {
      prefix: 'No',
      label: option ? option.label : props.currentFilter,
      color: option?.color || '',
      suffix: `${entity} records found.`,
      showBadge: true
    }
  }

  return {
    prefix: 'No',
    label: '',
    suffix: `${entity} records found.`,
    showBadge: false
  }
})

const handleAction = (type, item) => {
  emit('action', { type, item })
  closeMenu()
}
</script>

<template>
  <div :class="[
    'w-full flex flex-col',
    flexible ? '' : 'flex-1 min-h-0'
  ]">
    <AppTable :headers="headers" :loading="loading" :empty="!items || items.length === 0" :flexible="flexible">
      <template #toolbar>
        <TableToolbar :hasSearch="hasSearch" :searchQuery="searchQuery"
          @update:searchQuery="emit('update:searchQuery', $event)" :searchPlaceholder="searchPlaceholder"
          :hasFilter="hasFilter" :currentFilter="currentFilter"
          @update:currentFilter="emit('update:currentFilter', $event)" :filterOptions="filterOptions" :title="title">
          <template #actions>
            <slot name="toolbar-actions"></slot>
          </template>
        </TableToolbar>
      </template>

      <template #loading>{{ displayEmptyMessage }}</template>

      <template #empty>
        <div class="flex items-center justify-center gap-sm text-content-muted text-sm font-semibold italic">
          <span v-if="emptyState.prefix">{{ emptyState.prefix }}</span>
          <AppBadge v-if="emptyState.showBadge" :status="emptyState.label" size="sm" :type="emptyState.color" />
          <span v-else-if="emptyState.label" class="text-primary">{{ emptyState.label }}</span>
          <span v-if="emptyState.suffix">{{ emptyState.suffix }}</span>
        </div>
      </template>

      <tr v-for="(item, index) in items" :key="item.id || index" class="ui-row group" :class="rowClass(item)"
        @click="emit('row-click', item)">
        <slot name="row" :item="item" :index="index" :toggleMenu="toggleMenu" :activeMenuId="activeMenuId"
          :isMenuAbove="isMenuAbove" :menuStyles="menuStyles" :handleAction="handleAction" :closeMenu="closeMenu"
          :headers="headers">
          <td v-for="(header, hIdx) in headers" :key="hIdx" class="ui-cell" :class="[
            typeof header === 'object' && header.align ? `text-${header.align}` : '',
            typeof header === 'object' && header.hideOnMobile ? 'hidden-on-mobile' : ''
          ]"
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
        <TablePagination v-if="hasPagination && items && items.length > 0" :currentPage="currentPage"
          :pageSize="pageSize" :totalItems="totalItems" @update:currentPage="emit('update:currentPage', $event)" />
      </template>
    </AppTable>
  </div>
</template>
