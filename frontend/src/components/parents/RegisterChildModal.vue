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
        <div class="preset-chips">
          <button
            type="button"
            class="preset-chip"
            :class="{ active: formData.medical_note === 'None' }"
            @click="formData.medical_note = 'None'"
          >
            None
          </button>
          <button
            type="button"
            class="preset-chip"
            :class="{ active: formData.medical_note === 'G6PD Deficiency' }"
            @click="formData.medical_note = 'G6PD Deficiency'"
          >
            G6PD Deficiency
          </button>
          <button
            type="button"
            class="preset-chip"
            :class="{ active: formData.medical_note === 'ADHD' }"
            @click="formData.medical_note = 'ADHD'"
          >
            ADHD
          </button>
          <button
            type="button"
            class="preset-chip"
            :class="{ active: formData.medical_note === 'Dyslexia' }"
            @click="formData.medical_note = 'Dyslexia'"
          >
            Dyslexia
          </button>
          <button
            type="button"
            class="preset-chip"
            :class="{ active: formData.medical_note === 'Asthma' }"
            @click="formData.medical_note = 'Asthma'"
          >
            Asthma
          </button>
          <button
            type="button"
            class="preset-chip"
            :class="{ active: formData.medical_note === 'Vision Impairment' }"
            @click="formData.medical_note = 'Vision Impairment'"
          >
            Vision Impairment
          </button>
        </div>
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

/* Preset Chips */
.preset-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.preset-chip {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 100px;
  padding: 6px 14px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #64748b;
  transition: all 0.2s;
}

.preset-chip:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.preset-chip.active {
  background: #eff6ff;
  border-color: #00aeef;
  color: #00aeef;
  font-weight: 600;
}
</style>
