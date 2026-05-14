<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { getActionIcon } from '@/utils/assetHelper'

const props = defineProps({
  modelValue: [String, Number, Array],
  items: {
    type: Array,
    default: () => [],
  },
  label: String,
  placeholder: {
    type: String,
    default: '-- Select --',
  },
  required: Boolean,
  disabled: Boolean,
  error: String,
  shake: Boolean,
  searchable: {
    type: Boolean,
    default: true,
  },
  searchPlaceholder: {
    type: String,
    default: 'Search...',
  },
  multiple: Boolean,
  loading: Boolean,
})

const emit = defineEmits(['update:modelValue', 'change', 'click-disabled'])

const isOpen = ref(false)
const searchQuery = ref('')
const triggerRef = ref(null)
const dropdownMenuRef = ref(null)
const searchInput = ref(null)

const dropdownStyle = ref({})

const computeDropdownPosition = async () => {
  await nextTick()
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const dropdownMaxHeight = 280 // Max height based on 220px list + search + padding

  const spaceBelow = viewportHeight - rect.bottom
  const spaceAbove = rect.top

  let top, bottom, transformOrigin
  // If there's enough space below, or more space below than above
  if (spaceBelow >= dropdownMaxHeight || spaceBelow > spaceAbove) {
    top = `${rect.bottom + 2}px`
    bottom = 'auto'
    transformOrigin = 'top center'
  } else {
    top = 'auto'
    bottom = `${viewportHeight - rect.top + 2}px`
    transformOrigin = 'bottom center'
  }

  dropdownStyle.value = {
    top,
    bottom,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    zIndex: 9999,
    transformOrigin,
  }
}

const selectedItem = computed(() => {
  if (props.multiple) return null
  return props.items.find((item) => item.id == props.modelValue)
})

const selectedItems = computed(() => {
  if (!props.multiple || !Array.isArray(props.modelValue)) return []
  return props.items.filter((item) => props.modelValue.includes(item.id))
})

const filteredItems = computed(() => {
  let items = props.items
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    items = items.filter((item) => item.name.toLowerCase().includes(q))
  }
  return items
})

const toggleDropdown = () => {
  if (props.disabled) {
    emit('click-disabled')
    return
  }
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    searchQuery.value = ''
    computeDropdownPosition()
    setTimeout(() => {
      if (searchInput.value) searchInput.value.focus()
    }, 100)
  }
}

const selectItem = (item) => {
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const index = current.indexOf(item.id)
    if (index > -1) {
      current.splice(index, 1)
    } else {
      current.push(item.id)
    }
    emit('update:modelValue', current)
    emit('change', current)
    // Re-calculate position as the height might have changed due to new tags
    computeDropdownPosition()
  } else {
    emit('update:modelValue', item.id)
    emit('change', item.id)
    isOpen.value = false
  }
}

const handleClickOutside = (event) => {
  const clickedTrigger = triggerRef.value && triggerRef.value.contains(event.target)
  const clickedMenu = dropdownMenuRef.value && dropdownMenuRef.value.contains(event.target)
  if (!clickedTrigger && !clickedMenu) {
    isOpen.value = false
  }
}

const handleScrollOrResize = () => {
  if (isOpen.value) {
    computeDropdownPosition()
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
  window.addEventListener('scroll', handleScrollOrResize, true)
  window.addEventListener('resize', handleScrollOrResize)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  window.removeEventListener('scroll', handleScrollOrResize, true)
  window.removeEventListener('resize', handleScrollOrResize)
})
</script>

