<script setup>
defineProps({
  type: {
    type: String,
    default: 'button',
  },
  variant: {
    type: String,
    default: 'primary', // primary, outline, subtle, light
  },
  size: {
    type: String,
    default: 'md', // sm, md, lg
  },
  icon: String,
  disabled: Boolean,
  loading: Boolean,
})
</script>

<template>
  <button
    class="app-btn"
    :class="[`variant-${variant}`, `size-${size}`]"
    :type="type"
    :disabled="disabled || loading"
  >
    <slot name="icon-left"></slot>
    <span v-if="icon" class="icon-span">{{ icon }}</span>
    <slot></slot>
    <span v-if="loading" class="spinner">...</span>
    <slot name="icon-right"></slot>
  </button>
</template>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-family: inherit;
}

/* Variants */
.variant-primary {
  background: #00aeef;
  color: white;
}
.variant-primary:hover {
  opacity: 0.9;
}

.variant-outline {
  background: white;
  border: 1px solid #00aeef;
  color: #00aeef;
}
.variant-outline:hover {
  background: #f0f9ff;
}

.variant-subtle {
  background: #f8f9fa;
  border: 1px solid #ddd;
  color: #555;
}
.variant-subtle:hover {
  background: #eee;
}

.variant-light {
  background: #e6f6fd;
  color: #00aeef;
}
.variant-light:hover {
  background: #d4effc;
}

/* Sizes */
.size-sm {
  padding: 8px 16px;
  font-size: 0.85rem;
}
.size-md {
  padding: 12px 24px;
  font-size: 0.95rem;
}
.size-lg {
  padding: 14px 30px;
  font-size: 1.1rem;
}

.app-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  margin-left: 5px;
  font-size: 0.8em;
}
</style>
