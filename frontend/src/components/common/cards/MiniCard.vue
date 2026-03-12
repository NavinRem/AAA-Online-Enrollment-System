<script setup>
defineProps({
  title: String,
  value: [String, Number],
  image: String, // Expects a resolved asset URL
})

const handleImageError = (e) => {
  e.target.style.display = 'none' // Hide if fails, or could set a fallback src
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
    </div>
  </div>
</template>

<style scoped>
.mini-card {
  display: flex;
  align-items: center;
  gap: 15px;
  background: #e1f5fe;
  padding: 15px 20px;
  border-radius: 15px;
  width: 100%;
}

.icon-wrapper {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.card-info {
  display: flex;
  flex-direction: column;
}

.mini-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 2px;
}

.mini-value {
  font-size: 1.4rem;
  font-weight: 800;
  color: #1a1a1a;
  line-height: 1;
}
</style>
