<script setup>
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/authService'
import { userService } from '@/services/userService'
import { useForm } from '@/composables/useForm'

import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import { getImageUrl } from '@/utils/assetHelper'

const router = useRouter()

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

  // Centralized Validation
  const isFormValid = validate({
    required: isResetMode.value ? ['email'] : ['email', 'password'],
  })

  if (!isFormValid) return

  loading.value = true
  try {
    if (isResetMode.value) {
      await authService.resetPassword(form.email)
      message.value = 'Password reset email sent! Check your inbox.'
      loading.value = false
      return
    }

    const user = await authService.login(form.email, form.password)
    try {
      const profile = await userService.getProfile(user.uid)
      if (!profile || profile.role !== 'admin') {
        await authService.logout()
        apiError.value = 'Access Denied: This portal is reserved for administrators only.'
        loading.value = false
        return
      }
    } catch (profileError) {
      await authService.logout()
      apiError.value = `Auth Error: ${profileError.message || 'Could not verify administrator permissions.'}`
      loading.value = false
      return
    }

    message.value = 'Logged in successfully! Redirecting...'
    setTimeout(() => {
      router.push('/dashboard')
    }, 300)
  } catch (err) {
    apiError.value = err.message
  } finally {
    loading.value = false
  }
}
</script>
<style scoped>
.auth-banner {
  @apply flex-[1.2] bg-[url('@/assets/images/backgrounds/blue-bg-school.jpg')] bg-[80%_center] bg-cover bg-no-repeat relative border-r border-outline-std;
}

.auth-banner::after {
  @apply content-[''] absolute top-0 left-0 right-0 bottom-0 bg-primary/5;
}

.auth-card {
  @apply w-full max-w-md bg-white p-12 px-8 border border-black/5 rounded-std shadow-2xl text-center;
}

.auth-logo-box {
  @apply mb-11;
}

.auth-logo {
  @apply w-full max-w-36 h-auto mx-auto;
}

.auth-divider {
  @apply relative flex items-center gap-4 my-10;
}

.auth-divider-line {
  @apply h-px flex-grow bg-content-muted opacity-20;
}

.auth-divider-hint {
  @apply text-2xs font-black text-content-muted uppercase tracking-widest whitespace-nowrap;
}
</style>

<template>
  <div class="flex min-h-screen w-full">
    <div class="auth-banner"></div>
    <div class="flex-1 bg-white flex items-center justify-center p-12 lg:p-16">
      <div class="auth-card">
        <div class="auth-logo-box">
          <img :src="getImageUrl('common/logo-main')" alt="Active Kids Academy"
            class="auth-logo" />
        </div>

        <h2 class="text-2xl font-bold mb-8 text-content-dark">
          {{ isResetMode ? 'Reset Password' : 'Admin Portal Login' }}
        </h2>

        <form @submit.prevent="handleSubmit" class="flex flex-col gap-4" novalidate>
          <AppInput v-model="form.email" type="email" label="Administrator Email" placeholder="Enter your email"
            required :error="errors.email" :shake="shaking.email" @input="clearError('email')" />

          <AppInput v-if="!isResetMode" v-model="form.password" type="password" label="Password"
            placeholder="Enter your password" required :error="errors.password" :shake="shaking.password"
            @input="clearError('password')" />

          <AppButton :loading="loading" :disabled="loading" type="submit" variant="primary"
            class="w-full mt-2 py-4 text-base font-bold shadow-lg shadow-primary/20">
            {{ isResetMode ? 'Send Reset Link' : 'Sign in' }}
          </AppButton>
        </form>

        <div v-if="!isResetMode" class="auth-divider">
          <div class="auth-divider-line"></div>
          <span class="auth-divider-hint">
            SECURE ACCESS
          </span>
          <div class="auth-divider-line"></div>
        </div>

        <p class="mt-4">
          <a href="#" @click.prevent="toggleResetMode"
            class="text-sm font-bold text-primary hover:underline transition-colors">
            {{ isResetMode ? 'Back to Login' : 'Forgot Password?' }}
          </a>
        </p>

        <p v-if="apiError"
          class="mt-4 text-sm font-bold text-error animate-in fade-in slide-in-from-top-1 duration-300">
          {{ apiError }}
        </p>
        <p v-if="message"
          class="mt-4 text-sm font-bold text-success animate-in fade-in slide-in-from-top-1 duration-300">
          {{ message }}
        </p>
      </div>
    </div>
  </div>
</template>
