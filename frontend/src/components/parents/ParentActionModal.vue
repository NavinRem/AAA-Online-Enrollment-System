<template>
  <AppModal :show="isOpen" :title="modalTitle" variant="action" @close="$emit('close')" :icon="getActionIcon(type)">
    <div v-if="(selectedParent) && type !== 'edit'" class="parent-identity-panel" :class="parentTheme">
      <div class="parent-info-content">
        <div class="parent-avatar-wrapper">
          <img :src="(selectedParent).profileURL" class="parent-avatar-img" />
        </div>
        <div class="parent-details">
          <div class="flex-align-center gap-xs">
            <strong class="parent-name">{{ (selectedParent).name }}</strong>
          </div>
          <span class="parent-email-sub" v-if="(selectedParent).name">{{ selectedParent.email }}</span>
        </div>
      </div>
    </div>

    <div v-if="type === 'edit'" class="form-grid">
      <div class="form-group">
        <label>Full Name <span class="required">*</span>
          <span class="original-value" v-if="originalData.name">Original: {{ originalData.name }}</span>
        </label>
        <input type="text" v-model="localData.name" placeholder="Enter full name" class="standard-input"
          :class="{ 'field-error': isSubmittingAttempted && errors.name }" />
        <div v-if="isSubmittingAttempted && errors.name" class="field-error-msg">{{ errors.name }}</div>
      </div>

      <div class="form-group">
        <label>Email Address <span class="required">*</span>
          <span class="original-value" v-if="originalData.email">Original: {{ originalData.email }}</span>
        </label>
        <input type="email" v-model="localData.email" placeholder="email@example.com" class="standard-input"
          :class="{ 'field-error': isSubmittingAttempted && errors.email }" />
        <div v-if="isSubmittingAttempted && errors.email" class="field-error-msg">{{ errors.email }}</div>
      </div>

      <div class="form-group">
        <label>Phone Number <span class="required">*</span>
          <span class="original-value" v-if="originalData.phone">Original: {{ originalData.phone }}</span>
        </label>
        <input type="tel" v-model="localData.phone" placeholder="Enter phone number" class="standard-input"
          :class="{ 'field-error': isSubmittingAttempted && errors.phone }" />
        <div v-if="isSubmittingAttempted && errors.phone" class="field-error-msg">{{ errors.phone }}</div>
      </div>

      <div class="form-group">
        <label>Profile Avatar <span class="required">*</span></label>
        <AvatarSelector v-model="localData.profile" :role="localData.role" :uid="user?.uid || user?.id"
          :customFileName="`${localData.name}_${localData.role}`" />
        <p class="avatar-guidance">Only .jpg, .png, and .webp images are accepted.</p>
        <div v-if="isSubmittingAttempted && errors.profile" class="field-error-msg show">{{ errors.profile }}</div>
      </div>
    </div>

    <div v-if="type === 'plus'" class="form-grid">
      <div class="form-group full-width" v-if="!user && selectableParents && selectableParents.length > 0">
        <label>Select Parent <span class="required">*</span></label>
        <div class="custom-dropdown-container">
          <div class="custom-dropdown" :class="{ open: isDropdownOpen }">
            <div class="dropdown-header" @click="isDropdownOpen = !isDropdownOpen">
              <template v-if="selectedParent">
                <div class="selected-parent">
                  <img :src="selectedParent.profileURL" class="avatar-mini-sm" />
                  <span>{{ selectedParent.name }}</span>
                </div>
              </template>
              <template v-else>
                <span class="placeholder">Choose a parent</span>
              </template>
              <span class="chevron" :class="{ up: isDropdownOpen }"></span>
            </div>

            <Teleport to="body">
              <div class="dropdown-menu" v-if="isDropdownOpen" :style="dropdownStyles">
                <div class="dropdown-search">
                  <img :src="getActionIcon('search')" class="search-icon-mini" />
                  <input type="text" v-model="parentSearchQuery" placeholder="Search name or email..." @click.stop
                    autofocus />
                </div>
                <ul class="dropdown-list">
                  <li v-for="p in filteredParents" :key="p.uid || p.id" class="dropdown-item"
                    :class="{ active: localData.parentId === (p.uid || p.id) }" @click="selectParent(p)">
                    <img :src="getParentProfileURL(p.profile)" class="avatar-mini-sm" />
                    <div class="item-info">
                      <span class="item-name">{{ p.name }}</span>
                    </div>
                  </li>
                  <li v-if="filteredParents.length === 0" class="dropdown-item no-results">
                    No matches found.
                  </li>
                </ul>
              </div>
            </Teleport>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Child's Full Name <span class="required">*</span></label>
        <input type="text" v-model="localData.name" placeholder="Enter child's full name" class="standard-input"
          :class="{ 'field-error': isSubmittingAttempted && errors.name }" />
        <div v-if="isSubmittingAttempted && errors.name" class="field-error-msg">{{ errors.name }}</div>
      </div>

      <div class="form-group">
        <label>Date of Birth <span class="required">*</span></label>
        <input type="date" v-model="localData.dob" class="standard-input"
          :class="{ 'field-error': isSubmittingAttempted && errors.dob }" />
        <div v-if="isSubmittingAttempted && errors.dob" class="field-error-msg">{{ errors.dob }}</div>
      </div>

      <div class="form-group">
        <label>Child Profile Avatar <span class="required">*</span></label>
        <AvatarSelector v-model="localData.profile" role="student"
          :customFileName="`${localData.name}_student` || ''" />
        <p class="avatar-guidance">Only .jpg, .png, and .webp images are accepted.</p>
        <div v-if="isSubmittingAttempted && errors.profile" class="field-error-msg show">{{ errors.profile }}</div>
      </div>

      <div class="form-group">
        <label>Personal Bio / Notes</label>
        <textarea v-model="localData.medicalNote" placeholder="e.g. Nut allergy, ADHD, or any medical notes..." rows="3"
          class="standard-input"></textarea>
        <div class="preset-chips">
          <button v-for="preset in ['None', 'G6PD Deficiency', 'ADHD', 'Dyslexia', 'Asthma', 'Vision Impairment']"
            :key="preset" type="button" class="preset-chip" :class="{ active: isPresetActive('medicalNote', preset) }"
            @click="togglePreset('medicalNote', preset)">
            {{ preset }}
          </button>
        </div>
      </div>



    </div>

    <div v-if="type === 'deactivate'" class="form-group full-width">
      <AppAlert type="warning">
        <div class="flex-column gap-3xs">
          <strong>Deactivation Warning</strong>
          <span class="text-xs opacity-90 line-12">
            Deactivating an account will prevent the user from logging in. Child records remain untouched and can be
            reactivated later.
          </span>
        </div>
      </AppAlert>
    </div>

    <div v-if="type === 'activate'" class="form-group full-width">
      <AppAlert type="success">
        <div class="flex-column gap-3xs">
          <strong>Account Reactivation</strong>
          <span class="text-xs opacity-90 line-12">
            Reactivating this account will restore the user's ability to log in and manage their children's enrollments
            immediately.
          </span>
        </div>
      </AppAlert>
    </div>

    <div v-if="type === 'delete'" class="form-group full-width">
      <div class="danger-box-standard">
        <div class="danger-icon-large">⚠️</div>
        <div class="danger-content">
          <strong>Critical Permanent Account Deletion</strong>
          <p>
            Deleting an account removes the record entirely. It can never be recovered. This should only be used for
            accidental entries.
          </p>
        </div>
      </div>
      <div class="confirm-label-standard">To confirm, type <strong>DELETE</strong> below:</div>
      <input type="text" v-model="localData.deleteConfirm" class="confirm-input-standard"
        placeholder="TYPE DELETE HERE" />
    </div>

    <div v-if="type === 'reset-password'" class="security-reset-panel">
      <div class="security-intro">
        <h3>Reset Password</h3>
        <p>Choose an option below to help the parent recover their account.</p>
      </div>

      <div class="recovery-options-grid">
        <div class="recovery-card" :class="{ active: selectedResetMode === 'email' }" @click="selectedResetMode = 'email'">
          <div class="recovery-icon-circle blue">
            <img :src="getActionIcon('email')" class="recovery-icon" />
          </div>
          <div class="recovery-content">
            <strong>Send Reset Email</strong>
            <p>Parent receives a secure link to their registered email ({{ selectedParent?.email }}).</p>
          </div>
          <div class="recovery-badge recommendation">Recommended</div>
        </div>

        <div class="recovery-card manual" :class="{ active: selectedResetMode === 'manual' }"
          @click="selectedResetMode = 'manual'">
          <div class="recovery-icon-circle orange">
            <img :src="getActionIcon('edit')" class="recovery-icon" />
          </div>
          <div class="recovery-content">
            <strong>Manual Password Reset</strong>
            <p>Generate a temporary password instantly (requires identity verification).</p>
          </div>
        </div>
      </div>

      <div class="security-warning-box-modern">
        <div class="warning-icon-circle">🛡️</div>
        <div class="warning-text-content">
          <strong>Security Protocol</strong>
          <p>Both methods will require the parent to create their own secure password before they can continue using
            the mobile application.</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex-column flex-end w-full gap-sm">
        <transition name="toast-fade">
          <div v-if="showValidationHint && validationHint" class="validation-hint-toast">
            ⚠️ {{ validationHint }}
          </div>
        </transition>

        <div v-if="error || success" class="w-full">
          <transition name="alert-fade">
            <AppAlert v-if="error" :show="!!error" type="error" closable @close="$emit('update:error', '')">
              {{ error }}
            </AppAlert>
          </transition>

          <transition name="alert-fade">
            <AppAlert v-if="success" :show="!!success" type="success" closable @close="$emit('update:success', '')">
              {{ success }}
            </AppAlert>
          </transition>
        </div>

        <div class="flex-align-center flex-end w-full gap-sm">
          <AppButton variant="cancel" @click="$emit('close')" :disabled="loading || !!success">Cancel</AppButton>
          <AppButton :variant="type === 'delete' || type === 'deactivate' ? 'danger' : 'primary'"
            @click="handleActionSubmit" :loading="loading" :disabled="loading || !!success || isFormInvalid"
            :class="{ 'button-disabled-visual': isFormInvalid || (type === 'edit' && !isChanged) || !!success }">
            {{ submitLabel }}
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, computed, watch, toRef } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AvatarSelector from '@/components/common/ui/AvatarSelector.vue'
import StatusBadge from '@/components/common/ui/StatusBadge.vue'
import { useActionModal } from '@/composables/useActionModal'
import { getActionIcon, getParentProfileURL, isSameProfileAsset } from '@/utils/assetHelper'
import { useSearch, parentSearchMapper } from '@/composables/useSearch'

