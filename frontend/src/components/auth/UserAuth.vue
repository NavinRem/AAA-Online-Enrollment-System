<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/authService'
import { userService } from '@/services/userService'

import AppButton from '@/components/common/ui/AppButton.vue'
import { getImageUrl } from '@/utils/assetHelper'

const router = useRouter()

const isLogin = ref(true)
const isResetMode = ref(false)
const email = ref('')
const password = ref('')
const phone = ref('')
const role = ref('parent')
const name = ref('')
const showPassword = ref(false)
const error = ref('')
const message = ref('')
const loading = ref(false)

const toggleMode = () => {
  isLogin.value = !isLogin.value
  isResetMode.value = false
  // Clear fields
  email.value = ''
  password.value = ''
  name.value = ''
  phone.value = ''
  role.value = 'parent'
  error.value = ''
  message.value = ''
}

const toggleResetMode = () => {
  isResetMode.value = !isResetMode.value
  // Clear fields
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

    if (isLogin.value) {
      // 1. Sign in
      const user = await authService.login(email.value, password.value)

      // 2. Strict Role Check: ONLY 'admin' allowed
      try {
        const profile = await userService.getProfile(user.uid)
        if (!profile || profile.role !== 'admin') {
          await authService.logout()
          error.value = 'Permission Denied: Only administrators can access this portal.'
          loading.value = false
          return
        }
      } catch (profileError) {
        await authService.logout()
        error.value = 'Auth Error: Failed to verify your permissions.'
        loading.value = false
        return
      }

      message.value = 'Logged in successfully! Redirecting...'
      console.log('Login success - pausing for 3s before redirect...')
      
      // Redirect to Dashboard
      setTimeout(() => {
        console.log('3s over - moving to dashboard')
        router.push('/dashboard')
      }, 3000)
    } else {
      // 1. Create Auth User
      const user = await authService.register(email.value, password.value)

      // 2. Create Profile
      await userService.registerParentAccount({
        uid: user.uid,
        email: email.value,
        name: name.value,
        phone: phone.value,
        role: role.value,
      })

      // 3. Forced Logout & Sign In Redirect
      await authService.logout()
      
      // Success State
      message.value = 'Account created! Please sign in with your new credentials.'
      isLogin.value = true
      // Optional: Clear sensitive fields
      password.value = ''
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="split-screen">
    <!-- Left side: Image -->
    <div class="image-panel">
      <!-- Image is set via CSS background for better control -->
    </div>

    <!-- Right side: Form -->
    <div class="form-panel">
      <div class="form-container">
        <!-- Minimalist Logo -->
        <div class="logo">
          <img :src="getImageUrl('common/logo-main')" alt="Active Kids Academy" class="logo-img" />
        </div>

        <h2 class="title">
          {{
            isResetMode ? 'Reset Password' : isLogin ? 'Sign in to account' : 'Create your account'
          }}
        </h2>

        <form @submit.prevent="handleSubmit" class="auth-form">
          <div v-if="!isLogin && !isResetMode" class="form-group">
            <label>Full Name <span class="required">*</span></label>
            <input v-model="name" type="text" placeholder="Enter your full name" required />
          </div>

          <div v-if="!isLogin && !isResetMode" class="form-group">
            <label>Phone Number <span class="required">*</span></label>
            <input v-model="phone" type="tel" placeholder="Enter your phone number" required />
          </div>

          <div v-if="!isLogin && !isResetMode" class="form-group">
            <label>Role <span class="required">*</span></label>
            <select v-model="role" required>
              <option value="parent">Parent</option>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div class="form-group">
            <label>Email <span class="required">*</span></label>
            <input v-model="email" type="email" placeholder="Enter your email" required />
          </div>

          <div v-if="!isResetMode" class="form-group">
            <label>Password <span class="required">*</span></label>
            <div class="password-input">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter your password"
                required
              />
              <button type="button" @click="showPassword = !showPassword" class="eye-btn">
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <div v-if="!isLogin && !isResetMode" class="terms">
            <input type="checkbox" id="terms" required />
            <label for="terms">I accept <a href="#">Terms and Conditions</a></label>
          </div>

          <AppButton
            :loading="loading"
            :disabled="loading"
            type="submit"
            variant="primary"
            style="width: 100%; border-radius: 8px"
          >
            {{ isResetMode ? 'Send Reset Link' : isLogin ? 'Sign in' : 'Continue' }}
          </AppButton>
        </form>

        <div v-if="isLogin && !isResetMode" class="separator">
          <span>OR</span>
        </div>

        <AppButton
          v-if="isLogin && !isResetMode"
          variant="subtle"
          type="button"
          style="width: 100%; border-radius: 8px; justify-content: center; gap: 10px;"
        >
          <template #icon-left>
            <img
              src="../../assets/icons/other/google-logo.svg"
              alt="Google"
              style="width: 20px; height: 20px; display: block;"
            />
          </template>
          Continue with Google
        </AppButton>

        <p class="toggle-text">
          <template v-if="isResetMode">
            <a href="#" @click.prevent="toggleResetMode">Back to Login</a>
          </template>
          <template v-else>
            {{ isLogin ? "Don't have an account yet?" : 'Already have an account?' }}
            <a href="#" @click.prevent="isResetMode ? toggleResetMode() : toggleMode()">
              {{ isLogin ? 'Sign Up' : 'Log in' }}
            </a>
          </template>
        </p>

        <p v-if="isLogin && !isResetMode" class="forgot-link">
          <a href="#" @click.prevent="toggleResetMode">Forgot Password?</a>
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
  border-right: 1px solid #e0e0e0;
}

/* Creating the blue overlay effect if the image isn't perfect */
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
  background: #fdfdfd;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.form-container {
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  padding: 40px 30px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
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
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 30px;
  color: #1a1a1a;
}

.form-group {
  text-align: left;
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: #444;
}

input,
select {
  width: 100%;
  padding: 12px 16px;
  background: #f3f4f6;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;
}

input:focus,
select:focus {
  outline: none;
  background: #fff;
  border-color: #00aeef;
  box-shadow: 0 0 0 3px rgba(0, 174, 239, 0.1);
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
  font-size: 1.2rem;
  padding: 5px;
}

.terms {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 20px 0;
  font-size: 0.85rem;
  color: #666;
}
.terms input {
  width: auto;
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
  background: #eee;
}
.separator span {
  position: relative;
  background: #fff;
  padding: 0 10px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #999;
}

.toggle-text {
  font-size: 0.9rem;
  color: #666;
  margin-top: 15px;
}

.forgot-link {
  margin-top: 15px;
  font-size: 0.9rem;
}

.error-msg {
  color: #e63946;
  font-size: 0.85rem;
  margin-top: 15px;
}

.success-msg {
  color: #2a9d8f;
  font-size: 0.85rem;
  margin-top: 15px;
}


</style>
