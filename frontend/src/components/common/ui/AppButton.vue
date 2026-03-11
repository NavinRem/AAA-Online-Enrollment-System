<template>
  <button
    class="app-btn"
    :class="[
      `variant-${variant}`,
      `size-${size}`,
      {
        'is-loading': loading,
        'is-disabled': disabled || loading,
        'has-icon-only': iconOnly,
      },
    ]"
    :type="type"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="spinner"></span>

    <span v-if="$slots['icon-left'] && !loading" class="icon-span left">
      <slot name="icon-left"></slot>
    </span>

    <span v-if="icon && !loading" class="icon-span material-symbols-rounded">{{ icon }}</span>

    <span
      v-if="!iconOnly && ($slots.default || text)"
      class="btn-text"
      :class="{ 'hidden-text': loading }"
    >
      <slot>{{ text }}</slot>
    </span>

    <span v-if="$slots['icon-right'] && !loading" class="icon-span right">
      <slot name="icon-right"></slot>
    </span>
  </button>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'button',
  },
  variant: {
    type: String,
    default: 'primary', // primary, secondary, outline, subtle, light, danger, cancel, logout
  },
  size: {
    type: String,
    default: 'md', // sm, md, lg
  },
  icon: {
    type: String,
    default: '',
  },
  iconOnly: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['click'])
</script>

<style scoped>
@import '@/assets/styles/components/AppButton.css';
</style>
