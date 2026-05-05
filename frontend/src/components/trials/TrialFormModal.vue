<script setup>
import { ref, computed, watch } from 'vue'
import { useForm } from '@/composables/useForm'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AvatarSelector from '@/components/common/ui/AvatarSelector.vue'
import AppConfirmOverlay from '@/components/common/ui/AppConfirmOverlay.vue'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { formatDateOnly } from '@/utils/formatUtils'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  loading: { type: Boolean, default: false },
  trial: { type: Object, default: null },
  parents: { type: Array, default: () => [] },
  students: { type: Array, default: () => [] },
  programs: { type: Array, default: () => [] },
  branches: { type: Array, default: () => [] },
  error: { type: String, default: '' },
  success: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])

const { form, errors, shaking, validate, clearError, triggerShake, resetForm } = useForm({
  isGuest: false,
  studentId: '',
  parentId: '',
  programId: '',
  branchId: '',
  trialDate: new Date().toISOString().split('T')[0],
  trialTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  status: 'pending',
  trialType: 'booked',
  isSuccessful: false,
  remark: '',
  // Guest fields
  guestParentName: '',
  guestParentEmail: '',
  guestParentPhone: '',
  guestParentAvatar: '',
  guestStudentName: '',
  guestStudentDOB: '',
  guestStudentAge: '',
  guestStudentAvatar: '',
})

const showConfirm = ref(false)

const isEditMode = computed(() => !!props.trial)
const initialDataString = ref('')
const isChanged = computed(
  () => !isEditMode.value || JSON.stringify(form) !== initialDataString.value,
)

const hasAnyError = computed(() => Object.values(errors).some((e) => !!e))

const resolveId = (val) => (val && typeof val === 'object' ? val.id : val)

const selectedProgram = computed(() =>
  props.programs.find((p) => p.id === resolveId(form.programId)),
)
const selectedBranch = computed(() =>
  props.branches.find((b) => b.id === resolveId(form.branchId)),
)
const selectedStudent = computed(() =>
  props.students.find((s) => s.id === resolveId(form.studentId)),
)

const parentSelectItems = computed(() =>
  props.parents.map((p) => ({
    id: p.id,
    name: p.name,
    profileURL: p.profileURL,
  }))
)

const studentSelectItems = computed(() =>
  props.students
    .filter((s) => s.parentId === form.parentId)
    .map((s) => ({
      id: s.id,
      name: s.name,
      profileURL: s.profileURL,
      age: s.age,
    }))
)

const programSelectItems = computed(() =>
  props.programs.map((p) => ({
    id: p.id,
    name: p.name,
    profileURL: p.profileURL,
    type: p.type,
  }))
)

const branchSelectItems = computed(() =>
  props.branches.map((b) => ({
    id: b.id,
    name: b.name,
    abbr: b.abbr,
    profileURL: getImageUrl('branch-default'),
  }))
)

const confirmRows = computed(() => {
  const rows = [
    { key: 'Parent', value: form.isGuest ? form.guestParentName : selectedStudent.value?.parent?.name || 'Registered Parent' },
    { key: 'Student', value: form.isGuest ? form.guestStudentName : selectedStudent.value?.name },
    { key: 'Program', value: selectedProgram.value?.name },
    { key: 'Branch', value: selectedBranch.value?.abbr || selectedBranch.value?.name, badge: true, type: selectedBranch.value?.color },
    { key: 'Schedule', value: `${formatDateOnly(form.trialDate)} @ ${form.trialTime}` },
    { key: 'Type', value: form.isGuest ? 'Walk-in' : 'Booked', valueClass: form.isGuest ? 'text-magenta' : 'text-purple' }
  ]
  if (form.remark) rows.push({ key: 'Remark', value: form.remark, valueClass: 'italic' })
  return rows
})

const requiredFields = computed(() => {
  const fields = ['programId', 'branchId', 'trialDate', 'trialTime']
  if (form.isGuest) {
    fields.push('guestParentName', 'guestStudentName', 'guestParentPhone', 'guestParentAvatar', 'guestStudentAvatar')
  } else {
    fields.push('parentId', 'studentId')
  }
  return fields
})

