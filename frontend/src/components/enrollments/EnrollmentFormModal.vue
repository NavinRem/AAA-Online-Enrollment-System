<template>
  <AppModal :show="isOpen" @close="$emit('close')"
    :title="isEditMode ? 'Edit Enrollment Record' : 'Create New Enrollment'"
    :icon="getActionIcon(isEditMode ? 'edit' : 'plus')">
    <form id="enrollmentForm" novalidate @submit.prevent="validateAndSubmit" class="enroll-form-root">
      <div class="ui-form-grid">
        <!-- Parent Selection -->
        <AppSelect v-model="form.parentId"
          :items="activeParents.map((p) => ({ id: p.id, name: p.name, profileURL: p.profileURL }))"
          label="Parent Name" placeholder="Search Active Parent..." required :disabled="isSelectionLocked"
          :error="errors.parentId" :shake="shaking.parentId" @change="selectParent" />

        <!-- Student Selection -->
        <AppSelect v-model="form.studentId"
          :items="availableStudents.map((s) => ({ id: s.id, name: s.name, profileURL: s.profileURL, dob: s.dob }))"
          label="Student Name" placeholder="Search Active Student..." required
          :disabled="!form.parentId || isSelectionLocked" :error="errors.studentId" :shake="shaking.studentId"
          @change="handleStudentChange" @click-disabled="handleDisabledClick('studentId')">
          <template #selected-badge="{ item }">
            <StatusBadge v-if="item.dob" status="student" class="mr-4">
              {{ calculateAge(item.dob) }} years old
            </StatusBadge>
          </template>
          <template #item-badge="{ item }">
            <StatusBadge v-if="item.dob" status="student">
              {{ calculateAge(item.dob) }} years old
            </StatusBadge>
          </template>
        </AppSelect>

        <!-- Program Selection -->
        <AppSelect v-model="form.programId"
          :items="availableProgramsForStudent.map((p) => ({ id: p.id, name: p.title, profileURL: p.profileURL, type: p.type || 'group' }))"
          label="Program Name" placeholder="Choose Program..." required class="col-span-2 sm:col-span-1"
          :disabled="!form.studentId" :error="errors.programId" :shake="shaking.programId" @change="handleProgramChange"
          @click-disabled="handleDisabledClick('programId')">
          <template #selected-badge="{ item }">
            <StatusBadge :status="item.type" class="mr-4" />
          </template>
          <template #item-badge="{ item }">
            <StatusBadge :status="item.type" />
          </template>
        </AppSelect>

        <!-- Class Slot Selection -->
        <AppSelect v-model="form.classId" :items="availableClasses.map((cl) => ({
          id: cl.id,
          name: `${cl.day} (${cl.timeslot}) - ${cl.numStudent}/${cl.capacity} enrolled`,
          branchAbbr: cl.branch?.abbr,
          capacity: cl.capacity,
          numStudent: cl.numStudent,
        }))" label="Schedule And Branch" placeholder="Select Slot..." required class="col-span-2 sm:col-span-1"
          :disabled="!form.programId" :error="errors.classId" :shake="shaking.classId" @change="clearError('classId')"
          @click-disabled="handleDisabledClick('classId')">
          <template #selected-badge="{ item }">
            <StatusBadge v-if="item.branchAbbr" :status="item.branchAbbr" class="mr-4" />
          </template>
          <template #item-badge="{ item }">
            <StatusBadge v-if="item.branchAbbr" :status="item.branchAbbr" />
          </template>
        </AppSelect>
      </div>

      <!-- Unified Enrollment Detail Panel — shown when both program and class are selected -->
      <transition enter-active-class="transition duration-500 ease-out" enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0">
        <div v-if="form.programId && form.classId" class="enrollment-detail-panel">

          <!-- ── Program Overview (card, twin of Economic Adjustments) ── -->
          <div class="enroll-twin-card">
            <span class="enroll-section-label">Program Overview</span>
            <div class="enroll-info-grid">
              <div class="enroll-info-item">
                <span class="enroll-info-key">Program</span>
                <span class="enroll-info-val">{{ selectedClass?.program?.title || '—' }}</span>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Type</span>
                <StatusBadge :status="selectedClass?.program?.type" class="mt-[2px] " />
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Term</span>
                <span class="enroll-info-val">{{ selectedClass?.term?.name || '—' }}</span>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Branch</span>
                <StatusBadge :status="selectedClass?.branch?.abbr" class="mt-[2px] " />
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Start Date</span>
                <span class="enroll-info-val">{{ formatDateOnly(selectedClass?.term?.startDate) }}</span>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">End Date</span>
                <span class="enroll-info-val">{{ formatDateOnly(selectedClass?.term?.endDate) }}</span>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Total Sessions</span>
                <span class="enroll-info-val enroll-info-val--strong">{{
                  (selectedProgram?.sessionNumber
                    || '—') }}</span>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Remaining</span>
                <span class="enroll-info-val" :class="sessionInfo?.passed > 0 ? 'enroll-info-val--primary' : ''">
                  {{ sessionInfo?.remaining ?? '—' }}
                  <span v-if="sessionInfo?.passed > 0" class="enroll-info-sub">({{ sessionInfo.passed }} passed)</span>
                </span>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Base Price</span>
                <StatusBadge class="" :status="'$' + formatPrice(selectedProgram?.basePrice || 0)"
                  :type="(selectedProgram?.type || 'Full').toLowerCase() === 'partial' ? 'purple' : 'magenta'">
                </StatusBadge>
              </div>
            </div>
          </div>

          <!-- ── Economic Adjustments ── -->
          <div class="enroll-twin-card enroll-adjustments-card">
            <span class="enroll-section-label">Economic Adjustments</span>
            <div class="enroll-info-grid">
              <!-- Billing Mode (Proration) -->
              <div class="enroll-info-item">
                <span class="enroll-info-key">Billing Mode</span>
                <div class="ui-box-toggle" :class="{ 'ui-box-toggle--active': form.isProrated }"
                  @click="form.isProrated = !form.isProrated">
                  <StatusBadge :status="form.isProrated ? 'Partial' : 'Full'" />
                </div>
              </div>

              <!-- Sponsorship Toggle -->
              <div class="enroll-info-item">
                <span class="enroll-info-key">Sponsorship</span>
                <div class="ui-box-toggle" :class="{ 'ui-box-toggle--active': form.isSponsorship }"
                  @click="form.isSponsorship = !form.isSponsorship">
                  <StatusBadge :status="form.isSponsorship ? 'Sponsored' : 'Parent Paid'" />
                </div>
              </div>

              <!-- Sponsor Name (Conditional) -->
              <transition enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0">
                <div v-if="form.isSponsorship" class="enroll-info-item col-span-2">
                  <AppInput v-model="form.sponsorName" label="Specify Sponsor / Agency" required
                    placeholder="e.g. Corporate, NGO, NGO Plus..." inputClass="bg-primary-soft/30 border-primary/20"
                    :error="errors.sponsorName" :shake="shaking.sponsorName" @input="clearError('sponsorName')" />
                </div>
              </transition>

              <!-- Manual Discount -->
              <div class="enroll-info-item">
                <span class="enroll-info-key">Discount Logic</span>
                <div class="flex items-center gap-2 mt-0.5">
                  <AppInput v-model.number="form.discountAmount" type="number" placeholder="0"
                    inputClass="!py-1.5 text-sm font-bold w-24" @input="clearError('discountAmount')">
                  </AppInput>

                  <!-- Type Switcher (Simple Professional style) -->
                  <div class="flex bg-surface-subtle border border-outline-std rounded-sm p-0.5">
                    <button type="button" @click="form.discountType = 'dollar'"
                      class="px-2 py-1 rounded-xs text-[10px] font-black uppercase tracking-widest transition-all"
                      :class="form.discountType === 'dollar' ? 'bg-primary text-white shadow-sm rounded-sm' : 'text-content-muted hover:text-content-dark'">
                      $
                    </button>
                    <button type="button" @click="form.discountType = 'percent'"
                      class="px-1.5 py-1 rounded-xs text-[10px] font-black uppercase tracking-widest transition-all"
                      :class="form.discountType === 'percent' ? 'bg-primary text-white shadow-sm rounded-sm' : 'text-content-muted hover:text-content-dark'">
                      %
                    </button>
                  </div>
                  <span v-if="form.discountAmount > 0"
                    class="text-3xs font-black text-error uppercase ml-auto">Applied</span>
                </div>
              </div>

              <!-- Custom Override Toggle -->
              <div class="enroll-info-item">
                <span class="enroll-info-key">Price Control</span>
                <div class="ui-box-toggle" :class="{ 'ui-box-toggle--danger': form.isCustomPrice }"
                  @click="form.isCustomPrice = !form.isCustomPrice">
                  <span class="text-sm font-bold" :class="{ 'text-error': form.isCustomPrice }">
                    {{ form.isCustomPrice ? 'Override' : 'Locked' }}
                  </span>
                  <span class="text-3xs font-black uppercase opacity-40">{{ form.isCustomPrice ? 'Custom' : 'Standard'
                  }}</span>
                </div>
              </div>

              <!-- Custom Price Input -->
              <transition enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0">
                <div v-if="form.isCustomPrice" class="enroll-info-item col-span-2">
                  <AppInput v-model.number="form.customPrice" type="number" label="Custom Override Price ($)" required
                    placeholder="0" inputClass="border-error focus:ring-error/20 bg-error-soft/10"
                    @input="clearError('customPrice')" :error="errors.customPrice" :shake="shaking.customPrice">
                  </AppInput>
                </div>
              </transition>

              <!-- Tuition Total Card (Price to Pay) -->
              <div class="enroll-info-item col-span-2 mt-2">
                <div class="enroll-tuition-card" :class="{ 'enroll-tuition-card--sponsored': form.isSponsorship }">
                  <div class="enroll-tuition-glow"></div>
                  <div class="enroll-tuition-content">
                    <span class="enroll-tuition-label">{{
                      form.isSponsorship ?
                        'Managed via Sponsoring Agency' : 'Total Price to Pay' }}</span>
                    <div v-if="prorateSavings > 0 && !form.isSponsorship" class="enroll-tuition-savings">
                      Savings Detected: ${{ formatPrice(prorateSavings) }}
                    </div>
                  </div>
                  <span class="enroll-tuition-amount">
                    {{ form.isSponsorship ? '$0.00' : '$' + formatPrice(finalAmount) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="enroll-twin-card enroll-remarks-card" v-if="selectedClass">
            <span class="enroll-section-label">Administrative Remark</span>
            <div class="ui-preset-bar">
              <button
                v-for="preset in ['Trial Session', 'Sibling Discount', 'Sponsorship', 'Special Holiday', 'Scholarship']"
                :key="preset" type="button" class="ui-preset-btn"
                :class="{ 'ui-preset-btn-active': isRemarkPresetActive(preset) }" @click="toggleRemarkPreset(preset)">
                {{ preset }}
              </button>
            </div>
            <textarea v-model="form.remark" placeholder="Input the administrative remark..." rows="3"
              class="ui-remark-textarea"
              :class="{ 'border-error bg-error-soft ring-error/10': errors.remark }"></textarea>
            <div v-if="errors.remark" class="enroll-remark-error">
              {{ errors.remark }}
            </div>
          </div>
        </div>
      </transition>

      <!-- Submit Row — Cancel + Create/Confirm -->
      <div class="enroll-submit-row">
        <div v-if="hasAnyError" class="enroll-submit-error-summary">
          <span class="enroll-submit-error-icon">⚠</span>
          Please fill in all required fields before submitting.
        </div>
        <div class="enroll-submit-actions">
          <button type="button" class="enroll-cancel-btn" @click="$emit('close')">
            Cancel
          </button>
          <AppButton type="button" variant="primary" :loading="loading" class="ui-btn-premium"
            :disabled="loading || !isSubmittable"
            :class="{ 'button-disabled-visual': !isSubmittable || (isEditMode && !isChanged) }" @click="requestConfirm">
            {{ isEditMode ? 'Confirm Changes' : 'Create Enrollment' }}
          </AppButton>
        </div>
      </div>

      <!-- ── Reusable Confirmation Overlay ── -->
      <EnrollConfirmOverlay :show="showConfirm"
        :title="isEditMode ? 'Confirm Enrollment Changes' : 'Confirm Enrollment Details'"
        subtitle="Please review carefully before submitting. This action cannot be easily undone."
        :icon="getImageUrl('enrollment/total-enrollment')" :rows="confirmRows" :totalAmount="finalAmount"
        totalLabel="Price to Pay" :confirmLabel="isEditMode ? 'Confirm Changes' : 'Confirm & Submit'" :loading="loading"
        @back="showConfirm = false" @confirm="confirmAndSubmit" />
    </form>
  </AppModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useForm } from '@/composables/useForm'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import StatusBadge from '@/components/common/ui/StatusBadge.vue'
import EnrollConfirmOverlay from '@/components/enrollments/EnrollConfirmOverlay.vue'
import { getActionIcon, getImageUrl } from '@/utils/assetHelper'
import { formatPrice, formatDateOnly, calculateAge } from '@/utils/formatUtils'
import { getSessionCounts } from '@/utils/programHelper'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  loading: { type: Boolean, default: false },
  parents: { type: Array, default: () => [] },
  students: { type: Array, default: () => [] },
  programs: { type: Array, default: () => [] },
  classes: { type: Array, default: () => [] },
  enrollments: { type: Array, default: () => [] },
  enrollment: { type: Object, default: null },
  error: { type: String, default: '' },
  success: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit', 'program-change', 'register-student'])

const { form, errors, shaking, validate, clearError, triggerShake, resetForm } = useForm({
  parentId: '',
  studentId: '',
  programId: '',
  classId: '',
  isProrated: true,
  discountAmount: null,
  discountType: 'dollar',
  isSponsorship: false,
  sponsorName: '',
  isCustomPrice: false,
  customPrice: null,
  remark: '',
})

const showConfirm = ref(false)

const activeParents = computed(() =>
  (props.parents || []).filter((p) => (p.status || 'Active').toLowerCase() === 'active'),
)

const availableProgramsForStudent = computed(() => {
  const activePrograms = (props.programs || []).filter((p) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (p.endDate && new Date(p.endDate) < today) return false

    const programClasses = props.classes.filter(c => c.programId === p.id)
    if (programClasses.length === 0) return !p.endDate || p.id === props.enrollment?.programId

    return programClasses.some(c => {
      const d = c.term?.endDate
      if (!d) return true
      const classEndDate = new Date(d)
      classEndDate.setHours(23, 59, 59, 999)
      return classEndDate >= today
    })
  })
  if (!form.studentId) return activePrograms
  return activePrograms.filter(
    (program) =>
      !props.enrollments.some(
        (e) =>
          e.id !== props.enrollment?.id &&
          e.studentId === form.studentId &&
          e.programId === program.id &&
          !['cancelled', 'canceled'].includes((e.status || '').toLowerCase()),
      ),
  )
})

