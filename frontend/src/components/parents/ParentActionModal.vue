<template>
  <AppModal
    :show="isOpen"
    :title="modalTitle"
    variant="action"
    @close="$emit('close')"
    :icon="getActionIcon(type)"
  >
    <!-- Identity Banner -->
    <div
      v-if="selectedParent && type !== 'edit' && type !== 'delete'"
      class="flex items-center gap-xl px-2xl py-xl rounded-std mb-xl relative overflow-hidden shadow-lg border border-white/20 after:content-[''] after:absolute after:top-0 after:right-0 after:bottom-0 after:w-[150px] after:bg-gradient-to-l after:from-white/10 after:to-transparent after:pointer-events-none transition-all duration-500"
      :class="parentThemeClasses"
    >
      <div
        class="w-20 h-20 rounded-sm border-[4px] border-white shadow-2xl overflow-hidden flex-shrink-0 bg-white group hover:scale-105 transition-transform duration-300"
      >
        <img :src="selectedParent.profileURL" class="w-full h-full object-cover" />
      </div>
      <div class="flex flex-col gap-1">
        <h2 class="text-3xl font-black text-content-dark tracking-tighter leading-none">
          {{ selectedParent.name }}
        </h2>
        <div class="flex items-center gap-md mt-1">
          <span
            class="text-xs font-black uppercase text-content-muted/60 tracking-widest"
            v-if="selectedParent.email"
            >{{ selectedParent.email }}</span
          >
          <span
            class="px-2 py-0.5 bg-white/40 text-3xs font-black uppercase rounded-full shadow-sm"
            v-if="selectedParent.phone"
            >{{ selectedParent.phone }}</span
          >
        </div>
      </div>
    </div>

    <form id="parentActionForm" @submit.prevent="handleActionSubmit" novalidate>
      <!-- Edit Parent Form -->
      <div v-if="type === 'edit'" class="grid grid-cols-2 gap-x-lg gap-y-md">
        <AppInput
          v-model="localData.name"
          label="Legal Full Name"
          placeholder="Registry name"
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

        <div class="flex flex-col gap-xs col-span-2 sm:col-span-1">
          <label class="text-xs font-black uppercase text-content-muted tracking-widest"
            >Avatar Signature <span class="text-error">*</span></label
          >
          <AvatarSelector
            v-model="localData.profile"
            :role="localData.role"
            :uid="user?.uid || user?.id"
            :customFileName="`${localData.name}_${localData.role}`"
            :error="!!errors.profile"
            :shake="shaking.profile"
          />
          <div v-if="errors.profile" class="text-error text-3xs font-black px-1 mt-1 uppercase">
            {{ errors.profile }}
          </div>
        </div>
      </div>

      <!-- Register Child Form -->
      <div v-if="type === 'plus'" class="flex flex-col gap-lg">
        <AppSelect
          v-if="!user && selectableParents && selectableParents.length > 0"
          v-model="localData.parentId"
          :items="filteredParents.map((p) => ({ id: p.uid || p.id, name: p.name }))"
          label="Link to Parent Registry"
          placeholder="Search parent database..."
          required
          :error="errors.parentId"
          :shake="shaking.parentId"
          @change="clearError('parentId')"
        />

        <div class="grid grid-cols-2 gap-x-lg gap-y-md">
          <AppInput
            v-model="localData.name"
            label="Student Full Name"
            placeholder="Full name of student"
            required
            :error="errors.name"
            :shake="shaking.name"
            @input="clearError('name')"
          />

          <AppInput
            v-model="localData.dob"
            type="date"
            label="Birth Registry Date"
            required
            :error="errors.dob"
            :shake="shaking.dob"
            @input="clearError('dob')"
          />

          <div class="flex flex-col gap-xs col-span-2">
            <label class="text-xs font-black uppercase text-content-muted tracking-widest"
              >Student Avatar <span class="text-error">*</span></label
            >
            <AvatarSelector
              v-model="localData.profile"
              role="student"
              :customFileName="`${localData.name}_student` || ''"
              :error="!!errors.profile"
              :shake="shaking.profile"
            />
            <div v-if="errors.profile" class="text-error text-3xs font-black px-1 mt-1 uppercase">
              {{ errors.profile }}
            </div>
          </div>

          <div class="flex flex-col gap-xs col-span-2 mt-sm">
            <label class="text-xs font-black uppercase text-content-muted tracking-widest"
              >Medical & Behavioral Synopsis</label
            >
            <textarea
              v-model="localData.medicalNote"
              placeholder="List any allergies, requirements, or pedagogical notes..."
              rows="3"
              class="w-full px-md py-sm border-2 border-outline-std rounded-sm bg-white text-sm font-semibold outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-info-soft"
            ></textarea>
            <div
              class="flex flex-wrap gap-xs mt-sm bg-surface-light p-2 rounded-sm border border-outline-std/20"
            >
              <button
                v-for="preset in ['None', 'G6PD', 'ADHD', 'Dyslexia', 'Asthma', 'Vision']"
                :key="preset"
                type="button"
                class="px-3 py-1 bg-white border-2 border-outline-std/50 rounded-sm text-2xs font-black uppercase tracking-widest cursor-pointer transition-all hover:bg-primary-soft hover:text-primary hover:border-primary/20"
                :class="{
                  'bg-primary text-white border-primary-dark shadow-md scale-105': isPresetActive(
                    'medicalNote',
                    preset,
                  ),
                }"
                @click="togglePreset('medicalNote', preset)"
              >
                {{ preset }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>

    <!-- Account Lifecycle Views -->
    <div v-if="type === 'deactivate'" class="flex flex-col gap-lg">
      <AppAlert type="warning">
        <div class="flex flex-col gap-0.5">
          <strong class="text-sm font-black uppercase tracking-tight">Suspension Protocol</strong>
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
          <strong class="text-sm font-black uppercase tracking-tight"
            >Reactivation Clearance</strong
          >
          <span class="text-xs opacity-90 font-medium"
            >System access will be restored across all devices immediately. The parent will be able
            to manage active enrollments and billing.</span
          >
        </div>
      </AppAlert>
    </div>

    <div v-if="type === 'delete'" class="flex flex-col gap-xl">
      <div
        class="flex flex-col bg-white border border-outline-std rounded-std p-xl shadow-inner mb-md"
        v-if="selectedParent"
      >
        <div class="grid grid-cols-2 gap-x-xl gap-y-md">
          <div class="flex flex-col gap-xs">
            <span class="text-3xs font-black uppercase text-content-muted tracking-widest"
              >Legal Entity</span
            >
            <div class="flex items-center gap-sm">
              <img
                :src="selectedParent.profileURL"
                class="w-8 h-8 rounded-full border border-white shadow-sm"
              />
              <span class="text-sm font-black text-content-dark tracking-tight">{{
                selectedParent.name
              }}</span>
            </div>
          </div>
          <div class="flex flex-col gap-xs">
            <span class="text-3xs font-black uppercase text-content-muted tracking-widest"
              >Communication Channel</span
            >
            <span class="text-sm text-content-dark font-bold truncate">{{
              selectedParent.email
            }}</span>
          </div>
          <div class="flex flex-col gap-xs">
            <span class="text-3xs font-black uppercase text-content-muted tracking-widest"
              >Current Status</span
            >
            <div class="w-fit">
              <StatusBadge :status="selectedParent.status" />
            </div>
          </div>
        </div>
      </div>

      <AppAlert type="error">
        <div class="flex flex-col gap-0.5">
          <strong class="text-sm font-black uppercase tracking-tight">Critical Record Purge</strong>
          <span class="text-xs opacity-90 font-medium leading-relaxed"
            >This action is destructive and irreversible. All linked historical data, billing
            cycles, and child relations will be severed.</span
          >
        </div>
      </AppAlert>

      <AppInput
        v-model="localData.deleteConfirm"
        label="Authorization Required"
        placeholder="AUTHORIZE PURGE"
        required
        class="text-center"
        :error="errors.deleteConfirm"
        :shake="shaking.deleteConfirm"
        @input="clearError('deleteConfirm')"
      >
        <template #label-extra>
          <span class="block text-2xs font-black uppercase text-content-muted/40 text-center mt-1">
            Type <span class="text-error px-1">DELETE</span> to authorize record destruction
          </span>
        </template>
      </AppInput>
    </div>

    <!-- Password Management View -->
    <div v-if="type === 'reset-password'" class="flex flex-col gap-lg">
      <div class="bg-surface-subtle/50 p-md rounded-sm border border-outline-std/30">
        <h3 class="text-xs font-black uppercase tracking-[2px] mb-1 text-content-dark">
          Recovery Logic Selection
        </h3>
        <p
          class="text-3xs text-content-muted uppercase font-bold tracking-widest opacity-60 italic"
        >
          Choose a secure protocol for account restoration.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-md">
        <div
          class="group flex flex-col gap-md p-xl rounded-sm border-2 cursor-pointer transition-all relative overflow-hidden"
          :class="
            selectedResetMode === 'email'
              ? 'border-primary bg-primary-soft shadow-lg scale-[1.02]'
              : 'border-outline-std bg-white hover:border-text-muted'
          "
          @click="selectedResetMode = 'email'"
        >
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-primary/20 shadow-sm group-hover:scale-110 transition-transform"
          >
            <img :src="getActionIcon('email')" class="w-5 h-5 opacity-80" />
          </div>
          <div class="flex flex-col gap-1">
            <strong class="text-xs font-black uppercase tracking-tighter">Automated Link</strong>
            <p class="text-3xs text-content-muted font-bold leading-tight uppercase opacity-60">
              Send link to registered email address.
            </p>
          </div>
          <div
            v-if="selectedResetMode === 'email'"
            class="absolute -top-1 -right-1 w-6 h-6 bg-primary text-white flex items-center justify-center text-xs font-black border-2 border-white rounded-full"
          >
            ✓
          </div>
        </div>

        <div
          class="group flex flex-col gap-md p-xl rounded-sm border-2 cursor-pointer transition-all relative overflow-hidden"
          :class="
            selectedResetMode === 'manual'
              ? 'border-warning bg-warning-soft shadow-lg scale-[1.02]'
              : 'border-outline-std bg-white hover:border-text-muted'
          "
          @click="selectedResetMode = 'manual'"
        >
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-warning/20 shadow-sm group-hover:scale-110 transition-transform"
          >
            <img :src="getActionIcon('edit')" class="w-5 h-5 opacity-80" />
          </div>
          <div class="flex flex-col gap-1">
            <strong class="text-xs font-black uppercase tracking-tighter"
              >Administrative Override</strong
            >
            <p class="text-3xs text-content-muted font-bold leading-tight uppercase opacity-60">
              Initialize with temporary credentials.
            </p>
          </div>
          <div
            v-if="selectedResetMode === 'manual'"
            class="absolute -top-1 -right-1 w-6 h-6 bg-warning text-white flex items-center justify-center text-xs font-black border-2 border-white rounded-full"
          >
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
      <div
        v-if="errors.resetMode"
        class="text-error text-3xs font-black text-center uppercase animate-shake"
      >
        {{ errors.resetMode }}
      </div>
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="flex flex-col justify-end w-full gap-md">
        <AppAlert
          v-if="error"
          type="error"
          closable
          @close="$emit('update:error', '')"
          class="w-full"
        >
          {{ error }}
        </AppAlert>
        <AppAlert
          v-if="success"
          type="success"
          closable
          @close="$emit('update:success', '')"
          class="w-full"
        >
          {{ success }}
        </AppAlert>

        <div class="flex items-center justify-end w-full gap-md">
          <AppButton variant="cancel" @click="$emit('close')" :disabled="loading || !!success"
            >Abort Action</AppButton
          >
          <AppButton
            :variant="type === 'delete' || type === 'deactivate' ? 'danger' : 'primary'"
            :form="type === 'edit' || type === 'plus' ? 'parentActionForm' : null"
            type="submit"
            @click="!(type === 'edit' || type === 'plus') ? handleActionSubmit() : null"
            :loading="loading"
            :disabled="loading || !!success"
            :class="{
              'button-disabled-visual': (type === 'edit' && !isDirty) || !!success,
            }"
          >
            {{ submitLabel }}
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AvatarSelector from '@/components/common/ui/AvatarSelector.vue'
import StatusBadge from '@/components/common/ui/StatusBadge.vue'
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
  profile: '',
  deleteConfirm: '',
  parentId: props.user?.uid || props.user?.id || '',
  dob: '',
  medicalNote: '',
})