import { auth } from '@/firebase'
import { sendPasswordResetEmail } from 'firebase/auth'

const selectedResetMode = ref(null)

const props = defineProps({
  isOpen: Boolean,
  type: String,
  user: Object,
  selectableParents: Array,
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit', 'update:error', 'update:success'])

const getInitialData = () => ({
  name: '',
  phone: '',
  email: '',
  role: 'parent',
  status: 'Active',
  profile: '',
  deleteConfirm: '',
  parentId: props.user?.uid || props.user?.id || '',
  dob: '',
  medicalNote: '',
})

const mapSourceToForm = () => {
  const u = props.user || {}
  const base = getInitialData()

  if (props.type === 'register-child' || props.type === 'plus') {
    return {
      ...base,
      parentId: u.uid || u.id || '',
      profile: '',
      medicalNote: '',
    }
  }

  return {
    ...base,
    name: u.name || '',
    phone: u.phone || u.phoneNumber || '',
    email: u.email || '',
    role: u.role || 'parent',
    status: u.status || 'Active',
    profile: u.profileURL,
  }
}

const { localData, originalData, submitForm } = useActionModal(props, emit, {
  getInitialData,
  mapSourceToForm,
})

const isSubmittingAttempted = ref(false)
const showValidationHint = ref(false)
let hintTimeout = null
const errors = ref({})

const validationHint = computed(() => {
  const data = localData.value
  const errs = {}

  if (props.type === 'edit') {
    if (!data.name?.trim()) errs.name = 'Full name is required.'
    if (!data.email?.trim() || !data.email.includes('@')) errs.email = 'Valid email is required.'
    if (!data.phone?.trim()) errs.phone = 'Phone number is required.'
    if (!data.role) errs.role = 'Role is required.'
    if (!data.profile) errs.profile = 'Please select a profile avatar.'
  } else if (props.type === 'register-child' || props.type === 'plus') {
    if (!data.parentId) errs.parentId = 'Please select a parent.'
    if (!data.name?.trim()) errs.name = "Child's name is required."
    if (!data.dob) errs.dob = 'Date of birth is required.'
    if (!data.profile) errs.profile = 'Please select an avatar.'
  } else if (props.type === 'edit' && !isChanged.value) {
    return 'No changes detected to update.'
  } else if (props.type === 'delete') {
    if (data.deleteConfirm !== 'DELETE') return 'Type DELETE to confirm.'
  }

  errors.value = errs
  return Object.values(errs)[0] || ''
})

const isFormInvalid = computed(() => {
  if (props.type === 'delete') return localData.value.deleteConfirm !== 'DELETE'
  if (props.type === 'deactivate' || props.type === 'activate') return false
  if (props.type === 'reset-password') return !selectedResetMode.value
  return !!validationHint.value
})



const isChanged = computed(() => {
  if (props.type !== 'edit') return true

  // Custom equality check to handle tokens in profile URLs
  const d = localData.value
  const o = originalData.value

  const hasProfileChanged = !isSameProfileAsset(d.profile, o.profile)
  const hasNameChanged = d.name !== o.name
  const hasEmailChanged = d.email !== o.email
  const hasPhoneChanged = d.phone !== o.phone
  const hasRoleChanged = d.role !== o.role
  const hasStatusChanged = d.status !== o.status

  return hasProfileChanged || hasNameChanged || hasEmailChanged || hasPhoneChanged || hasRoleChanged || hasStatusChanged
})

const handleActionSubmit = () => {
  isSubmittingAttempted.value = true

  if (props.type === 'reset-password') {
    if (!selectedResetMode.value) return
    if (selectedResetMode.value === 'email') {
      handleSendResetEmail()
    } else {
      submitForm(true)
    }
    return
  }

  const isActuallyInvalid = isFormInvalid.value || (props.type === 'edit' && !isChanged.value)

  if (isActuallyInvalid) {
    showValidationHint.value = true
    if (hintTimeout) clearTimeout(hintTimeout)
    hintTimeout = setTimeout(() => {
      showValidationHint.value = false
    }, 3000)
    return
  }

  submitForm(true)
}

const handleSendResetEmail = async () => {
  if (!selectedParent.value?.email) return

  submittingLocal.value = true
  try {
    await sendPasswordResetEmail(auth, selectedParent.value.email)
    emit('submit', { type: 'reset-email-sent' }) // Parent component can show success
  } catch (err) {
    console.error('Failed to send reset email:', err)
  } finally {
    submittingLocal.value = false
  }
}

const submittingLocal = ref(false)

const parentTheme = computed(() => {
  const p = props.user || selectedParent.value
  if (!p) return 'theme-default'
  const url = (p.profile || '').toLowerCase()
  if (url.includes('woman') || url.includes('girl')) return 'theme-pink'
  if (url.includes('man') || url.includes('boy')) return 'theme-blue'
  return 'theme-default'
})

const modalTitle = computed(() => {
  const titles = {
    edit: 'Edit Parent Profile',
    deactivate: 'Deactivate Account',
    activate: 'Reactivate Account',
    delete: 'Delete Account',
    plus: 'Register New Child',
    'reset-password': 'Reset Password'
  }
  return titles[props.type] || 'Action Modal'
})

const submitLabel = computed(() => {
  if (props.type === 'plus') return 'Register Child'
  if (props.type === 'deactivate') return 'Deactivate'
  if (props.type === 'activate') return 'Reactivate'
  if (props.type === 'edit') return 'Update Profile'
  if (props.type === 'delete') return 'Permanently Delete'
  if (props.type === 'reset-password') return 'Confirm Reset'
  return 'Confirm Action'
})

const isDropdownOpen = ref(false)
const parentSearchQuery = ref('')
const dropdownStyles = ref({ top: '0px', left: '0px', minWidth: '0px' })

const activeParents = computed(() => {
  return (props.selectableParents || []).filter(p => {
    const s = (p.status || 'Active').toLowerCase().trim()
    return s === 'active'
  })
})

const { searchResults: filteredParents } = useSearch(
  activeParents,
  parentSearchMapper,
  parentSearchQuery
)

const selectedParent = computed(() => {
  if (!localData.value.parentId) return null
  if (props.user && (props.user.uid === localData.value.parentId || props.user.id === localData.value.parentId)) return props.user
  return props.selectableParents?.find(p => (p.uid || p.id) === localData.value.parentId)
})

const selectParent = (p) => {
  localData.value.parentId = p.uid || p.id
  isDropdownOpen.value = false
  parentSearchQuery.value = ''
}

const togglePreset = (field, chipValue) => {
  const currentText = localData.value[field] || ''
  let values = currentText.split(',').map(v => v.trim()).filter(Boolean)
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

const isPresetActive = (field, chipValue) => {
  return (localData.value[field] || '').split(',').map(v => v.trim()).includes(chipValue)
}

watch(() => props.isOpen, (newVal) => {
  if (!newVal) {
    isDropdownOpen.value = false
    isSubmittingAttempted.value = false
    showValidationHint.value = false
    submittingLocal.value = false
    selectedResetMode.value = null
  }
})
</script>

<style scoped>
.security-reset-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  padding: var(--space-sm) 0;
}

.security-intro h3 {
  font-size: var(--text-lg);
  color: var(--text-dark);
  margin-bottom: 4px;
}

.security-intro p {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.recovery-options-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.recovery-card {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg);
  background: var(--white);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.recovery-card:hover {
  border-color: var(--primary-color);
  background: var(--bg-subtle);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.recovery-card.active {
  border-color: var(--primary-color);
  background: var(--info-soft);
  box-shadow: 0 4px 15px rgba(0, 174, 239, 0.1);
}

.recovery-card.manual:hover {
  border-color: var(--accent-color);
}

.recovery-icon-circle {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.recovery-icon-circle.blue {
  background: var(--info-soft);
}

.recovery-icon-circle.orange {
  background: var(--warning-soft);
}

.recovery-icon {
  width: 24px;
  height: 24px;
}

.recovery-content strong {
  display: block;
  font-size: var(--text-base);
  color: var(--text-dark);
  margin-bottom: 2px;
}

.recovery-content p {
  font-size: var(--text-xs);
  color: var(--text-muted);
  line-height: 1.4;
  margin: 0;
}

.recovery-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 10px;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 20px;
  text-transform: uppercase;
}

.recovery-badge.recommendation {
  background: var(--success-soft);
  color: var(--success-color);
}

.security-warning-box-modern {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-lg);
  background: var(--warning-soft);
  border-radius: var(--border-radius);
  border: 1px solid var(--warning-light);
  border-left: 5px solid var(--warning-color);
  box-shadow: 0 4px 10px rgba(245, 158, 11, 0.05);
}

.warning-icon-circle {
  width: 32px;
  height: 32px;
  background: var(--white);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  font-size: var(--text-base);
}

.warning-text-content strong {
  display: block;
  font-size: var(--text-sm);
  color: var(--text-dark);
  margin-bottom: 2px;
}

.warning-text-content p {
  font-size: var(--text-xs);
  color: var(--text-muted);
  line-height: 1.5;
  margin: 0;
}

.validation-hint-toast {
  font-size: var(--text-xs);
  color: var(--error-color);
  background: var(--error-soft);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--border-radius-sm);
  border: 1px solid var(--error-soft);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  max-width: fit-content;
  z-index: 10;
  animation: shake 0.4s cubic-bezier(.36, .07, .19, .97) both;
}

@keyframes shake {

  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }

  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }

  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }

  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.danger-box-standard {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  background: var(--error-soft);
  border: 1px solid var(--error-soft);
  padding: var(--space-xl);
  border-radius: var(--border-radius);
  margin-bottom: var(--space-xl);
}

