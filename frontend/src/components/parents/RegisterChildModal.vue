<template>
  <AppModal :show="isOpen" title="Register New Child" @close="$emit('close')">
    <div v-if="error" class="error-banner">{{ error }}</div>
    <div v-if="success" class="success-banner">{{ success }}</div>

    <div class="target-summary" v-if="parent">
      {{ (parent.role || 'parent')[0].toUpperCase() + (parent.role || 'parent').slice(1) }}:
      <strong>{{ parent.name || parent.email }}</strong>
    </div>

    <div class="form-grid">
      <!-- Show dropdown if multiple parents are provided to select from -->
      <div class="form-group full-width" v-if="selectableParents && selectableParents.length > 0">
        <label>Select Parent / Guardian <span class="required">*</span></label>
        <select v-model="formData.parentId" required class="form-select">
          <option disabled value="">-- Choose a parent/guardian --</option>
          <option v-for="p in selectableParents" :key="p.uid || p.id" :value="p.uid || p.id">
            {{ p.name || p.email }} ({{ p.phone || 'No phone' }})
          </option>
        </select>
      </div>
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
          v-model="formData.medicalNote"
          placeholder="e.g. Nut allergy, Asthma, or 'None'"
          rows="3"
        ></textarea>
        <div class="preset-chips">
          <button
            type="button"
            class="preset-chip"
            :class="{ active: isPresetActive('medicalNote', 'None') }"
            @click="togglePreset('medicalNote', 'None')"
          >
            None
          </button>
          <button
            type="button"
            class="preset-chip"
            :class="{ active: isPresetActive('medicalNote', 'G6PD Deficiency') }"
            @click="togglePreset('medicalNote', 'G6PD Deficiency')"
          >
            G6PD Deficiency
          </button>
          <button
            type="button"
            class="preset-chip"
            :class="{ active: isPresetActive('medicalNote', 'ADHD') }"
            @click="togglePreset('medicalNote', 'ADHD')"
          >
            ADHD
          </button>
          <button
            type="button"
            class="preset-chip"
            :class="{ active: isPresetActive('medicalNote', 'Dyslexia') }"
            @click="togglePreset('medicalNote', 'Dyslexia')"
          >
            Dyslexia
          </button>
          <button
            type="button"
            class="preset-chip"
            :class="{ active: isPresetActive('medicalNote', 'Asthma') }"
            @click="togglePreset('medicalNote', 'Asthma')"
          >
            Asthma
          </button>
          <button
            type="button"
            class="preset-chip"
            :class="{ active: isPresetActive('medicalNote', 'Vision Impairment') }"
            @click="togglePreset('medicalNote', 'Vision Impairment')"
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
        :disabled="loading || !isFormValid"
      >
        Register Child
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import AppModal from '@/components/common/ui/AppModal/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton/AppButton.vue'

const props = defineProps({
  isOpen: Boolean,
  parent: Object,
  selectableParents: {
    type: Array,
    default: () => [],
  },
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit'])

const formData = ref({
  parentId: '',
  fullname: '',
  dob: '',
  medicalNote: 'None',
})

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      formData.value = {
        parentId: '',
        fullname: '',
        dob: '',
        medicalNote: 'None',
      }
    }
  },
)

const isFormValid = computed(() => {
  const basicFields = formData.value.fullname.trim() && formData.value.dob
  const parentSelected =
    props.selectableParents && props.selectableParents.length > 0 ? formData.value.parentId : true
  return basicFields && parentSelected
})

const handleSubmit = () => {
  if (!isFormValid.value) return
  emit('submit', { ...formData.value })
}

const togglePreset = (field, chipValue) => {
  const currentText = formData.value[field] || ''
  let values = currentText
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

  if (values.includes(chipValue)) {
    values = values.filter((v) => v !== chipValue)
  } else {
    // If 'None' is picked, clear others. If others picked, remove 'None'.
    if (chipValue === 'None') {
      values = ['None']
    } else {
      values = values.filter((v) => v !== 'None')
      values.push(chipValue)
    }
  }
  formData.value[field] = values.join(', ')
}

const isPresetActive = (field, chipValue) => {
  const currentText = formData.value[field] || ''
  const values = currentText
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
  return values.includes(chipValue)
}
</script>

<style scoped>

.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  background-color: #f8fafc;
  outline: none;
  transition: all 0.2s;
}

.form-select:focus {
  border-color: #00aeef;
  background-color: #ffffff;
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