<template>
  <div class="flex flex-col gap-xs text-left w-full" :class="{ 'animate-shake': shake }">
    <label v-if="label" class="text-sm font-semibold text-content-muted flex items-center gap-1">
      {{ label }}
      <span v-if="required" class="text-error font-bold leading-none">*</span>
    </label>

    <div class="relative w-full" ref="triggerRef">
      <div
        class="relative border-2 border-outline-std rounded-sm bg-surface-subtle cursor-pointer transition-all min-h-[44px] flex items-center group"
        :class="{
          'border-primary bg-white ring-4 ring-primary/5': isOpen,
          'ui-input-invalid': error,
          'opacity-60 cursor-not-allowed': disabled,
        }" @click="toggleDropdown">
        <div class="flex items-center justify-between w-full px-4 py-2">
          <slot name="selected" :item="selectedItem" :items="selectedItems">
            <!-- Multiple Selection View -->
            <div v-if="multiple" class="flex flex-wrap gap-2 flex-1 overflow-hidden">
              <div v-for="item in selectedItems" :key="item.id"
                class="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-sm pl-1.5 pr-2 py-1.5 group/tag animate-in zoom-in-95 duration-200">
                <div
                  class="w-10 h-10 rounded-full overflow-hidden border border-primary/30 bg-white shrink-0 shadow-sm">
                  <img :src="item.profileURL || getActionIcon('edit')" class="w-full h-full object-cover" />
                </div>
                <span class="text-sm font-bold text-primary truncate max-w-[150px]">{{
                  item.name
                }}</span>
                <button type="button" @click.stop="selectItem(item)"
                  class="ml-1 w-5 h-5 flex items-center justify-center rounded-full hover:bg-primary/20 text-primary/40 hover:text-primary transition-colors">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <span v-if="selectedItems.length === 0" class="text-content-light text-sm italic opacity-70">{{
                placeholder }}</span>
            </div>

            <!-- Single Selection View -->
            <div v-else-if="selectedItem" class="flex items-center gap-2 flex-1 overflow-hidden">
              <div class="w-7 h-7 rounded-full border border-outline-std overflow-hidden bg-white shrink-0">
                <img :src="selectedItem.profileURL || getActionIcon('edit')" class="w-full h-full object-cover" />
              </div>
              <span class="text-sm font-semibold text-content-dark truncate flex-1">{{
                selectedItem.name
              }}</span>
              <slot name="selected-badge" :item="selectedItem"></slot>
            </div>
            <span v-else class="text-content-light text-sm italic opacity-70">{{
              placeholder
            }}</span>
          </slot>
          <span class="w-2.5 h-2.5 border-r-2 border-b-2 transform transition-transform duration-300 mr-0.5"
            :class="isOpen ? 'rotate-[-135deg]' : 'rotate-45'"></span>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <transition enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95 -translate-y-2" enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 -translate-y-2">
        <div v-if="isOpen" class="fixed bg-white border-2 border-primary rounded-sm shadow-2xl overflow-hidden"
          :style="dropdownStyle" ref="dropdownMenuRef" @click.stop>
          <div v-if="searchable" class="p-2 border-b border-surface-light relative flex items-center bg-surface-subtle">
            <img :src="getActionIcon('search')" class="absolute left-4 w-4 h-4 opacity-40 pointer-events-none" />
            <input type="text" v-model="searchQuery" :placeholder="searchPlaceholder"
              class="w-full py-2.5 pl-10 pr-4 border-2 border-outline-std rounded-sm text-sm outline-none focus:border-primary transition-all font-semibold"
              @click.stop ref="searchInput" />
          </div>
          <ul class="list-none p-0 m-0 overflow-y-auto scrollable-v" style="max-height: 220px">
            <li v-for="item in filteredItems" :key="item.id"
              class="px-md py-sm flex items-center gap-sm cursor-pointer transition-colors hover:bg-surface-light group/item"
              :class="{
                'bg-primary-light text-primary font-bold': multiple
                  ? Array.isArray(modelValue) && modelValue.includes(item.id)
                  : modelValue == item.id,
              }" @click="selectItem(item)">
              <slot name="item" :item="item">
                <div class="flex items-center gap-3 w-full">
                  <div
                    class="w-8 h-8 rounded-md border border-outline-std overflow-hidden bg-white shrink-0 shadow-sm group-hover/item:scale-105 transition-transform">
                    <img :src="item.profileURL || getActionIcon('edit')" class="w-full h-full object-cover" />
                  </div>
                  <span
                    class="text-sm group-hover/item:translate-x-1 transition-transform duration-200 font-semibold text-content-dark flex-1">{{
                      item.name }}</span>
                  <slot name="item-badge" :item="item"></slot>
                </div>
              </slot>
            </li>
            <li v-if="loading"
              class="p-md text-center text-content-light text-sm italic flex items-center justify-center gap-2">
              <div class="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              Loading...
            </li>
            <li v-else-if="filteredItems.length === 0" class="p-md text-center text-content-light text-sm italic">
              No matches found.
            </li>
          </ul>
        </div>
      </transition>
    </Teleport>

    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-1">
      <p v-if="error" class="text-sm font-semibold text-error pl-1 mt-0.5">
        {{ error }}
      </p>
    </transition>
  </div>
</template>
