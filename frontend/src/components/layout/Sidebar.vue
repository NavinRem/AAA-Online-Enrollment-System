<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authService } from '@/services/authService'
import AppButton from '@/components/common/ui/AppButton.vue'
import { getImageUrl, getIconUrl } from '@/utils/assetHelper'

defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const router = useRouter()
const route = useRoute()
const logoutMessage = ref('')
const academyName = ref('Authentic Advanced Academy')

const updateAcademyName = () => {
  const saved = localStorage.getItem('aaa-academy-name')
  academyName.value = saved || 'Authentic Advanced Academy'
}

onMounted(() => {
  updateAcademyName()
  window.addEventListener('storage', updateAcademyName)
  window.addEventListener('academy-name-changed', updateAcademyName)
})

onUnmounted(() => {
  window.removeEventListener('storage', updateAcademyName)
  window.removeEventListener('academy-name-changed', updateAcademyName)
})

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: 'navigation/dashboard.svg' },
  { name: 'Enrollments', path: '/enrollments', icon: 'navigation/enrollment.svg' },
  { name: 'Trials', path: '/trials', icon: 'navigation/trial.svg' },
  { name: 'Branches', path: '/branches', icon: 'navigation/branch.svg' },
  { name: 'Teachers', path: '/teachers', icon: 'navigation/parent.svg' },
  { name: 'Parents', path: '/parents', icon: 'navigation/parent.svg' },
  { name: 'Students', path: '/students', icon: 'navigation/student.svg' },
  { name: 'Programs', path: '/programs', icon: 'navigation/program.svg' },
  { name: 'Classes', path: '/classes', icon: 'navigation/class.svg' },
  { name: 'Payments', path: '/payment', icon: 'navigation/dollar.svg' },
  { name: 'Terms', path: '/terms', icon: 'navigation/program.svg' },
  { name: 'Settings', path: '/settings', icon: 'navigation/setting.svg' },
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
    class="w-64 h-screen bg-white flex flex-col border-r border-surface-light fixed left-0 top-0 z-sidebar transition-transform duration-300 lg:translate-x-0"
    :class="isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'"
  >
    <div
      class="p-md mb-md flex flex-col items-center justify-center relative border-b border-surface-light/50"
    >
      <div class="w-20 h-20 flex items-center justify-center">
        <img
          :src="getImageUrl('common/logo-main')"
          alt="Logo"
          class="w-full h-full object-contain"
        />
      </div>
      <div class="flex flex-col items-center text-center">
        <span class="text-sm font-bold text-content-dark leading-tight tracking-tighter">{{
          academyName
        }}</span>
      </div>
      <button
        class="lg:hidden absolute right-4 top-4 bg-none border-none text-2xl text-content-light cursor-pointer p-1 leading-none hover:text-content-dark transition-all hover:rotate-90"
        @click="emit('close')"
      >
        ×
      </button>
    </div>

    <nav class="flex-1 p-2 px-md flex flex-col gap-1 overflow-y-auto">
      <router-link
        v-for="item in menuItems"
        :key="item.name"
        :to="item.path"
        class="flex items-center gap-sm p-3 px-md rounded-sm transition-all font-semibold text-sm group"
        :class="[
          route.path === item.path
            ? 'bg-primary text-white font-bold shadow-md shadow-primary/20'
            : 'text-content-muted hover:bg-primary-light hover:text-content-dark',
        ]"
        @click="handleNavClick"
      >
        <img
          :src="getIconUrl(item.icon)"
          :alt="item.name"
          class="w-5 h-5 transition-all"
          :class="[
            route.path === item.path
              ? 'opacity-100 !grayscale-0 brightness-0 invert'
              : 'opacity-60 group-hover:opacity-100',
          ]"
        />
        <span class="whitespace-nowrap">{{ item.name }}</span>
      </router-link>
    </nav>

    <div class="p-5 border-t border-surface-light mt-auto">
      <p v-if="logoutMessage" class="text-error text-sm mb-3 text-center font-bold animate-pulse">
        {{ logoutMessage }}
      </p>
      <AppButton variant="logout" :loading="!!logoutMessage" @click="handleLogout">
        Log Out
      </AppButton>
    </div>
  </aside>
</template>
