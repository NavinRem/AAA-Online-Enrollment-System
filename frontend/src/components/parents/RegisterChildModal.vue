<template>
  <AppModal :show="isOpen" title="Register New Child" @close="$emit('close')">
    <div v-if="error" class="alert-box error">{{ error }}</div>
    <div v-if="success" class="alert-box success">{{ success }}</div>

    <div class="identity-card" v-if="parent">
      <span class="label">{{ parent.role }}</span>
      <strong class="name">{{ parent.name || parent.email }}</strong>
    </div>

    <div class="form-grid">
      <div class="form-group full-width" v-if="selectableParents && selectableParents.length > 0">
        <label>Select Parent / Guardian <span class="required">*</span></label>
        <div class="custom-dropdown-container">
          <div class="custom-dropdown" :class="{ open: isDropdownOpen }">
            <div class="dropdown-header" @click="isDropdownOpen = !isDropdownOpen">
              <template v-if="selectedParent">
                <div class="selected-parent">
                  <img :src="selectedParent.profileURL || getImageUrl('profiles/avatar-parent')" class="avatar-mini-circle" />
                  <span>{{ selectedParent.name || selectedParent.email }}</span>
                </div>
              </template>
              <template v-else>
                <span class="placeholder">Parent/guardian name</span>
              </template>
              <span class="chevron" :class="{ up: isDropdownOpen }"></span>
            </div>
            
            <div class="dropdown-menu" v-if="isDropdownOpen">
              <div class="dropdown-search">
                <input
                  type="text"
                  v-model="searchQuery"
                  placeholder="Search name or email..."
                  @click.stop
                  autofocus
                />
              </div>
              <ul class="dropdown-list">
                <li
                  v-for="p in searchResults"
                  :key="p.uid || p.id"
                  class="dropdown-item"
                  :class="{ active: formData.parentId === (p.uid || p.id) }"
                  @click="selectParent(p)"
                >
                  <img :src="p.profileURL || getImageUrl('profiles/avatar-parent')" class="avatar-mini-circle" />
                  <div class="item-info">
                    <span class="item-name">{{ p.name || p.email }}</span>
                  </div>
                </li>
                <li v-if="searchResults.length === 0" class="dropdown-item no-results">
                  No matches found.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label>Full Name <span class="required">*</span></label>
        <input
          type="text"
          v-model="formData.fullName"
          placeholder="Enter child's full name"
          required
        />
      </div>

      <div class="form-group">
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
import { ref, watch, computed, toRef } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import { useSearch, parentSearchMapper } from '@/composables/useSearch'
import { getImageUrl } from '@/utils/assetHelper'

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
  parentId: props.parent?.uid || props.parent?.id || '',
  fullName: '',
  dob: '',
  medicalNote: 'None',
})

// Dropdown Search Logic
const isDropdownOpen = ref(false)
const selectableParentsRef = toRef(props, 'selectableParents')
const { searchQuery, searchResults } = useSearch(selectableParentsRef, parentSearchMapper)

const selectedParent = computed(() => {
  if (!formData.value.parentId) return null
  return props.selectableParents.find(p => (p.uid || p.id) === formData.value.parentId)
})

const selectParent = (parent) => {
  formData.value.parentId = parent.uid || parent.id
  isDropdownOpen.value = false
  searchQuery.value = ''
}

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      formData.value = {
        parentId: props.parent?.uid || props.parent?.id || '',
        fullName: '',
        dob: '',
        medicalNote: 'None',
      }
    }
  },
)

const isFormValid = computed(() => {
  const basicFields = formData.value.fullName.trim() && formData.value.dob
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
