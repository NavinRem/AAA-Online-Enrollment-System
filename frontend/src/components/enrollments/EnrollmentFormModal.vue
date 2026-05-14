<script setup>
import { ref, computed, watch } from 'vue'
import { useForm } from '@/composables/useForm'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppConfirmOverlay from '@/components/common/ui/AppConfirmOverlay.vue'
import { getActionIcon } from '@/utils/assetHelper'
import { formatPrice, formatDateOnly } from '@/utils/formatUtils'
import { getSessionCounts } from '@/utils/programHelper'
import { getProgramProfileURL } from '@/utils/assetHelper'

const props = defineProps({
  isOpen: { type: Boolean, required: true },
  loading: { type: Boolean, default: false },
  parents: { type: Array, default: () => [] },
  students: { type: Array, default: () => [] },
  programs: { type: Array, default: () => [] },
  classes: { type: Array, default: () => [] },
  terms: { type: Array, default: () => [] },
  enrollments: { type: Array, default: () => [] },
  enrollment: { type: Object, default: null },
  error: { type: String, default: '' },
  success: { type: String, default: '' },
})

const emit = defineEmits(['close', 'submit'])

const { form, errors, shaking, validate, clearError, triggerShake, resetForm } = useForm({
  parentId: '',
  studentId: '',
  programId: '',
  classId: '',
  termId: '',
  termOfferingId: '',
  branchId: '',
  scheduleId: '',
  enrollAt: new Date().toISOString(),
  isProrated: false,
  isSponsorship: false,
  sponsorName: '',
  discountAmount: 0,
  discountType: 'dollar',
  isCustomPrice: false,
  customPrice: 0,
  enrolledSessions: 0,
  amount: 0,
  remark: '',
}, { autoClear: 3000 })

const showConfirm = ref(false)
const initialDataString = ref('')
const isEditMode = computed(() => !!props.enrollment)
const isChanged = computed(
  () => !isEditMode.value || JSON.stringify(form) !== initialDataString.value,
)
const hasAnyError = computed(() => Object.values(errors).some(Boolean))

const activeParents = computed(() =>
  (props.parents || []).filter((parent) => (parent.status || 'Active').toLowerCase() === 'active'),
)

const availableStudents = computed(() => {
  if (!form.parentId) return []
  return props.students.filter((student) => student.parentId === form.parentId)
})

const availablePrograms = computed(() => {
  if (!form.studentId) return []
  return props.programs || []
})

const availableClassProducts = computed(() => {
  if (!form.programId) return []
  return props.classes.filter((item) => item.programId === form.programId)
})

const activeUpcomingTerms = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return (props.terms || []).filter(
    (term) => (term.endDate || '') >= today && term.isDeleted !== true,
  )
})

const availableOfferings = computed(() => {
  if (!form.classId || !form.programId) return []

  return activeUpcomingTerms.value.flatMap((term) =>
    (term.offerings || [])
      .filter(
        (offering) => offering.classId === form.classId || offering.program?.id === form.programId,
      )
      .map((offering) => ({
        id: offering.offeringId,
        name: `${offering.branch?.abbr || offering.branch?.name || 'Branch'} - ${offering.schedule?.day || 'Day'} (${offering.schedule?.time || 'Time'})`,
        termId: term.id,
        termName: term.name,
        branch: offering.branch,
        schedule: offering.schedule,
        startDate: term.startDate,
        endDate: term.endDate,
        studentCount: offering.currentCount || (offering.students || []).length || 0,
        totalSessions: term.totalSessions || 0,
      })),
  )
})

const availableBranches = computed(() => {
  if (!form.classId) return []
  const branchMap = new Map()
  availableOfferings.value.forEach((off) => {
    if (off.branch && !branchMap.has(off.branch.id)) {
      branchMap.set(off.branch.id, off.branch)
    }
  })
  return Array.from(branchMap.values()).map((b) => ({
    id: b.id,
    name: b.name,
    abbr: b.abbr,
    profileURL: b.profileURL,
  }))
})

