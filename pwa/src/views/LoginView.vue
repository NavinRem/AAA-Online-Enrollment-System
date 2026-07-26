<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { parentAuthService } from '@/services/parentAuthService'

const router = useRouter()

const activeTab = ref('phone') // default to mobile friendly phone/telegram login
const identifier = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const resetSent = ref(false)

const switchTab = (tab) => {
  activeTab.value = tab
  errorMessage.value = ''
  resetSent.value = false
}

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

const handleGoogleSSO = async () => {
  errorMessage.value = ''
  loading.value = true
  try {
    await parentAuthService.loginWithGoogle()
    router.push({ name: 'Dashboard' })
  } catch (err) {
    console.error('Google SSO error:', err)
    if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
      errorMessage.value =
        err.message || 'Google Sign-In failed. Please check your network or try again.'
    }
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
  <div class="min-h-[85vh] flex flex-col justify-center px-4 py-8 text-content-dark">
    <div class="w-full max-w-md mx-auto">
      <!-- App Header & Brand (Admin Portal Theme) -->
      <div class="text-center mb-8">
        <div class="mb-3 transform hover:scale-105 transition-transform duration-300">
          <img
            src="@/assets/images/common/logo-main.png"
            alt="AAA Academy Portal"
            class="w-32 h-auto mx-auto drop-shadow-sm"
          />
        </div>
        <h1 class="text-2xl font-extrabold tracking-tight text-content-deep sm:text-3xl">
          AAA Academy Portal
        </h1>
        <p class="text-sm text-content-muted mt-1">
          Parent Mobile Access for Performance & Enrollments
        </p>
      </div>

      <!-- Main Login Card -->
      <div
        class="bg-surface backdrop-blur-xl rounded-3xl border border-outline-std shadow-xl p-6 sm:p-8"
      >
        <!-- Auth Method Tabs -->
        <div
          class="grid grid-cols-2 p-1 bg-surface-subtle rounded-xl mb-6 border border-outline-std"
        >
          <button
            type="button"
            @click="switchTab('phone')"
            :class="[
              'py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2',
              activeTab === 'phone'
                ? 'bg-[#0ea5e9] text-white shadow-sm'
                : 'text-content-muted hover:text-content-deep',
            ]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            Phone / Telegram
          </button>
          <button
            type="button"
            @click="switchTab('email')"
            :class="[
              'py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2',
              activeTab === 'email'
                ? 'bg-[#0ea5e9] text-white shadow-sm'
                : 'text-content-muted hover:text-content-deep',
            ]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Email Address
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label
              class="block text-xs font-bold text-content-deep uppercase tracking-wider mb-1.5"
            >
              {{ activeTab === 'phone' ? 'Phone Number or Telegram ID' : 'Email Address' }}
            </label>
            <div class="relative">
              <div
                class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-content-muted"
              >
                <svg
                  v-if="activeTab === 'phone'"
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>
              <input
                v-model="identifier"
                :type="activeTab === 'phone' ? 'text' : 'email'"
                :placeholder="
                  activeTab === 'phone'
                    ? 'e.g. +855 12 345 678 or @parent_tg'
                    : 'parent@example.com'
                "
                class="w-full pl-11 pr-4 py-3 bg-surface-subtle border border-outline-std rounded-xl text-content-deep placeholder-content-light focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:bg-surface transition-all"
                required
              />
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-xs font-bold text-content-deep uppercase tracking-wider">
                Password / PIN
              </label>
              <button
                v-if="activeTab === 'email'"
                type="button"
                @click="handleForgotPassword"
                class="text-xs text-[#0284c7] hover:text-[#0ea5e9] font-bold transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <div class="relative">
              <div
                class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-content-muted"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter your security password"
                class="w-full pl-11 pr-11 py-3 bg-surface-subtle border border-outline-std rounded-xl text-content-deep placeholder-content-light focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:bg-surface transition-all"
                required
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-content-muted hover:text-content-deep transition-colors"
                :title="showPassword ? 'Hide password' : 'Show password'"
              >
                <svg
                  v-if="!showPassword"
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.478 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Alert feedback with explicit red/emerald colors for guaranteed visibility -->
          <div
            v-if="errorMessage"
            class="p-3.5 bg-red-100 border border-red-300 rounded-xl text-sm font-semibold text-red-800 flex items-start gap-2.5 shadow-sm animate-fade-in"
            style="background-color: #fee2e2; border-color: #fca5a5; color: #991b1b"
          >
            <svg
              class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{{ errorMessage }}</span>
          </div>

          <div
            v-if="resetSent"
            class="p-3.5 bg-emerald-100 border border-emerald-300 rounded-xl text-sm font-semibold text-emerald-800 flex items-start gap-2.5 shadow-sm animate-fade-in"
            style="background-color: #d1fae5; border-color: #6ee7b7; color: #065f46"
          >
            <svg
              class="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Password reset instructions sent! Check your email inbox.</span>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3.5 px-4 bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold rounded-xl shadow-md transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            <svg
              v-if="loading"
              class="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>{{ loading ? 'Signing In...' : 'Sign In to Portal' }}</span>
          </button>
        </form>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-outline-std"></div>
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-surface px-3 font-bold text-content-muted tracking-wider"
              >Or Continue With</span
            >
          </div>
        </div>

        <!-- One-Click Google SSO Button -->
        <button
          type="button"
          @click="handleGoogleSSO"
          :disabled="loading"
          class="w-full py-3.5 px-4 bg-surface-subtle hover:bg-surface border border-outline-std text-content-deep font-bold rounded-xl shadow-sm transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-8.87Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.3 0 6.08-1.09 8.11-2.96l-3.88-3.05c-1.1.74-2.5 1.18-4.23 1.18-3.25 0-6.01-2.19-7-5.14H.97v3.14C3.01 21.2 7.22 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5 14.03c-.25-.74-.4-1.54-.4-2.36 0-.82.15-1.62.4-2.36V6.17H.97C.35 7.41 0 8.8 0 10.3s.35 2.89.97 4.13l4.03-3.13Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.8 0 3.41.62 4.68 1.83l3.51-3.51C18.08 1.18 15.3 0 12 0 7.22 0 3.01 2.8 0 6.17l4.03 3.13c.99-2.95 3.75-5.14 7-5.14Z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <!-- Register Redirect -->
        <div class="mt-8 pt-6 border-t border-outline-std text-center">
          <p class="text-sm text-content-muted">
            Don't have a parent account yet?
            <RouterLink
              to="/register"
              class="text-[#0284c7] font-bold hover:text-[#0ea5e9] ml-1.5 transition-colors"
            >
              Sign Up Now →
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
