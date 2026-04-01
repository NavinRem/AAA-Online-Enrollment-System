<template>
  <div class="table-toolbar">
    <div class="table-title-area">
      <h2 v-if="title" class="table-title">{{ title }}</h2>
    </div>
    <div class="table-controls">
      <SearchBox v-if="hasSearch" :modelValue="searchQuery" @update:modelValue="$emit('update:searchQuery', $event)"
        :placeholder="searchPlaceholder" />
      <div v-if="hasFilter" class="filter-dropdown-container">
        <AppButton variant="secondary" :class="{ active: currentFilter !== 'all' && currentFilter !== '' }"
          :style="getStatusTheme(currentFilter)" @click="toggleFilter" @blur="closeFilter">
          <img :src="getActionIcon('filter')" class="btn-icon-mini"
            :class="{ 'reverse-icon': currentFilter !== 'all' && currentFilter !== '' }" /> {{ activeFilterLabel }}
        </AppButton>
        <Teleport to="body">
          <transition name="toast-fade">
            <div v-if="isFilterOpen" class="filter-dropdown-menu status-filter-menu scrollable-menu"
              :style="filterMenuStyles" @mousedown.stop>
              <div v-for="option in filterOptions" :key="option.value" class="filter-option"
                :class="{ active: currentFilter === option.value }" @click.stop="selectFilter(option.value)">
                {{ option.label }}
              </div>
            </div>
          </transition>
        </Teleport>
      </div>
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import SearchBox from '@/components/common/data/SearchBox.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import { getStatusTheme } from '@/utils/statusHelper'
import { getActionIcon } from '@/utils/assetHelper'

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  hasSearch: {
    type: Boolean,
    default: true,
  },
  searchQuery: {
    type: String,
    default: '',
  },
  searchPlaceholder: {
    type: String,
    default: 'Search...',
  },
  hasFilter: {
    type: Boolean,
    default: false,
  },
  currentFilter: {
    type: String,
    default: 'all',
  },
  filterOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:searchQuery', 'update:currentFilter'])

const isFilterOpen = ref(false)
const filterMenuStyles = ref({})

const activeFilterLabel = computed(() => {
  if (props.currentFilter === 'all' || !props.currentFilter) return 'Filter'
  const option = props.filterOptions.find(o => o.value === props.currentFilter)
  return option ? option.label : 'Filter'
})

const toggleFilter = (event) => {
  isFilterOpen.value = !isFilterOpen.value
  if (isFilterOpen.value) {
    const rect = event.currentTarget.getBoundingClientRect()
    filterMenuStyles.value = {
      top: `${rect.bottom + 8}px`,
      left: `${rect.left}px`,
      maxWidth: '150px'
    }
  }
}

const closeFilter = (event) => {
  setTimeout(() => {
    const menu = document.querySelector('.status-filter-menu')
    if (menu && menu.contains(event.relatedTarget)) return
    isFilterOpen.value = false
  }, 200)
}

const selectFilter = (val) => {
  emit('update:currentFilter', val)
  isFilterOpen.value = false
}
</script>

<style>
@import '@/assets/styles/components/TableToolbar.css';
</style>
