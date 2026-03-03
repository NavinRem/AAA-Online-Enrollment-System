<script setup>
defineProps({
  text: String,
  type: {
    type: String,
    default: 'default', // success, warning, danger, info, indigo
  },
  size: {
    type: String,
    default: 'sm', // sm, md, lg
  },
})
</script>

<template>
  <span class="app-badge" :class="[`badge-${type}`, `badge-${size}`]">
    {{ text }}
    <slot></slot>
  </span>
</template>

<style scoped>
.app-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  line-height: 1.2;
}

/* Types */
.badge-success {
  background: #e6f8ea;
  color: #2e7d32;
}
.badge-warning {
  background: #fff8e1;
  color: #f57f17;
}
.badge-danger {
  background: #ffebee;
  color: #c62828;
}
.badge-info {
  background: #e3f2fd;
  color: #0d47a1;
}
.badge-indigo {
  background: #e8eaf6;
  color: #3f51b5;
}
.badge-default {
  background: #f5f5f5;
  color: #666;
}
.badge-primary {
  background: #00aeef;
  color: white;
}

/* Sizes */
.badge-sm {
  font-size: 0.75rem;
  padding: 2px 8px;
}
.badge-md {
  font-size: 0.85rem;
  padding: 4px 12px;
}
.badge-lg {
  font-size: 1rem;
  padding: 6px 16px;
}
</style>
