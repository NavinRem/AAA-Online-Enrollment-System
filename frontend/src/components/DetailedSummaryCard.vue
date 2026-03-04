<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
  subtitle: String,
})
</script>

<template>
  <div class="summary-card">
    <h3 v-if="title" class="summary-title">{{ title }}</h3>
    <div class="summary-content">
      <h4 v-if="subtitle" class="content-subtitle">{{ subtitle }}</h4>
      <div class="internal-details-card">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.summary-card {
  background: transparent;
  padding: 0;
  margin-bottom: 30px;
}

.summary-title {
  padding: 0 0 16px 0;
  margin: 0;
  font-size: 1.6rem;
  font-weight: 850;
  color: #1a1a1a;
  letter-spacing: -0.5px;
  text-align: left;
}

.summary-content {
  background: #eef6fc;
  padding: 16px;
  border-radius: 12px;
}

.content-subtitle {
  font-size: 1.25rem;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0 0 16px 4px;
  letter-spacing: -0.3px;
  text-align: left;
}

.internal-details-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  text-align: left;
}

:deep(.detail-row) {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  align-items: flex-start;
}

:deep(.detail-row.align-center) {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

:deep(.summary-label) {
  font-size: 1.05rem;
  font-weight: 800;
  color: #1a1a1a;
  margin: 0 0 6px;
}

:deep(.summary-value) {
  font-size: 1.05rem;
  color: #4a5568;
  margin: 0;
  font-weight: 500;
  line-height: 1.5;
}

:deep(.summary-value.inline) {
  display: inline-block;
  margin-left: 8px;
}

:deep(.mt-3) {
  margin-top: 15px;
}
</style>
