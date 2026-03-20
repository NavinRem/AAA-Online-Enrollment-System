<template>
  <AppModal :show="isOpen" title="Register New Parent / Guardian" @close="$emit('close')">
    <div v-if="error" class="alert-box error">{{ error }}</div>
    <div v-if="success" class="alert-box success">{{ success }}</div>

    <form class="form-grid" @submit.prevent="handleSubmit">
      <div class="form-group full-width">
        <label>Full Name <span class="required">*</span></label>
        <input type="text" v-model="formData.name" placeholder="Enter full name" required />
      </div>

      <div class="form-group">
        <label>Email Address <span class="required">*</span></label>
        <input type="email" v-model="formData.email" placeholder="email@example.com" required />
      </div>

      <div class="form-group">
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
        <AvatarSelector v-model="formData.profileURL" type="parent" />
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
      <!-- Hidden submit for Enter key functionality -->
      <button type="submit" style="display: none;"></button>
    </form>

    <template #footer>
      <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
      <AppButton
        variant="primary"
        type="submit"
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
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AvatarSelector from '@/components/common/ui/AvatarSelector.vue'
import { getImageUrl } from '@/utils/assetHelper'

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
  profileURL: getImageUrl('profiles/avatar-man'),
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
        profileURL: getImageUrl('profiles/avatar-man'),
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

