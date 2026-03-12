<script setup>
import DashboardLayout from '../components/layout/DashboardLayout.vue'
</script>

<template>
  <DashboardLayout>
    <div class="settings-page">
      <div class="empty-state-card">
        <div class="icon-wrapper">⚙️</div>
        <h2>System Settings</h2>
        <p>This module is currently under development.</p>
        <p class="sub-text">In a future update, you'll be able to manage application preferences, user roles, and security policies here.</p>
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.settings-page {
  padding: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.empty-state-card {
  background: white;
  border-radius: 24px;
  padding: 60px 40px;
  text-align: center;
  max-width: 500px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.icon-wrapper {
  font-size: 3rem;
  margin-bottom: 5px;
  background: #f8fafc;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
}

h2 {
  font-weight: 800;
  color: #1a1a1a;
  margin: 0;
}

p {
  color: #64748b;
  font-size: 1.1rem;
  margin: 0;
  line-height: 1.5;
}

.sub-text {
  font-size: 0.9rem;
  color: #94a3b8;
}
</style>
