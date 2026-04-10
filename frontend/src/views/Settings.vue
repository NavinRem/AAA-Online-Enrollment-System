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
  padding: var(--space-2xl);
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.empty-state-card {
  background: var(--white);
  border-radius: var(--border-radius);
  padding: var(--space-5xl) var(--space-3xl);
  text-align: center;
  max-width: 500px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.icon-wrapper {
  font-size: var(--text-4xl);
  margin-bottom: var(--space-3xs);
  background: var(--bg-subtle);
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-sm);
}

h2 {
  font-weight: 800;
  color: var(--text-deep);
  margin: 0;
}

p {
  color: var(--text-muted);
  font-size: var(--text-lg);
  margin: 0;
  line-height: 1.5;
}

.sub-text {
  font-size: var(--text-sm);
  color: var(--text-light);
}
</style>