const mapSourceToForm = () => {
  const u = props.user || {}
  const base = getInitialData()

  if (props.type === 'plus') {
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
    profile: u.profileURL || '',
  }
}

const { localData, originalData, isDirty, errors, shaking, clearError, submitForm } =
  useActionModal(props, emit, {
    getInitialData,
    mapSourceToForm,
  })

const isChanged = computed(() => {
  if (props.type !== 'edit') return true

  const d = localData.value
  const o = originalData.value

  const hasProfileChanged = !isSameProfileAsset(d.profile, o.profile)
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
      submitForm()
    }
    return
  }

  const rules = {
    required: [],
    custom: {},
  }

  if (props.type === 'edit') {
    if (!isChanged.value) return
    rules.required = ['name', 'phone', 'profile']
    rules.custom.email = (val) => (!!val?.trim() && val.includes('@')) || 'Valid email required'
  } else if (props.type === 'plus') {
    rules.required = ['name', 'dob', 'profile']
    if (!props.user) rules.required.push('parentId')
  } else if (props.type === 'delete') {
    rules.custom.deleteConfirm = (val) => val === 'DELETE' || 'Authorization string invalid'
  }

  submitForm(rules)
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
  const url = (p.profileURL || p.profile || '').toLowerCase()
  if (url.includes('woman') || url.includes('girl'))
    return 'bg-gradient-to-br from-magenta-soft/80 to-magenta-soft/30 border-magenta-soft'
  if (url.includes('man') || url.includes('boy'))
    return 'bg-gradient-to-br from-info-soft to-primary-soft border-primary-light'
  return 'bg-gradient-to-br from-bg-subtle to-bg-light border-outline-std'
})

