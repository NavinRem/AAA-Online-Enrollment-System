<template>
  <AppModal :show="isOpen" :title="modalTitle" variant="action" @close="$emit('close')" :icon="getActionIcon(type)">
    <!-- Identity Card for Parent Actions (Show only for non-edit actions) -->
    <div v-if="(user || (type === 'register-child' && selectedParent)) && type !== 'edit'" class="parent-identity-panel"
      :class="parentTheme">
      <div class="parent-info-content">
        <div class="parent-avatar-wrapper">
          <img :src="(user || selectedParent).profileURL || (user || selectedParent).profile" class="parent-avatar-img" />
        </div>
        <div class="parent-details">
          <span class="parent-role-tag">{{ (user || selectedParent).role || 'parent' }}</span>
          <strong class="parent-name">{{ (user || selectedParent).name || (user || selectedParent).email }}</strong>
          <span class="parent-email-sub" v-if="(user || selectedParent).name">{{ (user || selectedParent).email
            }}</span>
        </div>
      </div>
    </div>

    <!-- Edit Parent Form -->
    <div v-if="type === 'edit'" class="form-grid">
      <div class="form-group full-width">
        <label>Full Name <span class="required">*</span></label>
        <span class="original-value" v-if="originalData.name">Original: {{ originalData.name }}</span>
        <input type="text" v-model="localData.name" placeholder="Enter full name" class="standard-input"
          :class="{ 'field-error': isSubmittingAttempted && errors.name }" />
        <div v-if="isSubmittingAttempted && errors.name" class="field-error-msg">{{ errors.name }}</div>
      </div>

      <div class="form-group">
        <label>Email Address <span class="required">*</span></label>
        <span class="original-value" v-if="originalData.email">Original: {{ originalData.email }}</span>
        <input type="email" v-model="localData.email" placeholder="email@example.com" class="standard-input"
          :class="{ 'field-error': isSubmittingAttempted && errors.email }" />
        <div v-if="isSubmittingAttempted && errors.email" class="field-error-msg">{{ errors.email }}</div>
      </div>

      <div class="form-group">
        <label>Phone Number <span class="required">*</span></label>
        <span class="original-value" v-if="originalData.phone">Original: {{ originalData.phone }}</span>
        <input type="tel" v-model="localData.phone" placeholder="Enter phone number" class="standard-input"
          :class="{ 'field-error': isSubmittingAttempted && errors.phone }" />
        <div v-if="isSubmittingAttempted && errors.phone" class="field-error-msg">{{ errors.phone }}</div>
      </div>

      <div class="form-group">
        <label>Role <span class="required">*</span></label>
        <span class="original-value" v-if="originalData.role">Original: {{ originalData.role }}</span>
        <select v-model="localData.role" class="standard-input"
          :class="{ 'field-error': isSubmittingAttempted && errors.role }">
          <option value="parent">Parent</option>
          <option value="guardian">Guardian</option>
        </select>
        <div v-if="isSubmittingAttempted && errors.role" class="field-error-msg">{{ errors.role }}</div>
      </div>

      <div class="form-group full-width">
        <label>Profile Avatar <span class="required">*</span></label>
        <AvatarSelector v-model="localData.profile" :role="localData.role" :uid="user?.uid || user?.id"
          :customFileName="`${localData.name}_${localData.role}`" />
        <p class="avatar-guidance">Only .jpg, .png, and .webp images are accepted.</p>
        <div v-if="isSubmittingAttempted && errors.profile" class="field-error-msg">{{ errors.profile }}</div>
      </div>
    </div>

    <!-- Register Child Form -->
    <div v-if="type === 'register-child'" class="form-grid">
      <!-- Parent Selection (Hide if parent already pre-selected from table) -->
      <div class="form-group full-width" v-if="!user && selectableParents && selectableParents.length > 0">
        <label>Select Parent / Guardian <span class="required">*</span></label>
        <div class="custom-dropdown-container">
          <div class="custom-dropdown" :class="{ open: isDropdownOpen }">
            <div class="dropdown-header" @click="isDropdownOpen = !isDropdownOpen">
              <template v-if="selectedParent">
                <div class="selected-parent">
                  <img :src="selectedParent.profileURL || getParentProfileURL(selectedParent.profile)" class="avatar-mini-sm" />
                  <span>{{ selectedParent.name || selectedParent.email }}</span>
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
                      <span class="item-name">{{ p.name || p.email }}</span>
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

      <div class="form-group full-width">
        <label>Child Profile Avatar <span class="required">*</span></label>
        <AvatarSelector v-model="localData.profile" role="student" :customFileName="`${localData.name}_student`" />
        <p class="avatar-guidance">Only .jpg, .png, and .webp images are accepted.</p>
        <div v-if="isSubmittingAttempted && errors.profile" class="field-error-msg">{{ errors.profile }}</div>
      </div>

      <div class="form-group full-width">
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

    <!-- Activation/Deactivation Alerts -->
    <div v-if="type === 'deactivate'" class="form-group full-width">
      <AppAlert type="warning">
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <strong>Deactivation Warning</strong>
          <span style="font-size: 0.85rem; opacity: 0.9; line-height: 1.2;">
            Deactivating an account will prevent the user from logging in. Child records remain untouched and can be
            reactivated later.
          </span>
        </div>
      </AppAlert>
    </div>

    <div v-if="type === 'activate'" class="form-group full-width">
      <AppAlert type="success">
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <strong>Account Reactivation</strong>
          <span style="font-size: 0.85rem; opacity: 0.9; line-height: 1.2;">
            Reactivating this account will restore the user's ability to log in and manage their children's enrollments
            immediately.
          </span>
        </div>
      </AppAlert>
    </div>

    <!-- Delete Confirmation -->
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

    <template #footer>
      <div style="display: flex; flex-direction: column; align-items: flex-end; width: 100%; gap: 12px;">
        <transition name="toast-fade">
          <div v-if="showValidationHint && validationHint" class="validation-hint-toast">
            ⚠️ {{ validationHint }}
          </div>
        </transition>

        <div v-if="error || success" style="width: 100%;">
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

        <div style="display: flex; gap: 12px; justify-content: flex-end; width: 100%;">
          <AppButton variant="cancel" @click="$emit('close')" :disabled="loading || !!success">Cancel</AppButton>
          <AppButton :variant="type === 'delete' || type === 'deactivate' ? 'danger' : 'primary'"
            @click="handleActionSubmit" :loading="loading" :disabled="loading || !!success"
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
import { useActionModal } from '@/composables/useActionModal'
import { getActionIcon, getParentProfileURL, isSameProfileAsset } from '@/utils/assetHelper'
import { useSearch, parentSearchMapper } from '@/composables/useSearch'

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
  // Child fields
  parentId: props.user?.uid || props.user?.id || '',
  name: '',
  dob: '',
  profile: '', // Force selection
  medicalNote: '',
})

