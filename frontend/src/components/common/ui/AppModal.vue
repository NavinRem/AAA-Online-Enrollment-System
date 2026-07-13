<script setup>
import { getActionIcon } from '@/utils/assetHelper'
import AppAlert from '@/components/common/ui/AppAlert.vue'

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
  error: {
    type: String,
    default: '',
  },
  success: {
    type: String,
    default: '',
  },
})

defineEmits(['close', 'clear-error', 'clear-success'])
</script>

<template>
  <Teleport to="body">
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 w-full h-screen bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-modal p-4 sm:p-md"
        @click.self="$emit('close')"
      >
        <transition
          enter-active-class="transition duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          enter-from-class="opacity-0 scale-90 translate-y-8"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-250 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
          appear
        >
          <div
            v-if="show"
            class="bg-white rounded-std overflow-hidden shadow-2xl flex flex-col relative border border-white/30 w-full modal-content"
            :class="[
              variant === 'action' ? 'max-w-full sm:max-w-xl' : 'max-w-full lg:max-w-5xl',
              variant,
            ]"
            :style="maxWidth ? { maxWidth } : {}"
          >
            <!-- Header -->
            <div
              class="px-md sm:px-2xl py-md sm:py-xl border-b border-surface-light flex justify-between items-center bg-white"
            >
              <slot name="header">
                <div class="flex items-center gap-sm">
                  <img v-if="icon" :src="icon" class="w-6 h-6 object-contain opacity-80" />
                  <h3 class="m-0 text-lg sm:text-xl font-bold text-content-dark tracking-tight">
                    {{ title }}
                  </h3>
                </div>
              </slot>
              <button
                class="bg-surface-light w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-content-muted cursor-pointer transition-all duration-300 hover:bg-border hover:text-content-dark hover:rotate-90 group"
                @click="$emit('close')"
              >
                <img
                  :src="getActionIcon('close')"
                  class="w-3 h-3 sm:w-4 sm:h-4 object-contain opacity-60 group-hover:opacity-100 transition-opacity"
                />
              </button>
            </div>

            <!-- Content Area -->
            <div class="p-md sm:p-xl flex-1 overflow-y-auto bg-white scrollable-v">
              <slot></slot>
            </div>

            <!-- Sticky Alerts -->
            <div
              v-if="error || success"
              class="px-md sm:px-xl py-4 bg-white border-t border-surface-light shrink-0"
            >
              <AppAlert
                v-if="error"
                type="error"
                :message="error"
                class="mb-2 last:mb-0"
                closable
                @close="$emit('clear-error')"
              />
              <AppAlert
                v-if="success"
                type="success"
                :message="success"
                class="mb-2 last:mb-0"
                closable
                @close="$emit('clear-success')"
              />
            </div>

            <!-- Footer -->
            <div
              class="px-md sm:px-xl py-md sm:py-lg bg-surface-subtle border-t border-surface-light flex flex-col sm:flex-row justify-end gap-sm sm:gap-md"
              v-if="$slots.footer"
            >
              <slot name="footer"></slot>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.modal-content {
  max-height: calc(100vh - 2rem);
}
@media (min-width: 640px) {
  .modal-content {
    max-height: calc(100vh - 4rem);
  }
}
</style>
