<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/authService'
import { userService } from '../services/userService'
import { storageService } from '../services/storageService'

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

// File Upload
const selectedFile = ref(null)

const toggleMode = () => {
  isLogin.value = !isLogin.value
  isResetMode.value = false
  error.value = ''
  message.value = ''
  selectedFile.value = null
}

const toggleResetMode = () => {
  isResetMode.value = !isResetMode.value
  error.value = ''
  message.value = ''
}

const handleFileChange = (event) => {
  selectedFile.value = event.target.files[0]
}

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  message.value = ''

  try {
    if (isResetMode.value) {
      // Reset Password Logic
      await authService.resetPassword(email.value)
      message.value = 'Password reset email sent! Check your inbox.'
      loading.value = false
      return
    }

    if (isLogin.value) {
      // Login Logic
      await authService.login(email.value, password.value)
      message.value = 'Logged in successfully!'
    } else {
      // Register Logic
      // 1. Create Auth User
      const user = await authService.register(email.value, password.value)

      let profileURL = null

      // 2. Upload Profile Image (if selected)
      if (selectedFile.value) {
        try {
          profileURL = await storageService.uploadProfileImage(user.uid, selectedFile.value)
        } catch (uploadError) {
          console.error('Failed to upload image during registration', uploadError)
          // Continue registration even if upload fails
        }
      }

      // 3. Create Profile in 'registration' database via Backend API
      await userService.createUser({
        uid: user.uid,
        email: email.value,
        name: name.value,
        phone: phone.value,
        role: role.value,
        profileURL: profileURL, // Pass the URL here
      })

      message.value = 'Account created and profile saved!'
    }

    // Redirect to Dashboard on success
    setTimeout(() => {
      console.log('Redirecting to dashboard...')
      router.push('/dashboard')
    }, 1000)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <h2 v-if="isResetMode">Reset Password</h2>
    <h2 v-else>{{ isLogin ? 'Login' : 'Register' }}</h2>

    <form @submit.prevent="handleSubmit">
      <div v-if="!isLogin && !isResetMode" class="form-group">
        <label>Name:</label>
        <input v-model="name" type="text" required />
      </div>

      <div v-if="!isLogin && !isResetMode" class="form-group">
        <label>Phone Number:</label>
        <input v-model="phone" type="tel" required />
      </div>

      <div v-if="!isLogin && !isResetMode" class="form-group">
        <label>Role:</label>
        <select v-model="role" required>
          <option value="parent">Parent</option>
          <option value="instructor">Instructor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div v-if="!isLogin && !isResetMode" class="form-group">
        <label>Profile Picture (Optional):</label>
        <input type="file" @change="handleFileChange" accept="image/*" />
      </div>

      <div class="form-group">
        <label>Email:</label>
        <input v-model="email" type="email" required />
      </div>

      <div v-if="!isResetMode" class="form-group">
        <label>Password:</label>
        <div class="password-wrapper">
          <input v-model="password" :type="showPassword ? 'text' : 'password'" required />
          <button type="button" class="toggle-password" @click="showPassword = !showPassword">
            {{ showPassword ? '🙈' : '👁️' }}
          </button>
        </div>
      </div>

      <button :disabled="loading" type="submit">
        {{
          loading
            ? 'Processing...'
            : isResetMode
              ? 'Send Reset Link'
              : isLogin
                ? 'Login'
                : 'Sign Up'
        }}
      </button>
    </form>

    <!-- Forgot Password Link -->
    <p v-if="isLogin && !isResetMode" class="forgot-link">
      <a href="#" @click.prevent="toggleResetMode">Forgot Password?</a>
    </p>

    <p v-if="isResetMode" class="toggle-text">
      <a href="#" @click.prevent="toggleResetMode">Back to Login</a>
    </p>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="message" class="success">{{ message }}</p>

    <p v-if="!isResetMode" class="toggle-text">
      {{ isLogin ? "Don't have an account?" : 'Already have an account?' }}
      <a href="#" @click.prevent="toggleMode">Click here</a>
    </p>
  </div>
</template>

<style scoped>
.auth-container {
  max-width: 400px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
}
.form-group {
  margin-bottom: 15px;
}
label {
  display: block;
  margin-bottom: 5px;
}
input,
select,
textarea {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}
button {
  width: 100%;
  padding: 10px;
  background-color: #4caf50;
  color: white;
  border: none;
  cursor: pointer;
}
button:disabled {
  background-color: #ccc;
}
.error {
  color: red;
  margin-top: 10px;
}
.success {
  color: green;
  margin-top: 10px;
}
.toggle-text {
  text-align: center;
  margin-top: 15px;
  font-size: 0.9em;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper input {
  padding-right: 40px; /* Space for the button */
}

.toggle-password {
  position: absolute;
  right: 5px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2em;
  padding: 5px;
  width: auto; /* Override general button width */
  color: #666;
}

.toggle-password:hover {
  color: #333;
}
</style>
