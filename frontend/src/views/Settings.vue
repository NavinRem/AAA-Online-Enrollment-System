<script setup>
import DashboardLayout from '../components/DashboardLayout.vue'
</script>

<template>
  <DashboardLayout>
    <div class="page-container">
      <div class="settings-card">
        <p>System settings and profile management will appear here.</p>
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.settings-card {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
  color: #666;
}
</style>
