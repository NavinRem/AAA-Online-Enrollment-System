<template>
  <AppModal :show="isOpen" :title="modalTitle" @close="$emit('close')" :icon="modalIcon">
    <!-- Identity Banner -->
    <div
      v-if="
        (student || enrollment) &&
        (type === 'edit' || type === 'override' || type === 'enrollment-override')
      "
      class="flex items-center gap-xl px-2xl py-xl rounded-std mb-xl relative overflow-hidden shadow-sm border border-transparent after:content-[''] after:absolute after:top-0 after:right-0 after:bottom-0 after:w-[120px] after:bg-gradient-to-l after:from-white/10 after:to-transparent after:pointer-events-none"
      :class="studentThemeClasses"
    >
      <div
        class="w-16 h-16 rounded-full border-[3px] border-white shadow-lg overflow-hidden flex-shrink-0 bg-white"
      >
        <img :src="getStudentProfileURL(localData.profileURL)" class="w-full h-full object-cover" />
      </div>
      <div class="flex flex-col">
        <h2 class="text-2xl font-[850] text-content-dark tracking-tighter leading-[1.1]">
          {{ localData.name || 'Student Name' }}
        </h2>
        <div class="text-sm text-content-muted mt-[2px] font-medium flex items-center gap-xs">
          <span>{{ studentTheme === 'theme-pink' ? 'Female' : 'Male' }}</span>
          <span class="opacity-50">•</span>
          <span>{{ calculateAge(localData.dob) }} yrs old</span>
        </div>
      </div>
    </div>

    <form id="studentActionForm" @submit.prevent="handleActionSubmit" novalidate>
      <!-- Edit Profile / Override Form -->
      <div
        v-if="type === 'edit' || type === 'override' || type === 'enrollment-override'"
        class="grid grid-cols-2 gap-lg"
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

        <div class="flex flex-col gap-xs mb-md col-span-2">
          <label class="text-sm font-semibold text-content-dark"
            >Medical Notes / Allergies
            <span
              class="text-2xs font-bold text-content-muted ml-sm uppercase opacity-60"
              v-if="originalData.medicalNote"
              >Original: {{ originalData.medicalNote }}</span
            >
          </label>
          <textarea
            v-model="localData.medicalNote"
            placeholder="e.g. Nut allergy, ADHD..."
            rows="2"
            class="w-full px-md py-sm border-2 border-outline-std rounded-sm bg-white text-sm outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-info-soft disabled:bg-surface-light disabled:cursor-not-allowed disabled:opacity-70"
            :class="{
              'border-error bg-error-soft ring-error/10': errors.medicalNote,
              'animate-shake': shaking.medicalNote,
            }"
            :disabled="type !== 'edit'"
          ></textarea>
          <div
            v-if="errors.medicalNote"
            class="text-error text-3xs font-black px-1 mt-0.5 uppercase tracking-widest"
          >
            {{ errors.medicalNote }}
          </div>
          <div class="flex flex-wrap gap-xs mt-sm" v-if="type === 'edit'">
            <button
              v-for="preset in ['None', 'G6PD', 'ADHD', 'Asthma']"
              :key="preset"
              type="button"
              class="px-[14px] py-[6px] bg-surface-light border-[1.5px] border-outline-std rounded-[6px] text-xs cursor-pointer font-semibold transition-all hover:bg-primary-soft hover:text-primary"
              :class="{
                'bg-primary text-white border-primary hover:bg-primary-dark hover:text-white':
                  isPresetActive('medicalNote', preset),
              }"
              @click="togglePreset('medicalNote', preset)"
            >
              {{ preset }}
            </button>
          </div>
        </div>

        <AppSelect
          v-model="localData.status"
          label="Account Status"
          :items="[
            { id: 'Studying', name: 'Studying' },
            { id: 'Suspended', name: 'Suspended' },
            { id: 'Stopped', name: 'Stopped' },
            { id: 'Graduated', name: 'Graduated' },
          ]"
          required
          :error="errors.status"
          :shake="shaking.status"
          :disabled="type === 'edit' && !['Suspended', 'Stopped'].includes(localData.status)"
          :searchable="false"
          @change="clearError('status')"
        />

        <div
          class="flex flex-col gap-xs mb-md col-span-2"
          v-if="['Suspended', 'Stopped'].includes(localData.status)"
        >
          <label class="text-sm font-semibold text-content-dark"
            >Administrative Remarks <span class="text-error">*</span></label
          >
          <textarea
            v-model="localData.overrideRemark"
            placeholder="Document reason for status change..."
            rows="3"
            class="w-full px-md py-sm border-2 border-outline-std rounded-sm bg-white text-sm outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-info-soft"
            :class="{
              'border-error bg-error-soft ring-error/10': errors.overrideRemark,
              'animate-shake': shaking.overrideRemark,
            }"
          ></textarea>
          <div v-if="errors.overrideRemark" class="text-error text-3xs font-black px-1 mt-0.5 uppercase tracking-widest">
            {{ errors.overrideRemark }}
          </div>
        </div>

        <div class="flex flex-col gap-xs mb-md col-span-2" v-if="type === 'edit'">
          <label class="text-sm font-semibold text-content-dark">Student Profile Avatar</label>
          <AvatarSelector
            v-model="localData.profileURL"
            role="student"
            :uid="student?.id || enrollment?.studentId"
            :customFileName="`${localData.name}_student`"
            :error="errors.profileURL"
            :shake="shaking.profileURL"
          />
        </div>
      </div>

      <!-- Delete Panel -->
      <div v-if="type === 'delete' || type === 'enrollment-delete'" class="mt-lg">
        <div
          class="flex items-center gap-xl p-xl bg-error-soft border border-error-soft rounded-std mb-xl"
        >
          <div class="text-3xl">🚨</div>
          <div class="flex flex-col gap-[2px]">
            <strong class="text-lg text-error-deep">Critical Record Deletion</strong>
            <p class="text-sm text-error-deep opacity-90 leading-relaxed">
              This will permanently remove the record and all associated history. This action cannot
              be undone.
            </p>
          </div>
        </div>

        <AppInput
          v-model="localData.deleteConfirm"
          label="Authorization"
          placeholder="DELETE"
          required
          class="text-center"
          :error="errors.deleteConfirm"
          :shake="shaking.deleteConfirm"
          @input="clearError('deleteConfirm')"
        >
          <template #label-extra>
            <span
              class="block text-2xs font-bold text-center w-full text-content-muted/40 mt-1 uppercase"
            >
              Type <span class="text-error font-extrabold px-1">DELETE</span> to confirm
            </span>
          </template>
        </AppInput>
      </div>
    </form>

    <template #footer>
      <div class="flex flex-col justify-end w-full gap-sm">
        <AppAlert
          v-if="error"
          :show="!!error"
          type="error"
          closable
          @close="$emit('update:error', '')"
        >
          {{ error }}
        </AppAlert>

        <div class="flex items-center justify-end w-full gap-sm">
          <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
          <AppButton
            :variant="type?.includes('delete') ? 'danger' : 'primary'"
            form="studentActionForm"
            type="submit"
            @click="type?.includes('delete') ? handleActionSubmit() : null"
            :loading="loading"
            :disabled="loading"
            :class="{ 'button-disabled-visual': type === 'edit' && !isDirty }"
          >
            {{ submitLabel }}
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, watch } from 'vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
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
  medicalNote: 'None',
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
    medicalNote: source.medicalNote || 'None',
    status: source.status || 'Studying',
    deleteConfirm: '',
    overrideRemark: source.overrideRemark || '',
  }
}

