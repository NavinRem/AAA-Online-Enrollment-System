<script setup>
import { ref, computed, watch } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AvatarSelector from '@/components/common/ui/AvatarSelector.vue'
import AppConfirmOverlay from '@/components/common/ui/AppConfirmOverlay.vue'
import { useActionModal } from '@/composables/useActionModal'
import { getActionIcon, getImageUrl } from '@/utils/assetHelper'
import { useSearch, parentSearchMapper } from '@/composables/useSearch'

import { auth } from '@/firebase'
import { sendPasswordResetEmail } from 'firebase/auth'
import { useDataStore } from '@/stores/dataStore'
import { parentService } from '@/services/parentService'
import { processParentProfileImage, prepareParentPayload } from '@/utils/parentHelper'

const selectedResetMode = ref(null)
const dataStore = useDataStore()
const showNewParentSubModal = ref(false)
const subModalLoading = ref(false)
const subModalError = ref('')
const subModalSuccess = ref('')

const props = defineProps({
  isOpen: Boolean,
  type: String, // 'edit', 'deactivate', 'activate', 'delete', 'plus', 'reset-password'
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
  profileURL: '',
  deleteConfirm: '',
  parentId: props.user?.id,
  dob: '',
})

const mapSourceToForm = () => {
  const u = props.user || {}
  const base = getInitialData()

  if (props.type === 'plus') {
    return {
      ...base,
      parentId: u.id,
      profileURL: '',
    }
  }

  if (props.type === 'add') {
    return {
      ...base,
      profileURL: '',
    }
  }

  return {
    ...base,
    name: u.name || '',
    phone: u.phone || '',
    email: u.email || '',
    role: u.role || '',
    status: u.status || '',
    profileURL: u.profileURL || '',
  }
}

const { localData, isDirty, errors, shaking, clearError, validate, triggerShake, getPayload } = useActionModal(
  props,
  emit,
  {
    getInitialData,
    mapSourceToForm,
    autoClear: 3000,
  },
)

const showConfirm = ref(false)

const requestConfirm = () => {
  validationMessage.value = ''
  if (props.type === 'reset-password') {
    if (!selectedResetMode.value) {
      validationMessage.value = 'Please select a reset method.'
      setTimeout(() => {
        validationMessage.value = ''
      }, 3000)
      errors.resetMode = 'Selection required'
      triggerShake('resetMode')
      return
    }
    showConfirm.value = true
    return
  }

  const rules = {
    required: [],
    custom: {},
  }

  if (props.type === 'edit') {
    if (!isDirty.value) return
    rules.required = ['name', 'phone', 'profileURL']
    rules.custom.email = (val) => (!!val?.trim() && val.includes('@')) || 'Valid email required'
  } else if (props.type === 'add') {
    rules.required = ['name', 'email', 'phone', 'profileURL']
    rules.custom.email = (val) => (!val?.includes('@') ? 'Valid email is required.' : null)
  } else if (props.type === 'plus') {
    rules.required = ['name', 'dob', 'profileURL']
    if (!props.user) rules.required.push('parentId')
  } else if (props.type === 'delete') {
    rules.custom.deleteConfirm = (val) => val === 'DELETE' || 'Authorization string invalid'
  }

  if (!validate(rules)) {
    validationMessage.value =
      props.type === 'delete'
        ? 'Please type DELETE to confirm.'
        : 'Please fill out all required fields to proceed.'
    setTimeout(() => {
      validationMessage.value = ''
    }, 3000)
    return
  }
  showConfirm.value = true
}

const handleActionSubmit = () => {
  if (props.loading) return // Prevent double-submit
  showConfirm.value = false
  if (props.type === 'reset-password') {
    if (selectedResetMode.value === 'email') {
      handleSendResetEmail()
    } else {
      emit('submit', { type: 'manual' })
    }
    return
  }

  const payload = getPayload()

  // Fix: Mapping profileURL to profile for registration handler
  if (props.type === 'plus') {
    payload.profile = payload.profileURL
  }

  if (props.type === 'edit') {
    delete payload.parentId
  }

  emit('submit', payload)
}

