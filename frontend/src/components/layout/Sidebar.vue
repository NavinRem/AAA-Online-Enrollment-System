<script setup>
import { useRouter, useRoute } from 'vue-router'
import { authService } from '@/services/authService'
import AppButton from '@/components/common/ui/AppButton/AppButton.vue'
import { getImageUrl, getIconUrl } from '@/utils/assetHelper'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const router = useRouter()
const route = useRoute()

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: 'navigation/dashboard-svgrepo.svg' },
  { name: 'Enrollment', path: '/enrollments', icon: 'navigation/registration-svgrepo.svg' },
  { name: 'Parent / Guardian', path: '/parents', icon: 'navigation/guardian-svgrepo.svg' },
  { name: 'Students', path: '/students', icon: 'navigation/student-svgrepo.svg' },
  { name: 'Programs', path: '/programs', icon: 'navigation/program-svgrepo.svg' },
  { name: 'Payment', path: '/payment', icon: 'navigation/dollar-minimal.svg' },
  { name: 'Setting', path: '/settings', icon: 'navigation/setting-svgrepo.svg' },
]

const handleLogout = async () => {
  try {
    await authService.logout()
    router.push('/')
  } catch (error) {
    console.error('Logout failed', error)
  }
}

// Removed local getIconPath in favor of getIconUrl from assetHelper

const handleNavClick = () => {
  if (window.innerWidth <= 1024) {
    emit('close')
  }
}
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar-mobile-open': isOpen }">
    <div class="logo-section">
      <img :src="getImageUrl('aaa-logo')" alt="Logo" class="sidebar-logo" />
      <span class="brand-name">Authentic Advanced Academy</span>
      <button class="mobile-close-btn" @click="emit('close')">×</button>
    </div>

    <nav class="nav-menu">
      <router-link
        v-for="item in menuItems"
        :key="item.name"
        :to="item.path"
        class="nav-item"
        :class="{ active: route.path === item.path }"
        @click="handleNavClick"
      >
        <img :src="getIconUrl(item.icon)" :alt="item.name" class="nav-icon" />
        <span class="nav-text">{{ item.name }}</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <AppButton variant="logout" style="width: 100%" @click="handleLogout">Log Out</AppButton>
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
  transition: transform 0.3s ease;
}

.logo-section {
  padding: 30px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  position: relative;
}

.mobile-close-btn {
  display: none;
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 2rem;
  color: #999;
  cursor: pointer;
  padding: 5px;
  line-height: 1;
}

.sidebar-logo {
  width: 80px;
  height: auto;
}

.brand-name {
  font-size: 0.9rem;
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


</style>
