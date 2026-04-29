<script setup>
import { ref, computed, watch } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AvatarSelector from '@/components/common/ui/AvatarSelector.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { useActionModal } from '@/composables/useActionModal'
import { getActionIcon, isSameProfileAsset } from '@/utils/assetHelper'
import { useSearch, parentSearchMapper } from '@/composables/useSearch'

import { auth } from '@/firebase'
import { sendPasswordResetEmail } from 'firebase/auth'

const selectedResetMode = ref(null)

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

  return {
    ...base,
    name: u.name || '',
    phone: u.phone || u.phoneNumber || '',
    email: u.email || '',
    role: u.role || 'parent',
    status: u.status || 'Active',
    profileURL: u.profileURL || '',
  }
}

const { localData, originalData, isDirty, errors, shaking, clearError, triggerShake, validate } =
  useActionModal(props, emit, {
    getInitialData,
    mapSourceToForm,
  })

const isChanged = computed(() => {
  if (props.type !== 'edit') return true

  const d = localData
  const o = originalData

  const hasProfileChanged = !isSameProfileAsset(d.profileURL, o.profileURL)
  const hasNameChanged = d.name !== o.name
  const hasEmailChanged = d.email !== o.email
  const hasPhoneChanged = d.phone !== o.phone
  const hasStatusChanged = d.status !== o.status

  return (
    hasProfileChanged || hasNameChanged || hasEmailChanged || hasPhoneChanged || hasStatusChanged
  )
})

const handleActionSubmit = () => {
  if (props.type === 'reset-password') {
    if (!selectedResetMode.value) {
      // Manual error set for resetMode since it's not a form field
      errors.value.resetMode = 'Selection required'
      shaking.value.resetMode = true
      setTimeout(() => {
        delete errors.value.resetMode
        shaking.value.resetMode = false
      }, 2000)
      return
    }
    if (selectedResetMode.value === 'email') {
      handleSendResetEmail()
    } else {
      emit('submit', { type: 'manual' })
    }
    return
  }

  const rules = {
    required: [],
    custom: {},
  }

  if (props.type === 'edit') {
    if (!isChanged.value) return
    rules.required = ['name', 'phone', 'profileURL']
    rules.custom.email = (val) => (!!val?.trim() && val.includes('@')) || 'Valid email required'
  } else if (props.type === 'plus') {
    rules.required = ['name', 'dob', 'profileURL']
    if (!props.user) rules.required.push('parentId')
  } else if (props.type === 'delete') {
    rules.custom.deleteConfirm = (val) => val === 'DELETE' || 'Authorization string invalid'
  }

  if (!validate(rules)) return

  const payload = JSON.parse(JSON.stringify(localData))

  // Remove UI-only and system-managed fields from backend payload
  const forbidden = ['deleteConfirm', 'id', '_id', 'createdAt', 'updatedAt']
  // parentId is required for "plus" (add child) but not for edit parent
  if (props.type === 'edit') forbidden.push('parentId')

  forbidden.forEach((key) => delete payload[key])

  emit('submit', payload)
}

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
  if (props.type === 'plus') return 'Add'
  if (props.type === 'deactivate') return 'Deactivate'
  if (props.type === 'activate') return 'Activate'
  if (props.type === 'edit') return 'Edit'
  if (props.type === 'delete') return 'Delete'
  if (props.type === 'reset-password') return 'Reset'
  return 'Confirm'
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
  if (props.user && (props.user.id === localData.parentId)) return props.user
  return props.selectableParents?.find((p) => p.id === localData.parentId)
})

