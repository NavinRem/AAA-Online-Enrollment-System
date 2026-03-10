<template>
  <AppModal :show="isOpen" title="Register New Parent / Guardian" @close="$emit('close')">
    <div v-if="error" class="error-banner">{{ error }}</div>
    <div v-if="success" class="success-banner">{{ success }}</div>

    <div class="form-grid">
      <div class="form-group full-width">
        <label>Full Name <span class="required">*</span></label>
        <input type="text" v-model="formData.name" placeholder="Enter full name" required />
      </div>

      <div class="form-group full-width">
        <label>Email Address <span class="required">*</span></label>
        <input type="email" v-model="formData.email" placeholder="email@example.com" required />
      </div>

      <div class="form-group full-width">
        <label>Phone Number</label>
        <input type="tel" v-model="formData.phone" placeholder="e.g. +855..." />
      </div>

      <div class="form-group full-width">
        <label>Role</label>
        <select v-model="formData.role">
          <option value="parent">Parent</option>
          <option value="guardian">Guardian</option>
        </select>
      </div>

      <div class="form-group full-width">
        <label>Password (Temporary)</label>
        <input
          type="text"
          v-model="formData.password"
          placeholder="Leave blank for auto-generated"
        />
        <small class="text-muted">The parent will be asked to change this on first login.</small>
      </div>
    </div>

    <template #footer>
      <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
      <AppButton
        variant="primary"
        @click="handleSubmit"
        :loading="loading"
        :disabled="loading || !isFormValid"
      >
        Create Account
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import AppModal from '../common/AppModal/AppModal.vue'
import AppButton from '../common/AppButton/AppButton.vue'

const props = defineProps({
  isOpen: Boolean,
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit'])

const formData = ref({
  name: '',
  email: '',
  phone: '',
  role: 'parent',
  password: '',
})

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      formData.value = {
        name: '',
        email: '',
        phone: '',
        role: 'parent',
        password: '',
      }
    }
  },
)

const isFormValid = computed(() => {
  return formData.value.name.trim() && formData.value.email.includes('@') && formData.value.role
})

const handleSubmit = () => {
  if (!isFormValid.value) return
  emit('submit', { ...formData.value })
}
</script>

