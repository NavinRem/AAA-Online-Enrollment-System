<script setup>
import { ref, computed, watch } from 'vue'
import { useActionModal } from '@/composables/useActionModal'
import { useModalText } from '@/composables/useModalText'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AvatarSelector from '@/components/common/ui/AvatarSelector.vue'
import AppConfirmOverlay from '@/components/common/ui/AppConfirmOverlay.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import { getImageUrl, getActionIcon, getProgramProfileURL } from '@/utils/assetHelper'
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
  type: { type: String, default: 'add' },
})

const emit = defineEmits(['close', 'submit'])

const getInitialData = () => ({
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
  deleteConfirm: '',
})

const mapSourceToForm = () => {
  if (props.trial) {
    return {
      ...getInitialData(),
      isGuest: !!props.trial.isGuest,
      parentId: props.trial.parentId || props.trial.parent?.id || '',
      studentId: props.trial.studentId || props.trial.student?.id || '',
      programId: props.trial.programId || props.trial.program?.id || '',
      branchId: props.trial.branchId || props.trial.branch?.id || '',
      trialDate: (props.trial.trialDate || '').split('T')[0],
      trialTime: props.trial.trialTime || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      status: props.trial.status || 'pending',
      trialType: props.trial.trialType || (props.trial.isGuest ? 'walk-in' : 'booked'),
      isSuccessful: !!props.trial.isSuccessful,
      remark: props.trial.remark || '',
      guestParentName: props.trial.guestParentName || '',
      guestParentEmail: props.trial.guestParentEmail || '',
      guestParentPhone: props.trial.guestParentPhone || '',
      guestParentAvatar: props.trial.guestParentAvatar || '',
      guestStudentName: props.trial.guestStudentName || '',
      guestStudentDOB: props.trial.guestStudentDOB ? props.trial.guestStudentDOB.split('T')[0] : '',
      guestStudentAge: props.trial.guestStudentAge || '',
      guestStudentAvatar: props.trial.guestStudentAvatar || '',
    }
  }
  return getInitialData()
}

const { localData: form, isDirty, errors, shaking, validate, clearError, triggerShake, getPayload } = useActionModal(props, emit, {
  getInitialData,
  mapSourceToForm,
  sourceKey: 'trial',
  autoClear: 3000,
})

const showConfirm = ref(false)

const isEditMode = computed(() => props.type === 'edit' || (props.type !== 'add' && !!props.trial))
const isChanged = computed(() => !isEditMode.value || isDirty.value)

const resolveId = (val) => (val && typeof val === 'object' ? val.id : val)

const selectedProgram = computed(() =>
  props.programs.find((p) => String(p.id) === String(resolveId(form.programId))),
)
const selectedBranch = computed(() =>
  props.branches.find((b) => String(b.id) === String(resolveId(form.branchId))),
)
const selectedStudent = computed(() =>
  props.students.find((s) => String(s.id) === String(resolveId(form.studentId))),
)

const parentSelectItems = computed(() =>
  props.parents.map((p) => ({
    id: p.id,
    name: p.name,
    profileURL: p.profileURL,
  })),
)

const studentSelectItems = computed(() =>
  props.students
    .filter((s) => String(s.parentId) === String(form.parentId))
    .map((s) => ({
      id: s.id,
      name: s.name,
      profileURL: s.profileURL,
      age: s.age,
    })),
)

const programSelectItems = computed(() =>
  props.programs.map((p) => ({
    id: p.id,
    name: p.name,
    profileURL: getProgramProfileURL(p.profileURL, p.category, p.categoryProfileURL),
    type: p.type,
  })),
)

const branchSelectItems = computed(() =>
  props.branches.map((b) => ({
    id: b.id,
    name: b.name,
    abbr: b.abbr,
    color: b.color,
  })),
)