const handleDisabledClick = (field) => {
  if (field === 'childInfo' && !props.user && !localData.parentId) {
    errors.parentId = 'PLEASE LINK TO A PARENT RECORD FIRST'
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
  <AppModal :show="isOpen" :title="modalTitle" variant="action" @close="$emit('close')" :icon="getActionIcon(type)"
    :error="error" :success="success">
    <!-- Identity Banner -->
    <div v-if="selectedParent && type !== 'edit' && type !== 'delete'" class="ui-identity-banner"
      :class="parentThemeClasses">
      <div class="ui-identity-avatar">
        <img :src="selectedParent.profileURL" class="w-full h-full object-cover" />
      </div>
      <div class="ui-identity-info">
        <h2 class="ui-identity-name">
          {{ selectedParent.name }}
        </h2>
        <div class="ui-identity-meta">
          <span class="parent-identity-email" v-if="selectedParent.email">{{ selectedParent.email }}</span>
          <span class="parent-identity-phone" v-if="selectedParent.phone">{{ selectedParent.phone }}</span>
        </div>
      </div>
    </div>

    <form id="parentActionForm" @submit.prevent="handleActionSubmit" novalidate>
      <!-- Edit Parent Form -->
      <div v-if="type === 'edit'" class="ui-form-grid">
        <AppInput v-model="localData.name" label="Legal Full Name" placeholder="Registry name" required
          :error="errors.name" :shake="shaking.name" @input="clearError('name')" />

        <AppInput v-model="localData.email" type="email" label="Account Email" placeholder="email@address.com" required
          :error="errors.email" :shake="shaking.email" @input="clearError('email')" />

        <AppInput v-model="localData.phone" label="Contact Phone" placeholder="Active phone line" required
          :error="errors.phone" :shake="shaking.phone" @input="clearError('phone')" />

        <div class="flex flex-col gap-xs col-span-2 sm:col-span-1">
          <label class="text-xs font-black uppercase text-content-muted tracking-widest">Avatar Signature <span
              class="text-error">*</span></label>
          <AvatarSelector v-model="localData.profileURL" :role="localData.role" :uid="user?.id"
            :customFileName="`${localData.name}_${localData.role}`" :error="errors.profileURL"
            :shake="shaking.profileURL" />
        </div>
      </div>

      <!-- Register Child Form -->
      <div v-if="type === 'plus'" class="flex flex-col gap-lg">
        <AppSelect v-if="!user && selectableParents && selectableParents.length > 0" v-model="localData.parentId"
          :items="filteredParents.map((p) => ({ id: p.id, name: p.name, profileURL: p.profileURL }))"
          label="Link to Parent Registry" placeholder="Search Parent" required :error="errors.parentId"
          :shake="shaking.parentId" @change="clearError('parentId')" />

        <div class="ui-form-grid">
          <AppInput v-model="localData.name" label="Student Full Name" placeholder="Enter Student Name" required
            :disabled="!user && !localData.parentId" :error="errors.name" :shake="shaking.name"
            @input="clearError('name')" @click-disabled="handleDisabledClick('childInfo')" />

          <AppInput v-model="localData.dob" type="date" label="Student Birthday" required
            :disabled="!user && !localData.parentId" :error="errors.dob" :shake="shaking.dob" @input="clearError('dob')"
            @click-disabled="handleDisabledClick('childInfo')" />

          <div class="flex flex-col gap-xs col-span-2">
            <label class="text-xs font-black uppercase text-content-muted tracking-widest">Student Avatar <span
                class="text-error">*</span></label>
            <AvatarSelector v-model="localData.profileURL" role="student"
              :customFileName="`${localData.name}_student` || ''" :disabled="!user && !localData.parentId"
              :error="errors.profileURL" :shake="shaking.profileURL"
              @click-disabled="handleDisabledClick('childInfo')" />
          </div>
        </div>
      </div>
    </form>

    <!-- Account Lifecycle Views -->
    <div v-if="type === 'deactivate'" class="flex flex-col gap-lg">
      <AppAlert type="warning">
        <div class="flex flex-col gap-0.5">
          <strong class="text-sm font-black uppercase tracking-tight">Suspension Protocol</strong>
          <span class="text-xs opacity-90 font-medium">Deactivating this account will revoke system access for the
            parent immediately. All
            linked student data remained archived for future reactivation.</span>
        </div>
      </AppAlert>
    </div>

    <div v-if="type === 'activate'" class="flex flex-col gap-lg">
      <AppAlert type="success">
        <div class="flex flex-col gap-0.5">
          <strong class="text-sm font-black uppercase tracking-tight">Reactivation Clearance</strong>
          <span class="text-xs opacity-90 font-medium">System access will be restored across all devices immediately.
            The parent will be able
            to manage active enrollments and billing.</span>
        </div>
      </AppAlert>
    </div>

    <div v-if="type === 'delete'" class="flex flex-col gap-xl">
      <div class="flex flex-col bg-white border border-outline-std rounded-std p-xl shadow-inner mb-md"
        v-if="selectedParent">
        <div class="grid grid-cols-2 gap-x-xl gap-y-md">
          <div class="flex flex-col gap-xs">
            <span class="text-3xs font-black uppercase text-content-muted tracking-widest">Parent Name</span>
            <div class="flex items-center gap-sm">
              <img :src="selectedParent.profileURL" class="w-8 h-8 rounded-full border border-white shadow-sm" />
              <span class="text-sm font-black text-content-dark tracking-tight">{{
                selectedParent.name
              }}</span>
            </div>
          </div>
          <div class="flex flex-col gap-xs">
            <span class="text-3xs font-black uppercase text-content-muted tracking-widest">Contact Email</span>
            <span class="text-sm text-content-dark font-bold truncate">{{
              selectedParent.email
              }}</span>
          </div>
          <div class="flex flex-col gap-xs">
            <span class="text-3xs font-black uppercase text-content-muted tracking-widest">Contact Phone</span>
            <span class="text-sm text-content-dark font-bold truncate">{{
              selectedParent.phone
              }}</span>
          </div>
          <div class="flex flex-col gap-xs">
            <span class="text-3xs font-black uppercase text-content-muted tracking-widest">Account Status</span>
            <div class="w-fit">
              <AppBadge :status="selectedParent.status" />
            </div>
          </div>
        </div>
      </div>

      <AppAlert type="error">
        <div class="flex flex-col gap-0.5">
          <strong class="text-sm font-black uppercase tracking-tight">Critical Record Delete</strong>
          <span class="text-xs opacity-90 font-medium leading-relaxed">This action is destructive and irreversible. All
            linked historical data, billing
            cycles, and child relations will be severed.</span>
        </div>
      </AppAlert>

      <AppInput v-model="localData.deleteConfirm" label="Enter 'DELETE' to confirm" placeholder="DELETE" required
        class="text-center" :error="errors.deleteConfirm" :shake="shaking.deleteConfirm"
        @input="clearError('deleteConfirm')">
        <template #label-extra>
          <span class="block text-2xs font-black text-center mt-1">
            Type <span class="text-error px-1">DELETE</span> to authorize record deletion
          </span>
        </template>
      </AppInput>
    </div>

    <!-- Password Management View -->
    <div v-if="type === 'reset-password'" class="flex flex-col gap-lg">
      <div class="bg-surface-subtle/50 p-md rounded-sm border border-outline-std/30">
        <h3 class="text-xs font-black uppercase tracking-widest mb-1 text-content-dark">
          Recovery Logic Selection
        </h3>
        <p class="text-3xs text-content-muted uppercase font-bold tracking-widest opacity-60 italic">
          Choose a secure protocol for account restoration.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-md">
        <div class="parent-reset-card group" :class="selectedResetMode === 'email'
          ? 'parent-reset-card--email-active'
          : 'parent-reset-card--inactive'
          " @click="selectedResetMode = 'email'">
          <div class="parent-reset-icon parent-reset-icon--email">
            <img :src="getActionIcon('email')" class="w-5 h-5 opacity-80" />
          </div>
          <div class="parent-reset-info">
            <strong class="parent-reset-title">Automated Link</strong>
            <p class="parent-reset-sub">
              Send link to registered email address.
            </p>
          </div>
          <div v-if="selectedResetMode === 'email'"
            class="absolute -top-1 -right-1 w-6 h-6 bg-primary text-white flex items-center justify-center text-xs font-black border-2 border-white rounded-full">
            ✓
          </div>
        </div>

        <div class="parent-reset-card group" :class="selectedResetMode === 'manual'
          ? 'parent-reset-card--manual-active'
          : 'parent-reset-card--inactive'
          " @click="selectedResetMode = 'manual'">
          <div class="parent-reset-icon parent-reset-icon--manual">
            <img :src="getActionIcon('edit')" class="w-5 h-5 opacity-80" />
          </div>
          <div class="parent-reset-info">
            <strong class="parent-reset-title">Administrative Override</strong>
            <p class="parent-reset-sub">
              Initialize with temporary credentials.
            </p>
          </div>
          <div v-if="selectedResetMode === 'manual'"
            class="absolute -top-1 -right-1 w-6 h-6 bg-warning text-white flex items-center justify-center text-xs font-black border-2 border-white rounded-full">
            ✓
          </div>
        </div>
      </div>

      <AppAlert type="info">
        <div class="flex flex-col gap-0.5">
          <strong class="text-xs font-black uppercase tracking-widest">Compliance Protocol</strong>
          <p class="text-2xs opacity-90 font-bold uppercase tracking-tighter opacity-70">
            User will be required to update credentials upon first session authorization.
          </p>
        </div>
      </AppAlert>
      <div v-if="errors.resetMode"
        class="text-error text-3xs font-black text-center uppercase tracking-widest animate-shake mt-2">
        {{ errors.resetMode }}
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="flex flex-col justify-end w-full gap-md">
        <div class="flex items-center justify-end w-full gap-md">
          <AppButton variant="cancel" @click="$emit('close')" :disabled="loading || !!success">Cancel</AppButton>
          <AppButton :variant="type === 'delete' || type === 'deactivate' ? 'danger' : 'primary'"
            :form="type === 'edit' || type === 'plus' ? 'parentActionForm' : null" type="submit"
            @click="!(type === 'edit' || type === 'plus') ? handleActionSubmit() : null" :loading="loading"
            :disabled="loading || !!success" :class="{
              'button-disabled-visual': (type === 'edit' && !isDirty) || !!success,
            }">
            {{ submitLabel }}
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>
</template>

<style scoped>
.parent-identity-email {
  @apply text-sm font-black text-content-muted opacity-60;
}

.parent-identity-phone {
  @apply px-2 py-0.5 bg-white/40 text-sm font-bold rounded-full shadow-sm;
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
  @apply text-xs font-black uppercase tracking-tighter;
}

.parent-reset-sub {
  @apply text-3xs text-content-muted font-bold leading-tight uppercase opacity-60;
}
</style>
