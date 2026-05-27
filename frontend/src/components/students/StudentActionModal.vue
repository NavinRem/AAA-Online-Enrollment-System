<script setup>
import { computed, watch, ref } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppConfirmOverlay from '@/components/common/ui/AppConfirmOverlay.vue'
import AvatarSelector from '@/components/common/ui/AvatarSelector.vue'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { calculateAge } from '@/utils/formatUtils'
import { useActionModal } from '@/composables/useActionModal'

const props = defineProps({
  isOpen: Boolean,
  type: String, // 'edit', 'delete', 'override', 'enrollment-override', 'enrollment-delete'
  student: Object,
  enrollment: Object,
  selectableParents: Array,
  branches: Array,
  loading: Boolean,
  error: String,
  success: String,
})

const emit = defineEmits(['close', 'submit', 'update:error', 'update:success'])

const getInitialData = () => ({
  name: '',
  dob: '',
  profileURL: '',
  status: 'inactive',
  deleteConfirm: '',
  overrideRemark: '',
})

const mapSourceToForm = () => {
  const source = props.student || props.enrollment || {}
  return {
    name: source.name || '',
    dob: source.dob || '',
    profileURL: source.profileURL || '',
    status: (source.status || 'inactive').toLowerCase(),
    deleteConfirm: '',
    overrideRemark: source.overrideRemark || '',
  }
}

const { localData, isDirty, errors, shaking, clearError, validate, getPayload } = useActionModal(props, emit, {
  getInitialData,
  mapSourceToForm,
  autoClear: 3000,
})

const showConfirm = ref(false)

