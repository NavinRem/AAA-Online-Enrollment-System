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

    <form id="studentActionForm" @submit.prevent="handleSubmit">
      <!-- Edit Profile / Override Form -->
      <div
        v-if="type === 'edit' || type === 'override' || type === 'enrollment-override'"
        class="grid grid-cols-2 gap-lg"
      >
        <div
          class="flex flex-col gap-xs mb-md"
          :class="{ 'group is-error': isSubmittingAttempted && errors.name }"
        >
          <label class="text-sm font-semibold text-content-dark"
            >Full Name <span class="text-error">*</span></label
          >
          <input
            type="text"
            v-model="localData.name"
            placeholder="Full Name"
            class="w-full px-md py-sm border-2 border-outline-std rounded-sm bg-white text-sm outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-info-soft disabled:bg-surface-light disabled:cursor-not-allowed disabled:opacity-70 group-[.is-error]:border-error group-[.is-error]:bg-error-soft group-[.is-error]:ring-error/10"
            :disabled="type !== 'edit'"
          />
          <div
            v-if="isSubmittingAttempted && errors.name"
            class="text-error text-xs font-bold mt-1"
          >
            {{ errors.name }}
          </div>
        </div>

        <div
          class="flex flex-col gap-xs mb-md"
          :class="{ 'group is-error': isSubmittingAttempted && errors.dob }"
        >
          <label class="text-sm font-semibold text-content-dark"
            >Date of Birth <span class="text-error">*</span></label
          >
          <input
            type="date"
            v-model="localData.dob"
            class="w-full px-md py-sm border-2 border-outline-std rounded-sm bg-white text-sm outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-info-soft disabled:bg-surface-light disabled:cursor-not-allowed disabled:opacity-70 group-[.is-error]:border-error group-[.is-error]:bg-error-soft group-[.is-error]:ring-error/10"
            :disabled="type !== 'edit'"
          />
          <div v-if="isSubmittingAttempted && errors.dob" class="text-error text-xs font-bold mt-1">
            {{ errors.dob }}
          </div>
        </div>

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
            :disabled="type !== 'edit'"
          ></textarea>
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

        <div
          class="flex flex-col gap-xs mb-md"
          :class="{ 'group is-error': isSubmittingAttempted && errors.status }"
        >
          <label class="text-sm font-semibold text-content-dark"
            >Account Status <span class="text-error">*</span></label
          >
          <select
            v-model="localData.status"
            class="w-full px-md py-sm border-2 border-outline-std rounded-sm bg-white text-sm outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-info-soft disabled:bg-surface-light disabled:cursor-not-allowed disabled:opacity-70 group-[.is-error]:border-error group-[.is-error]:bg-error-soft"
            :disabled="type === 'edit' && !['Suspended', 'Stopped'].includes(localData.status)"
          >
            <option value="Studying">Studying</option>
            <option value="Suspended">Suspended</option>
            <option value="Stopped">Stopped</option>
            <option value="Graduated">Graduated</option>
          </select>
          <div
            v-if="isSubmittingAttempted && errors.status"
            class="text-error text-xs font-bold mt-1"
          >
            {{ errors.status }}
          </div>
        </div>

        <div
          class="flex flex-col gap-xs mb-md col-span-2"
          v-if="['Suspended', 'Stopped'].includes(localData.status)"
          :class="{ 'group is-error': isSubmittingAttempted && errors.overrideRemark }"
        >
          <label class="text-sm font-semibold text-content-dark"
            >Administrative Remarks <span class="text-error">*</span></label
          >
          <textarea
            v-model="localData.overrideRemark"
            placeholder="Document reason for status change..."
            rows="3"
            class="w-full px-md py-sm border-2 border-outline-std rounded-sm bg-white text-sm outline-none transition-all focus:border-primary focus:ring-[3px] focus:ring-info-soft group-[.is-error]:border-error group-[.is-error]:bg-error-soft group-[.is-error]:ring-error/10"
          ></textarea>
          <div
            v-if="isSubmittingAttempted && errors.overrideRemark"
            class="text-error text-xs font-bold mt-1"
          >
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
        <div class="mt-xl flex flex-col gap-sm">
          <label class="text-sm font-bold text-center w-full text-content-dark"
            >Type <span class="text-error font-extrabold px-1">DELETE</span> to confirm</label
          >
          <input
            type="text"
            v-model="localData.deleteConfirm"
            placeholder="DELETE"
            class="w-full p-md border-[3px] border-outline-std rounded-std text-center font-[800] tracking-[2px] transition-all bg-surface-subtle font-inherit text-lg outline-none focus:border-error focus:bg-white focus:ring-[5px] focus:ring-error/10"
          />
          <div
            v-if="isSubmittingAttempted && errors.deleteConfirm"
            class="text-error text-xs font-bold text-center mt-1"
          >
            {{ errors.deleteConfirm }}
          </div>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="flex flex-col justify-end w-full gap-sm">
        <transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="transform -translate-y-2 opacity-0"
          enter-to-class="transform translate-y-0 opacity-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <AppAlert
            v-if="error"
            :show="!!error"
            type="error"
            closable
            @close="$emit('update:error', '')"
          >
            {{ error }}
          </AppAlert>
        </transition>

        <div class="flex items-center justify-end w-full gap-sm">
          <AppButton variant="cancel" @click="$emit('close')">Cancel</AppButton>
          <AppButton
            :variant="type?.includes('delete') ? 'danger' : 'primary'"
            form="studentActionForm"
            type="submit"
            :loading="loading"
            :disabled="loading"
            :class="{ 'button-disabled-visual': isFormInvalid || (type === 'edit' && !isChanged) }"
          >
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

const originalData = ref({})
const initialDataString = ref('')
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
  originalData.value = { ...data }
  initialDataString.value = JSON.stringify(data)
}

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      syncData()
      isSubmittingAttempted.value = false
    }
  },
)

const isChanged = computed(() => {
  if (props.type !== 'edit') return true
  const current = JSON.stringify(localData.value)
  const base = initialDataString.value

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
    if (
      ['Suspended', 'Stopped'].includes(localData.value.status) &&
      !localData.value.overrideRemark?.trim()
    ) {
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

const handleSubmit = () => {
  isSubmittingAttempted.value = true
  if (isFormInvalid.value || (props.type === 'edit' && !isChanged.value)) return
  emit('submit', { ...localData.value })
}
</script>

<style scoped>
/* Scoped styles removed in favor of Tailwind utilities */
</style>
