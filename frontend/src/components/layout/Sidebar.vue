<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authService } from '@/services/authService'
import AppButton from '@/components/common/ui/AppButton.vue'
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
const logoutMessage = ref('')

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: 'navigation/dashboard.svg' },
  { name: 'Enrollments', path: '/enrollments', icon: 'navigation/enrollment.svg' },
  { name: 'Branches', path: '/branches', icon: 'navigation/branch.svg' },
  { name: 'Parents', path: '/parents', icon: 'navigation/parent.svg' },
  { name: 'Students', path: '/students', icon: 'navigation/student.svg' },
  { name: 'Programs', path: '/programs', icon: 'navigation/program.svg' },
  { name: 'Classes', path: '/classes', icon: 'navigation/class.svg' },
  { name: 'Payments', path: '/payment', icon: 'navigation/dollar.svg' },
  { name: 'Setting', path: '/settings', icon: 'navigation/setting.svg' },
]

const handleLogout = async () => {
  if (logoutMessage.value) return

  try {
    logoutMessage.value = 'Logging out...'

    setTimeout(async () => {
      try {
        await authService.logout()
        router.push('/')
      } catch (err) {
        console.error('Logout failed in timeout', err)
        router.push('/')
      }
    }, 3000)
  } catch (error) {
    logoutMessage.value = ''
    console.error('Logout initiation failed', error)
  }
}

const handleNavClick = () => {
  if (window.innerWidth <= 1024) {
    emit('close')
  }
}
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar-mobile-open': isOpen }">
    <div class="logo-section">
      <img :src="getImageUrl('common/logo-main')" alt="Logo" class="sidebar-logo" />
      <span class="brand-name">Authentic Advanced Academy</span>
      <button class="mobile-close-btn" @click="emit('close')">×</button>
    </div>

    <nav class="nav-menu">
      <router-link v-for="item in menuItems" :key="item.name" :to="item.path" class="nav-item"
        :class="{ active: route.path === item.path }" @click="handleNavClick">
        <img :src="getIconUrl(item.icon)" :alt="item.name" class="nav-icon" />
        <span class="nav-text">{{ item.name }}</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <p v-if="logoutMessage" class="logout-msg">{{ logoutMessage }}</p>
      <AppButton variant="logout" class="w-full" :loading="!!logoutMessage" @click="handleLogout">
        Log Out
      </AppButton>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  height: 100vh;
  background: var(--white);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--bg-light);
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  transition: transform 0.3s ease;
}

.logo-section {
  padding: var(--space-2xl) var(--space-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
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
  color: var(--text-light);
  cursor: pointer;
  padding: 5px;
  line-height: 1;
}

.sidebar-logo {
  width: 80px;
  height: auto;
}

.brand-name {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--text-deep);
  line-height: 1.2;
}

.nav-menu {
  flex: 1;
  padding: var(--space-sm) var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  text-decoration: none;
  color: var(--text-muted);
  border-radius: var(--border-radius-sm);
  transition: all 0.2s ease;
  font-weight: 500;
  font-size: var(--text-sm);
}

.nav-item:hover {
  background: var(--bg-subtle);
}

.nav-item.active {
  background: var(--accent-light);
  color: var(--primary-color);
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
  padding: var(--space-lg);
}

.logout-msg {
  color: var(--error-color);
  font-size: var(--text-sm);
  margin-bottom: var(--space-sm);
  text-align: center;
  font-weight: 600;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.6;
  }

  100% {
    opacity: 1;
  }
}
</style>
