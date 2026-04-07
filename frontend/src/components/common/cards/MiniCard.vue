<script setup>
defineProps({
  title: String,
  value: [String, Number],
  subtitle: String,
  image: String,
})

const handleImageError = (e) => {
  e.target.style.display = 'none'
}
</script>

<template>
  <div class="mini-card">
    <div class="icon-wrapper">
      <img :src="image" :alt="title" @error="handleImageError" />
    </div>
    <div class="card-info">
      <h4 class="mini-title">{{ title }}</h4>
      <div class="mini-value">{{ value }}</div>
      <div v-if="subtitle" class="mini-subtitle">{{ subtitle }}</div>
    </div>
  </div>
</template>

<style scoped>
.mini-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: var(--accent-light);
  padding: 16px;
  border-radius: 10px;
  width: 100%;
}

.icon-wrapper {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.icon-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.mini-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--secondary-color);
}

.mini-value {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-dark);
  line-height: 1.2;
}

.mini-subtitle {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 2px;
  font-weight: 500;
}
</style>
