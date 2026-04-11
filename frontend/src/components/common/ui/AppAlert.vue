<template>
  <transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <div
      v-if="show"
      class="flex items-start gap-md p-md rounded-sm border-l-4 shadow-sm relative transition-all"
      :class="variantClasses[type] || variantClasses.info"
      :style="customStyle"
    >
      <div class="flex-1 text-sm font-semibold leading-relaxed">
        <slot>{{ message }}</slot>
      </div>
      <button
        v-if="closable"
        class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors cursor-pointer"
        @click="$emit('close')"
      >
        <span class="text-lg leading-none">&times;</span>
      </button>
    </div>
  </transition>
</template>

<script setup>
const props = defineProps({
  show: {
    type: Boolean,
    default: true,
  },
  type: {
    type: String,
    default: 'info',
    validator: (val) => ['success', 'warning', 'error', 'info'].includes(val),
  },
  message: {
    type: String,
    default: '',
  },
  closable: {
    type: Boolean,
    default: false,
  },
  customStyle: {
    type: Object,
    default: () => ({}),
  },
})

const variantClasses = {
  success: 'bg-success-soft border-success text-success-deep',
  error: 'bg-error-soft border-error text-error-deep',
  warning: 'bg-warning-soft border-warning text-warning-deep',
  info: 'bg-info-soft border-info text-info-deep',
}

defineEmits(['close'])
</script>

<style scoped>
/* Scoped styles entirely removed. Transitions are handled via Vue transition classes. */
</style>