const availableSchedulesForBranch = computed(() => {
  if (!form.classId || !form.branchId) return []
  return availableOfferings.value
    .filter((off) => off.branch?.id === form.branchId)
    .map((off) => ({
      id: off.id,
      name: `${off.schedule?.day} (${off.schedule?.time})`,
      day: off.schedule?.day,
      time: off.schedule?.time,
      studentCount: off.studentCount,
    }))
})

const selectedProgram = computed(() => props.programs.find((item) => item.id === form.programId))
const selectedStudent = computed(() => props.students.find((item) => item.id === form.studentId))
const selectedClass = computed(() => props.classes.find((item) => item.id === form.classId))
const selectedOffering = computed(() =>
  availableOfferings.value.find((item) => item.id === form.termOfferingId),
)

const sessionInfo = computed(() => {
  if (!selectedOffering.value) return null
  return getSessionCounts(selectedOffering.value.startDate, selectedOffering.value.endDate, {
    [selectedOffering.value.schedule?.day || '']: selectedOffering.value.schedule?.time || '',
  })
})

const finalAmount = computed(() => {
  if (form.isSponsorship) return 0
  if (form.isCustomPrice) return Number(form.customPrice || 0)
  let price = selectedProgram.value?.basePrice || 0
  if (form.isProrated && sessionInfo.value && sessionInfo.value.total > 0) {
    price = (price / sessionInfo.value.total) * sessionInfo.value.remaining
  }
  const discountBase = Number(form.discountAmount || 0)
  const discount = form.discountType === 'percent' ? (price * discountBase) / 100 : discountBase
  return Math.max(0, price - discount)
})

const confirmRows = computed(() => [
  { key: 'Student', value: selectedStudent.value?.name || 'N/A' },
  { key: 'Program', value: selectedProgram.value?.name || 'N/A' },
  {
    key: 'Class Product',
    value: selectedClass.value?.program?.name || selectedProgram.value?.name || 'N/A',
  },
  { key: 'Term', value: selectedOffering.value?.termName || 'N/A', badge: true, type: 'blue' },
  {
    key: 'Branch / Schedule',
    value: selectedOffering.value
      ? `${selectedOffering.value.branch?.abbr || selectedOffering.value.branch?.name} - ${selectedOffering.value.schedule?.day} (${selectedOffering.value.schedule?.time})`
      : 'N/A',
  },
  { key: 'Sessions', value: `${form.enrolledSessions || 0} sessions` },
  { key: 'Total', value: `$${formatPrice(finalAmount.value)}` },
])

const parentSelectItems = computed(() =>
  activeParents.value.map((parent) => ({
    id: parent.id,
    name: parent.name,
    profileURL: parent.profileURL,
  })),
)

const studentSelectItems = computed(() =>
  availableStudents.value.map((student) => ({
    id: student.id,
    name: student.name,
    profileURL: student.profileURL,
    age: student.age,
  })),
)

const programSelectItems = computed(() =>
  availablePrograms.value.map((program) => ({
    id: program.id,
    name: program.name,
    profileURL: getProgramProfileURL(
      program.profileURL,
      program.category,
      program.categoryProfileURL,
    ),
    type: program.type,
  })),
)

const classProductItems = computed(() =>
  availableClassProducts.value.map((item) => ({
    id: item.id,
    name: item.program?.name || selectedProgram.value?.name || 'Class Product',
    profileURL: getProgramProfileURL(
      item.program?.profileURL,
      item.program?.category,
      item.program?.categoryProfileURL,
    ),
    schedules: (item.schedules || [])
      .map((schedule) => `${schedule.day} ${schedule.time}`)
      .join(', '),
  })),
)

const branchItems = computed(() =>
  availableBranches.value.map((b) => ({
    id: b.id,
    name: b.name,
    abbr: b.abbr,
    profileURL: b.profileURL,
  })),
)

const scheduleItems = computed(() =>
  availableSchedulesForBranch.value.map((s) => ({
    id: s.id,
    name: s.name,
    meta: `${s.studentCount} enrolled`,
  })),
)

