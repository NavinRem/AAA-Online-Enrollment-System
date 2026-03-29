<template>
  <transition name="alert-fade">
    <div v-if="show" :class="['alert-box', type]" :style="customStyle">
      <div class="alert-content">
        <slot>{{ message }}</slot>
      </div>
      <button v-if="closable" class="alert-close" @click="$emit('close')">&times;</button>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: true
  },
  type: {
    type: String,
    default: 'info', // 'success', 'warning', 'error', 'info'
    validator: (val) => ['success', 'warning', 'error', 'info'].includes(val)
  },
  message: {
    type: String,
    default: ''
  },
  closable: {
    type: Boolean,
    default: false
  },
  customStyle: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['close'])
</script>

<style scoped>
.alert-fade-enter-active,
.alert-fade-leave-active {
  transition: all 0.3s ease;
}

.alert-fade-enter-from,
.alert-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.alert-content {
  flex: 1;
}

.alert-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  line-height: 1;
  color: currentColor;
  opacity: 0.6;
  cursor: pointer;
  padding: 0 4px;
  margin-top: -2px;
  transition: opacity 0.2s;
}

.alert-close:hover {
  opacity: 1;
}

/* Base alert-box styles are in main.css, 
   scoped styles here handle component-specific layout */
</style>
