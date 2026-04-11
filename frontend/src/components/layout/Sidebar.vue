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
  { name: 'Trials', path: '/trials', icon: 'navigation/trial.svg' },
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
  <aside
    class="w-[260px] h-screen bg-white flex flex-col border-r border-surface-light fixed left-0 top-0 z-[100] transition-transform duration-300 lg:translate-x-0"
    :class="isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'">
    <div class="p-3 px-5 flex items-center justify-center gap-sm relative border-b border-surface-light/50 mb-2">
      <img :src="getImageUrl('common/logo-main')" alt="Logo" class="w-20 h-auto" />
      <span class="text-sm font-extrabold text-content-dark leading-tight tracking-tight">Authentic Advanced
        Academy</span>
      <button
        class="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none text-3xl text-content-light cursor-pointer p-1 leading-none hover:text-content-dark transition-colors"
        @click="emit('close')">
        ×
      </button>
    </div>

    <nav class="flex-1 p-2 px-md flex flex-col gap-1 overflow-y-auto">
      <router-link v-for="item in menuItems" :key="item.name" :to="item.path"
        class="flex items-center gap-sm p-3 px-md text-content-muted rounded-sm transition-all font-semibold text-sm hover:bg-surface-subtle group"
        :class="{
          'bg-primary-soft text-primary font-bold shadow-sm shadow-primary/5':
            route.path === item.path,
        }" @click="handleNavClick">
        <img :src="getIconUrl(item.icon)" :alt="item.name"
          class="w-4.5 h-4.5 opacity-60 transition-all group-hover:opacity-90" :class="{
            'opacity-100 grayscale-0 !invert-[48%] !sepia-[93%] !saturate-[3015%] !hue-rotate-[170deg] !contrast-[101%]':
              route.path === item.path,
          }" />
        <span class="whitespace-nowrap">{{ item.name }}</span>
      </router-link>
    </nav>

    <div class="p-5 border-t border-surface-light mt-auto">
      <p v-if="logoutMessage" class="text-error text-sm mb-3 text-center font-bold animate-pulse">
        {{ logoutMessage }}
      </p>
      <AppButton variant="logout" class="w-full font-bold shadow-lg shadow-error/5" :loading="!!logoutMessage"
        @click="handleLogout">
        Log Out
      </AppButton>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'Sidebar',
}
</script>

<style scoped>
/* Scoped styles removed in favor of Tailwind utilities */
/* Custom scrollbar for nav menu */
nav::-webkit-scrollbar {
  width: 4px;
}

nav::-webkit-scrollbar-track {
  background: transparent;
}

nav::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 10px;
}
</style>