const requestConfirm = () => {
  validationMessage.value = ''
  const rules = {
    required: [],
    custom: {},
  }

  if (props.type === 'edit' || props.type?.includes('override')) {
    if (props.type === 'edit' && !isDirty.value) return
    rules.required = ['name', 'dob']
    rules.custom.overrideRemark = (val) => {
      if (['hold', 'inactive'].includes(localData.status.toLowerCase())) {
        return !!val?.trim() || 'Detailed remark is required for this status change.'
      }
      return true
    }
  } else if (props.type?.includes('delete')) {
    rules.custom.deleteConfirm = (val) => val === 'DELETE' || 'Type DELETE to confirm.'
  }

  if (!validate(rules)) {
    validationMessage.value = props.type?.includes('delete')
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
  showConfirm.value = false
  const payload = getPayload()

  emit('submit', payload)
}

const confirmRows = computed(() => {
  if (props.type === 'delete' || props.type === 'enrollment-delete') {
    return [
      { key: 'Name', value: localData.name },
      {
        key: 'DeleteConfirm',
        value: localData.deleteConfirm,
        valueClass: 'text-error font-bold',
      },
    ]
  }

  const rows = [
    { key: 'Name', value: localData.name },
    { key: 'Dob', value: localData.dob },
    { key: 'Status', value: localData.status, badge: true },
  ]

  if (
    (props.type === 'override' || props.type === 'enrollment-override') &&
    localData.overrideRemark
  ) {
    rows.push({
      key: 'OverrideRemark',
      value: localData.overrideRemark,
      valueClass: 'italic text-xs',
    })
  }

  return rows
})

const modalTitle = computed(() => {
  const titles = {
    add: 'Add Student',
    edit: 'Edit Student',
    delete: 'Delete Student',
    override: 'Manual Status Override',
    'enrollment-override': 'Enrollment Status Override',
    'enrollment-delete': 'Delete Enrollment',
  }
  return titles[props.type] || 'Add Student'
})

const submitLabel = computed(() => {
  if (props.type === 'edit') return 'Update'
  if (props.type?.includes('delete')) return 'Delete'
  if (props.type === 'add') return 'Add'
  return 'Update'
})

const validationMessage = ref('')
const isFormInvalid = computed(() => {
  if (props.type?.includes('delete')) return !localData.deleteConfirm
  const baseInvalid = !localData.name || !localData.dob
  if (['hold', 'inactive'].includes(localData.status?.toLowerCase())) {
    return baseInvalid || !localData.overrideRemark
  }
  return baseInvalid
})

const modalIcon = computed(() => {
  if (props.type?.includes('delete')) return getActionIcon('delete')
  return getActionIcon('edit')
})

const studentTheme = computed(() => {
  const url = (localData.profileURL || '').toLowerCase()
  if (url.includes('woman') || url.includes('girl')) return 'theme-pink'
  if (url.includes('man') || url.includes('boy')) return 'theme-blue'
  return 'theme-default'
})

const studentThemeClasses = computed(() => {
  if (studentTheme.value === 'theme-pink')
    return 'bg-gradient-to-br from-magenta-soft/50 to-magenta-soft border-magenta-soft/80'
  if (studentTheme.value === 'theme-blue')
    return 'bg-gradient-to-br from-info-soft to-primary-soft border-primary-light'
  return 'bg-gradient-to-br from-bg-subtle to-bg-light border-outline-std'
})

watch(
  () => props.isOpen,
  (newVal) => {
    if (!newVal) {
      // clearError context is handled by useActionModal
    }
  },
)
</script>

<template>
  <AppModal
    :show="isOpen"
    :title="modalTitle"
    @close="$emit('close')"
    :icon="modalIcon"
    :error="error"
    :success="success"
  >
    <!-- Identity Banner (Show for all types now for consistency) -->
    <div v-if="student || enrollment" class="ui-identity-banner mb-lg" :class="studentThemeClasses">
      <div class="ui-identity-avatar-round">
        <img
          :src="localData.profileURL || getImageUrl('profiles', 'avatar-student')"
          class="w-full h-full object-cover"
        />
      </div>
      <div class="ui-identity-info">
        <h2 class="ui-identity-name-compact">
          {{ localData.name || 'Student Name' }}
        </h2>
        <div class="ui-identity-meta-compact">
          <AppBadge :status="studentTheme === 'theme-pink' ? 'Female' : 'Male'" />
          <span class="opacity-50">•</span>
          <span>{{ calculateAge(localData.dob) }} years old</span>
        </div>
      </div>
    </div>

    <form id="studentActionForm" @submit.prevent="requestConfirm" novalidate>
      <!-- Edit Profile / Override Form -->
      <div
        v-if="type === 'edit' || type === 'override' || type === 'enrollment-override'"
        class="ui-form-grid-lg"
      >
        <AppInput
          v-model="localData.name"
          label="Full Name"
          placeholder="Full Name"
          required
          :error="errors.name"
          :shake="shaking.name"
          :disabled="type !== 'edit'"
          @input="clearError('name')"
        />

        <AppInput
          v-model="localData.dob"
          type="date"
          label="Date of Birth"
          required
          :error="errors.dob"
          :shake="shaking.dob"
          :disabled="type !== 'edit'"
          @input="clearError('dob')"
        />

        <AppSelect
          v-model="localData.status"
          label="Account Status"
          :items="[
            { id: 'active', name: 'Active' },
            { id: 'inactive', name: 'Inactive' },
            { id: 'hold', name: 'Hold' },
          ]"
          required
          :error="errors.status"
          :shake="shaking.status"
          :disabled="
            type === 'edit' &&
            (student?.status || enrollment?.status || '').toLowerCase() === 'stopped'
          "
          :searchable="false"
          @change="clearError('status')"
        />

        <AppInput
          v-if="['hold', 'inactive'].includes(localData.status.toLowerCase())"
          v-model="localData.overrideRemark"
          type="textarea"
          label="Administrative Remarks"
          placeholder="Document reason for status change..."
          required
          :error="errors.overrideRemark"
          :shake="shaking.overrideRemark"
          class="col-span-2"
          @input="clearError('overrideRemark')"
        />

        <AvatarSelector
          v-if="type === 'edit'"
          v-model="localData.profileURL"
          label="Student Profile Avatar"
          role="student"
          :uid="student?.id || enrollment?.studentId"
          :customFileName="`${localData.name}_student`"
          :error="errors.profileURL"
          :shake="shaking.profileURL"
          class="col-span-2"
          @update:modelValue="clearError('profileURL')"
        />
      </div>

      <!-- Delete Panel -->
      <div v-if="type === 'delete' || type === 'enrollment-delete'" class="flex flex-col gap-lg">
        <AppAlert type="error">
          <div class="flex flex-col gap-0.5">
            <strong class="text-sm font-semibold tracking-tight">Permanent Record Erasure</strong>
            <span class="text-xs opacity-90 font-medium"
              >This action will permanently remove the student profile and all historical data.
              Linked enrollments and academic logs will be severed.</span
            >
          </div>
        </AppAlert>

        <AppInput
          v-model="localData.deleteConfirm"
          label="Authorization Confirmation"
          placeholder='Type "DELETE" to confirm'
          required
          :error="errors.deleteConfirm"
          :shake="shaking.deleteConfirm"
          @input="clearError('deleteConfirm')"
        >
          <template #label-extra>
            <span class="block text-2xs font-semibold mt-0.5">
              Type <span class="text-error px-1 font-semibold">DELETE</span> to authorize this
              permanent action
            </span>
          </template>
        </AppInput>
      </div>

      <!-- Confirmation Overlay -->
      <AppConfirmOverlay
        :show="showConfirm"
        :title="modalTitle"
        :subtitle="
          type?.includes('delete')
            ? 'This action is irreversible. Data will be permanently erased.'
            : 'Please verify details before proceeding.'
        "
        :icon="modalIcon"
        :image="localData.profileURL"
        :rows="confirmRows"
        :confirmLabel="submitLabel"
        :loading="loading"
        @back="showConfirm = false"
        @confirm="handleActionSubmit"
      />
    </form>

    <template #footer>
      <div class="flex flex-col justify-end w-full gap-md">
        <AppAlert
          v-if="error"
          :show="!!error"
          type="error"
          closable
          @close="$emit('update:error', '')"
        >
          {{ error }}
        </AppAlert>
        <AppAlert v-if="validationMessage" type="error" class="w-full">
          {{ validationMessage }}
        </AppAlert>
        <AppAlert v-if="type === 'edit' && !isDirty" type="info" class="w-full">
          No modifications detected. Please update at least one field to enable saving.
        </AppAlert>

        <div class="flex items-center justify-end w-full gap-md">
          <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
          <AppButton
            :variant="type?.includes('delete') ? 'danger' : 'primary'"
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
</template>

<style scoped>
.student-delete-alert {
  @apply flex items-center gap-xl p-xl bg-error-soft border border-error-soft rounded-std mb-xl;
}
</style>
