<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import SearchBox from '@/components/common/data/SearchBox.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import { getStatusTheme, getStatusFilter } from '@/utils/badgeUtils'
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

const isActiveFilter = computed(() => props.currentFilter !== 'all' && props.currentFilter !== '')

const activeFilterLabel = computed(() => {
  if (props.currentFilter === 'all' || !props.currentFilter) return 'Filter'
  const option = props.filterOptions.find((o) => o.value === props.currentFilter)
  return option ? option.label : 'Filter'
})

const toggleFilter = (event) => {
  isFilterOpen.value = !isFilterOpen.value
  if (isFilterOpen.value) {
    const rect = event.currentTarget.getBoundingClientRect()
    filterMenuStyles.value = {
      top: `${rect.bottom + window.scrollY + 8}px`,
      left: `${rect.left + window.scrollX}px`,
      width: `${rect.width}px`,
    }
  }
}

const handleClickOutside = (event) => {
  const toggleBtn = filterToggleRef.value?.$el || filterToggleRef.value
  const menu = document.querySelector('.filter-dropdown-menu') // Note: this class is removed, but we check click outside logic

  if (isFilterOpen.value && toggleBtn && !toggleBtn.contains(event.target)) {
    // Close if clicking outside the button. Teleported menu has @mousedown.stop
    isFilterOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('mousedown', handleClickOutside)
})

const selectFilter = (val) => {
  emit('update:currentFilter', val)
  isFilterOpen.value = false
}
</script>

<template>
  <div class="toolbar-root">
    <div class="toolbar-title-box">
      <h2 v-if="title" class="toolbar-title">
        {{ title }}
      </h2>
    </div>
    <div class="toolbar-actions">
      <SearchBox v-if="hasSearch" :modelValue="searchQuery" @update:modelValue="$emit('update:searchQuery', $event)"
        :placeholder="searchPlaceholder" variant="default" class="!w-[350px] flex-shrink-0" />
      <div v-if="hasFilter" class="relative">
        <AppButton ref="filterToggleRef" :variant="isActiveFilter ? currentFilter : 'light'" size="md"
          :class="{ 'border-primary shadow-sm': isActiveFilter }" @click="toggleFilter">
          <img :src="getActionIcon('filter')" class="w-4 h-4 transition-all"
            :style="{ filter: getStatusFilter(isActiveFilter ? currentFilter : 'filter') }" />
          <span class="font-extrabold tracking-tight">{{ activeFilterLabel }}</span>
        </AppButton>
        <Teleport to="body">
          <transition enter-active-class="transition duration-200 ease-out"
            enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100"
            leave-to-class="opacity-0">
            <div v-if="isFilterOpen" class="toolbar-filter-menu" :style="filterMenuStyles" @mousedown.stop>
              <div v-for="option in filterOptions" :key="option.value" class="toolbar-filter-option" :class="{
                'bg-primary-soft text-primary font-bold': currentFilter === option.value,
              }" @click.stop="selectFilter(option.value)">
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

<style scoped>
.toolbar-root {
  @apply flex items-center justify-between px-md py-sm min-h-[56px] w-full;
}

.toolbar-title-box {
  @apply flex flex-col gap-[2px];
}

.toolbar-title {
  @apply text-base font-extrabold text-content-dark tracking-tight;
}

.toolbar-actions {
  @apply flex items-center gap-lg;
}

.toolbar-filter-menu {
  @apply fixed bg-white rounded-md shadow-2xl border border-outline-std z-[10000] p-xs min-w-[150px] overflow-hidden;
}

.toolbar-filter-option {
  @apply px-md py-sm text-sm font-semibold cursor-pointer transition-colors rounded-sm hover:bg-surface-subtle select-none;
}
</style>
