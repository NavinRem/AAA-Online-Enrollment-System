<template>
  <transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content" :class="variant">
        <div class="modal-header">
          <slot name="header">
            <div class="modal-title-wrapper">
              <img v-if="icon" :src="icon" class="modal-title-icon" />
              <h3>{{ title }}</h3>
            </div>
          </slot>
          <button class="close-btn" @click="$emit('close')">
            <img :src="getActionIcon('close')" class="close-icon" />
          </button>
        </div>

        <div class="modal-body">
          <slot></slot>
        </div>

        <div class="modal-footer" v-if="$slots.footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </transition>
</template>

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
})

defineEmits(['close'])
</script>

<style scoped>
@import '@/assets/styles/components/AppModal.css';
</style>