const confirmRows = computed(() => {
  const p = selectedParent.value

  if (props.type === 'plus') {
    const rows = [{ key: 'ParentId', value: p?.id || 'N/A' }]
    rows.push({ key: 'Name', value: localData.name })
    rows.push({ key: 'Dob', value: localData.dob })
    rows.push({ key: 'Status', value: localData.status || 'Inactive', badge: true })
    return rows
  }

  const rows = [{ key: 'Name', value: localData.name || p?.name || 'N/A' }]

  if (props.type === 'edit') {
    rows.push({ key: 'Email', value: localData.email })
    rows.push({ key: 'Phone', value: localData.phone })
    rows.push({ key: 'Status', value: localData.status, badge: true })
  } else if (props.type === 'add') {
    rows.push({ key: 'Email', value: localData.email })
    rows.push({ key: 'Phone', value: localData.phone })
  } else if (props.type === 'delete') {
    rows.push({ key: 'Email', value: localData.email })
    rows.push({
      key: 'DeleteConfirm',
      value: localData.deleteConfirm,
      valueClass: 'text-error font-bold',
    })
  } else if (props.type === 'reset-password') {
    rows.push({
      key: 'ResetMode',
      value: selectedResetMode.value === 'email' ? 'Email Link' : 'Manual Override',
      valueClass: 'font-bold text-primary',
    })
  }

  return rows
})

const handleSendResetEmail = async () => {
  if (!selectedParent.value?.email) return
  submittingLocal.value = true
  try {
    await sendPasswordResetEmail(auth, selectedParent.value.email)
    emit('submit', { type: 'reset-email-sent' })
  } catch (err) {
    console.error('Failed to send reset email:', err)
  } finally {
    submittingLocal.value = false
  }
}

const handleInlineParentSubmit = async (data) => {
  subModalLoading.value = true
  subModalError.value = ''
  subModalSuccess.value = ''

  try {
    const profileURL = await processParentProfileImage(data.profileURL, data.name)
    const payload = prepareParentPayload({ ...data, profileURL })
    const result = await parentService.createParent(payload)

    const newParent = {
      id: result.id,
      ...payload,
      createdAt: new Date().toISOString(),
      childrenInfo: [],
    }

    // Update global store
    dataStore.parents.unshift(newParent)

    // Auto-select in dropdown
    localData.parentId = result.id

    subModalSuccess.value = 'Parent created successfully!'
    setTimeout(() => {
      showNewParentSubModal.value = false
      subModalSuccess.value = ''
    }, 1500)
  } catch (error) {
    console.error('Failed to create parent inline:', error)
    subModalError.value = error.message || 'Failed to create parent'
  } finally {
    subModalLoading.value = false
  }
}

const submittingLocal = ref(false)

const parentThemeClasses = computed(() => {
  const p = props.user || selectedParent.value
  if (!p) return 'bg-gradient-to-br from-bg-subtle to-bg-light border-outline-std'
  const url = (p.profileURL || '').toLowerCase()
  if (url.includes('woman') || url.includes('girl'))
    return 'bg-gradient-to-br from-magenta-soft/80 to-magenta-soft/30 border-magenta-soft'
  if (url.includes('man') || url.includes('boy'))
    return 'bg-gradient-to-br from-info-soft to-primary-soft border-primary-light'
  return 'bg-gradient-to-br from-bg-subtle to-bg-light border-outline-std'
})

const modalTitle = computed(() => {
  const titles = {
    add: 'Add Parent',
    edit: 'Edit Parent',
    deactivate: 'Deactivate Parent',
    activate: 'Activate Parent',
    delete: 'Delete Parent',
    plus: 'Add Child',
    'reset-password': 'Reset Password',
  }
  return titles[props.type] || 'Parent Action'
})

const submitLabel = computed(() => {
  if (props.type === 'add') return 'Add'
  if (props.type === 'plus') return 'Add'
  if (props.type === 'deactivate') return 'Update'
  if (props.type === 'activate') return 'Update'
  if (props.type === 'edit') return 'Update'
  if (props.type === 'delete') return 'Delete'
  if (props.type === 'reset-password') return 'Reset'
  return 'Confirm'
})

const validationMessage = ref('')
const isFormInvalid = computed(() => {
  if (props.type === 'reset-password') return !selectedResetMode.value
  if (props.type === 'edit')
    return !localData.name || !localData.phone || !localData.profileURL || !localData.email
  if (props.type === 'add')
    return !localData.name || !localData.email || !localData.phone || !localData.profileURL
  if (props.type === 'plus') {
    if (!localData.name || !localData.dob || !localData.profileURL) return true
    if (!props.user && !localData.parentId) return true
  }
  if (props.type === 'delete') return !localData.deleteConfirm
  return false
})