const mapSourceToForm = () => {
  const u = props.user || {}
  const base = getInitialData()

  if (props.type === 'register-child') {
    return {
      ...base,
      parentId: u.uid || u.id || '',
      profile: 'boy',
    }
  }

  return {
    ...base,
    name: u.name || '',
    phone: u.phone || u.phoneNumber || '',
    email: u.email || '',
    role: u.role || 'parent',
    status: u.status || 'Active',
    profile: u.profile || 'man',
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
  } else if (props.type === 'register-child') {
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
    'register-child': 'Register New Child'
  }
  return titles[props.type] || 'Action Modal'
})

const submitLabel = computed(() => {
  if (props.type === 'register-child') return 'Register Child'
  if (props.type === 'deactivate') return 'Deactivate'
  if (props.type === 'activate') return 'Reactivate'
  if (props.type === 'edit') return 'Update Profile'
  if (props.type === 'delete') return 'Permanently Delete'
  return 'Confirm Action'
})

// Child Registration Helpers (Presets & Dropdown)
const isDropdownOpen = ref(false)
const parentSearchQuery = ref('')
const dropdownStyles = ref({ top: '0px', left: '0px', minWidth: '0px' })

const { searchResults: filteredParents } = useSearch(
  toRef(props, 'selectableParents'),
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

// Reset Dropdown and attempt flag on close
watch(() => props.isOpen, (newVal) => {
  if (!newVal) {
    isDropdownOpen.value = false
    isSubmittingAttempted.value = false
    showValidationHint.value = false
  }
})
</script>

<style scoped>
.validation-hint-toast {
  font-size: 0.8rem;
  color: #ef4444;
  background: #fef2f2;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #fee2e2;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  max-width: fit-content;
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
  gap: 16px;
  background: #fef2f2;
  border: 1px solid #fee2e2;
  padding: 20px;
  border-radius: 16px;
  margin-bottom: 24px;
}

.danger-icon-large {
  font-size: 2rem;
}

.danger-content strong {
  display: block;
  color: #991b1b;
  margin-bottom: 4px;
  font-size: 1rem;
}

.danger-content p {
  font-size: 0.85rem;
  color: #b91c1c;
  line-height: 1.4;
  margin: 0;
  opacity: 0.8;
}

.confirm-label-standard {
  font-size: 0.9rem;
  color: #475569;
  margin-bottom: 12px;
  text-align: center;
}

.confirm-input-standard {
  width: 100%;
  padding: 14px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  text-align: center;
  font-weight: 700;
  letter-spacing: 2px;
  transition: all 0.25s;
  background: var(--bg-subtle);
  font-family: inherit;
}

.confirm-input-standard:focus {
  border-color: #ef4444;
  outline: none;
  background: white;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
}

.parent-identity-panel {
  padding: 20px 24px;
  border-radius: 20px;
  margin-bottom: 24px;
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
  gap: 20px;
  z-index: 1;
}

.parent-avatar-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  overflow: hidden;
  border: 3px solid white;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  background: #fff;
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
  font-size: 0.65rem;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
  padding: 4px 10px;
  background: white;
  border-radius: 8px;
  width: fit-content;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.parent-name {
  font-size: 1.35rem;
  font-weight: 850;
  color: #1e293b;
  letter-spacing: -0.5px;
  line-height: 1.1;
}

.parent-email-sub {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 2px;
  font-weight: 500;
}

/* Theme Color logic */
.theme-blue {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-color: #bae6fd;
}

.theme-blue .parent-role-tag {
  color: #0284c7;
}

.theme-pink {
  background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
  border-color: #fbcfe8;
}

.theme-pink .parent-role-tag {
  color: #db2777;
}

.theme-default {
  background: linear-gradient(135deg, var(--bg-subtle) 0%, #f1f5f9 100%);
  border-color: #e2e8f0;
}

.theme-default .parent-role-tag {
  color: #64748b;
}

.avatar-guidance {
  font-size: 0.72rem;
  color: #94a3b8;
  margin-top: 6px;
  font-style: italic;
  display: block;
}

.required {
  color: #ef4444;
  margin-left: 2px;
  font-weight: bold;
}
</style>
