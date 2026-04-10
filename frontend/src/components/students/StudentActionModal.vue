<template>
  <AppModal :show="isOpen" :title="modalTitle" @close="$emit('close')" :icon="modalIcon">
    <div class="entity-identity-standard" v-if="(student || enrollment) && (type === 'edit' || type === 'override' || type === 'enrollment-override')">
      <div class="identity-panel-wrapper" :class="studentTheme">
        <div class="entity-info-content">
          <div class="entity-avatar-wrapper student-size">
            <img :src="getStudentProfileURL(localData.profileURL)" class="entity-avatar-img" />
          </div>
          <div class="entity-details">
            <span class="entity-type-tag">Student Profile</span>
            <h2 class="entity-name">{{ localData.name || 'Student Name' }}</h2>
            <div class="entity-sub-info">
              <span>{{ studentTheme === 'theme-pink' ? 'Female' : 'Male' }}</span>
              <span class="dot-sep">•</span>
              <span>{{ calculateAge(localData.dob) }} yrs old</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <form id="studentActionForm" @submit.prevent="handleSubmit">
      <!-- Edit Profile / Override Form -->
      <div v-if="type === 'edit' || type === 'override' || type === 'enrollment-override'" class="form-grid">
        <div class="form-group" :class="{ 'field-error': isSubmittingAttempted && errors.name }">
          <label>Full Name <span class="required">*</span></label>
          <input type="text" v-model="localData.name" placeholder="Full Name" class="standard-input"
            :disabled="type !== 'edit'" />
          <div v-if="isSubmittingAttempted && errors.name" class="field-error-msg">{{ errors.name }}</div>
        </div>

        <div class="form-group" :class="{ 'field-error': isSubmittingAttempted && errors.dob }">
          <label>Date of Birth <span class="required">*</span></label>
          <input type="date" v-model="localData.dob" class="standard-input" :disabled="type !== 'edit'" />
          <div v-if="isSubmittingAttempted && errors.dob" class="field-error-msg">{{ errors.dob }}</div>
        </div>

        <div class="form-group">
          <label>Medical Notes / Allergies
            <span class="original-value" v-if="originalData.medicalNote">Original: {{ originalData.medicalNote }}</span>
          </label>
          <textarea v-model="localData.medicalNote" placeholder="e.g. Nut allergy, ADHD..." rows="2"
            class="standard-input" :disabled="type !== 'edit'"></textarea>
          <div class="preset-chips" v-if="type === 'edit'">
            <button v-for="preset in ['None', 'G6PD', 'ADHD', 'Asthma']" :key="preset" type="button" class="preset-chip"
              :class="{ active: isPresetActive('medicalNote', preset) }" @click="togglePreset('medicalNote', preset)">
              {{ preset }}
            </button>
          </div>
        </div>

        <div class="form-group" :class="{ 'field-error': isSubmittingAttempted && errors.status }">
          <label>Account Status <span class="required">*</span></label>
          <select v-model="localData.status" class="standard-input" :disabled="type === 'edit' && !['Suspended', 'Stopped'].includes(localData.status)">
            <option value="Studying">Studying</option>
            <option value="Suspended">Suspended</option>
            <option value="Stopped">Stopped</option>
            <option value="Graduated">Graduated</option>
          </select>
          <div v-if="isSubmittingAttempted && errors.status" class="field-error-msg">{{ errors.status }}</div>
        </div>

        <div class="form-group full-width" v-if="['Suspended', 'Stopped'].includes(localData.status)"
          :class="{ 'field-error': isSubmittingAttempted && errors.overrideRemark }">
          <label>Administrative Remarks <span class="required">*</span></label>
          <textarea v-model="localData.overrideRemark" placeholder="Document reason for status change..."
            rows="3" class="standard-input"></textarea>
          <div v-if="isSubmittingAttempted && errors.overrideRemark" class="field-error-msg">{{ errors.overrideRemark }}</div>
        </div>

        <div class="form-group full-width" v-if="type === 'edit'">
          <label>Student Profile Avatar</label>
          <AvatarSelector v-model="localData.profileURL" role="student" :uid="student?.id || enrollment?.studentId"
            :customFileName="`${localData.name}_student`" />
        </div>
      </div>

      <!-- Delete Panel -->
      <div v-if="type === 'delete' || type === 'enrollment-delete'" class="status-action-panel">
        <div class="danger-box-standard">
          <div class="danger-icon-large">🚨</div>
          <div class="danger-content">
            <strong>Critical Record Deletion</strong>
            <p>This will permanently remove the record and all associated history. This action cannot be undone.</p>
          </div>
        </div>
        <p class="confirm-label-standard">Type <strong class="danger-text">DELETE</strong> to confirm</p>
        <input type="text" v-model="localData.deleteConfirm" placeholder="DELETE" class="confirm-input-standard" />
        <div v-if="isSubmittingAttempted && errors.deleteConfirm" class="field-error-msg">{{ errors.deleteConfirm }}</div>
      </div>
    </form>

    <template #footer>
      <div class="flex-column flex-end w-full gap-sm">
        <transition name="alert-fade">
          <AppAlert v-if="error" type="error" closable @close="$emit('update:error', '')" class="w-full">
            {{ error }}
          </AppAlert>
        </transition>

        <div class="flex-align-center flex-end w-full gap-sm">
          <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
          <AppButton :variant="type?.includes('delete') ? 'danger' : 'primary'" form="studentActionForm" type="submit"
            :loading="loading" :disabled="isFormInvalid || (type === 'edit' && !isChanged)"
            :class="{ 'button-disabled-visual': isFormInvalid || (type === 'edit' && !isChanged) }">
            {{ submitLabel }}
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AvatarSelector from '@/components/common/ui/AvatarSelector.vue'
import { getStudentProfileURL, isSameProfileAsset, getActionIcon } from '@/utils/assetHelper'
import { calculateAge } from '@/utils/formatUtils'

