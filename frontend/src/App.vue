<script setup>
import { ref } from 'vue'
import RegistrationForm from './components/RegistrationForm.vue'
import RegistrationList from './components/RegistrationList.vue'

const refreshListTrigger = ref(0)

const handleRegistrationCreated = () => {
  refreshListTrigger.value++
}
</script>

<template>
  <div class="app-container">
    <header>
      <h1>Online Registration System</h1>
    </header>

    <main>
      <RegistrationForm @created="handleRegistrationCreated" />
      <RegistrationList :refresh-trigger="refreshListTrigger" />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

header {
  text-align: center;
  margin-bottom: 30px;
}
</style>