const modalTitle = computed(() => {
  const titles = {
    edit: 'Engineer Parent Profile',
    deactivate: 'Authorize Account Suspension',
    activate: 'Authorize Account Restoration',
    delete: 'Critical: Record Purge',
    plus: 'Initialize Student Registry',
    'reset-password': 'Initialize Recovery Protocol',
  }
  return titles[props.type] || 'Parental Administration'
})

const submitLabel = computed(() => {
  if (props.type === 'plus') return 'Authorize Registry'
  if (props.type === 'deactivate') return 'Execute Suspension'
  if (props.type === 'activate') return 'Execute Restoration'
  if (props.type === 'edit') return 'Commit Profile'
  if (props.type === 'delete') return 'Force Delete Record'
  if (props.type === 'reset-password') return 'Execute Recovery'
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
  if (!localData.value.parentId) return null
  if (
    props.user &&
    (props.user.uid === localData.value.parentId || props.user.id === localData.value.parentId)
  )
    return props.user
  return props.selectableParents?.find((p) => (p.uid || p.id) === localData.value.parentId)
})

const togglePreset = (field, chipValue) => {
  const currentText = localData.value[field] || ''
  let values = currentText
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
  if (values.includes(chipValue)) {
    values = values.filter((v) => v !== chipValue)
  } else {
    if (chipValue === 'None') values = ['None']
    else {
      values = values.filter((v) => v !== 'None')
      values.push(chipValue)
    }
  }
  localData.value[field] = values.join(', ')
}

const isPresetActive = (field, chipValue) => {
  return (localData.value[field] || '')
    .split(',')
    .map((v) => v.trim())
    .includes(chipValue)
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