const availableStudents = computed(() => {
  if (!form.parentId) return []
  return props.students.filter((s) => s.parentId === form.parentId)
})

const resolveId = (val) => (val && typeof val === 'object' ? val.id : val)

const selectedProgram = computed(() =>
  props.programs.find((c) => c.id === resolveId(form.programId)),
)
const selectedClass = computed(() =>
  props.classes.find((c) => c.id === resolveId(form.classId)),
)
const selectedStudent = computed(() =>
  props.students.find((s) => s.id === resolveId(form.studentId)),
)

const availableClasses = computed(() => {
  if (!form.programId) return []
  return props.classes.filter((cl) => cl.programId === form.programId)
})

const sessionInfo = computed(() => {
  const prog = selectedProgram.value || selectedClass.value?.program
  if (!prog || !selectedClass.value) return null
  return getSessionCounts(prog.startDate, prog.endDate, {
    [selectedClass.value.day]: selectedClass.value.timeslot,
  })
})

const finalAmount = computed(() => {
  if (form.isSponsorship) return 0
  if (form.isCustomPrice) return form.customPrice
  const prog = selectedProgram.value || selectedClass.value?.program
  let price = prog?.basePrice || 0
  if (form.isProrated && sessionInfo.value && sessionInfo.value.total > 0) {
    price = (price / sessionInfo.value.total) * sessionInfo.value.remaining
  }
  let discount = form.discountAmount || 0
  if (form.discountType === 'percent') {
    discount = price * (discount / 100)
  }
  return Math.max(0, price - discount)
})