.danger-icon-large {
  font-size: 2rem;
}

.danger-content strong {
  display: block;
  color: var(--error-deep);
  margin-bottom: 4px;
  font-size: var(--text-base);
}

.danger-content p {
  font-size: var(--text-sm);
  color: var(--error-deep);
  line-height: 1.4;
  margin: 0;
  opacity: 0.8;
}

.confirm-label-standard {
  font-size: var(--text-sm);
  color: var(--text-dark);
  margin-bottom: var(--space-md);
  text-align: center;
}

.confirm-input-standard {
  width: 100%;
  padding: var(--space-md);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  text-align: center;
  font-weight: 700;
  letter-spacing: 2px;
  transition: all 0.25s;
  background: var(--bg-subtle);
  font-family: inherit;
}

.confirm-input-standard:focus {
  border-color: var(--error-color);
  outline: none;
  background: var(--white);
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
}

.parent-identity-panel {
  padding: var(--space-xl) var(--space-2xl);
  border-radius: var(--border-radius);
  margin-bottom: var(--space-xl);
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
}

.parent-identity-panel::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100px;
  background: linear-gradient(to left, rgba(255, 255, 255, 0.2), transparent);
  pointer-events: none;
}

.parent-info-content {
  display: flex;
  align-items: center;
  gap: var(--space-xl);
  z-index: 1;
}

