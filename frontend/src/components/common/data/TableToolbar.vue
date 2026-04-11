<template>
  <div
    class="flex items-center justify-between px-2xl py-lg bg-white border-b border-outline-std min-h-[80px] w-full"
  >
    <div class="flex flex-col gap-[2px]">
      <h2 v-if="title" class="text-xl font-extrabold text-content-dark tracking-tight">
        {{ title }}
      </h2>
    </div>
    <div class="flex items-center gap-md">
      <SearchBox
        v-if="hasSearch"
        :modelValue="searchQuery"
        @update:modelValue="$emit('update:searchQuery', $event)"
        :placeholder="searchPlaceholder"
        variant="default"
      />
      <div v-if="hasFilter" class="relative">
        <AppButton
          ref="filterToggleRef"
          variant="secondary"
          :class="{
            'ring-2 ring-primary ring-offset-2': currentFilter !== 'all' && currentFilter !== '',
          }"
          :style="
            isActiveFilter
              ? {
                  backgroundColor: getStatusTheme(currentFilter).backgroundColor,
                  color: getStatusTheme(currentFilter).color,
                  borderColor: getStatusTheme(currentFilter).color + '33',
                }
              : {}
          "
          @click="toggleFilter"
        >
          <img
            :src="getActionIcon('filter')"
            class="w-3 h-3 transition-all"
            :style="
              isActiveFilter ? { filter: getStatusFilter(currentFilter) } : { filter: 'none' }
            "
          />
          <span class="font-bold">{{ activeFilterLabel }}</span>
        </AppButton>
        <Teleport to="body">
          <transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="transform scale-95 opacity-0"
            enter-to-class="transform scale-100 opacity-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <div
              v-if="isFilterOpen"
              class="fixed bg-white rounded-md shadow-2xl border border-outline-std z-[10000] p-xs min-w-[150px] overflow-hidden"
              :style="filterMenuStyles"
              @mousedown.stop
            >
              <div
                v-for="option in filterOptions"
                :key="option.value"
                class="px-md py-sm text-sm font-semibold cursor-pointer transition-colors rounded-sm hover:bg-surface-subtle select-none"
                :class="{
                  'bg-primary-soft text-primary font-bold': currentFilter === option.value,
                }"
                @click.stop="selectFilter(option.value)"
              >
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
import { getStatusTheme, getStatusFilter } from '@/utils/statusUtils'
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

<style scoped>
/* Scoped styles removed in favor of Tailwind */
</style>
