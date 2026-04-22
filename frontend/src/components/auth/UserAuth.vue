<script setup>
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/auth'
import { useForm } from '@/composables/useForm'

import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import { getImageUrl } from '@/utils/assetHelper'

const router = useRouter()
const authStore = useAuthStore()

const isResetMode = ref(false)
const loading = ref(false)
const apiError = ref('')
const message = ref('')

const { form, errors, shaking, validate, clearError, resetForm } = useForm({
  email: '',
  password: '',
})

onUnmounted(() => {
  clearError()
})

const toggleResetMode = () => {
  isResetMode.value = !isResetMode.value
  resetForm({ email: '', password: '' })
  apiError.value = ''
  message.value = ''
}

const handleSubmit = async () => {
  apiError.value = ''
  message.value = ''

  const isFormValid = validate({
    required: isResetMode.value ? ['email'] : ['email', 'password'],
  })

  if (!isFormValid) return

  loading.value = true
  try {
    if (isResetMode.value) {
      await authService.sendPasswordReset(form.email)
      message.value = 'Password reset email sent! Check your inbox.'
      loading.value = false
      return
    }

    await authService.login(form.email, form.password)

    try {
      const profile = await authStore.fetchProfile()

      if (!profile || !profile.role) {
        throw new Error('User profile not found or role missing.')
      }

      message.value = `Welcome back, ${profile.name}! Redirecting...`

      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    } catch (profileError) {
      await authStore.logout()
      apiError.value = `Verification Failed: ${profileError.message || 'Unauthorized access.'}`
    }
  } catch (err) {
    apiError.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-banner">
      <div class="auth-overlay"></div>
    </div>

    <div class="auth-content">
      <transition name="fade-up" appear>
        <div class="auth-card">
          <div class="auth-logo-box">
            <img :src="getImageUrl('common/logo-main')" alt="Active Kids Academy" class="auth-logo" />
          </div>

          <h2 class="auth-title">
            {{ isResetMode ? 'Reset Password' : 'Welcome Back' }}
          </h2>
          <span class="auth-subtitle">
            {{ isResetMode ? 'Enter your email to receive a recovery link.'
              : 'Welcom Back! Please Enter your details.' }}
          </span>

          <form @submit.prevent="handleSubmit" class="auth-form" novalidate>
            <AppInput v-model="form.email" type="email" label="Email Address" placeholder="Enter your email" required
              :error="errors.email" :shake="shaking.email" @input="clearError('email')" />

            <AppInput v-if="!isResetMode" v-model="form.password" type="password" label="Password"
              placeholder="Enter your password" required :error="errors.password" :shake="shaking.password"
              @input="clearError('password')" />

            <div class="mt-2 text-center">
              <a href="#" @click.prevent="toggleResetMode" class="auth-footer-link">
                {{ isResetMode ? 'Return to Login' : 'Forgot your password?' }}
              </a>
            </div>

            <AppButton :loading="loading" :disabled="loading" type="submit" variant="primary"
              class="w-full mt-4 py-4 rounded-xl text-base font-black shadow-xl shadow-primary/20">
              {{ isResetMode ? 'Send Recovery Link' : 'Sign In' }}
            </AppButton>
          </form>

          <div v-if="!isResetMode" class="auth-divider">
            <div class="auth-divider-line"></div>
            <span class="auth-divider-hint">Identity & Security</span>
            <div class="auth-divider-line"></div>
          </div>

          <div v-if="apiError" class="auth-alert auth-alert-error">
            {{ apiError }}
          </div>
          <div v-if="message" class="auth-alert auth-alert-success">
            {{ message }}
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  @apply flex min-h-screen w-full bg-surface-subtle overflow-hidden;
}

.auth-banner {
  @apply hidden lg:flex flex-[1.4] bg-[url('@/assets/images/backgrounds/blue-bg-school.jpg')] bg-[80%_center] bg-cover bg-no-repeat relative border-r border-black/5;
}

.auth-banner::after {
  @apply content-[''] absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent;
}

.auth-overlay {
  @apply absolute inset-0 bg-black/10;
}

.auth-content {
  @apply flex-1 flex items-center justify-center p-8 lg:p-16 relative z-10;
}

.auth-card {
  @apply w-full max-w-md bg-white/80 backdrop-blur-xl p-10 px-8 border border-white/40 rounded-3xl text-center transition-all duration-500;
}

.auth-logo-box {
  @apply mb-10 transform transition-transform duration-700 hover:scale-105;
}

.auth-logo {
  @apply w-full max-w-[140px] h-auto mx-auto drop-shadow-sm;
}

.auth-title {
  @apply text-3xl font-black mb-2 text-content-dark tracking-tight;
}

.auth-subtitle {
  @apply text-sm font-medium text-content-muted mb-10 block;
}

.auth-form {
  @apply flex flex-col gap-5;
}

.auth-divider {
  @apply relative flex items-center gap-4 my-8;
}

.auth-divider-line {
  @apply h-px flex-grow bg-content-muted opacity-10;
}

.auth-divider-hint {
  @apply text-[10px] font-black text-content-muted/40 uppercase tracking-[0.2em] whitespace-nowrap;
}

.auth-footer-link {
  @apply text-sm font-bold text-primary hover:text-primary-deep transition-all duration-300 decoration-primary/20 hover:underline underline-offset-4;
}

.auth-alert {
  @apply mt-6 p-4 rounded-xl text-sm font-bold;
}

.auth-alert-error {
  @apply bg-error-soft/50 text-error border border-error/10;
}

.auth-alert-success {
  @apply bg-success-soft/50 text-success border border-success/10;
}

/* Animations */
.fade-up-enter-active {
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}
</style>
