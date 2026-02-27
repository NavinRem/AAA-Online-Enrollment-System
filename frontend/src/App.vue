<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <RouterView />
  </div>
</template>

<style>
/* Remove scoped to affect children if needed, or keep it clean */
.app-container {
  font-family: 'Inter', sans-serif;
  min-height: 100vh;
}
</style>