const { localData, originalData, isDirty, errors, shaking, clearError, submitForm } =
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
      if (['Suspended', 'Stopped'].includes(localData.value.status)) {
        return !!val?.trim() || 'Detailed remark is required for this status change.'
      }
      return true
    }
  } else if (props.type?.includes('delete')) {
    rules.custom.deleteConfirm = (val) => val === 'DELETE' || 'Type DELETE to confirm.'
  }

  submitForm(rules)
}

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

const studentThemeClasses = computed(() => {
  if (studentTheme.value === 'theme-pink')
    return 'bg-gradient-to-br from-magenta-soft/50 to-magenta-soft border-magenta-soft/80'
  if (studentTheme.value === 'theme-blue')
    return 'bg-gradient-to-br from-info-soft to-primary-soft border-primary-light'
  return 'bg-gradient-to-br from-bg-subtle to-bg-light border-outline-std'
})

const isPresetActive = (field, chipValue) => {
  const values = (localData.value[field] || '').split(',').map((v) => v.trim())
  return values.includes(chipValue)
}

const togglePreset = (field, chipValue) => {
  let values = (localData.value[field] || '')
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

watch(
  () => props.isOpen,
  (newVal) => {
    if (!newVal) {
      // clearError context is handled by useActionModal
    }
  },
)
</script>
