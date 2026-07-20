<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { parentAuthService } from '@/services/parentAuthService'

const router = useRouter()
const route = useRoute()
const { currentUser } = useAuth()
const showProfileMenu = ref(false)

const handleLogout = async () => {
  try {
    await parentAuthService.logout()
    showProfileMenu.value = false
    router.push({ name: 'Login' })
  } catch (err) {
    console.error('Logout error:', err)
  }
}
</script>

<template>
  <!-- Top Fixed Header -->
  <header class="fixed top-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between text-white shadow-sm">
    <RouterLink to="/" class="flex items-center gap-2.5 group">
      <div class="w-8 h-8 bg-gradient-to-tr from-sky-400 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
        <svg class="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 14l9-5-9-5-9 5 9 5z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      </div>
      <div>
        <span class="text-base font-extrabold tracking-tight bg-gradient-to-r from-white to-sky-200 bg-clip-text text-transparent">AAA Academy</span>
        <span class="hidden xs:inline-block text-[10px] uppercase tracking-wider font-bold text-sky-400 ml-1.5 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">Portal</span>
      </div>
    </RouterLink>

    <!-- Desktop Nav Links -->
    <nav class="hidden sm:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
      <RouterLink
        to="/"
        :class="[
          'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
          route.path === '/' ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30' : 'text-slate-400 hover:text-white'
        ]"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Dashboard
      </RouterLink>
      <RouterLink
        to="/enroll"
        :class="[
          'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
          route.path === '/enroll' ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30' : 'text-slate-400 hover:text-white'
        ]"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Self-Enroll
      </RouterLink>
      <RouterLink
        to="/enrollments"
        :class="[
          'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
          route.path === '/enrollments' ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30' : 'text-slate-400 hover:text-white'
        ]"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        My Classes
      </RouterLink>
    </nav>

    <!-- User Pill & Menu Trigger -->
    <div class="relative">
      <button
        @click="showProfileMenu = !showProfileMenu"
        class="flex items-center gap-2 px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 rounded-full transition-colors text-xs font-semibold text-slate-200"
      >
        <div class="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
          {{ currentUser?.email ? currentUser.email.charAt(0) : 'P' }}
        </div>
        <span class="max-w-[100px] truncate hidden xs:inline-block">
          {{ currentUser?.email ? currentUser.email.split('@')[0] : 'Parent' }}
        </span>
        <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <!-- Dropdown Menu -->
      <div
        v-if="showProfileMenu"
        class="absolute right-0 mt-2 w-52 bg-slate-800 rounded-2xl shadow-xl border border-slate-700 p-2 z-50 animate-fade-in"
      >
        <div class="px-3 py-2 border-b border-slate-700/60 mb-1">
          <p class="text-[11px] text-slate-400 font-medium">Logged in as</p>
          <p class="text-xs font-bold text-white truncate">{{ currentUser?.email || 'Telegram/Phone Parent' }}</p>
        </div>
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  </header>

  <!-- Bottom Mobile Navigation Bar -->
  <nav class="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 flex justify-around items-center py-2 px-1 text-xs pb-safe shadow-lg">
    <RouterLink
      to="/"
      :class="[
        'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all',
        route.path === '/' ? 'text-sky-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
      ]"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
      <span class="text-[10px]">Dashboard</span>
    </RouterLink>

    <RouterLink
      to="/enroll"
      :class="[
        'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all',
        route.path === '/enroll' ? 'text-sky-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
      ]"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
      <span class="text-[10px]">Self-Enroll</span>
    </RouterLink>

    <RouterLink
      to="/enrollments"
      :class="[
        'flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all',
        route.path === '/enrollments' ? 'text-sky-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
      ]"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <span class="text-[10px]">My Classes</span>
    </RouterLink>

    <button
      @click="handleLogout"
      class="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-400 hover:text-red-400 transition-all"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      <span class="text-[10px]">Logout</span>
    </button>
  </nav>
</template>
