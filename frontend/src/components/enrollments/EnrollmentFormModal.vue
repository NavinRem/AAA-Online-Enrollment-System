<script setup>
import { ref, computed, watch } from 'vue'
import { useForm } from '@/composables/useForm'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppConfirmOverlay from '@/components/common/ui/AppConfirmOverlay.vue'
import { getActionIcon, getImageUrl } from '@/utils/assetHelper'
import { formatPrice, formatDateOnly } from '@/utils/formatUtils'
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

const emit = defineEmits(['close', 'submit', 'register-student'])

const REMARK_PRESETS = [
  'Sibling Discount',
  'Sponsorship',
  'Scholarship',
  'Late Enrollment',
  'Ocassional Discount'
]

const { form, errors, shaking, validate, clearError, triggerShake, resetForm } = useForm({
  parentId: '',
  studentId: '',
  programId: '',
  classId: '',
  enrollAt: new Date().toISOString(),
  enrollmentType: '',
  status: '',
  paymentStatus: '',
  isProrated: null,
  isSponsorship: null,
  sponsorName: '',
  discountAmount: null,
  discountType: 'dollar',
  isCustomPrice: null,
  customPrice: null,
  enrolledSessions: 0,
  amount: 0,
  remark: '',
})

const showConfirm = ref(false)

const availablePrograms = computed(() => {
  if (!form.studentId) return []
  return props.programs || []
})

const activeParents = computed(() =>
  (props.parents || []).filter((p) => (p.status || 'Active').toLowerCase() === 'active'),
)

const availableStudents = computed(() => {
  if (!form.parentId) return []
  return props.students.filter((s) => s.parentId === form.parentId)
})

