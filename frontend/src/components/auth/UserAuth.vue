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

      message.value = `Welcome back! Redirecting...`
      await router.push('/dashboard')
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
            <img
              :src="getImageUrl('common/logo-main')"
              alt="Active Kids Academy"
              class="auth-logo"
            />
          </div>

          <h2 class="auth-title">
            {{ isResetMode ? 'Reset Password' : 'Welcome Back' }}
          </h2>
          <span class="auth-subtitle">
            {{
              isResetMode
                ? 'Enter your email to receive a recovery link.'
                : 'Welcome Back! Please Enter your details.'
            }}
          </span>

          <form @submit.prevent="handleSubmit" class="auth-form" novalidate>
            <AppInput
              v-model="form.email"
              type="email"
              label="Email Address"
              placeholder="Enter your email"
              required
              :error="errors.email"
              :shake="shaking.email"
              @input="clearError('email')"
            />

            <AppInput
              v-if="!isResetMode"
              v-model="form.password"
              type="password"
              label="Password"
              placeholder="Enter your password"
              required
              :error="errors.password"
              :shake="shaking.password"
              @input="clearError('password')"
            />

            <div class="mt-2 text-center">
              <a href="#" @click.prevent="toggleResetMode" class="auth-footer-link">
                {{ isResetMode ? 'Return to Login' : 'Forgot your password?' }}
              </a>
            </div>

            <AppButton :loading="loading" :disabled="loading" type="submit" variant="primary">
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
  @apply flex min-h-screen w-full overflow-hidden;
  background-color: var(--color-surface-light);
}

.auth-banner {
  @apply hidden lg:flex flex-[1.4] bg-[url('@/assets/images/backgrounds/blue-bg-school.jpg')] bg-[80%_center] bg-cover bg-no-repeat relative;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}

.auth-banner::after {
  @apply content-[''] absolute inset-0;
  background: linear-gradient(
    to bottom right,
    rgba(56, 189, 248, 0.2),
    rgba(56, 189, 248, 0.05),
    transparent
  );
}

.auth-overlay {
  @apply absolute inset-0;
  background-color: rgba(0, 0, 0, 0.1);
}

.auth-content {
  @apply flex-1 flex items-center justify-center p-8 lg:p-16 relative z-10;
}

.auth-card {
  @apply w-full max-w-md backdrop-blur-xl p-10 px-8 rounded-3xl text-center transition-all duration-500;
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid var(--color-outline-std);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

.auth-logo-box {
  @apply mb-10 transform transition-transform duration-700 hover:scale-105;
}

.auth-logo {
  @apply w-full max-w-36 h-auto mx-auto drop-shadow-sm;
}

.auth-title {
  @apply text-3xl font-bold mb-2 tracking-tight;
  color: var(--color-content-deep);
}

.auth-subtitle {
  @apply text-sm font-medium mb-10 block;
  color: var(--color-content-muted);
}

.auth-form {
  @apply flex flex-col gap-5;
}

.auth-divider {
  @apply relative flex items-center gap-4 my-8;
}

.auth-divider-line {
  @apply h-px flex-grow;
  background-color: var(--color-outline-std);
}

.auth-divider-hint {
  @apply text-sm font-semibold whitespace-nowrap;
  color: var(--color-content-muted);
  opacity: 0.5;
}

.auth-footer-link {
  @apply text-sm font-semibold transition-all duration-300 underline-offset-4;
  color: var(--color-primary);
}

.auth-footer-link:hover {
  @apply underline;
  color: var(--color-primary-dark);
}

.auth-alert {
  @apply mt-6 p-4 rounded-xl text-sm font-semibold;
}

.auth-alert-error {
  background-color: var(--color-error-soft);
  color: var(--color-error-deep);
  border: 1px solid rgba(239, 68, 68, 0.1);
}

.auth-alert-success {
  background-color: var(--color-success-soft);
  color: var(--color-success-deep);
  border: 1px solid rgba(16, 185, 129, 0.1);
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
