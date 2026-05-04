<script setup>
import { computed, watch } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AvatarSelector from '@/components/common/ui/AvatarSelector.vue'
import { getStudentProfileURL, isSameProfileAsset, getActionIcon } from '@/utils/assetHelper'
import { calculateAge } from '@/utils/formatUtils'
import { useActionModal } from '@/composables/useActionModal'

const props = defineProps({
  isOpen: Boolean,
  type: String, // 'edit', 'delete', 'override', 'enrollment-override', 'enrollment-delete'
  student: Object,
  enrollment: Object,
  loading: Boolean,
  error: String,
})

const emit = defineEmits(['close', 'submit', 'update:error'])

const getInitialData = () => ({
  name: '',
  dob: '',
  profileURL: '',
  status: 'Studying',
  deleteConfirm: '',
  overrideRemark: '',
})

const mapSourceToForm = () => {
  const source = props.student || props.enrollment || {}
  return {
    name: source.name || '',
    dob: source.dob || '',
    profileURL: source.profileURL || '',
    status: source.status || 'Studying',
    deleteConfirm: '',
    overrideRemark: source.overrideRemark || '',
  }
}

const { localData, originalData, isDirty, errors, shaking, clearError, validate } =
  useActionModal(props, emit, {
    getInitialData,
    mapSourceToForm,
  })

const handleActionSubmit = () => {
  if (props.type === 'edit' && !isDirty.value) return

  const rules = {
    required: [],
    custom: {},
  }

  if (props.type === 'edit' || props.type?.includes('override')) {
    rules.required = ['name', 'dob']
    rules.custom.overrideRemark = (val) => {
      if (['Suspended', 'Stopped'].includes(localData.status)) {
        return !!val?.trim() || 'Detailed remark is required for this status change.'
      }
      return true
    }
  } else if (props.type?.includes('delete')) {
    rules.custom.deleteConfirm = (val) => val === 'DELETE' || 'Type DELETE to confirm.'
  }

  if (!validate(rules)) return

  const payload = JSON.parse(JSON.stringify(localData))

  // Remove UI-only and system-managed fields from backend payload
  const forbidden = ['deleteConfirm', 'id', '_id', 'createdAt', 'updatedAt']
  forbidden.forEach((key) => delete payload[key])

  emit('submit', payload)
}

const modalTitle = computed(() => {
  const titles = {
    edit: 'Edit Student',
    delete: 'Delete Student',
    override: 'Manual Status Override',
    'enrollment-override': 'Enrollment Status Override',
    'enrollment-delete': 'Delete Enrollment',
  }
  return titles[props.type] || 'Student Action'
})

