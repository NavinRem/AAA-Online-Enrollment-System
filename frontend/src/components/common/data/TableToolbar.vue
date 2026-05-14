<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import SearchBox from '@/components/common/data/SearchBox.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { getStatusFilter, getStatusTheme } from '@/utils/badgeUtils'
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
  searchVariant: {
    type: String,
    default: 'default',
  },
})

const emit = defineEmits(['update:searchQuery', 'update:currentFilter'])

const isFilterOpen = ref(false)
const filterMenuStyles = ref({})
const filterToggleRef = ref(null)

const isActiveFilter = computed(() => props.currentFilter !== 'all' && props.currentFilter !== '')

const activeOption = computed(() => {
  if (props.currentFilter === 'all' || !props.currentFilter) return null
  return props.filterOptions.find((o) => o.value === props.currentFilter)
})

const activeFilterLabel = computed(() => {
  return activeOption.value ? activeOption.value.label : 'Filter'
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

  if (isFilterOpen.value && toggleBtn && !toggleBtn.contains(event.target)) {
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
      <h3 v-if="title" class="ui-section-title whitespace-nowrap">
        {{ title }}
      </h3>
    </div>
    <div class="toolbar-actions">
      <SearchBox
        v-if="hasSearch"
        :modelValue="searchQuery"
        @update:modelValue="$emit('update:searchQuery', $event)"
        :placeholder="searchPlaceholder"
        :variant="searchVariant"
        class="lg:w-[500px] w-full flex-1"
      />
      <div v-if="hasFilter" class="relative">
        <AppButton
          ref="filterToggleRef"
          :variant="isActiveFilter ? 'ghost' : 'secondary'"
          size="md"
          class="rounded-xl transition-all duration-300"
          :class="{ 'shadow-md': isActiveFilter, 'shadow-sm': !isActiveFilter }"
          @click="toggleFilter"
          :style="
            isActiveFilter
              ? {
                  backgroundColor: getStatusTheme(currentFilter, activeOption?.color)
                    .backgroundColor,
                  color: getStatusTheme(currentFilter, activeOption?.color).color,
                  border: `1px solid ${getStatusTheme(currentFilter, activeOption?.color).color}20`,
                }
              : {}
          "
        >
          <img
            v-if="activeOption?.image || activeOption?.profileURL"
            :src="activeOption.image || activeOption.profileURL"
            class="w-4 h-4 transition-all brightness-0 invert"
          />
          <img
            v-else
            :src="getActionIcon('filter')"
            class="w-4 h-4 transition-all"
            :class="{ 'brightness-0 invert': isActiveFilter }"
            :style="!isActiveFilter ? { filter: getStatusFilter('filter') } : {}"
          />
          <span class="font-bold tracking-tight">{{ activeFilterLabel }}</span>
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
              class="toolbar-filter-menu"
              :style="filterMenuStyles"
              @mousedown.stop
            >
              <template v-for="(option, idx) in filterOptions" :key="option.value || `item-${idx}`">
                <div
                  v-if="option.isHeader"
                  class="px-md pt-md pb-xs text-3xs font-semibold text-content-muted sticky top-0 bg-white/95 backdrop-blur-sm z-10 select-none flex items-center justify-between"
                >
                  <span>{{ option.label }}</span>
                </div>
                <div v-else-if="option.isDivider" class="h-px w-full bg-outline-std/50 my-1"></div>
                <div
                  v-else
                  class="toolbar-filter-option"
                  :class="{
                    'active-option': currentFilter === option.value,
                  }"
                  :style="
                    currentFilter === option.value
                      ? {
                          backgroundColor: getStatusTheme(option.value, option.color)
                            .backgroundColor,
                          color: getStatusTheme(option.value, option.color).color,
                        }
                      : {}
                  "
                  @click.stop="selectFilter(option.value)"
                  @mouseenter="
                    (e) => {
                      if (currentFilter !== option.value) {
                        const theme = getStatusTheme(option.value, option.color)
                        if (theme.color !== 'var(--color-gray)') {
                          e.currentTarget.style.backgroundColor = theme.backgroundColor
                          e.currentTarget.style.color = theme.color
                        }
                      }
                    }
                  "
                  @mouseleave="
                    (e) => {
                      if (currentFilter !== option.value) {
                        e.currentTarget.style.backgroundColor = ''
                        e.currentTarget.style.color = ''
                      }
                    }
                  "
                >
                  <div class="flex items-center gap-3">
                    <div
                      v-if="option.badge"
                      class="shrink-0 flex items-center justify-center min-w-[24px]"
                    >
                      <AppBadge :status="option.badge.status" :type="option.badge.type" />
                    </div>
                    <div
                      v-else-if="option.image || option.profileURL"
                      class="shrink-0 flex items-center justify-center overflow-hidden transition-all duration-200"
                      :class="
                        String(option.image || option.profileURL).includes('.svg')
                          ? 'w-4 h-4'
                          : 'w-6 h-6 border border-outline-std/50 bg-white shadow-sm'
                      "
                    >
                      <img
                        :src="option.image || option.profileURL"
                        class="w-full h-full transition-all duration-200"
                        :class="[
                          String(option.image || option.profileURL).includes('.svg')
                            ? 'object-contain'
                            : 'object-cover',
                          {
                            'brightness-0 invert':
                              currentFilter === option.value &&
                              String(option.image || option.profileURL).includes('.svg'),
                          },
                        ]"
                      />
                    </div>
                    <span class="flex-1 truncate">{{ option.label }}</span>
                  </div>
                </div>
              </template>
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
  @apply flex items-center justify-between min-h-[56px] w-full pb-lg;
}

.toolbar-title-box {
  @apply flex items-center gap-md flex-1 min-w-0 pr-xl;
}

.toolbar-title {
  @apply text-base font-bold text-content-dark tracking-tight;
}

.toolbar-actions {
  @apply flex justify-end items-center gap-lg;
}

.toolbar-filter-menu {
  @apply fixed bg-white rounded-md shadow-2xl border border-outline-std z-[10000] p-xs min-w-[240px] max-h-[300px] overflow-y-auto;
}

.toolbar-filter-option {
  @apply px-md py-sm text-sm font-semibold cursor-pointer transition-all rounded-sm select-none hover:bg-surface-subtle hover:text-primary;
}
</style>
