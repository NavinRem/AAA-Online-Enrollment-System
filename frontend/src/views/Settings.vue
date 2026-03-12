<script setup>
import DashboardLayout from '../components/layout/DashboardLayout.vue'
</script>

<template>
  <DashboardLayout>
    <div class="page-container">
      <div class="settings-card">
        <h3>Settings</h3>
        <p>System settings and profile preferences will be available soon.</p>
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