const submitLabel = computed(() => {
  if (props.type === 'edit') return 'Edit'
  if (props.type?.includes('delete')) return 'Delete'
  if (props.type === 'add') return 'Add'
  return 'Edit'
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

const isPresetActive = (field, chipValue) => {
  const values = (localData[field] || '').split(',').map((v) => v.trim())
  return values.includes(chipValue)
}

const togglePreset = (field, chipValue) => {
  let values = (localData[field] || '')
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
  localData[field] = values.join(', ')
}

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
  <AppModal :show="isOpen" :title="modalTitle" @close="$emit('close')" :icon="modalIcon">
    <!-- Identity Banner -->
    <div v-if="
      (student || enrollment) &&
      (type === 'edit' || type === 'override' || type === 'enrollment-override')
    " class="ui-identity-banner" :class="studentThemeClasses">
      <div class="ui-identity-avatar-round">
        <img :src="getStudentProfileURL(localData.profileURL)" class="w-full h-full object-cover" />
      </div>
      <div class="ui-identity-info">
        <h2 class="ui-identity-name-compact">
          {{ localData.name || 'Student Name' }}
        </h2>
        <div class="ui-identity-meta-compact">
          <AppBadge :status="studentTheme === 'theme-pink' ? 'Female' : 'Male'" />
          <span class="opacity-50">•</span>
          <span>{{ calculateAge(localData.dob) }} yrs old</span>
        </div>
      </div>
    </div>

    <form id="studentActionForm" @submit.prevent="handleActionSubmit" novalidate>
      <!-- Edit Profile / Override Form -->
      <div v-if="type === 'edit' || type === 'override' || type === 'enrollment-override'" class="ui-form-grid-lg">
        <AppInput v-model="localData.name" label="Full Name" placeholder="Full Name" required :error="errors.name"
          :shake="shaking.name" :disabled="type !== 'edit'" @input="clearError('name')" />

        <AppInput v-model="localData.dob" type="date" label="Date of Birth" required :error="errors.dob"
          :shake="shaking.dob" :disabled="type !== 'edit'" @input="clearError('dob')" />

        <AppSelect v-model="localData.status" label="Account Status" :items="[
          { id: 'Studying', name: 'Studying' },
          { id: 'Suspended', name: 'Suspended' },
          { id: 'Stopped', name: 'Stopped' },
          { id: 'Graduated', name: 'Graduated' },
        ]" required :error="errors.status" :shake="shaking.status"
          :disabled="type === 'edit' && !['Suspended', 'Stopped'].includes(localData.status)" :searchable="false"
          @change="clearError('status')" />

        <div class="flex flex-col gap-xs mb-md col-span-2" v-if="['Suspended', 'Stopped'].includes(localData.status)">
          <label class="text-sm font-semibold text-content-dark">Administrative Remarks <span
              class="text-error">*</span></label>
          <textarea v-model="localData.overrideRemark" placeholder="Document reason for status change..." rows="3"
            class="ui-remark-textarea" :class="{
              'border-error bg-error-soft ring-error/10': errors.overrideRemark,
              'animate-shake': shaking.overrideRemark,
            }"></textarea>
          <div v-if="errors.overrideRemark"
            class="text-error text-3xs font-semibold px-1 mt-0.5 tracking-widest">
            {{ errors.overrideRemark }}
          </div>
        </div>

        <div class="flex flex-col gap-xs mb-md col-span-2" v-if="type === 'edit'">
          <label class="text-sm font-semibold text-content-dark">Student Profile Avatar</label>
          <AvatarSelector v-model="localData.profileURL" role="student" :uid="student?.id || enrollment?.studentId"
            :customFileName="`${localData.name}_student`" :error="errors.profileURL" :shake="shaking.profileURL" />
        </div>
      </div>

      <!-- Delete Panel -->
      <div v-if="type === 'delete' || type === 'enrollment-delete'" class="mt-lg">
        <div class="student-delete-alert">
          <div class="text-3xl">🚨</div>
          <div class="flex flex-col gap-0.5">
            <strong class="text-lg text-error-deep">Critical Record Deletion</strong>
            <p class="text-sm text-error-deep opacity-90 leading-relaxed">
              This will permanently remove the record and all associated history. This action cannot
              be undone.
            </p>
          </div>
        </div>

        <AppInput v-model="localData.deleteConfirm" label="Authorization" placeholder="DELETE" required
          class="text-center" :error="errors.deleteConfirm" :shake="shaking.deleteConfirm"
          @input="clearError('deleteConfirm')">
          <template #label-extra>
            <span class="block text-2xs font-bold text-center w-full text-content-muted/40 mt-1">
              Type <span class="text-error font-bold px-1">DELETE</span> to confirm
            </span>
          </template>
        </AppInput>
      </div>
    </form>

    <template #footer>
      <div class="flex flex-col justify-end w-full gap-sm">
        <AppAlert v-if="error" :show="!!error" type="error" closable @close="$emit('update:error', '')">
          {{ error }}
        </AppAlert>

        <div class="flex items-center justify-end w-full gap-sm">
          <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
          <AppButton :variant="type?.includes('delete') ? 'danger' : 'primary'" form="studentActionForm" type="submit"
            @click="type?.includes('delete') ? handleActionSubmit() : null" :loading="loading" :disabled="loading"
            :class="{ 'button-disabled-visual': type === 'edit' && !isDirty }">
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