.parent-avatar-wrapper {
  width: 64px;
  height: 64px;
  border-radius: var(--border-radius);
  overflow: hidden;
  border: 3px solid var(--white);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  background: var(--white);
  flex-shrink: 0;
}

.parent-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.parent-details {
  display: flex;
  flex-direction: column;
}

.parent-role-tag {
  font-size: var(--text-3xs);
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
  padding: 4px 10px;
  background: var(--white);
  border-radius: var(--border-radius-sm);
  width: fit-content;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.parent-name {
  font-size: var(--text-2xl);
  font-weight: 850;
  color: var(--text-dark);
  letter-spacing: -0.5px;
  line-height: 1.1;
}

.parent-email-sub {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin-top: 2px;
  font-weight: 500;
}

/* Theme Color logic */
.theme-blue {
  background: linear-gradient(135deg, var(--info-soft) 0%, var(--primary-soft) 100%);
  border-color: var(--primary-light);
}

.theme-blue .parent-role-tag {
  color: var(--info-color);
}

.theme-pink {
  background: linear-gradient(135deg, var(--magenta-soft) 0%, var(--magenta-soft) 100%);
  filter: brightness(1.05);
  /* Lighter version */
  border-color: var(--magenta-soft);
}

.theme-pink .parent-role-tag {
  color: var(--magenta-color);
}

.theme-default {
  background: linear-gradient(135deg, var(--bg-subtle) 0%, var(--bg-light) 100%);
  border-color: var(--border-color);
}

.theme-default .parent-role-tag {
  color: var(--text-muted);
}

.avatar-guidance {
  font-size: var(--text-3xs);
  color: var(--text-light);
  margin-top: 6px;
  font-style: italic;
  display: block;
}

.required {
  color: var(--error-color);
  margin-left: 2px;
  font-weight: bold;
}
</style>