const activeParents = computed(() => {
  return (props.selectableParents || []).filter((p) => {
    const s = (p.status || 'Active').toLowerCase().trim()
    return s === 'active'
  })
})

const { searchResults: filteredParents } = useSearch(activeParents, parentSearchMapper, ref(''))

const selectedParent = computed(() => {
  if (!localData.parentId) return null
  if (props.user && String(props.user.id) === String(localData.parentId)) return props.user
  return props.selectableParents?.find((p) => String(p.id) === String(localData.parentId))
})

const handleDisabledClick = (field) => {
  if (field === 'childInfo' && !props.user && !localData.parentId) {
    validationMessage.value = 'Please link to a parent record first'
    setTimeout(() => {
      validationMessage.value = ''
    }, 3000)
    errors.parentId = 'Please link to a parent record first'
    triggerShake('parentId')
  }
}

watch(
  () => props.isOpen,
  (newVal) => {
    if (!newVal) {
      submittingLocal.value = false
      selectedResetMode.value = null
    }
  },
)
</script>

<template>
  <AppModal
    :show="isOpen"
    :title="modalTitle"
    variant="action"
    @close="$emit('close')"
    :icon="getActionIcon(type)"
    :error="error"
    :success="success"
  >
    <!-- Identity Banner (Standardized for Edit/Delete/Plus) -->
    <div v-if="selectedParent" class="ui-identity-banner mb-lg" :class="parentThemeClasses">
      <div class="ui-identity-avatar-round">
        <img
          :src="selectedParent.profileURL || getImageUrl('profiles', 'avatar-guest')"
          class="w-full h-full object-cover"
        />
      </div>
      <div class="ui-identity-info">
        <h2 class="ui-identity-name-compact">
          {{ selectedParent.name }}
        </h2>
        <div class="ui-identity-meta-compact">
          <span class="text-sm font-bold text-content-muted" v-if="selectedParent.email">{{
            selectedParent.email
          }}</span>
          <span class="opacity-30" v-if="selectedParent.email && selectedParent.phone">•</span>
          <span class="text-sm font-bold text-content-muted" v-if="selectedParent.phone">{{
            selectedParent.phone
          }}</span>
        </div>
      </div>
    </div>

    <form id="parentActionForm" @submit.prevent="requestConfirm" novalidate>
      <!-- Edit Parent Form -->
      <div v-if="type === 'edit' || type === 'add'" class="ui-form-grid">
        <AppInput
          v-model="localData.name"
          label="Full Name"
          placeholder="Full Name"
          required
          :error="errors.name"
          :shake="shaking.name"
          @input="clearError('name')"
        />

        <AppInput
          v-model="localData.email"
          type="email"
          label="Account Email"
          placeholder="email@address.com"
          required
          :error="errors.email"
          :shake="shaking.email"
          @input="clearError('email')"
        />

        <AppInput
          v-model="localData.phone"
          label="Contact Phone"
          placeholder="Active phone line"
          required
          :error="errors.phone"
          :shake="shaking.phone"
          @input="clearError('phone')"
        />

        <AvatarSelector
          v-model="localData.profileURL"
          label="Avatar Signature"
          required
          :role="localData.role"
          :uid="user?.id"
          :customFileName="`${localData.name}_${localData.role}`"
          :error="errors.profileURL"
          :shake="shaking.profileURL"
          @update:modelValue="clearError('profileURL')"
        />
      </div>

      <!-- Register Child Form -->
      <div v-if="type === 'plus'" class="flex flex-col gap-lg">
        <AppSelect
          v-if="!user && selectableParents && selectableParents.length > 0"
          v-model="localData.parentId"
          :items="
            filteredParents.map((p) => ({ id: p.id, name: p.name, profileURL: p.profileURL }))
          "
          label="Link to Parent Registry"
          placeholder="Search Parent"
          required
          :error="errors.parentId"
          :shake="shaking.parentId"
          @change="clearError('parentId')"
        />

        <div v-if="!user && type === 'plus'" class="flex justify-end -mt-3 mb-2">
          <button
            type="button"
            @click="showNewParentSubModal = true"
            class="text-xs font-bold text-primary hover:text-primary-deep transition-colors flex items-center gap-1 group"
          >
            New Parent Registry
          </button>
        </div>

        <div class="ui-form-grid">
          <AppInput
            v-model="localData.name"
            label="Student Full Name"
            placeholder="Enter Student Name"
            required
            :disabled="!user && !localData.parentId"
            :error="errors.name"
            :shake="shaking.name"
            @input="clearError('name')"
            @click-disabled="handleDisabledClick('childInfo')"
          />

          <AppInput
            v-model="localData.dob"
            type="date"
            label="Student Birthday"
            required
            :disabled="!user && !localData.parentId"
            :error="errors.dob"
            :shake="shaking.dob"
            @input="clearError('dob')"
            @click-disabled="handleDisabledClick('childInfo')"
          />

          <AvatarSelector
            v-model="localData.profileURL"
            label="Student Avatar"
            required
            role="student"
            :customFileName="`${localData.name}_student` || ''"
            :disabled="!user && !localData.parentId"
            :error="errors.profileURL"
            :shake="shaking.profileURL"
            @update:modelValue="clearError('profileURL')"
            @click-disabled="handleDisabledClick('childInfo')"
          />
        </div>
      </div>
    </form>

    <!-- Account Lifecycle Views -->
    <div v-if="type === 'deactivate'" class="flex flex-col gap-lg">
      <AppAlert type="warning">
        <div class="flex flex-col gap-0.5">
          <strong class="text-sm font-semibold tracking-tight">Suspension Protocol</strong>
          <span class="text-xs opacity-90 font-medium"
            >Deactivating this account will revoke system access for the parent immediately. All
            linked student data remained archived for future reactivation.</span
          >
        </div>
      </AppAlert>
    </div>

    <div v-if="type === 'activate'" class="flex flex-col gap-lg">
      <AppAlert type="success">
        <div class="flex flex-col gap-0.5">
          <strong class="text-sm font-semibold tracking-tight">Reactivation Clearance</strong>
          <span class="text-xs opacity-90 font-medium"
            >System access will be restored across all devices immediately. The parent will be able
            to manage active enrollments and billing.</span
          >
        </div>
      </AppAlert>
    </div>

    <div v-if="type === 'delete'" class="flex flex-col gap-lg">
      <AppAlert type="error">
        <div class="flex flex-col gap-0.5">
          <strong class="text-sm font-semibold tracking-tight">⚠ Permanent Account Deletion</strong>
          <span class="text-xs opacity-90 font-medium leading-relaxed"
            >This action will permanently erase the parent profile and all linked student relations.
            Historical billing data will be severed.</span
          >
        </div>
      </AppAlert>

      <AppInput
        v-model="localData.deleteConfirm"
        label="Authorization Confirmation"
        placeholder="DELETE"
        required
        :error="errors.deleteConfirm"
        :shake="shaking.deleteConfirm"
        @input="clearError('deleteConfirm')"
      >
        <template #label-extra>
          <span class="block text-2xs font-semibold mt-0.5">
            Type <span class="text-error px-1 font-bold">DELETE</span> to authorize this permanent
            action
          </span>
        </template>
      </AppInput>
    </div>

    <!-- Password Management View -->
    <div v-if="type === 'reset-password'" class="flex flex-col gap-lg">
      <div class="bg-surface-subtle/50 p-md rounded-sm border border-outline-std/30">
        <h3 class="text-3xs font-semibold mb-1 text-content-dark">Recovery Logic Selection</h3>
        <p class="text-3xs text-content-muted font-bold opacity-60 italic">
          Choose a secure protocol for account restoration.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-md" :class="{ 'animate-shake': shaking.resetMode }">
        <div
          class="parent-reset-card group"
          :class="
            selectedResetMode === 'email'
              ? 'parent-reset-card--email-active'
              : 'parent-reset-card--inactive'
          "
          @click="selectedResetMode = 'email'"
        >
          <div class="parent-reset-icon parent-reset-icon--email">
            <img :src="getActionIcon('email')" class="w-5 h-5 opacity-80" />
          </div>
          <div class="parent-reset-info">
            <strong class="parent-reset-title">Automated Link</strong>
            <p class="parent-reset-sub">Send link to registered email address.</p>
          </div>
          <div
            v-if="selectedResetMode === 'email'"
            class="absolute -top-1 -right-1 w-6 h-6 bg-primary text-white flex items-center justify-center text-xs font-semibold border-2 border-white rounded-full"
          >
            ✓
          </div>
        </div>

        <div
          class="parent-reset-card group"
          :class="
            selectedResetMode === 'manual'
              ? 'parent-reset-card--manual-active'
              : 'parent-reset-card--inactive'
          "
          @click="selectedResetMode = 'manual'"
        >
          <div class="parent-reset-icon parent-reset-icon--manual">
            <img :src="getActionIcon('edit')" class="w-5 h-5 opacity-80" />
          </div>
          <div class="parent-reset-info">
            <strong class="parent-reset-title">Administrative Override</strong>
            <p class="parent-reset-sub">Initialize with temporary credentials.</p>
          </div>
          <div
            v-if="selectedResetMode === 'manual'"
            class="absolute -top-1 -right-1 w-6 h-6 bg-warning text-white flex items-center justify-center text-xs font-semibold border-2 border-white rounded-full"
          >
            ✓
          </div>
        </div>
      </div>

      <AppAlert type="info">
        <div class="flex flex-col gap-0.5">
          <strong class="text-xs font-semibold">Compliance Protocol</strong>
          <p class="text-3xs font-bold tracking-tighter opacity-70">
            User will be required to update credentials upon first session authorization.
          </p>
        </div>
      </AppAlert>
      <div
        v-if="errors.resetMode"
        class="text-error text-3xs font-semibold text-center animate-shake mt-2"
      >
        {{ errors.resetMode }}
      </div>
    </div>

    <!-- Confirmation Overlay -->
    <AppConfirmOverlay
      :show="showConfirm"
      :title="modalTitle"
      :subtitle="
        type === 'delete'
          ? 'This action is irreversible. All data will be permanently erased.'
          : 'Please verify details before proceeding.'
      "
      :icon="getActionIcon(type)"
      :image="
        localData.profileURL ||
        (type === 'plus'
          ? getImageUrl('profiles/avatar-boy')
          : getImageUrl('profiles/avatar-parent'))
      "
      :rows="confirmRows"
      :confirmLabel="submitLabel"
      :loading="loading"
      @back="showConfirm = false"
      @confirm="handleActionSubmit"
    />

    <!-- Footer -->
    <template #footer>
      <div class="flex flex-col justify-end w-full gap-md">
        <AppAlert v-if="validationMessage" type="error" class="w-full">
          {{ validationMessage }}
        </AppAlert>
        <AppAlert v-if="type === 'edit' && !isDirty" type="info" class="w-full">
          No modifications detected. Please update at least one field to enable saving.
        </AppAlert>

        <div class="flex items-center justify-end w-full gap-md">
          <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
          <AppButton
            :variant="type === 'delete' ? 'danger' : 'primary'"
            type="button"
            @click="requestConfirm"
            :loading="loading"
            :disabled="loading"
            :class="{
              'opacity-60 grayscale-[0.2]': (type === 'edit' && !isDirty) || isFormInvalid,
            }"
          >
            {{ submitLabel }}
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>

  <!-- Inline Parent Creation Sub-Modal -->
  <ParentActionModal
    v-if="showNewParentSubModal"
    :isOpen="showNewParentSubModal"
    type="add"
    :loading="subModalLoading"
    :error="subModalError"
    :success="subModalSuccess"
    @close="((showNewParentSubModal = false), (subModalError = ''), (subModalSuccess = ''))"
    @submit="handleInlineParentSubmit"
  />
