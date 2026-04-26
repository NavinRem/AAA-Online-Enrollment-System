<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { getActionIcon } from '@/utils/assetHelper'

const props = defineProps({
  modelValue: [String, Number],
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
  const spaceBelow = viewportHeight - rect.bottom
  const dropdownMaxHeight = 260

  let top, transformOrigin
  if (spaceBelow >= dropdownMaxHeight || spaceBelow >= 150) {
    top = rect.bottom + window.scrollY + 2
    transformOrigin = 'top center'
  } else {
    top = rect.top + window.scrollY - dropdownMaxHeight - 2
    transformOrigin = 'bottom center'
  }

  dropdownStyle.value = {
    top: `${top}px`,
    left: `${rect.left + window.scrollX}px`,
    width: `${rect.width}px`,
    zIndex: 9999,
    transformOrigin,
  }
}

const selectedItem = computed(() => {
  return props.items.find((item) => item.id == props.modelValue)
})

const filteredItems = computed(() => {
  if (!searchQuery.value) return props.items
  const q = searchQuery.value.toLowerCase()
  return props.items.filter((item) => item.name.toLowerCase().includes(q))
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
  emit('update:modelValue', item.id)
  emit('change', item.id)
  isOpen.value = false
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
    <label v-if="label" class="text-sm font-semibold text-content-dark flex items-center gap-1">
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
          <slot name="selected" :item="selectedItem">
            <div v-if="selectedItem" class="flex items-center gap-2 flex-1 overflow-hidden">
              <div class="w-7 h-7 rounded-full border border-outline-std overflow-hidden bg-white shrink-0">
                <img :src="selectedItem.profileURL" class="w-full h-full object-cover" />
              </div>
              <span class="text-sm font-semibold text-content-dark truncate flex-1">{{ selectedItem.name }}</span>
              <slot name="selected-badge" :item="selectedItem"></slot>
            </div>
            <span v-else class="text-content-light text-sm italic opacity-70">{{ placeholder }}</span>
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
          <ul class="list-none p-0 m-0 overflow-y-auto scrollable-v" style="max-height: 220px;">
            <li v-for="item in filteredItems" :key="item.id"
              class="px-md py-sm flex items-center gap-sm cursor-pointer transition-colors hover:bg-surface-light group/item"
              :class="{ 'bg-primary-soft text-primary font-bold': modelValue == item.id }" @click="selectItem(item)">
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
            <li v-if="filteredItems.length === 0" class="p-md text-center text-content-light text-sm italic">
              No matches found.
            </li>
          </ul>
        </div>
      </transition>
    </Teleport>

    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-1">
      <p v-if="error" class="text-3xs font-black text-error uppercase tracking-widest pl-1 mt-0.5">
        {{ error }}
      </p>
    </transition>
  </div>
</template>