const props = defineProps({
  isOpen: Boolean,
  type: String, // 'edit', 'delete', 'override', 'enrollment-override', 'enrollment-delete'
  student: Object,
  enrollment: Object,
  loading: Boolean,
  error: String,
})

const emit = defineEmits(['close', 'submit', 'update:error'])

const localData = ref({
  name: '',
  dob: '',
  profileURL: '',
  medicalNote: 'None',
  status: '',
  deleteConfirm: '',
  overrideRemark: '',
})

const initialData = ref('')
const isSubmittingAttempted = ref(false)

const syncData = () => {
  const source = props.student || props.enrollment || {}
  const data = {
    name: source.name || '',
    dob: source.dob || '',
    profileURL: source.profileURL || '',
    medicalNote: source.medicalNote || 'None',
    status: source.status || 'Studying',
    deleteConfirm: '',
    overrideRemark: source.overrideRemark || '',
  }
  localData.value = data
  initialData.value = JSON.stringify(data)
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    syncData()
    isSubmittingAttempted.value = false
  }
})

const isChanged = computed(() => {
  if (props.type !== 'edit') return true
  const current = JSON.stringify(localData.value)
  const base = initialData.value
  
  // profile asset comparison
  const originalProfile = (props.student || props.enrollment)?.profileURL || ''
  const currentProfile = localData.value.profileURL || ''
  const profileChanged = !isSameProfileAsset(currentProfile, originalProfile)
  
  return current !== base || profileChanged
})

const errors = computed(() => {
  const errs = {}
  if (props.type === 'edit' || props.type?.includes('override')) {
    if (!localData.value.name?.trim()) errs.name = 'Full name is required.'
    if (!localData.value.dob) errs.dob = 'Date of birth is required.'
    if (['Suspended', 'Stopped'].includes(localData.value.status) && !localData.value.overrideRemark?.trim()) {
      errs.overrideRemark = 'Detailed remark is required for this status change.'
    }
  } else if (props.type?.includes('delete')) {
    if (localData.value.deleteConfirm !== 'DELETE') errs.deleteConfirm = 'Type DELETE to confirm.'
  }
  return errs
})

const isFormInvalid = computed(() => Object.keys(errors.value).length > 0)

const modalTitle = computed(() => {
  const titles = {
    edit: 'Edit Student Profile',
    delete: 'Delete Student Record',
    override: 'Manual Status Override',
    'enrollment-override': 'Enrollment Status Override',
    'enrollment-delete': 'Delete Enrollment Record',
  }
  return titles[props.type] || 'Student Action'
})

const submitLabel = computed(() => {
  if (props.type === 'edit') return 'Save profile'
  if (props.type?.includes('delete')) return 'Permanently Delete'
  return 'Confirm action'
})

const modalIcon = computed(() => {
  if (props.type?.includes('delete')) return getActionIcon('delete')
  return getActionIcon('edit')
})

const studentTheme = computed(() => {
  const url = (localData.value.profileURL || '').toLowerCase()
  if (url.includes('woman') || url.includes('girl')) return 'theme-pink'
  if (url.includes('man') || url.includes('boy')) return 'theme-blue'
  return 'theme-default'
})

const isPresetActive = (field, chipValue) => {
  const values = (localData.value[field] || '').split(',').map(v => v.trim())
  return values.includes(chipValue)
}

const togglePreset = (field, chipValue) => {
  let values = (localData.value[field] || '').split(',').map(v => v.trim()).filter(Boolean)
  if (values.includes(chipValue)) {
    values = values.filter(v => v !== chipValue)
  } else {
    if (chipValue === 'None') values = ['None']
    else {
      values = values.filter(v => v !== 'None')
      values.push(chipValue)
    }
  }
  localData.value[field] = values.join(', ')
}

const handleSubmit = () => {
  isSubmittingAttempted.value = true
  if (isFormInvalid.value) return
  emit('submit', { ...localData.value })
}
</script>

<style scoped>
@import "@/assets/styles/components/ActionModalShared.css";
</style>