const confirmRows = computed(() => {
  if (props.type === 'delete') {
    return [
      {
        key: form.isGuest ? 'GuestStudentName' : 'Student',
        value: form.isGuest ? form.guestStudentName : selectedStudent.value?.name,
      },
      { key: 'Program', value: selectedProgram.value?.name },
      { key: 'TrialDate', value: formatDateOnly(form.trialDate) },
      { key: 'Status', value: form.status },
      { key: 'TrialType', value: form.trialType },
      {
        key: 'DeleteConfirm',
        value: form.deleteConfirm,
        valueClass: 'text-error font-bold',
      },
    ]
  }

  const rows = [
    {
      key: form.isGuest ? 'GuestParentName' : 'Parent',
      value: form.isGuest
        ? form.guestParentName
        : selectedStudent.value?.parentInfo?.name || 'Registered Parent',
    },
    {
      key: form.isGuest ? 'GuestStudentName' : 'Student',
      value: form.isGuest ? form.guestStudentName : selectedStudent.value?.name,
    },
    { key: 'Program', value: selectedProgram.value?.name },
    {
      key: 'Branch',
      value: selectedBranch.value?.abbr || selectedBranch.value?.name,
      badge: true,
      type: selectedBranch.value?.color,
    },
    { key: 'TrialDate/Time', value: `${formatDateOnly(form.trialDate)} @ ${form.trialTime}` },
    {
      key: 'TrialType',
      value: form.isGuest ? 'Walk-in' : 'Booked',
      badge: true,
    },
    {
      key: 'Status',
      value: form.status,
      badge: true,
    },
  ]

  if (form.isSuccessful) {
    rows.push({ key: 'Converted', value: 'Successful', badge: true })
  }
  if (form.isGuest) {
    rows.splice(1, 0, { key: 'GuestParentPhone', value: form.guestParentPhone })
  }
  if (form.remark) rows.push({ key: 'Remark', value: form.remark, valueClass: 'italic' })
  return rows
})

const requiredFields = computed(() => {
  const fields = ['programId', 'branchId', 'trialDate', 'trialTime']
  if (form.isGuest) {
    fields.push(
      'guestParentName',
      'guestStudentName',
      'guestParentPhone',
      'guestParentAvatar',
      'guestStudentAvatar',
    )
  } else {
    fields.push('parentId', 'studentId')
  }
  return fields
})

const isFormInvalid = computed(
  () =>
    !requiredFields.value.every((f) => {
      const val = form[f]
      return val !== null && val !== undefined && val !== ''
    }),
)