const handleFinalSubmit = () => {
  emit('submit', {
    parentId: form.parentId,
    studentId: form.studentId,
    programId: form.programId,
    classId: form.classId,
    termId: form.termId,
    termOfferingId: form.termOfferingId,
    enrollAt: form.enrollAt || new Date().toISOString(),
    isProrated: !!form.isProrated,
    isSponsorship: !!form.isSponsorship,
    sponsorName: form.sponsorName || '',
    isCustomPrice: !!form.isCustomPrice,
    discountAmount: Number(form.discountAmount || 0),
    discountType: form.discountType,
    customPrice: Number(form.customPrice || 0),
    enrolledSessions: Number(form.enrolledSessions || 0),
    amount: Number(finalAmount.value || 0),
    remark: form.remark || '',
  })
  showConfirm.value = false
}

const requestConfirm = () => {
  const isValid = validate({
    required: ['parentId', 'studentId', 'programId', 'classId', 'termOfferingId', 'enrollAt'],
    custom: {
      discountAmount: (val) => val >= 0 || 'Discount cannot be negative',
      customPrice: (val) => (form.isCustomPrice ? val >= 0 || 'Price cannot be negative' : true),
    },
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

const selectParent = (parentId) => {
  form.parentId = parentId
  form.studentId = ''
  form.programId = ''
  form.classId = ''
  form.termId = ''
  form.termOfferingId = ''
  clearError()
}

const handleStudentChange = () => {
  form.programId = ''
  form.classId = ''
  form.termId = ''
  form.termOfferingId = ''
  clearError('studentId')
}

const handleProgramChange = (programId) => {
  form.programId = programId
  form.classId = ''
  form.termId = ''
  form.termOfferingId = ''
  clearError('programId')
}

const handleClassChange = (classId) => {
  form.classId = classId
  form.termId = ''
  form.termOfferingId = ''
  clearError('classId')
}

const handleBranchChange = (branchId) => {
  form.branchId = branchId
  form.termOfferingId = ''
  form.termId = ''
  clearError('branchId')
}

const handleScheduleChange = (offeringId) => {
  const offering = availableOfferings.value.find((item) => item.id === offeringId)
  form.termOfferingId = offeringId
  form.termId = offering?.termId || ''
  clearError('termOfferingId')
}

watch(
  sessionInfo,
  (info) => {
    form.enrolledSessions = info ? (form.isProrated ? info.remaining : info.total) : 0
  },
  { immediate: true },
)

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      if (props.enrollment) {
        resetForm({
          parentId: props.enrollment.parentId || '',
          studentId: props.enrollment.studentId || '',
          programId: props.enrollment.programId || '',
          classId: props.enrollment.classId || '',
          termId: props.enrollment.termId || props.enrollment.term?.id || '',
          termOfferingId:
            props.enrollment.termOfferingId || props.enrollment.term?.offeringId || '',
          branchId: props.enrollment.class?.branch?.id || props.enrollment.branchId || '',
          scheduleId: props.enrollment.termOfferingId || '',
          enrollAt:
            props.enrollment.enrollAt ||
            props.enrollment.enrollmentDate ||
            new Date().toISOString(),
          isProrated: !!props.enrollment.isProrated,
          isSponsorship: !!props.enrollment.isSponsorship,
          sponsorName: props.enrollment.sponsorName || '',
          discountAmount: props.enrollment.discountAmount || 0,
          discountType: props.enrollment.discountType || 'dollar',
          isCustomPrice: !!props.enrollment.isCustomPrice,
          customPrice: props.enrollment.customPrice || 0,
          enrolledSessions: props.enrollment.enrolledSessions || 0,
          amount: props.enrollment.amount || 0,
          remark: props.enrollment.remark || '',
        })
        initialDataString.value = JSON.stringify(form)
      } else {
        resetForm({
          parentId: '',
          studentId: '',
          programId: '',
          classId: '',
          termId: '',
          termOfferingId: '',
          branchId: '',
          scheduleId: '',
          enrollAt: new Date().toISOString(),
          isProrated: false,
          isSponsorship: false,
          sponsorName: '',
          discountAmount: 0,
          discountType: 'dollar',
          isCustomPrice: false,
          customPrice: 0,
          enrolledSessions: 0,
          amount: 0,
          remark: '',
        })
        initialDataString.value = JSON.stringify(form)
      }
    } else {
      clearError()
    }
  },
  { immediate: true },
)
const setStudent = (studentId) => {
  form.studentId = studentId
  handleStudentChange()
}