const prorateSavings = computed(() => {
  const prog = selectedProgram.value || selectedClass.value?.program
  const price = prog?.basePrice || 0
  if (!form.isProrated || !sessionInfo.value || price <= 0 || sessionInfo.value.total <= 0) return 0
  return (price / sessionInfo.value.total) * sessionInfo.value.passed
})

const isEditMode = computed(() => !!props.enrollment)
const initialDataString = ref('')
const isChanged = computed(
  () => !isEditMode.value || JSON.stringify(form) !== initialDataString.value,
)
const isSelectionLocked = computed(() => isEditMode.value)

// Show error summary banner when there are any active errors
const hasAnyError = computed(() => Object.values(errors).some((e) => !!e))

const handleDisabledClick = (field) => {
  if (isSelectionLocked.value && (field === 'parentId' || field === 'studentId')) return

  if (field === 'studentId' && !form.parentId) {
    errors.parentId = 'Please select a parent first'
    triggerShake('parentId')
  } else if (field === 'programId' && !form.studentId) {
    errors.studentId = 'Please select a student first'
    triggerShake('studentId')
  } else if (field === 'classId' && !form.programId) {
    errors.programId = 'Please select a program first'
    triggerShake('programId')
  }
}

const requiredFields = computed(() => {
  const fields = ['parentId', 'studentId', 'programId', 'classId']
  if (form.isSponsorship) fields.push('sponsorName')
  if (form.isCustomPrice) fields.push('customPrice')
  return fields
})