const handleDisabledClick = (field) => {
  if (field === 'studentId' && !form.parentId) {
    validationMessage.value = 'Please select a parent first'
    setTimeout(() => {
      validationMessage.value = ''
    }, 3000)
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

const validationMessage = ref('')

const handleSubmit = () => {
  validationMessage.value = ''

  if (props.type === 'delete') {
    if (form.deleteConfirm !== 'DELETE') {
      validationMessage.value = 'Please type DELETE to confirm.'
      triggerShake('deleteConfirm')
      return
    }
    showConfirm.value = true
    return
  }

  const isValid = validate({
    required: requiredFields.value,
  })

  if (!isValid) {
    validationMessage.value = 'Please fill out all required fields to proceed.'
    setTimeout(() => {
      validationMessage.value = ''
    }, 3000)
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
    ...getPayload(),
    trialType: form.isGuest ? 'walk-in' : 'booked',
  }
  emit('submit', payload)
  showConfirm.value = false
}

// watch handled by useActionModal

watch(
  () => form.guestStudentDOB,
  (dob) => {
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
  },
)

const { modalTitle, submitLabel, modalIcon } = useModalText(() => props.type, 'Trial')
</script>

<template>
  <AppModal
    :show="isOpen"
    @close="$emit('close')"
    :title="modalTitle"
    :icon="getActionIcon(isEditMode ? 'edit' : 'plus')"
    :error="error"
    :success="success"
  >
    <form @submit.prevent="handleSubmit" class="enroll-form-root">
      <template v-if="type === 'add' || type === 'edit'">
        <!-- Engagement Mode Toggle -->
        <div
          v-if="type === 'add'"
          class="bg-surface-light/50 p-4 rounded-std border-2 border-dashed border-outline-std flex items-center justify-between"
        >
          <div class="flex flex-col">
            <span class="text-sm font-bold text-content-dark tracking-tight"
              >Engagement Strategy</span
            >
            <span class="text-xs font-semibold text-content-muted mt-0.5"
              >Choose between registered accounts or guest walk-ins</span
            >
          </div>
          <div
            class="flex bg-white p-1 rounded-lg border border-outline-std shadow-sm overflow-hidden"
          >
            <button
              type="button"
              class="px-4 py-1.5 rounded-md text-sm font-bold transition-all"
              :class="
                !form.isGuest
                  ? 'bg-primary text-white shadow-md font-bold'
                  : 'text-content-muted hover:bg-surface-light'
              "
              @click="form.isGuest = false"
            >
              Registered
            </button>
            <button
              type="button"
              class="px-4 py-1.5 rounded-md text-sm font-bold transition-all"
              :class="
                form.isGuest
                  ? 'bg-primary text-white shadow-md font-bold'
                  : 'text-content-muted hover:bg-surface-light'
              "
              @click="form.isGuest = true"
            >
              Guest/Walk-in
            </button>
          </div>
        </div>

        <div class="ui-form-grid">
          <template v-if="!form.isGuest">
            <!-- Registered Flow -->
            <AppSelect
              v-model="form.parentId"
              :items="parentSelectItems"
              label="Parent Name"
              placeholder="Search Active Parent..."
              required
              :error="errors.parentId"
              :shake="shaking.parentId"
              @change="handleParentChange"
            />

            <AppSelect
              v-model="form.studentId"
              :items="studentSelectItems"
              label="Student Name"
              placeholder="Search Active Student..."
              required
              :disabled="!form.parentId"
              :error="errors.studentId"
              :shake="shaking.studentId"
              @change="handleStudentChange"
              @click-disabled="handleDisabledClick('studentId')"
            >
              <template #selected-badge="{ item }">
                <AppBadge v-if="item.age" status="student"> {{ item.age }} years old </AppBadge>
              </template>
              <template #item-badge="{ item }">
                <AppBadge v-if="item.age" status="student"> {{ item.age }} years old </AppBadge>
              </template>
            </AppSelect>
          </template>

          <template v-else>
            <!-- Guest Flow -->
            <div
              class="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 bg-surface-subtle/30 p-4 rounded-md border border-outline-std"
            >
              <!-- Parent Profile Section -->
              <div class="col-span-2 flex items-center gap-2 border-b border-outline-std pb-2">
                <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
                <span class="text-sm font-bold text-content-muted">Guest Parent Profile</span>
              </div>

              <AppInput
                v-model="form.guestParentName"
                label="Full Name"
                required
                placeholder="Parent full name..."
                :error="errors.guestParentName"
                :shake="shaking.guestParentName"
                @input="clearError('guestParentName')"
              />

              <AppInput
                v-model="form.guestParentPhone"
                label="Contact Phone"
                required
                placeholder="Primary phone number..."
                :error="errors.guestParentPhone"
                :shake="shaking.guestParentPhone"
                @input="clearError('guestParentPhone')"
              />

              <AppInput
                v-model="form.guestParentEmail"
                label="Email Address (Optional)"
                placeholder="e.g. parent@example.com"
              />

              <AvatarSelector
                v-model="form.guestParentAvatar"
                label="Choose Parent Avatar"
                required
                :error="errors.guestParentAvatar"
                :shake="shaking.guestParentAvatar"
                @update:modelValue="clearError('guestParentAvatar')"
              />

              <!-- Student Profile Section -->
              <div class="col-span-2 flex items-center gap-2 border-b border-outline-std pb-2 mt-4">
                <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
                <span class="text-sm font-bold text-content-muted">Guest Student Profile</span>
              </div>

              <AppInput
                v-model="form.guestStudentName"
                label="Student Name"
                required
                placeholder="Student full name..."
                :error="errors.guestStudentName"
                :shake="shaking.guestStudentName"
                @input="clearError('guestStudentName')"
              />

              <AppInput
                v-model="form.guestStudentDOB"
                type="date"
                label="Date of Birth"
                placeholder="Select DOB..."
              />

              <AppInput
                v-model.number="form.guestStudentAge"
                type="number"
                label="Age"
                placeholder="Calculated automatically..."
                readonly
                disabled
              />

              <AvatarSelector
                v-model="form.guestStudentAvatar"
                label="Choose Student Avatar"
                required
                role="student"
                :error="errors.guestStudentAvatar"
                :shake="shaking.guestStudentAvatar"
                @update:modelValue="clearError('guestStudentAvatar')"
              />
            </div>
          </template>

          <!-- Session Selection -->
          <div class="col-span-2 grid grid-cols-2 gap-4">
            <AppSelect
              v-model="form.programId"
              :items="programSelectItems"
              label="Trial Program"
              placeholder="Select Program..."
              required
              :error="errors.programId"
              :shake="shaking.programId"
              @change="handleProgramChange"
            >
              <template #selected-badge="{ item }">
                <AppBadge :status="item.type" />
              </template>
            </AppSelect>

            <AppSelect
              v-model="form.branchId"
              :items="branchSelectItems"
              label="Trial Branch"
              placeholder="Select Branch..."
              required
              :error="errors.branchId"
              :shake="shaking.branchId"
              @change="handleBranchChange"
            >
              <template #selected="{ item }">
                <div v-if="item" class="flex items-center gap-2 flex-1 overflow-hidden">
                  <span class="text-sm font-semibold text-content-dark truncate flex-1">{{
                    item.name
                  }}</span>
                  <AppBadge v-if="item.abbr" :status="item.abbr" :type="item.color" />
                </div>
              </template>
              <template #item="{ item }">
                <div class="flex items-center justify-between w-full gap-2">
                  <span class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
                  <AppBadge v-if="item.abbr" :status="item.abbr" :type="item.color" />
                </div>
              </template>
            </AppSelect>
          </div>

          <div class="col-span-2 grid grid-cols-2 gap-4">
            <AppInput
              v-model="form.trialDate"
              type="date"
              label="Trial Date"
              required
              :error="errors.trialDate"
              :shake="shaking.trialDate"
              @input="clearError('trialDate')"
            />
            <AppInput
              v-model="form.trialTime"
              type="time"
              label="Trial Time"
              required
              :error="errors.trialTime"
              :shake="shaking.trialTime"
              @input="clearError('trialTime')"
            />
          </div>
        </div>

        <!-- Detail Panel -->
        <transition
          enter-active-class="transition duration-500 ease-out"
          enter-from-class="opacity-0 translate-y-4"
          enter-to-class="opacity-100 translate-y-0"
        >
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
                  <AppBadge :status="selectedProgram?.type" />
                </div>
                <div class="enroll-info-item col-span-2">
                  <span class="enroll-info-key">Branch</span>
                  <div class="flex items-center gap-2">
                    <AppBadge :status="selectedBranch?.abbr" :type="selectedBranch?.color" />
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
                  <AppBadge
                    :status="form.isGuest ? 'Walk-in' : 'Booked'"
                    :type="form.isGuest ? 'magenta' : 'purple'"
                  />
                </div>
                <div
                  v-if="isEditMode"
                  class="enroll-info-item col-span-2 mt-2 pt-2 border-t border-outline-std/50"
                >
                  <span class="enroll-info-key">Trial Status</span>
                  <div class="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      @click="form.status = 'pending'"
                      class="px-3 py-1.5 rounded-md text-xs font-bold transition-all border border-outline-std shadow-sm"
                      :class="
                        form.status === 'pending'
                          ? 'bg-primary text-white border-transparent shadow-primary/30'
                          : 'bg-white text-content-muted hover:bg-surface-light'
                      "
                    >
                      Pending (Booked)
                    </button>
                    <button
                      type="button"
                      @click="form.status = 'confirmed'"
                      class="px-3 py-1.5 rounded-md text-xs font-bold transition-all border border-outline-std shadow-sm"
                      :class="
                        form.status === 'confirmed'
                          ? 'bg-blue-500 text-white border-transparent shadow-blue-500/30'
                          : 'bg-white text-content-muted hover:bg-surface-light'
                      "
                    >
                      Confirmed
                    </button>
                    <button
                      type="button"
                      @click="form.status = 'attended'"
                      class="px-3 py-1.5 rounded-md text-xs font-bold transition-all border border-outline-std shadow-sm"
                      :class="
                        form.status === 'attended'
                          ? 'bg-green-500 text-white border-transparent shadow-green-500/30'
                          : 'bg-white text-content-muted hover:bg-surface-light'
                      "
                    >
                      Attended
                    </button>
                    <button
                      type="button"
                      @click="form.status = 'absent'"
                      class="px-3 py-1.5 rounded-md text-xs font-bold transition-all border border-outline-std shadow-sm"
                      :class="
                        form.status === 'absent'
                          ? 'bg-red-500 text-white border-transparent shadow-red-500/30'
                          : 'bg-white text-content-muted hover:bg-surface-light'
                      "
                    >
                      Absent
                    </button>
                  </div>
                </div>

                <div
                  v-if="isEditMode"
                  class="enroll-info-item col-span-2 mt-2 pt-2 border-t border-outline-std/50"
                >
                  <span class="enroll-info-key">Conversion Success</span>
                  <div class="flex items-center gap-4 mt-1">
                    <div
                      class="ui-box-toggle"
                      :class="{ 'ui-box-toggle--active': form.isSuccessful }"
                      @click="form.isSuccessful = !form.isSuccessful"
                    >
                      <span
                        class="text-sm font-semibold"
                        :class="form.isSuccessful ? 'text-success' : 'text-content-muted'"
                      >
                        {{
                          form.isSuccessful ? 'Converted / Successful' : 'Pending / No Enrollment'
                        }}
                      </span>
                    </div>
                    <span class="text-xs text-content-muted leading-tight italic">
                      Marking this as successful indicates the student has decided to enroll.
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <!-- Administrative Remarks -->
            <div class="enroll-twin-card">
              <AppInput
                v-model="form.remark"
                type="textarea"
                label="Administrative Remarks"
                placeholder="Input specific trial notes or feedback here..."
                :error="errors.remark"
                :shake="shaking.remark"
                @input="clearError('remark')"
              />
            </div>
          </div>
        </transition>
      </template>

      <!-- Content for Delete Action -->
      <div v-if="type === 'delete'" class="flex flex-col gap-lg">
        <AppAlert type="error">
          <div class="flex flex-col gap-0.5">
            <strong class="text-sm font-semibold tracking-tight">⚠ Permanent Data Deletion</strong>
            <span class="text-xs opacity-90 font-medium"
              >This will permanently erase the trial engagement record. This action cannot be
              undone.</span
            >
          </div>
        </AppAlert>

        <AppInput
          v-model="form.deleteConfirm"
          label="Authorization Confirmation"
          placeholder='Type "DELETE" to confirm'
          required
          :error="errors.deleteConfirm"
          :shake="shaking.deleteConfirm"
          @update:modelValue="clearError('deleteConfirm')"
        >
          <template #label-extra>
            <span class="block text-2xs font-semibold mt-0.5">
              Type <span class="text-error px-1 font-semibold">DELETE</span> to authorize this
              permanent action
            </span>
          </template>
        </AppInput>
      </div>

      <!-- ── Confirmation Overlay ── -->
      <AppConfirmOverlay
        :show="showConfirm"
        :title="
          type === 'delete' ? 'Delete Trial' : type === 'edit' ? 'Edit Trial' : 'Book Trial Class'
        "
        :subtitle="
          type === 'delete'
            ? 'This action is irreversible and deletes historical records.'
            : 'Please verify details before proceeding.'
        "
        :icon="modalIcon"
        :image="
          form.isGuest
            ? form.guestStudentAvatar || getImageUrl('profiles/avatar-student')
            : selectedStudent?.profileURL || getImageUrl('profiles/avatar-student')
        "
        :rows="confirmRows"
        :confirmLabel="submitLabel"
        :loading="loading"
        @back="showConfirm = false"
        @confirm="handleFinalSubmit"
      />
    </form>
    <template #footer>
      <div class="flex flex-col justify-end w-full gap-md">
        <AppAlert v-if="isEditMode && !isChanged" type="info" class="w-full">
          No modifications detected. Please update at least one field to enable saving.
        </AppAlert>

        <AppAlert v-if="validationMessage" type="error" class="w-full">
          {{ validationMessage }}
        </AppAlert>

        <div class="flex items-center justify-between w-full">
          <div></div>
          <div class="flex items-center gap-3">
            <button type="button" class="ui-btn-cancel" @click="$emit('close')">Cancel</button>
            <AppButton
              type="button"
              :variant="type === 'delete' ? 'danger' : 'primary'"
              :loading="loading"
              :disabled="loading"
              :class="{
                'button-disabled-visual':
                  (isEditMode && !isChanged) || (type !== 'delete' && isFormInvalid),
              }"
              @click="handleSubmit"
            >
              {{ submitLabel }}
            </AppButton>
          </div>
        </div>
      </div>
    </template>
  </AppModal>
</template>

<style scoped></style>