defineExpose({ setStudent })
</script>

<template>
  <AppModal
    :show="isOpen"
    @close="$emit('close')"
    :title="isEditMode ? 'Edit Enrollment Record' : 'Create New Enrollment'"
    :icon="getActionIcon(isEditMode ? 'edit' : 'plus')"
    :error="error"
    :success="success"
  >
    <form id="enrollmentForm" novalidate @submit.prevent="requestConfirm" class="enroll-form-root">
      <div class="ui-form-grid">
        <AppSelect
          v-model="form.parentId"
          :items="parentSelectItems"
          label="Parent Name"
          placeholder="Search Active Parent..."
          required
          :error="errors.parentId"
          :shake="shaking.parentId"
          @change="selectParent"
        />

        <AppSelect
          v-model="form.studentId"
          :items="studentSelectItems"
          label="Student Name"
          placeholder="Search Active Student..."
          required
          :error="errors.studentId"
          :shake="shaking.studentId"
          :disabled="!form.parentId"
          @change="handleStudentChange"
        >
          <template #item-badge="{ item }">
            <AppBadge v-if="item.age" status="student">{{ item.age }} years old</AppBadge>
          </template>
        </AppSelect>

        <div v-if="form.parentId && availableStudents.length === 0" class="col-span-2 p-4 bg-warning-soft border border-warning/20 rounded-xl flex items-center gap-3 animate-fade-in">
          <img :src="getActionIcon('cancel')" class="w-5 h-5 brightness-0 grayscale opacity-60" />
          <span class="text-xs font-bold text-content-dark opacity-70">This parent has no children registered. Add a child in the Students module first.</span>
        </div>

        <AppSelect
          v-model="form.programId"
          :items="programSelectItems"
          label="Program"
          placeholder="Select Program..."
          required
          :error="errors.programId"
          :shake="shaking.programId"
          :disabled="!form.studentId"
          @change="handleProgramChange"
        >
          <template #item-badge="{ item }">
            <AppBadge :status="item.type" />
          </template>
        </AppSelect>

        <AppSelect
          v-model="form.classId"
          :items="classProductItems"
          label="Class Product"
          placeholder="Select Class Product..."
          required
          :error="errors.classId"
          :shake="shaking.classId"
          :disabled="!form.programId"
          @change="handleClassChange"
        >
          <template #item-badge="{ item }">
            <AppBadge v-if="item.schedules" :status="item.schedules" type="blue" />
          </template>
        </AppSelect>

        <AppSelect
          v-model="form.branchId"
          :items="branchItems"
          label="Branch"
          placeholder="Select Branch..."
          required
          :error="errors.branchId"
          :shake="shaking.branchId"
          :disabled="!form.classId"
          @change="handleBranchChange"
        >
          <template #item-badge="{ item }">
            <AppBadge v-if="item.abbr" :status="item.abbr" type="blue" />
          </template>
        </AppSelect>

        <AppSelect
          v-model="form.termOfferingId"
          :items="scheduleItems"
          label="Schedule"
          placeholder="Select Schedule..."
          required
          :error="errors.termOfferingId"
          :shake="shaking.termOfferingId"
          :disabled="!form.branchId"
          @change="handleScheduleChange"
        >
          <template #item-badge="{ item }">
            <AppBadge v-if="item.meta" :status="item.meta" type="green" />
          </template>
        </AppSelect>

        <AppInput
          v-model="form.enrollAt"
          type="date"
          label="Enrollment Date"
          required
          :error="errors.enrollAt"
          :shake="shaking.enrollAt"
        />

        <div v-if="form.classId && availableOfferings.length === 0" class="col-span-2 p-4 bg-error-soft border border-error/10 rounded-xl flex items-center gap-3 animate-fade-in">
          <img :src="getActionIcon('cancel')" class="w-5 h-5" />
          <span class="text-xs font-bold text-error">No active or upcoming terms offer this class yet.</span>
        </div>
      </div>

      <transition
        enter-active-class="transition duration-500 ease-out"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
      >
        <div v-if="selectedOffering" class="enrollment-detail-panel">
          <div class="enroll-twin-card">
            <span class="enroll-section-label">Offering Overview</span>
            <div class="enroll-info-grid">
              <div class="enroll-info-item">
                <span class="enroll-info-key">Program</span>
                <span class="enroll-info-val">{{ selectedProgram?.name || '—' }}</span>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Term</span>
                <span class="enroll-info-val">{{ selectedOffering.termName }}</span>
              </div>
              <div class="enroll-info-item col-span-2">
                <span class="enroll-info-key">Schedule</span>
                <span class="enroll-info-val text-primary font-bold">
                  {{ selectedOffering.schedule?.day }} ({{ selectedOffering.schedule?.time }})
                </span>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Branch</span>
                <AppBadge
                  :status="selectedOffering.branch?.abbr || selectedOffering.branch?.name"
                  :type="selectedOffering.branch?.color || 'blue'"
                />
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Students</span>
                <span class="enroll-info-val">{{ selectedOffering.studentCount }}</span>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Start Date</span>
                <span class="enroll-info-val">{{
                  formatDateOnly(selectedOffering.startDate)
                }}</span>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">End Date</span>
                <span class="enroll-info-val">{{ formatDateOnly(selectedOffering.endDate) }}</span>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Remaining</span>
                <span class="enroll-info-val">{{ sessionInfo?.remaining ?? '—' }}</span>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Base Price</span>
                <AppBadge
                  :status="'$' + formatPrice(selectedProgram?.basePrice || 0)"
                  type="blue"
                />
              </div>
            </div>
          </div>

          <div class="enroll-twin-card">
            <span class="enroll-section-label">Pricing</span>
            <div class="enroll-info-grid">
              <div class="enroll-info-item">
                <span class="enroll-info-key">Billing Mode</span>
                <div
                  class="ui-box-toggle"
                  :class="{ 'ui-box-toggle--active': form.isProrated }"
                  @click="form.isProrated = !form.isProrated"
                >
                  <AppBadge :status="form.isProrated ? 'Partial' : 'Full'" />
                </div>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Sponsorship</span>
                <div
                  class="ui-box-toggle"
                  :class="{ 'ui-box-toggle--active': form.isSponsorship }"
                  @click="form.isSponsorship = !form.isSponsorship"
                >
                  <AppBadge :status="form.isSponsorship ? 'Sponsored' : 'Parent Paid'" />
                </div>
              </div>
              <div v-if="form.isSponsorship" class="enroll-info-item col-span-2">
                <AppInput
                  v-model="form.sponsorName"
                  label="Sponsor Name"
                  placeholder="e.g. Corporate Partner"
                  :error="errors.sponsorName"
                  :shake="shaking.sponsorName"
                />
              </div>
              <div class="enroll-info-item">
                <AppInput
                  v-model.number="form.discountAmount"
                  type="number"
                  label="Discount"
                  placeholder="0"
                  :error="errors.discountAmount"
                  :shake="shaking.discountAmount"
                />
              </div>
              <div class="enroll-info-item">
                <div class="flex flex-col gap-2">
                  <span class="enroll-info-key">Discount Type</span>
                  <div class="flex bg-surface-subtle border border-outline-std rounded-sm p-0.5">
                    <button
                      type="button"
                      @click="form.discountType = 'dollar'"
                      class="px-2 py-1 rounded-xs text-3xs font-semibold transition-all"
                      :class="
                        form.discountType === 'dollar'
                          ? 'bg-primary text-white shadow-sm rounded-sm'
                          : 'text-content-muted hover:text-content-dark'
                      "
                    >
                      $
                    </button>
                    <button
                      type="button"
                      @click="form.discountType = 'percent'"
                      class="px-2 py-1 rounded-xs text-3xs font-semibold transition-all"
                      :class="
                        form.discountType === 'percent'
                          ? 'bg-primary text-white shadow-sm rounded-sm'
                          : 'text-content-muted hover:text-content-dark'
                      "
                    >
                      %
                    </button>
                  </div>
                </div>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Custom Price</span>
                <div
                  class="ui-box-toggle"
                  :class="{ 'ui-box-toggle--danger': form.isCustomPrice }"
                  @click="form.isCustomPrice = !form.isCustomPrice"
                >
                  <span class="text-sm font-semibold" :class="{ 'text-error': form.isCustomPrice }">
                    {{ form.isCustomPrice ? 'Override' : 'Locked' }}
                  </span>
                </div>
              </div>
              <div v-if="form.isCustomPrice" class="enroll-info-item">
                <AppInput
                  v-model.number="form.customPrice"
                  type="number"
                  label="Override Price"
                  placeholder="0"
                  :error="errors.customPrice"
                  :shake="shaking.customPrice"
                />
              </div>
              <div class="enroll-info-item col-span-2">
                <AppInput
                  v-model="form.remark"
                  type="textarea"
                  label="Administrative Remark"
                  placeholder="Optional note"
                  :error="errors.remark"
                  :shake="shaking.remark"
                  @input="clearError('remark')"
                />
              </div>
              <div class="enroll-info-item col-span-2 mt-2">
                <div class="ui-summary-card">
                  <div class="ui-summary-content">
                    <span class="ui-summary-label">Total Price to Pay</span>
                    <div class="enroll-tuition-savings">
                      Billed Sessions: {{ form.enrolledSessions || 0 }}
                    </div>
                  </div>
                  <span class="ui-summary-amount">
                    {{ form.isSponsorship ? '$0.00' : '$' + formatPrice(finalAmount) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <AppConfirmOverlay
        :show="showConfirm"
        :title="isEditMode ? 'Confirm Enrollment Changes' : 'Confirm Enrollment Details'"
        subtitle="Please review carefully before submitting."
        :icon="getActionIcon(isEditMode ? 'edit' : 'plus')"
        :rows="confirmRows"
        :totalAmount="finalAmount"
        totalLabel="Price to Pay"
        :confirmLabel="isEditMode ? 'Update' : 'Add'"
        :loading="loading"
        @back="showConfirm = false"
        @confirm="handleFinalSubmit"
      />
    </form>

    <template #footer>
      <div class="flex flex-col justify-end w-full gap-md">
        <AppAlert
          v-if="isEditMode && !isChanged"
          type="info"
          class="w-full"
        >
          No modifications detected. Please update at least one field to enable saving.
        </AppAlert>
        <div class="flex items-center justify-between w-full">
          <div v-if="hasAnyError" class="text-error font-bold text-sm flex items-center gap-2 animate-bounce">
            <img :src="getActionIcon('cancel')" class="w-4 h-4" />
            <span>Please fill in all required fields and correct errors.</span>
          </div>
          <div class="flex items-center gap-3 ml-auto">
            <button type="button" class="ui-btn-cancel" @click="$emit('close')">Cancel</button>
            <AppButton
              type="button"
              variant="primary"
              :loading="loading"
              class="ui-btn-premium"
              :disabled="loading || (isEditMode && !isChanged)"
              :class="{ 'opacity-50 pointer-events-none': isEditMode && !isChanged }"
              @click="requestConfirm"
            >
              {{ isEditMode ? 'Update' : 'Add' }}
            </AppButton>
          </div>
        </div>
      </div>
    </template>
  </AppModal>
</template>

<style scoped></style>