// Disable submit button proactively when required fields are empty
const isSubmittable = computed(() =>
  requiredFields.value.every((f) => {
    const val = form[f]
    return val !== null && val !== undefined && val !== '' && val !== 0
  }) && (!isEditMode.value || isChanged.value)
)

// Build the rows for the confirmation overlay dynamically
const confirmRows = computed(() => [
  { key: 'Student', value: selectedStudent.value?.name },
  { key: 'Program', value: selectedClass.value?.program?.title, badge: false },
  { key: 'Type', value: selectedClass.value?.program?.type, badge: true },
  { key: 'Schedule', value: selectedClass.value ? `${selectedClass.value.day} (${selectedClass.value.timeslot})` : null },
  { key: 'Branch', value: selectedClass.value?.branch?.abbr || selectedClass.value?.branch?.name, badge: true },
  { key: 'Sessions', value: `${sessionInfo.value?.remaining ?? '—'} remaining / ${sessionInfo.value?.total ?? '—'} total` },
  { key: 'Proration', value: form.isProrated ? 'Applied' : 'Not applied' },
  ...(form.discountAmount > 0 ? [{ key: 'Discount', value: `${form.discountType === 'dollar' ? '-$' : '-'}${formatPrice(form.discountAmount)}${form.discountType === 'percent' ? '%' : ''}` }] : []),
  ...(form.sponsorName ? [{ key: 'Sponsor', value: form.sponsorName }] : []),
  ...(form.remark ? [{ key: 'Remark', value: form.remark, valueClass: 'italic' }] : []),
])

