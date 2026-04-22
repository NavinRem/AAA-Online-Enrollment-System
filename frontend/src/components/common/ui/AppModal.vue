<script setup>
import { getActionIcon } from '@/utils/assetHelper'

defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  variant: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
  maxWidth: {
    type: String,
    default: '',
  },
})

defineEmits(['close'])
</script>

<template>
  <transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0"
    enter-to-class="opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100"
    leave-to-class="opacity-0">
    <div v-if="show"
      class="fixed inset-0 w-full h-screen bg-[#0a1e32]/50 backdrop-blur-md flex items-center justify-center z-[2000] p-4 sm:p-md"
      @click.self="$emit('close')">
      <transition enter-active-class="transition duration-400 cubic-bezier(0.34, 1.56, 0.64, 1)"
        enter-from-class="opacity-0 scale-90 translate-y-8" enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition duration-250 ease-in" leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 translate-y-4" appear>
        <div v-if="show"
          class="bg-white rounded-std overflow-hidden shadow-2xl flex flex-col relative border border-white/30 w-full"
          :class="[
            variant === 'action' ? 'max-w-[95%] sm:max-w-[600px]' : 'max-w-full lg:max-w-[1000px]',
            variant,
          ]" :style="maxWidth ? { maxWidth } : {}">
          <!-- Header -->
          <div
            class="px-md sm:px-2xl py-md sm:py-xl border-b border-surface-light flex justify-between items-center bg-white">
            <slot name="header">
              <div class="flex items-center gap-sm">
                <img v-if="icon" :src="icon" class="w-6 h-6 object-contain opacity-80" />
                <h3 class="m-0 text-lg sm:text-xl font-extrabold text-content-dark tracking-tight">
                  {{ title }}
                </h3>
              </div>
            </slot>
            <button
              class="bg-surface-light w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-content-muted cursor-pointer transition-all duration-300 hover:bg-border hover:text-content-dark hover:rotate-90 group"
              @click="$emit('close')">
              <img :src="getActionIcon('close')"
                class="w-3 h-3 sm:w-4 sm:h-4 object-contain opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          <!-- Content Area -->
          <div class="p-md sm:p-xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto bg-white scrollable-v">
            <slot></slot>
          </div>

          <!-- Footer -->
          <div
            class="px-md sm:px-xl py-md sm:py-lg bg-surface-subtle border-t border-surface-light flex flex-col sm:flex-row justify-end gap-sm sm:gap-md"
            v-if="$slots.footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>
