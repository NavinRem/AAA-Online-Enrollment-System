<script setup>
import { ref } from 'vue'
import { registrationService } from '../services/registrationService'

const formData = ref({
  name: '',
  email: '',
})

const status = ref({
  loading: false,
  error: null,
  success: null,
})

const emit = defineEmits(['created'])

const handleSubmit = async () => {
  status.value.loading = true
  status.value.error = null
  status.value.success = null

  try {
    const response = await registrationService.create(formData.value)
    status.value.success = `Registration successful! ID: ${response.id}`
    formData.value = { name: '', email: '' } // Reset form
    emit('created') // Notify parent
  } catch (err) {
    status.value.error = err.message
  } finally {
    status.value.loading = false
  }
}
</script>

<template>
  <div class="registration-form">
    <h2>Register Now</h2>

    <div v-if="status.error" class="error">{{ status.error }}</div>
    <div v-if="status.success" class="success">{{ status.success }}</div>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="name">Name:</label>
        <input
          id="name"
          v-model="formData.name"
          type="text"
          required
          placeholder="Enter your name"
        />
      </div>

      <div class="form-group">
        <label for="email">Email:</label>
        <input
          id="email"
          v-model="formData.email"
          type="email"
          required
          placeholder="Enter your email"
        />
      </div>

      <button type="submit" :disabled="status.loading">
        {{ status.loading ? 'Submitting...' : 'Register' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.registration-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #cccccc;
}

.error {
  color: red;
  margin-bottom: 10px;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
}

.success {
  color: green;
  margin-bottom: 10px;
  padding: 10px;
  background-color: #e8f5e9;
  border-radius: 4px;
}
</style>
