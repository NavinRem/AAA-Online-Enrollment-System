<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  image: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: '#e0f2fe'
  }
})
</script>

<template>
  <div class="metric-card" :style="{ backgroundColor: color }">
    <div class="metric-icon">
      <img :src="image" :alt="label" />
    </div>
    <div class="metric-info">
      <span class="metric-label">{{ label }}</span>
      <span class="metric-value">{{ value }}</span>
    </div>
  </div>
</template>

<style scoped>
.metric-card {
  padding: 20px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
  flex: 1;
  min-width: 180px;
}

.metric-icon {
  width: 44px;
  height: 44px;
  background: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.metric-icon img {
  width: 24px;
  height: 24px;
}

.metric-info {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: #1e293b;
}
</style>