const availableClasses = computed(() => {
  if (!form.programId) return []
  return props.classes.filter((cl) => cl.programId === form.programId)
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

const sessionInfo = computed(() => {
  const cl = selectedClass.value
  if (!cl || !cl.term) return null

  const scheduleMap = (cl.schedules || []).reduce((acc, s) => {
    acc[s.day] = s.timeslot || s.time
    return acc
  }, {})

  return getSessionCounts(cl.term.startDate, cl.term.endDate, scheduleMap)
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

const isSubmittable = computed(() =>
  requiredFields.value.every((f) => {
    const val = form[f]
    return val !== null && val !== undefined && val !== '' && val !== 0
  }) && (!isEditMode.value || isChanged.value)
)

const confirmRows = computed(() => {
  const rows = [
    { key: 'Student', value: selectedStudent.value?.name },
    { key: 'Program', value: selectedClass.value?.program?.name },
    { key: 'Type', value: selectedClass.value?.program?.type, badge: true },
    {
      key: 'Schedule',
      value: selectedClass.value
        ? (selectedClass.value.schedules || []).map((s) => `${s.day} (${s.timeslot || s.time})`).join(', ')
        : null,
    },
    { key: 'Branch', value: selectedClass.value?.branch?.abbr || selectedClass.value?.branch?.name, badge: true, type: selectedClass.value?.branch?.color },
    { key: 'Sessions', value: `${form.enrolledSessions || 0} sessions` },
    { key: 'Proration', value: form.isProrated ? 'Applied' : 'Not applied' },
  ]

  if (form.discountAmount > 0) {
    const symbol = form.discountType === 'dollar' ? '$' : ''
    const suffix = form.discountType === 'percent' ? '%' : ''
    rows.push({ key: 'Discount', value: `-${symbol}${formatPrice(form.discountAmount)}${suffix}` })
  }

  if (form.sponsorName) rows.push({ key: 'Sponsor', value: form.sponsorName })
  if (form.remark) rows.push({ key: 'Remark', value: form.remark, valueClass: 'italic' })

  return rows
})

const parentSelectItems = computed(() =>
  activeParents.value.map((p) => ({
    id: p.id,
    name: p.name,
    profileURL: p.profileURL,
  }))
)

const studentSelectItems = computed(() =>
  availableStudents.value.map((s) => ({
    id: s.id,
    name: s.name,
    profileURL: s.profileURL,
    age: s.age,
  }))
)

const programSelectItems = computed(() =>
  availablePrograms.value.map((p) => ({
    id: p.id,
    name: p.name,
    profileURL: p.profileURL,
    type: p.type,
  }))
)

const classSelectItems = computed(() =>
  availableClasses.value.map((cl) => ({
    id: cl.id,
    name: `${(cl.schedules || []).map((s) => `${s.day} (${s.timeslot || s.time})`).join(', ')} - ${cl.enrolledCount || 0}/${cl.maxCapacity || 0} enrolled`,
    branchAbbr: cl.branch?.abbr,
    maxCapacity: cl.maxCapacity,
    enrolledCount: cl.enrolledCount,
    profileURL: cl.program?.profileURL,
  }))
)

const handleFinalSubmit = () => {
  const isValid = validate({
    required: requiredFields.value,
  })

  if (!isValid || (isEditMode.value && !isChanged.value)) return

  // Calculate values for backend
  const basePrice = selectedProgram.value?.basePrice || 0
  let calculatedDiscount = parseFloat(form.discountAmount || 0)
  if (form.discountType === 'percent') {
    calculatedDiscount = (basePrice * calculatedDiscount) / 100
  }

  const payload = {
    parentId: form.parentId,
    studentId: form.studentId,
    programId: form.programId,
    classId: form.classId,
    enrollAt: form.enrollAt || new Date().toISOString(),
    enrollmentType: form.enrollmentType,
    status: form.status,
    paymentStatus: form.paymentStatus,
    isProrated: !!form.isProrated,
    isSponsorship: !!form.isSponsorship,
    sponsorName: form.sponsorName || '',
    isCustomPrice: !!form.isCustomPrice,
    discountAmount: calculatedDiscount,
    discountType: form.discountType,
    customPrice: parseFloat(form.customPrice || 0),
    enrolledSessions: parseInt(sessionInfo.value?.remaining || 0),
    amount: parseFloat(finalAmount.value || 0),
    remark: form.remark || '',
  }

  if (isEditMode.value) {
    payload.id = props.enrollment.id
  }

  emit('submit', payload)
  clearError()
}

const requestConfirm = () => {
  const isValid = validate({
    required: requiredFields.value,
  })

  if (!isValid) {
    Object.keys(errors).forEach(key => {
      if (errors[key]) triggerShake(key)
    })
    return
  }

  if (isEditMode.value && !isChanged.value) {
    triggerShake()
    return
  }

  showConfirm.value = true
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

watch(
  sessionInfo,
  (info) => {
    if (!info) {
      form.enrolledSessions = 0
      return
    }

    form.enrolledSessions = form.isProrated ? info.remaining : info.total

    if (!isEditMode.value) {
      form.isProrated = info.remaining !== info.total
    }
  },
  { immediate: true },
)
</script>

<template>
  <AppModal :show="isOpen" @close="$emit('close')"
    :title="isEditMode ? 'Edit Enrollment Record' : 'Create New Enrollment'"
    :icon="getActionIcon(isEditMode ? 'edit' : 'plus')">
    <form id="enrollmentForm" novalidate @submit.prevent="validateAndSubmit" class="enroll-form-root">
      <div class="ui-form-grid">
        <!-- Parent Selection -->
        <AppSelect v-model="form.parentId" :items="parentSelectItems" label="Parent Name"
          placeholder="Search Active Parent..." required :disabled="isSelectionLocked" :error="errors.parentId"
          :shake="shaking.parentId" @change="selectParent" />

        <!-- Student Selection -->
        <AppSelect v-model="form.studentId" :items="studentSelectItems" label="Student Name"
          placeholder="Search Active Student..." required :disabled="!form.parentId || isSelectionLocked"
          :error="errors.studentId" :shake="shaking.studentId" @change="handleStudentChange"
          @click-disabled="handleDisabledClick('studentId')">
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

        <!-- Program Selection -->
        <AppSelect v-model="form.programId" :items="programSelectItems" label="Program Name"
          :placeholder="`Select Active Program...`" required class="col-span-2 sm:col-span-1"
          :disabled="!form.studentId" :error="errors.programId" :shake="shaking.programId" @change="handleProgramChange"
          @click-disabled="handleDisabledClick('programId')">
          <template #selected-badge="{ item }">
            <AppBadge :status="item.type" class="mr-4" />
          </template>
          <template #item-badge="{ item }">
            <AppBadge :status="item.type" />
          </template>
        </AppSelect>

        <!-- Class Slot Selection -->
        <AppSelect v-model="form.classId" :items="classSelectItems" label="Schedule And Branch"
          placeholder="Select Active Class..." required class="col-span-2 sm:col-span-1" :disabled="!form.programId"
          :error="errors.classId" :shake="shaking.classId" @change="clearError('classId')"
          @click-disabled="handleDisabledClick('classId')">
          <template #selected-badge="{ item }">
            <AppBadge v-if="item.branchAbbr" :status="item.branchAbbr" class="mr-4" />
          </template>
          <template #item-badge="{ item }">
            <AppBadge v-if="item.branchAbbr" :status="item.branchAbbr" />
          </template>
        </AppSelect>
      </div>

      <transition enter-active-class="transition duration-500 ease-out" enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0">
        <div v-if="form.programId && form.classId" class="enrollment-detail-panel">
          <div class="enroll-twin-card">
            <span class="enroll-section-label">Program Overview</span>
            <div class="enroll-info-grid">
              <div class="enroll-info-item">
                <span class="enroll-info-key">Program</span>
                <span class="enroll-info-val">{{ selectedClass?.program?.name || '—' }}</span>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Type</span>
                <AppBadge :status="selectedClass?.program?.type" class="mt-[2px] " />
              </div>
              <div class="enroll-info-item col-span-2">
                <span class="enroll-info-key">Schedule</span>
                <span class="enroll-info-val text-primary font-bold">
                  {{(selectedClass?.schedules || []).map((s) => `${s.day} (${s.timeslot || s.time || '—'})`).join(', ')
                  }}
                </span>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Term</span>
                <span class="enroll-info-val">{{ selectedClass?.term?.name || '—' }}</span>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Branch</span>
                <AppBadge :status="selectedClass?.branch?.abbr" class="mt-[2px] " />
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
                  (selectedProgram?.totalSessions || '—') }}</span>
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
                <AppBadge class="" :status="'$' + formatPrice(selectedProgram?.basePrice || 0)" type="blue">
                </AppBadge>
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
                  <AppBadge :status="form.isProrated ? 'Full' : 'Partial'" />
                </div>
              </div>

              <!-- Sponsorship Toggle -->
              <div class="enroll-info-item">
                <span class="enroll-info-key">Sponsorship</span>
                <div class="ui-box-toggle" :class="{ 'ui-box-toggle--active': form.isSponsorship }"
                  @click="form.isSponsorship = !form.isSponsorship">
                  <AppBadge :status="form.isSponsorship ? 'Sponsored' : 'Parent Paid'" />
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
                <div class="ui-summary-card" :class="{ 'ui-summary-card--success': form.isSponsorship }">
                  <div class="ui-summary-glow"></div>
                  <div class="ui-summary-content">
                    <span class="ui-summary-label">{{
                      form.isSponsorship ?
                        'Managed via Sponsoring Agency' : 'Total Price to Pay' }}</span>
                    <div v-if="!form.isSponsorship" class="enroll-tuition-savings">
                      Billed Sessions: {{ form.enrolledSessions || 0 }}
                      <span v-if="prorateSavings > 0" class="ml-1 opacity-70">
                        (Saved ${{ formatPrice(prorateSavings) }})
                      </span>
                    </div>
                  </div>
                  <span class="ui-summary-amount">
                    {{ form.isSponsorship ? '$0.00' : '$' + formatPrice(finalAmount) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="enroll-twin-card enroll-remarks-card" v-if="selectedClass">
            <span class="enroll-section-label">Administrative Remark</span>
            <div class="ui-preset-bar">
              <button v-for="preset in REMARK_PRESETS" :key="preset" type="button" class="ui-preset-btn"
                :class="{ 'ui-preset-btn-hover': isRemarkPresetActive(preset) }" @click="toggleRemarkPreset(preset)">
                {{ preset }}
              </button>
            </div>
            <textarea v-model="form.remark" placeholder="Input the administrative remark..." rows="3"
              class="ui-textarea-standard"
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
          <button type="button" class="ui-btn-cancel" @click="$emit('close')">
            Cancel
          </button>
          <AppButton type="button" variant="primary" :loading="loading" class="ui-btn-premium" :disabled="loading"
            :class="{ 'opacity-50 grayscale-[0.3]': !isSubmittable || (isEditMode && !isChanged) }"
            @click="requestConfirm">
            {{ isEditMode ? 'Confirm Changes' : 'Create Enrollment' }}
          </AppButton>
        </div>
      </div>

      <!-- ── Reusable Confirmation Overlay ── -->
      <AppConfirmOverlay :show="showConfirm"
        :title="isEditMode ? 'Confirm Enrollment Changes' : 'Confirm Enrollment Details'"
        subtitle="Please review carefully before submitting. This action cannot be easily undone."
        :icon="getImageUrl('enrollment/total-enrollment')" :rows="confirmRows" :totalAmount="finalAmount"
        totalLabel="Price to Pay" :confirmLabel="isEditMode ? 'Confirm Changes' : 'Confirm & Submit'" :loading="loading"
        @back="showConfirm = false" @confirm="handleFinalSubmit" />
    </form>
  </AppModal>
</template>

<style scoped></style>
