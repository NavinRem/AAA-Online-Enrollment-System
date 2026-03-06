<template>
  <div class="table-toolbar">
    <SearchBox
      v-if="hasSearch"
      :modelValue="searchQuery"
      @update:modelValue="$emit('update:searchQuery', $event)"
      :placeholder="searchPlaceholder"
    />

    <div v-if="hasFilter" class="filter-dropdown-container">
      <AppButton
        variant="secondary"
        :class="{ active: currentFilter !== 'all' && currentFilter !== '' }"
        @click="toggleFilter"
        @blur="closeFilter"
      >
        <span style="margin-right: 6px"></span> Filter
      </AppButton>
      <transition name="toast-fade">
        <div v-if="isFilterOpen" class="filter-dropdown-menu">
          <div
            v-for="option in filterOptions"
            :key="option.value"
            class="filter-option"
            :class="{ active: currentFilter === option.value }"
            @click.stop="selectFilter(option.value)"
          >
            {{ option.label }}
          </div>
        </div>
      </transition>
    </div>

    <!-- Actions for Add Buttons, etc -->
    <slot name="actions"></slot>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import SearchBox from '../SearchBox/SearchBox.vue'
import AppButton from '../AppButton/AppButton.vue'

defineProps({
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

const toggleFilter = () => {
  isFilterOpen.value = !isFilterOpen.value
}

const closeFilter = () => {
  setTimeout(() => {
    isFilterOpen.value = false
  }, 200)
}

const selectFilter = (val) => {
  emit('update:currentFilter', val)
  isFilterOpen.value = false
}
</script>

<style src="./TableToolbar.css" scoped></style>
