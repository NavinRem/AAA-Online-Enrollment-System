<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/authService'
import { userService } from '@/services/userService'

import AppButton from '@/components/common/ui/AppButton.vue'
import { getActionIcon, getImageUrl } from '@/utils/assetHelper'

const router = useRouter()

const isResetMode = ref(false)
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref('')
const message = ref('')
const loading = ref(false)

const toggleResetMode = () => {
  isResetMode.value = !isResetMode.value
  email.value = ''
  password.value = ''
  error.value = ''
  message.value = ''
}

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  message.value = ''

  try {
    if (isResetMode.value) {
      await authService.resetPassword(email.value)
      message.value = 'Password reset email sent! Check your inbox.'
      loading.value = false
      return
    }

    const user = await authService.login(email.value, password.value)
    try {
      const profile = await userService.getProfile(user.uid)
      if (!profile || profile.role !== 'admin') {
        await authService.logout()
        error.value = 'Access Denied: This portal is reserved for administrators only.'
        loading.value = false
        return
      }
    } catch (profileError) {
      await authService.logout()
      error.value = `Auth Error: ${profileError.message || 'Could not verify administrator permissions.'}`
      loading.value = false
      return
    }

    message.value = 'Logged in successfully! Redirecting...'
    setTimeout(() => {
      router.push('/dashboard')
    }, 300)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="split-screen">
    <div class="image-panel"></div>
    <div class="form-panel">
      <div class="form-container">
        <div class="logo">
          <img :src="getImageUrl('common/logo-main')" alt="Active Kids Academy" class="logo-img" />
        </div>

        <h2 class="title">
          {{ isResetMode ? 'Reset Password' : 'Admin Portal Login' }}
        </h2>

        <form @submit.prevent="handleSubmit" class="auth-form">
          <div class="form-group">
            <label>Administrator Email <span class="required">*</span></label>
            <input v-model="email" type="email" placeholder="Enter your email" required />
          </div>

          <div v-if="!isResetMode" class="form-group">
            <label>Password <span class="required">*</span></label>
            <div class="password-input">
              <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="Enter your password"
                required />
              <button type="button" @click="showPassword = !showPassword" class="eye-btn">
                <img :src="showPassword ? getActionIcon('eye-close') : getActionIcon('eye-open')"
                  alt="Toggle password visibility" class="eye-icon" />
              </button>
            </div>
          </div>

          <AppButton :loading="loading" :disabled="loading" type="submit" variant="primary"
            class="w-full">
            {{ isResetMode ? 'Send Reset Link' : 'Sign in' }}
          </AppButton>
        </form>

        <div v-if="!isResetMode" class="separator">
          <span>SECURE ACCESS</span>
        </div>

        <p class="toggle-text">
          <a href="#" @click.prevent="toggleResetMode">
            {{ isResetMode ? 'Back to Login' : 'Forgot Password?' }}
          </a>
        </p>

        <p v-if="error" class="error-msg">{{ error }}</p>
        <p v-if="message" class="success-msg">{{ message }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.split-screen {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

.image-panel {
  flex: 1.2;
  background: url('@/assets/images/backgrounds/blue-bg-school.jpg') 80% center/cover no-repeat;
  position: relative;
  border-right: 1px solid var(--border-color);
}

.image-panel::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 174, 239, 0.03);
}

.form-panel {
  flex: 1;
  background: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl);
}

.form-container {
  width: 100%;
  max-width: 440px;
  background: var(--white);
  padding: var(--space-2xl) var(--space-xl);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: var(--border-radius);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.logo {
  margin-bottom: 25px;
}

.logo-img {
  width: 100%;
  max-width: 140px;
  height: auto;
}

.title {
  font-size: var(--text-2xl);
  font-weight: 700;
  margin-bottom: var(--space-xl);
  color: var(--text-deep);
}

.form-group {
  text-align: left;
  margin-bottom: var(--space-md);
}

.form-group label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 600;
  margin-bottom: var(--space-xs);
  color: var(--text-dark);
}

input {
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-subtle);
  border: 1px solid transparent;
  border-radius: var(--border-radius-sm);
  font-size: var(--text-base);
}

input:focus {
  outline: none;
  background: var(--white);
  border-color: var(--primary-color);
}

.password-input {
  position: relative;
}

.eye-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.eye-icon {
  width: 20px;
  height: 20px;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.eye-btn:hover .eye-icon {
  opacity: 0.9;
}

.separator {
  margin: 25px 0;
  position: relative;
  text-align: center;
}

.separator::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--bg-light);
}

.separator span {
  position: relative;
  background: var(--white);
  padding: 0 var(--space-sm);
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--text-light);
}

.toggle-text {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin-top: var(--space-md);
}

.error-msg {
  color: var(--error-color);
  font-size: var(--text-sm);
  margin-top: var(--space-md);
}

.success-msg {
  color: var(--success-color);
  font-size: var(--text-sm);
  margin-top: var(--space-md);
}
</style>