const validateAndSubmit = () => {
  const isValid = validate({
    required: requiredFields.value,
  })

  if (!isValid || (isEditMode.value && !isChanged.value)) return

  emit('submit', {
    ...(isEditMode.value ? { id: props.enrollment.id } : {}),
    ...form,
    amount: finalAmount.value,
    sessionTotal: sessionInfo.value?.total ?? 0,
    sessionRemaining: sessionInfo.value?.remaining ?? 0,
    sessionPassed: sessionInfo.value?.passed ?? 0,
    prorateSavings: prorateSavings.value,
    enrollmentType:
      (!form.isProrated || sessionInfo.value?.passed === 0) &&
        !form.isCustomPrice &&
        (form.discountAmount || 0) === 0
        ? 'Full'
        : 'Partial',
  })

  clearError()
}

const requestConfirm = () => {
  const isValid = validate({
    required: requiredFields.value,
  })

  if (!isValid || (isEditMode.value && !isChanged.value)) return
  showConfirm.value = true
}

const confirmAndSubmit = () => {
  showConfirm.value = false
  validateAndSubmit()
}

const selectParent = (uid) => {
  form.parentId = uid
  form.studentId = form.programId = form.classId = ''
  clearError()
}

const handleStudentChange = () => {
  form.programId = ''
  form.classId = ''
  clearError('studentId')
}

const handleProgramChange = (pid) => {
  form.programId = pid
  form.classId = ''
  clearError('programId')
  emit('program-change', pid)
}

const toggleRemarkPreset = (p) => {
  let values = (form.remark || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
  values = values.includes(p) ? values.filter((v) => v !== p) : [...values, p]
  form.remark = values.join(', ')
}

const isRemarkPresetActive = (p) =>
  (form.remark || '')
    .split(',')
    .map((v) => v.trim())
    .includes(p)

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      if (props.enrollment) {
        resetForm(props.enrollment)
        initialDataString.value = JSON.stringify(form)
      } else {
        resetForm({
          parentId: '',
          studentId: '',
          programId: '',
          classId: '',
          isProrated: true,
          discountAmount: 0,
          isCustomPrice: false,
          customPrice: 0,
          remark: '',
        })
      }
    } else {
      clearError()
    }
  },
)

// Logic: Intelligent Defaults for Billing Mode
watch(sessionInfo, (info) => {
  if (!info || isEditMode.value) return
  // Default to Prorated if sessions are partial, else Full Term
  form.isProrated = info.remaining !== info.total
}, { immediate: true })
</script>

