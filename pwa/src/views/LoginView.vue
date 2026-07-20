<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { parentAuthService } from '@/services/parentAuthService'

const router = useRouter()

const activeTab = ref('phone') // default to mobile friendly phone/telegram login
const identifier = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const resetSent = ref(false)

const handleLogin = async () => {
  errorMessage.value = ''
  if (!identifier.value || !password.value) {
    errorMessage.value = 'Please enter your account details and password.'
    return
  }

  loading.value = true
  try {
    await parentAuthService.login(identifier.value.trim(), password.value)
    router.push({ name: 'Dashboard' })
  } catch (err) {
    console.error('Login error:', err)
    errorMessage.value =
      err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found'
        ? 'Invalid credentials. Please check your details or register.'
        : err.message || 'Login failed. Please verify your internet connection.'
  } finally {
    loading.value = false
  }
}

const handleForgotPassword = async () => {
  if (!identifier.value || !identifier.value.includes('@')) {
    errorMessage.value = 'Please enter your registered email address above to reset password.'
    return
  }
  try {
    await parentAuthService.sendPasswordReset(identifier.value.trim())
    resetSent.value = true
    errorMessage.value = ''
  } catch (err) {
    errorMessage.value = err.message || 'Could not send reset email.'
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col justify-center bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 px-4 py-8 text-slate-100">
    <div class="w-full max-w-md mx-auto">
      <!-- App Header & Brand -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-gradient-to-tr from-sky-400 to-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-sky-500/30 mb-4 transform hover:scale-105 transition-transform duration-300">
          <svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 14l9-5-9-5-9 5 9 5z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        </div>
        <h1 class="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">AAA Academy Portal</h1>
        <p class="text-sm text-sky-200/80 mt-1">Parent Mobile Access for Performance & Enrollments</p>
      </div>

      <!-- Main Login Card -->
      <div class="bg-slate-800/90 backdrop-blur-xl rounded-3xl border border-slate-700/60 shadow-2xl p-6 sm:p-8">
        <!-- Auth Method Tabs -->
        <div class="grid grid-cols-2 p-1 bg-slate-900/80 rounded-xl mb-6 border border-slate-700/50">
          <button
            type="button"
            @click="activeTab = 'phone'; errorMessage = ''; resetSent = false"
            :class="[
              'py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2',
              activeTab === 'phone' ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20' : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Phone / Telegram
          </button>
          <button
            type="button"
            @click="activeTab = 'email'; errorMessage = ''; resetSent = false"
            :class="[
              'py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2',
              activeTab === 'email' ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20' : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email Address
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {{ activeTab === 'phone' ? 'Phone Number or Telegram ID' : 'Email Address' }}
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg v-if="activeTab === 'phone'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                v-model="identifier"
                :type="activeTab === 'phone' ? 'text' : 'email'"
                :placeholder="activeTab === 'phone' ? 'e.g. +855 12 345 678 or @parent_tg' : 'parent@example.com'"
                class="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password / PIN
              </label>
              <button
                v-if="activeTab === 'email'"
                type="button"
                @click="handleForgotPassword"
                class="text-xs text-sky-400 hover:text-sky-300 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                v-model="password"
                type="password"
                placeholder="Enter your security password"
                class="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <!-- Alert feedback -->
          <div v-if="errorMessage" class="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-sm font-medium text-red-400 flex items-start gap-2.5 animate-fade-in">
            <svg class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ errorMessage }}</span>
          </div>

          <div v-if="resetSent" class="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm font-medium text-emerald-400 flex items-start gap-2.5 animate-fade-in">
            <svg class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Password reset instructions sent! Check your email inbox.</span>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ loading ? 'Signing In...' : 'Sign In to Portal' }}</span>
          </button>
        </form>

        <!-- Register Redirect -->
        <div class="mt-8 pt-6 border-t border-slate-700/60 text-center">
          <p class="text-sm text-slate-400">
            Don't have a parent account yet?
            <RouterLink to="/register" class="text-sky-400 font-bold hover:text-sky-300 ml-1.5 transition-colors">
              Sign Up Now →
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
