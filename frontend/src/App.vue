<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'

onMounted(() => {
  const savedTheme = localStorage.getItem('aaa-app-theme')
  if (savedTheme) {
    try {
      const theme = JSON.parse(savedTheme)
      const root = document.documentElement
      root.style.setProperty('--color-primary', theme.primary)
      root.style.setProperty('--color-primary-dark', theme.dark)
      root.style.setProperty('--color-primary-light', theme.light)
      root.style.setProperty('--color-primary-soft', theme.light)
      root.style.setProperty('--color-primary-deep', theme.deep)
    } catch (e) {
      console.error('Failed to parse saved theme', e)
    }
  }
})
</script>

<template>
  <div class="app-container">
    <RouterView />
  </div>
</template>

<style>
.app-container {
  min-height: 100vh;
}
</style>
