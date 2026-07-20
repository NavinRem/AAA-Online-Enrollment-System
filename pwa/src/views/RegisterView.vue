<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { parentAuthService } from '@/services/parentAuthService'

const router = useRouter()

const activeTab = ref('phone')
const form = ref({
  name: '',
  email: '',
  phone: '',
  telegramHandle: '',
  password: '',
  confirmPassword: '',
})

const loading = ref(false)
const errorMessage = ref('')

const handleRegister = async () => {
  errorMessage.value = ''

  if (!form.value.name || !form.value.password) {
    errorMessage.value = 'Please provide your full name and password.'
    return
  }
  if (activeTab.value === 'email' && !form.value.email) {
    errorMessage.value = 'Please enter a valid email address.'
    return
  }
  if (activeTab.value === 'phone' && !form.value.phone && !form.value.telegramHandle) {
    errorMessage.value = 'Please enter your phone number or Telegram handle.'
    return
  }
  if (form.value.password.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters for security.'
    return
  }
  if (form.value.password !== form.value.confirmPassword) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  loading.value = true
  try {
    if (activeTab.value === 'phone') {
      await parentAuthService.registerWithTelegramOrPhone({
        name: form.value.name,
        phone: form.value.phone,
        telegramHandle: form.value.telegramHandle,
        password: form.value.password,
      })
    } else {
      await parentAuthService.register({
        name: form.value.name,
        email: form.value.email,
        phone: form.value.phone,
        password: form.value.password,
      })
    }
    router.push({ name: 'Dashboard' })
  } catch (err) {
    console.error('Registration error:', err)
    errorMessage.value =
      err.status === 409 || err.code === 'auth/email-already-in-use'
        ? 'An account with this phone/email already exists. Try logging in instead.'
        : err.message || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col justify-center bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 px-4 py-8 text-slate-100">
    <div class="w-full max-w-md mx-auto">
      <!-- Header -->
      <div class="text-center mb-6">
        <h1 class="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Create Parent Account</h1>
        <p class="text-sm text-sky-200/80 mt-1">Register once to track performance & pay fees online</p>
      </div>

      <!-- Main Register Card -->
      <div class="bg-slate-800/90 backdrop-blur-xl rounded-3xl border border-slate-700/60 shadow-2xl p-6 sm:p-8">
        <!-- Tabs -->
        <div class="grid grid-cols-2 p-1 bg-slate-900/80 rounded-xl mb-6 border border-slate-700/50">
          <button
            type="button"
            @click="activeTab = 'phone'; errorMessage = ''"
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
            @click="activeTab = 'email'; errorMessage = ''"
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

        <form @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Parent Full Name</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="e.g. Sokha Chan"
              class="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <template v-if="activeTab === 'phone'">
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Phone Number</label>
              <input
                v-model="form.phone"
                type="tel"
                placeholder="+855 12 345 678"
                class="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Telegram Handle (Optional)</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-bold">@</span>
                <input
                  v-model="form.telegramHandle"
                  type="text"
                  placeholder="parent_tg_username"
                  class="w-full pl-8 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </template>

          <template v-else>
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Email Address</label>
              <input
                v-model="form.email"
                type="email"
                placeholder="you@example.com"
                class="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Phone Number (Optional)</label>
              <input
                v-model="form.phone"
                type="tel"
                placeholder="+855 12 345 678"
                class="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
              />
            </div>
          </template>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Password</label>
              <input
                v-model="form.password"
                type="password"
                placeholder="Min 6 chars"
                class="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Confirm</label>
              <input
                v-model="form.confirmPassword"
                type="password"
                placeholder="Repeat password"
                class="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <!-- Alert feedback -->
          <div v-if="errorMessage" class="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-sm font-medium text-red-400 flex items-start gap-2.5">
            <svg class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ errorMessage }}</span>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-sky-500/25 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ loading ? 'Creating Account...' : 'Sign Up to Portal' }}</span>
          </button>
        </form>

        <div class="mt-6 pt-5 border-t border-slate-700/60 text-center">
          <p class="text-sm text-slate-400">
            Already registered?
            <RouterLink to="/login" class="text-sky-400 font-bold hover:text-sky-300 ml-1.5 transition-colors">
              Log In Here →
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
