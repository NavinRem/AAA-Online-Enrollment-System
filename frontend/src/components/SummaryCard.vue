<script setup>
defineProps({
  title: String,
  value: [String, Number],
  image: String,
  color: {
    type: String,
    default: '#e1f5fe',
  },
})

const getImagePath = (img) => {
  return new URL(`../assets/images/${img}`, import.meta.url).href
}
</script>

<template>
  <div class="summary-card" :style="{ backgroundColor: color }">
    <div class="card-content">
      <h3 class="card-title">{{ title }}</h3>
      <div class="card-illustration">
        <img :src="getImagePath(image)" :alt="title" />
      </div>
      <div class="card-value">{{ value }}</div>
    </div>
  </div>
</template>

<style scoped>
.summary-card {
  flex: 1;
  min-width: 180px;
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform 0.2s;
}

.summary-card:hover {
  transform: translateY(-5px);
}

.card-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 5px;
}

.card-illustration {
  width: 100%;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px 0;
}

.card-illustration img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.card-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: #1a1a1a;
}
</style>
