<template>
  <div class="table-toolbar">
    <div class="table-title-area">
      <h2 v-if="title" class="table-title">{{ title }}</h2>
    </div>
    <div class="table-controls">
      <SearchBox v-if="hasSearch" :modelValue="searchQuery" @update:modelValue="$emit('update:searchQuery', $event)"
        :placeholder="searchPlaceholder" variant="light" />
      <div v-if="hasFilter" class="filter-dropdown-container">
        <AppButton ref="filterToggleRef" variant="secondary"
          :class="{ active: currentFilter !== 'all' && currentFilter !== '' }"
          :style="currentFilter !== 'all' && currentFilter !== '' ? { backgroundColor: getStatusTheme(currentFilter).backgroundColor, color: getStatusTheme(currentFilter).color, borderColor: getStatusTheme(currentFilter).color + '33' } : {}"
          @click="toggleFilter">
          <img :src="getActionIcon('filter')" class="btn-icon-mini"
            :style="currentFilter !== 'all' && currentFilter !== '' ? { filter: getStatusFilter(currentFilter) } : { filter: 'none' }" />
          {{ activeFilterLabel }}
        </AppButton>
        <Teleport to="body">
          <transition name="toast-fade">
            <div v-if="isFilterOpen" class="filter-dropdown-menu" :style="filterMenuStyles" @mousedown.stop>
              <div v-for="option in filterOptions" :key="option.value" class="filter-option"
                :class="{ active: currentFilter === option.value }"
                @click.stop="selectFilter(option.value)">
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import SearchBox from '@/components/common/data/SearchBox.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import { getStatusTheme, getStatusCategory, getStatusFilter } from '@/utils/statusUtils'
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
const filterToggleRef = ref(null)

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
      top: `${rect.bottom + window.scrollY + 8}px`,
      left: `${rect.left + window.scrollX}px`,
      minWidth: `${rect.width}px`,
      position: 'absolute',
      zIndex: 9999
    }
  }
}

const handleClickOutside = (event) => {
  const toggleBtn = filterToggleRef.value?.$el || filterToggleRef.value
  const menu = document.querySelector('.filter-dropdown-menu')

  if (isFilterOpen.value &&
    toggleBtn && !toggleBtn.contains(event.target) &&
    menu && !menu.contains(event.target)) {
    isFilterOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})

const selectFilter = (val) => {
  emit('update:currentFilter', val)
  isFilterOpen.value = false
}


</script>

<style>
@import '@/assets/styles/components/TableToolbar.css';
</style>