const isSubmittable = computed(() =>
  requiredFields.value.every((f) => {
    const val = form[f]
    return val !== null && val !== undefined && val !== ''
  }) && (!isEditMode.value || isChanged.value)
)

const handleDisabledClick = (field) => {
  if (field === 'studentId' && !form.parentId) {
    errors.parentId = 'Please select a parent first'
    triggerShake('parentId')
  }
}

const handleParentChange = (uid) => {
  form.parentId = uid
  form.studentId = ''
  clearError('parentId')
}

const handleStudentChange = () => {
  form.programId = ''
  clearError('studentId')
}

const handleProgramChange = (pid) => {
  form.programId = pid
  clearError('programId')
}

const handleBranchChange = (bid) => {
  form.branchId = bid
  clearError('branchId')
}

const handleSubmit = () => {
  const isValid = validate({
    required: requiredFields.value,
  })

  if (!isValid) {
    Object.keys(errors).forEach((key) => {
      if (errors[key]) triggerShake(key)
    })
    return
  }

  if (isEditMode.value && !isChanged.value) {
    errors.remark = 'No changes detected. Please update at least one field.'
    triggerShake('remark')
    return
  }

  showConfirm.value = true
}

const handleFinalSubmit = () => {
  const payload = {
    ...form,
    trialType: form.isGuest ? 'walk-in' : 'booked'
  }
  emit('submit', payload)
  showConfirm.value = false
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      if (props.trial) {
        resetForm({
          ...props.trial,
          trialDate: (props.trial.trialDate || '').split('T')[0],
          trialTime: props.trial.trialTime || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          isGuest: !!props.trial.isGuest,
          isSuccessful: !!props.trial.isSuccessful,
          guestStudentDOB: props.trial.guestStudentDOB ? props.trial.guestStudentDOB.split('T')[0] : '',
        })
        initialDataString.value = JSON.stringify(form)
        showConfirm.value = false
      } else {
        resetForm({
          isGuest: false,
          studentId: '',
          parentId: '',
          programId: '',
          classId: '',
          branchId: '',
          trialDate: new Date().toISOString().split('T')[0],
          trialTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          status: 'pending',
          trialType: 'booked',
          isSuccessful: false,
          remark: '',
          guestParentName: '',
          guestParentEmail: '',
          guestParentPhone: '',
          guestParentAvatar: '',
          guestStudentName: '',
          guestStudentDOB: '',
          guestStudentAge: '',
          guestStudentAvatar: '',
        })
        showConfirm.value = false
      }
    } else {
      clearError()
    }
  },
)

watch(() => form.guestStudentDOB, (dob) => {
  if (dob) {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    form.guestStudentAge = age
  }
})
</script>

