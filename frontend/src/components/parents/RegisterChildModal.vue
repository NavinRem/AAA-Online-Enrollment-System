<template>
  <AppModal :show="isOpen" title="Register New Child" @close="$emit('close')">
    <div v-if="error" class="error-banner">{{ error }}</div>
    <div v-if="success" class="success-banner">{{ success }}</div>

    <div class="target-summary" v-if="parent">
      {{ (parent.role || 'parent')[0].toUpperCase() + (parent.role || 'parent').slice(1) }}:
      <strong>{{ parent.name || parent.email }}</strong>
    </div>

    <div class="form-grid">
      <div class="form-group full-width">
        <label>Full Name <span class="required">*</span></label>
        <input
          type="text"
          v-model="formData.fullname"
          placeholder="Enter child's full name"
          required
        />
      </div>

      <div class="form-group full-width">
        <label>Date of Birth <span class="required">*</span></label>
        <input type="date" v-model="formData.dob" required />
      </div>

      <div class="form-group full-width">
        <label>Medical Notes / Allergies</label>
        <textarea
          v-model="formData.medical_note"
          placeholder="e.g. Nut allergy, Asthma, or 'None'"
          rows="3"
        ></textarea>
      </div>
    </div>

    <template #footer>
      <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
      <AppButton
        variant="primary"
        @click="handleSubmit"
        :loading="loading"
        :disabled="loading || !formData.fullname || !formData.dob"
      >
        Register Child
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import AppModal from '../common/AppModal/AppModal.vue'
import AppButton from '../common/AppButton/AppButton.vue'

const props = defineProps({
  isOpen: Boolean,
  parent: Object,
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit'])

const formData = ref({
  fullname: '',
  dob: '',
  medical_note: 'None',
})

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      formData.value = {
        fullname: '',
        dob: '',
        medical_note: 'None',
      }
    }
  },
)

const handleSubmit = () => {
  emit('submit', { ...formData.value })
}
</script>

<style scoped>
.required {
  color: #ef4444;
}
</style>