</template>

<style scoped>
.parent-identity-email {
  @apply text-sm font-semibold text-content-muted opacity-60;
}

.parent-identity-phone {
  @apply px-2 py-0.5 bg-white/40 text-sm font-semibold rounded-full shadow-sm;
}

.parent-reset-card {
  @apply flex flex-col gap-md p-xl rounded-sm border-2 cursor-pointer transition-all relative overflow-hidden;
}

.parent-reset-card--inactive {
  @apply border-outline-std bg-white;
}

.parent-reset-card--email-active {
  @apply border-primary bg-primary-soft shadow-lg scale-105;
}

.parent-reset-card--manual-active {
  @apply border-warning bg-warning-soft shadow-lg scale-105;
}

.parent-reset-icon {
  @apply w-10 h-10 rounded-full flex items-center justify-center bg-white border shadow-sm transition-transform duration-300;
}

.parent-reset-card:hover .parent-reset-icon {
  @apply scale-110;
}

.parent-reset-icon--email {
  @apply border-primary;
}

.parent-reset-icon--manual {
  @apply border-warning;
}

.parent-reset-info {
  @apply flex justify-between gap-1;
}

.parent-reset-title {
  @apply text-xs font-semibold tracking-tighter;
}

.parent-reset-sub {
  @apply text-3xs text-content-muted font-bold leading-tight opacity-60;
}
</style>
