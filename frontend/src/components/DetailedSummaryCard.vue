<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="summary-card">
    <h3 class="summary-title">{{ title }}</h3>
    <div class="summary-content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.summary-card {
  background: white;
  border-radius: 16px;
  padding: 0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.summary-title {
  padding: 20px 20px 15px;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: #1a1a1a;
  border-bottom: 1px solid #f0f0f0;
}

.summary-content {
  background: #eef6fc;
  padding: 20px;
  margin: 20px;
  border-radius: 12px;
}

:deep(.detail-row) {
  display: flex;
  align-items: center;
}

:deep(.detail-row.align-center) {
  justify-content: space-between;
}

:deep(.summary-label) {
  font-size: 0.85rem;
  font-weight: 600;
  color: #555;
  margin: 0 0 4px;
}

:deep(.summary-value) {
  font-size: 0.9rem;
  color: #1a1a1a;
  margin: 0;
  font-weight: 500;
  line-height: 1.4;
}

:deep(.summary-value.inline) {
  display: inline-block;
  margin-left: 8px;
}

:deep(.mt-3) {
  margin-top: 15px;
}
</style>
