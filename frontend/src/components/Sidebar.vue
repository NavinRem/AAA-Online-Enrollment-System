<script setup>
import { useRouter, useRoute } from 'vue-router'
import { authService } from '../services/authService'

const router = useRouter()
const route = useRoute()

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: 'dashboard-svgrepo.svg' },
  { name: 'Enrollment', path: '/registrations', icon: 'registration-svgrepo.svg' },
  { name: 'Parent / Guardian', path: '/parents', icon: 'guardian-svgrepo.svg' },
  { name: 'Students', path: '/students', icon: 'student-svgrepo.svg' },
  { name: 'Programs', path: '/programs', icon: 'program-svgrepo.svg' },
  { name: 'Payment', path: '/payment', icon: 'dollar-minimal.svg' },
  { name: 'Setting', path: '/settings', icon: 'setting-svgrepo.svg' },
]

const handleLogout = async () => {
  try {
    await authService.logout()
    router.push('/')
  } catch (error) {
    console.error('Logout failed', error)
  }
}

const getIconPath = (icon) => {
  return new URL(`../assets/icons/${icon}`, import.meta.url).href
}
</script>

<template>
  <aside class="sidebar">
    <div class="logo-section">
      <img src="@/assets/images/AAA-Logo.png" alt="Logo" class="sidebar-logo" />
      <span class="brand-name">Authentic Advanced Academy</span>
    </div>

    <nav class="nav-menu">
      <router-link
        v-for="item in menuItems"
        :key="item.name"
        :to="item.path"
        class="nav-item"
        :class="{ active: route.path === item.path }"
      >
        <img :src="getIconPath(item.icon)" :alt="item.name" class="nav-icon" />
        <span class="nav-text">{{ item.name }}</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <button @click="handleLogout" class="logout-btn">Log Out</button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  height: 100vh;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #f0f0f0;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
}

.logo-section {
  padding: 30px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar-logo {
  width: 35px;
  height: auto;
}

.brand-name {
  font-size: 0.8rem;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.2;
}

.nav-menu {
  flex: 1;
  padding: 10px 15px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  text-decoration: none;
  color: #555;
  border-radius: 12px;
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: 0.9rem;
}

.nav-item:hover {
  background: #f8f9fa;
}

.nav-item.active {
  background: #e1f5fe;
  color: #00aeef;
}

.nav-icon {
  width: 20px;
  height: 20px;
  opacity: 0.7;
}

.active .nav-icon {
  opacity: 1;
  filter: invert(48%) sepia(93%) saturate(3015%) hue-rotate(170deg) brightness(101%) contrast(101%);
}

.sidebar-footer {
  padding: 20px;
}

.logout-btn {
  width: 100%;
  padding: 12px;
  background-color: #c00;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.logout-btn:hover {
  background-color: #a00;
}
</style>