<style scoped>
/* =========================================
   Select Badges (inline tags inside selects)
   ========================================= */
.enroll-form-root {
  @apply flex flex-col gap-lg;
}

/* =========================================
   Enrollment Detail Panel
   ========================================= */
.enrollment-detail-panel {
  @apply grid grid-cols-1 md:grid-cols-2 gap-xl bg-surface-light/50 p-xl rounded-std border-2 border-dashed border-outline-std mt-sm;
}

.enroll-remarks-card {
  @apply col-span-1 md:col-span-2;
}

/* =========================================
   Program Overview Info Grid
   ========================================= */
/* Twin card — mirrors the Economic Adjustments card */
.enroll-twin-card {
  @apply bg-white border-2 border-outline-std shadow-sm p-xl rounded-sm flex flex-col gap-sm;
}

.enroll-section-label {
  @apply text-2xs font-black text-content-muted uppercase tracking-widest border-b border-outline-std pb-1 mb-1;
}

.enroll-info-grid {
  @apply grid grid-cols-2 gap-x-lg gap-y-sm;
}

.enroll-info-item {
  @apply flex flex-col gap-[3px];
}

.enroll-info-key {
  @apply text-3xs font-black text-content-muted/60 uppercase tracking-widest;
}

.enroll-info-val {
  @apply text-sm font-bold text-content-dark;
}

.enroll-info-val--primary {
  @apply text-primary font-black;
}

.enroll-info-sub {
  @apply text-3xs text-content-muted ml-1;
}

.enroll-remark-error {
  @apply text-error text-3xs font-black px-1 mt-0.5 uppercase tracking-widest;
}

/* =========================================
   Custom Box Toggle UI Rules (Rectangle Style)
   ========================================= */
.ui-box-toggle {
  @apply flex items-center justify-between px-md min-h-[38px] border-2 border-outline-std rounded-sm bg-surface-subtle cursor-pointer transition-all hover:border-text-muted/30 select-none mt-0.5;
}

.ui-box-toggle--active {
  @apply border-primary bg-white shadow-sm;
}

.ui-box-toggle--danger {
  @apply border-error/30 bg-white shadow-sm;
}

.ui-box-toggle:hover {
  @apply shadow-md -translate-y-px;
}

/* Tuition Total Card (Price to Pay) */
.enroll-tuition-card {
  @apply relative bg-primary text-white p-xl rounded-std flex items-center justify-between shadow-lg border-2 border-primary-deep overflow-hidden mt-sm transition-all duration-300;
  box-shadow: 0 10px 30px rgba(0, 174, 239, 0.35);
}

.enroll-tuition-card--sponsored {
  @apply bg-emerald-500 border-emerald-600;
  box-shadow: 0 10px 30px rgba(16, 185, 129, 0.35);
}

.enroll-tuition-card:hover {
  @apply shadow-xl -translate-y-0.5;
}

.enroll-tuition-glow {
  @apply absolute -top-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-[8px] transition-transform duration-1000;
}

.enroll-tuition-card:hover .enroll-tuition-glow {
  @apply scale-150;
}

.enroll-tuition-content {
  @apply flex flex-col relative z-[1];
}

.enroll-tuition-label {
  @apply text-2xs font-black uppercase tracking-widest opacity-70;
}

.enroll-tuition-savings {
  @apply px-2 py-1 rounded-sm mt-2 bg-white/20 text-3xs font-black uppercase tracking-widest border border-white/10;
}

.enroll-tuition-amount {
  @apply text-3xl font-black tracking-tighter relative z-[1] transition-transform duration-500;
}

.enroll-tuition-card:hover .enroll-tuition-amount {
  @apply scale-105;
}

/* =========================================
   Submit Row
   ========================================= */
.enroll-submit-row {
  @apply flex flex-col gap-sm mt-sm pt-md border-t-2 border-outline-std;
}

.enroll-submit-actions {
  @apply flex items-center justify-end gap-sm;
}

.enroll-submit-error-summary {
  @apply flex items-center gap-xs px-md py-sm bg-error-soft border border-error/25 rounded-sm text-xs font-bold text-error;
}

.enroll-submit-error-icon {
  @apply text-sm flex-shrink-0;
}

.enroll-cancel-btn {
  @apply px-xl py-sm bg-bg-light text-content-muted border-2 border-outline-std rounded-sm text-xs font-bold tracking-wider cursor-pointer transition-all hover:bg-outline-std hover:text-content-dark;
}
</style>
