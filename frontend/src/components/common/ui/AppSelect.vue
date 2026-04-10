<template>
  <div class="custom-dropdown-container" ref="dropdownRef">
    <div 
      class="custom-dropdown" 
      :class="{ open: isOpen, disabled: disabled }"
      @click="toggleDropdown"
    >
      <div class="dropdown-header">
        <div v-if="selectedItem" class="selected-item">
          <span class="item-name">{{ selectedItem.name }}</span>
        </div>
        <span v-else class="placeholder">{{ placeholder }}</span>
        <span class="chevron" :class="{ up: isOpen }"></span>
      </div>
      
      <div class="dropdown-menu" v-if="isOpen" @click.stop>
        <div v-if="searchable" class="dropdown-search">
          <img :src="getActionIcon('search')" class="search-icon-mini" />
          <input
            type="text"
            v-model="searchQuery"
            :placeholder="searchPlaceholder"
            @click.stop
            ref="searchInput"
          />
        </div>
        <ul class="dropdown-list">
          <li
            v-for="item in filteredItems"
            :key="item.id"
            class="dropdown-item"
            :class="{ active: modelValue === item.id }"
            @click="selectItem(item)"
          >
            <div class="item-info">
              <span class="item-name">{{ item.name }}</span>
            </div>
          </li>
          <li v-if="filteredItems.length === 0" class="dropdown-item no-results">
            No matches found.
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { getActionIcon } from '@/utils/assetHelper'

const props = defineProps({
  modelValue: [String, Number],
  items: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: '-- Select --'
  },
  disabled: Boolean,
  searchable: {
    type: Boolean,
    default: true
  },
  searchPlaceholder: {
    type: String,
    default: 'Search...'
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const isOpen = ref(false)
const searchQuery = ref('')
const dropdownRef = ref(null)
const searchInput = ref(null)

const selectedItem = computed(() => {
  return props.items.find(item => item.id === props.modelValue)
})

const filteredItems = computed(() => {
  if (!searchQuery.value) return props.items
  const q = searchQuery.value.toLowerCase()
  return props.items.filter(item => 
    item.name.toLowerCase().includes(q)
  )
})

const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    searchQuery.value = ''
    setTimeout(() => {
      if (searchInput.value) searchInput.value.focus()
    }, 100)
  }
}

const selectItem = (item) => {
  emit('update:modelValue', item.id)
  emit('change', item.id)
  isOpen.value = false
}

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})

watch(() => props.modelValue, () => {
  // Reset search when selection changes if needed? Maybe not.
})
</script>

<style scoped>
/* Scoped styles to ensure functionality even if global CSS isn't loaded */
.custom-dropdown-container {
  position: relative;
  width: 100%;
}

.custom-dropdown {
  position: relative;
  border: 1.5px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  background: var(--bg-subtle);
  cursor: pointer;
  transition: all 0.2s;
}

.custom-dropdown.open {
  border-color: var(--primary-color);
  background: var(--white);
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.custom-dropdown.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.dropdown-header {
  padding: var(--space-xs) var(--space-sm);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
}

.selected-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.placeholder {
  color: var(--text-light);
  font-size: var(--text-sm);
}

.chevron {
  width: 8px;
  height: 8px;
  border-right: 2px solid var(--text-muted);
  border-bottom: 2px solid var(--text-muted);
  transform: rotate(45deg);
  transition: transform 0.3s;
  margin-right: 4px;
}

.chevron.up {
  transform: rotate(-135deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: -1.5px;
  right: -1.5px;
  background: var(--white);
  border: 1.5px solid var(--primary-color);
  border-top: none;
  border-bottom-left-radius: var(--border-radius-sm);
  border-bottom-right-radius: var(--border-radius-sm);
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.dropdown-search {
  padding: var(--space-xs);
  border-bottom: 1px solid var(--bg-light);
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon-mini {
  position: absolute;
  left: 16px;
  width: 14px;
  height: 14px;
  opacity: 0.4;
  pointer-events: none;
}

.dropdown-search input {
  width: 100%;
  padding: var(--space-2xs) var(--space-md) var(--space-2xs) 30px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: var(--text-sm);
  outline: none;
}

.dropdown-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-item {
  padding: var(--space-xs) var(--space-sm);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  transition: background 0.2s;
  cursor: pointer;
}

.dropdown-item:hover {
  background: var(--bg-light);
}

.dropdown-item.active {
  background: var(--primary-soft);
  color: var(--primary-color);
}

.item-name {
  font-size: var(--text-sm);
  font-weight: 500;
}

.no-results {
  padding: var(--space-sm);
  text-align: center;
  color: var(--text-light);
  font-size: var(--text-sm);
}
</style>