<template>
  <AppModal :show="isOpen" @close="$emit('close')"
    :title="isEditMode ? 'Modify Trial Engagement' : 'Book New Trial Session'"
    :icon="getActionIcon(isEditMode ? 'edit' : 'plus')" :error="error" :success="success">
    <form @submit.prevent="handleSubmit" class="enroll-form-root">

      <!-- Engagement Mode Toggle -->
      <div
        class="bg-surface-light/50 p-4 rounded-std border-2 border-dashed border-outline-std flex items-center justify-between">
        <div class="flex flex-col">
          <span class="text-xs font-semibold text-content-dark uppercase tracking-tighter">Engagement Strategy</span>
          <span class="text-[10px] font-semibold text-content-muted mt-0.5">Choose between registered accounts or guest
            walk-ins</span>
        </div>
        <div class="flex bg-white p-1 rounded-lg border border-outline-std shadow-sm overflow-hidden">
          <button type="button"
            class="px-4 py-1.5 rounded-md text-[10px] font-semibold tracking-widest transition-all"
            :class="!form.isGuest ? 'bg-primary text-white shadow-md font-bold' : 'text-content-muted hover:bg-surface-light'"
            @click="form.isGuest = false">Registered</button>
          <button type="button"
            class="px-4 py-1.5 rounded-md text-[10px] font-semibold tracking-widest transition-all"
            :class="form.isGuest ? 'bg-primary text-white shadow-md font-bold' : 'text-content-muted hover:bg-surface-light'"
            @click="form.isGuest = true">Guest/Walk-in</button>
        </div>
      </div>

      <div class="ui-form-grid">
        <template v-if="!form.isGuest">
          <!-- Registered Flow -->
          <AppSelect v-model="form.parentId" :items="parentSelectItems" label="Parent Name"
            placeholder="Search Active Parent..." required :error="errors.parentId" :shake="shaking.parentId"
            @change="handleParentChange" />

          <AppSelect v-model="form.studentId" :items="studentSelectItems" label="Student Name"
            placeholder="Search Active Student..." required :disabled="!form.parentId" :error="errors.studentId"
            :shake="shaking.studentId" @change="handleStudentChange" @click-disabled="handleDisabledClick('studentId')">
            <template #selected-badge="{ item }">
              <AppBadge v-if="item.age" status="student" class="mr-4">
                {{ item.age }} years old
              </AppBadge>
            </template>
            <template #item-badge="{ item }">
              <AppBadge v-if="item.age" status="student">
                {{ item.age }} years old
              </AppBadge>
            </template>
          </AppSelect>
        </template>

        <template v-else>
          <!-- Guest Flow -->
          <div
            class="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 bg-surface-subtle/30 p-4 rounded-md border border-outline-std">
            <!-- Parent Profile Section -->
            <div class="col-span-2 flex items-center gap-2 border-b border-outline-std pb-2">
              <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span class="text-[10px] font-semibold text-content-muted uppercase tracking-widest">Guest Parent
                Profile</span>
            </div>

            <AppInput v-model="form.guestParentName" label="Full Name" required placeholder="Parent full name..."
              :error="errors.guestParentName" :shake="shaking.guestParentName" @input="clearError('guestParentName')" />

            <AppInput v-model="form.guestParentPhone" label="Contact Phone" required
              placeholder="Primary phone number..." :error="errors.guestParentPhone" :shake="shaking.guestParentPhone"
              @input="clearError('guestParentPhone')" />

            <AppInput v-model="form.guestParentEmail" label="Email Address (Optional)"
              placeholder="e.g. parent@example.com" />

            <AvatarSelector v-model="form.guestParentAvatar" label="Choose Parent Avatar" required
              :error="errors.guestParentAvatar" :shake="shaking.guestParentAvatar"
              @update:modelValue="clearError('guestParentAvatar')" />

            <!-- Student Profile Section -->
            <div class="col-span-2 flex items-center gap-2 border-b border-outline-std pb-2 mt-4">
              <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span class="text-[10px] font-semibold text-content-muted uppercase tracking-widest">Guest Student
                Profile</span>
            </div>

            <AppInput v-model="form.guestStudentName" label="Student Name" required placeholder="Student full name..."
              :error="errors.guestStudentName" :shake="shaking.guestStudentName"
              @input="clearError('guestStudentName')" />

            <AppInput v-model="form.guestStudentDOB" type="date" label="Date of Birth" placeholder="Select DOB..." />

            <AppInput v-model.number="form.guestStudentAge" type="number" label="Age"
              placeholder="Calculated automatically..." readonly />

            <AvatarSelector v-model="form.guestStudentAvatar" label="Choose Student Avatar" required role="student"
              :error="errors.guestStudentAvatar" :shake="shaking.guestStudentAvatar"
              @update:modelValue="clearError('guestStudentAvatar')" />
          </div>
        </template>

        <!-- Session Selection -->
        <div class="col-span-2 grid grid-cols-2 gap-4">
          <AppSelect v-model="form.programId" :items="programSelectItems" label="Trial Program"
            placeholder="Select Program..." required :error="errors.programId" :shake="shaking.programId"
            @change="handleProgramChange">
            <template #selected-badge="{ item }">
              <AppBadge :status="item.type" class="mr-4" />
            </template>
          </AppSelect>

          <AppSelect v-model="form.branchId" :items="branchSelectItems" label="Trial Branch"
            placeholder="Select Branch..." required :error="errors.branchId" :shake="shaking.branchId"
            @change="handleBranchChange">
            <template #selected-badge="{ item }">
              <AppBadge v-if="item.abbr" :status="item.abbr" class="mr-4" />
            </template>
          </AppSelect>
        </div>

        <div class="col-span-2 grid grid-cols-2 gap-4">
          <AppInput v-model="form.trialDate" type="date" label="Trial Date" required :error="errors.trialDate"
            :shake="shaking.trialDate" @input="clearError('trialDate')" />
          <AppInput v-model="form.trialTime" type="time" label="Trial Time" required :error="errors.trialTime"
            :shake="shaking.trialTime" @input="clearError('trialTime')" />
        </div>
      </div>

      <!-- Detail Panel -->
      <transition enter-active-class="transition duration-500 ease-out" enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0">
        <div v-if="form.programId && form.branchId" class="enrollment-detail-panel">
          <div class="enroll-twin-card">
            <span class="enroll-section-label">Trial Context Overview</span>
            <div class="enroll-info-grid">
              <div class="enroll-info-item">
                <span class="enroll-info-key">Program</span>
                <span class="enroll-info-val">{{ selectedProgram?.name || '—' }}</span>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Type</span>
                <AppBadge :status="selectedProgram?.type" class="mt-[2px]" />
              </div>
              <div class="enroll-info-item col-span-2">
                <span class="enroll-info-key">Branch</span>
                <div class="flex items-center gap-2">
                  <AppBadge :status="selectedBranch?.abbr" class="mt-[2px]" />
                </div>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Trial Schedule</span>
                <span class="enroll-info-val text-primary font-bold">
                  {{ formatDateOnly(form.trialDate) }} @ {{ form.trialTime || '--:--' }}
                </span>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Registry</span>
                <AppBadge :status="form.isGuest ? 'Walk-in' : 'Booked'" :type="form.isGuest ? 'magenta' : 'purple'" />
              </div>
              <div v-if="isEditMode" class="enroll-info-item col-span-2 mt-2 pt-2 border-t border-outline-std/50">
                <span class="enroll-info-key">Conversion Success</span>
                <div class="flex items-center gap-4 mt-1">
                   <div class="ui-box-toggle" :class="{ 'ui-box-toggle--active': form.isSuccessful }"
                    @click="form.isSuccessful = !form.isSuccessful">
                    <span class="text-xs font-bold uppercase tracking-widest" :class="form.isSuccessful ? 'text-success' : 'text-content-muted'">
                      {{ form.isSuccessful ? 'Converted / Successful' : 'Pending / No Enrollment' }}
                    </span>
                  </div>
                  <span class="text-[10px] text-content-muted leading-tight italic">
                    Marking this as successful indicates the student has decided to enroll.
                  </span>
                </div>
              </div>
            </div>
          </div>
          <!-- Administrative Remarks -->
          <div class="enroll-twin-card">
            <span class="enroll-section-label">Administrative Remarks</span>
            <div class="flex flex-col gap-2 mt-2">
              <textarea v-model="form.remark" placeholder="Input specific trial notes or feedback here..." rows="4"
                class="ui-textarea-standard bg-white/50 w-full min-h-[120px]"></textarea>
            </div>
          </div>
        </div>
      </transition>

      <!-- Confirmation Overlay -->
      <AppConfirmOverlay :show="showConfirm" :title="isEditMode ? 'Confirm Trial Changes' : 'Confirm Trial Booking'"
        subtitle="Please review trial details carefully before confirming."
        :icon="getImageUrl('enrollment/total-enrollment')" :rows="confirmRows"
        :confirmLabel="isEditMode ? 'Update' : 'Add'" :loading="loading" @back="showConfirm = false"
        @confirm="handleFinalSubmit" />
    </form>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <div>
          <div v-if="hasAnyError" class="text-error font-semibold text-sm flex items-center gap-2">
            <span>⚠</span> Please resolve highlighted issues.
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button type="button" class="ui-btn-cancel" @click="$emit('close')">
            Cancel
          </button>
          <AppButton type="button" variant="primary" :loading="loading" class="ui-btn-premium" :disabled="loading"
            :class="{ 'opacity-50 grayscale-[0.3]': !isSubmittable || (isEditMode && !isChanged) }"
            @click="handleSubmit">
            {{ isEditMode ? 'Update' : 'Add' }}
          </AppButton>
        </div>
      </div>
    </template>
  </AppModal>
</template>

<style scoped></style>
