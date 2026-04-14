<template>
  <div class="flex flex-col gap-xs text-left w-full" :class="{ 'animate-shake': shake }">
    <label v-if="label" class="text-sm font-semibold text-content-dark flex items-center gap-1">
      {{ label }}
      <span v-if="required" class="text-error font-bold leading-none">*</span>
    </label>

    <div class="relative w-full" ref="dropdownRef">
      <div
        class="relative border-2 border-outline-std rounded-sm bg-surface-subtle cursor-pointer transition-all min-h-[44px] flex items-center group"
        :class="{
          'border-primary bg-white rounded-b-none ring-4 ring-primary/5': isOpen,
          'ui-input-invalid': error,
          'opacity-60 cursor-not-allowed': disabled,
        }" @click="toggleDropdown">
        <div class="flex items-center justify-between w-full px-4 py-2">
          <slot name="selected" :item="selectedItem">
            <div v-if="selectedItem" class="flex items-center gap-3">
              <div class="w-7 h-7 rounded-sm border border-outline-std overflow-hidden bg-white shrink-0">
                <img :src="selectedItem.profileURL || getActionIcon('edit')" class="w-full h-full object-cover" />
              </div>
              <span class="text-sm font-semibold text-content-dark">{{ selectedItem.name }}</span>
            </div>
            <span v-else class="text-content-light text-sm italic opacity-70">{{ placeholder }}</span>
          </slot>
          <span
            class="w-2.5 h-2.5 border-r-2 border-b-2 border-text-muted transform transition-transform duration-300 mr-0.5"
            :class="isOpen ? 'rotate-[-135deg]' : 'rotate-45'"></span>
        </div>

        <transition enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 -translate-y-2" enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-2">
          <div
            class="absolute top-[calc(100%+2px)] -left-[2px] -right-[2px] bg-white border-2 border-primary border-t-0 rounded-b-sm z-[1000] shadow-xl overflow-hidden"
            v-if="isOpen" @click.stop>
            <div v-if="searchable"
              class="p-2 border-b border-surface-light relative flex items-center bg-surface-subtle">
              <img :src="getActionIcon('search')" class="absolute left-4 w-4 h-4 opacity-40 pointer-events-none" />
              <input type="text" v-model="searchQuery" :placeholder="searchPlaceholder"
                class="w-full py-2.5 pl-10 pr-4 border-2 border-outline-std rounded-sm text-sm outline-none focus:border-primary transition-all font-semibold"
                @click.stop ref="searchInput" />
            </div>
            <ul class="list-none p-0 m-0 max-h-[200px] scrollable-v">
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
                      class="text-sm group-hover/item:translate-x-1 transition-transform duration-200 font-semibold text-content-dark">{{
                      item.name }}</span>
                  </div>
                </slot>
              </li>
              <li v-if="filteredItems.length === 0" class="p-md text-center text-content-light text-sm italic">
                No matches found.
              </li>
            </ul>
          </div>
        </transition>
      </div>
    </div>

    <!-- Error Message -->
    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-1">
      <p v-if="error" class="text-3xs font-black text-error uppercase tracking-widest pl-1 mt-0.5">
        {{ error }}
      </p>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { getActionIcon, getImageUrl } from '@/utils/assetHelper'

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
const dropdownRef = ref(null)
const searchInput = ref(null)

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
</script>
