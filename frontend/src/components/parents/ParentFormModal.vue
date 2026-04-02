<template>
  <AppModal :show="isOpen" title="Register New Parent / Guardian" @close="$emit('close')" :icon="getActionIcon('plus')">
    <form class="form-grid" @submit.prevent="handleFormSubmit">
      <div class="form-group full-width">
        <label>Full Name <span class="required">*</span></label>
        <input type="text" v-model="formData.name" placeholder="Enter full name" class="standard-input" />
      </div>

      <div class="form-group">
        <label>Email Address <span class="required">*</span></label>
        <input type="email" v-model="formData.email" placeholder="email@example.com" class="standard-input" />
      </div>

      <div class="form-group">
        <label>Phone Number <span class="required">*</span></label>
        <input type="tel" v-model="formData.phone" placeholder="e.g. +855..." class="standard-input" />
      </div>

      <div class="form-group full-width">
        <label>Role</label>
        <select v-model="formData.role" class="standard-input">
          <option value="parent">Parent</option>
          <option value="guardian">Guardian</option>
        </select>
      </div>

      <div class="form-group full-width">
        <AvatarSelector v-model="formData.profileURL" :role="formData.role"
          :customFileName="`${formData.name}_${formData.role}`" />
      </div>

      <div class="form-group full-width">
        <label>Password (Temporary)</label>
        <input type="text" v-model="formData.password" placeholder="Leave blank for auto-generated" class="standard-input" />
        <small class="text-muted-modern">The parent will be asked to change this on first login.</small>
      </div>
      <!-- Hidden submit for Enter key functionality -->
      <button type="submit" style="display: none;"></button>
    </form>

    <template #footer>
      <div style="display: flex; flex-direction: column; align-items: flex-end; width: 100%; gap: 12px;">
        <transition name="toast-fade">
          <div v-if="error" class="alert-box error" style="width: 100%; margin-bottom: 0;">
            {{ error }}
          </div>
        </transition>

        <transition name="toast-fade">
          <div v-if="success" class="alert-box success" style="width: 100%; margin-bottom: 0;">
            {{ success }}
          </div>
        </transition>

        <transition name="toast-fade">
          <div v-if="showHint && validationHint" class="validation-hint-toast">
            ⚠️ {{ validationHint }}
          </div>
        </transition>

        <div style="display: flex; gap: 12px; justify-content: flex-end; width: 100%;">
          <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
          <AppButton variant="primary" @click="handleFormSubmit" :loading="loading">
            Create Account
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AvatarSelector from '@/components/common/ui/AvatarSelector.vue'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'

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
  profileURL: getImageUrl('profiles/avatar-parent'),
  password: '',
})

const showHint = ref(false)
let hintTimeout = null

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    formData.value = {
      name: '',
      email: '',
      phone: '',
      role: 'parent',
      profileURL: getImageUrl('profiles/avatar-parent'),
      password: '',
    }
    showHint.value = false
  }
})

const validationHint = computed(() => {
  if (!formData.value.name.trim()) return 'Full name is required.'
  if (!formData.value.email.includes('@')) return 'A valid email is required.'
  if (!formData.value.phone.trim()) return 'Phone number is required.'
  return ''
})

const isFormValid = computed(() => !validationHint.value)

const handleFormSubmit = () => {
  if (!isFormValid.value) {
    showHint.value = true
    if (hintTimeout) clearTimeout(hintTimeout)
    hintTimeout = setTimeout(() => (showHint.value = false), 3000)
    return
  }
  emit('submit', { ...formData.value })
}
</script>

<style scoped>
.validation-hint-toast {
  font-size: 0.8rem;
  color: #ef4444;
  background: #fef2f2;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #fee2e2;
  max-width: fit-content;
  animation: shake 0.4s ease;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

.text-muted-modern {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 4px;
}

.required {
  color: #ef4444;
}

.alert-box {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
}

.alert-box.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fee2e2;
}

.alert-box.success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #dcfce7;
}
</style>
