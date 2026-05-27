<script setup>
import { ref, computed, watch } from 'vue'
import { useForm } from '@/composables/useForm'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppConfirmOverlay from '@/components/common/ui/AppConfirmOverlay.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
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
  type: { type: String, default: 'add' },
})

const emit = defineEmits(['close', 'submit'])

const { form, errors, shaking, validate, clearError, triggerShake, resetForm, getPayload } = useForm(
  {
    parentId: '',
    studentId: '',
    programId: '',
    classId: '',
    termId: '',
    termOfferingId: '',
    branchId: '',
    scheduleId: '',
    enrollAt: new Date().toISOString().split('T')[0],
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
    proof: '',
    bankName: '',
    reason: '',
    deleteConfirm: '',
    paymentMethod: 'online',
    paymentStatus: 'paid',
  },
  { autoClear: 3000 },
)

const cancelPresets = ['Schedule Conflict', 'Relocation', 'Financial Issue', 'Duplicated']
const selectPreset = (preset) => {
  if (form.reason === preset) {
    form.reason = ''
  } else {
    form.reason = preset
  }
}

const showConfirm = ref(false)
const initialDataString = ref('')
const isEditMode = computed(
  () => props.type === 'edit' || (props.type !== 'add' && !!props.enrollment),
)

const displaySummary = computed(() => {
  const e = props.enrollment
  if (!e) return null

  const classObj = e.class || {}
  const branchObj = classObj.branch || e.branch || {}

  return {
    studentName: e.student?.name,
    programName: e.program?.name,
    amount: e.finalPrice || e.totalPrice || e.amount || 0,
    status: e.status || 'Pending',
    studentAvatar: e.student?.profileURL || null,
    parentAvatar: e.parent?.profileURL || null,
    programAvatar: e.program?.profileURL || null,
    parentName: e.parent?.name || 'Parent',
    className: classObj.name || 'N/A',
    scheduleDay: classObj.schedule ? classObj.schedule.day : '',
    scheduleTime: classObj.schedule ? classObj.schedule.startTime : '',
    branchName: branchObj.name || branchObj.abbr || 'HQ',
    branchAbbr: branchObj.abbr || 'HQ',
    branchColor: branchObj.color || 'blue',
  }
})
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

// Removed availableClassProducts as it is replaced by availableOfferings

const activeUpcomingTerms = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return (props.terms || []).filter(
    (term) => (term.endDate || '') >= today && term.isDeleted !== true,
  )
})

const availableOfferings = computed(() => {
  if (!form.programId) return []

  return activeUpcomingTerms.value.flatMap((term) =>
    (term.offerings || [])
      .filter((offering) => {
        const isMatch =
          offering.program?.id === form.programId || offering.class?.programId === form.programId
        if (!isMatch) return false

        const currentCount = offering.currentCount || (offering.students || []).length || 0
        const capacity = offering.capacity || offering.class?.capacity || 20
        return currentCount < capacity
      })
      .map((offering) => ({
        id: offering.offeringId,
        classId: offering.classId,
        className: offering.class?.name || 'Class',
        name: `${offering.branch?.abbr || offering.branch?.name || 'Branch'} - ${offering.schedule?.day || 'Day'} (${offering.schedule?.time || 'Time'})`,
        termId: term.id,
        termName: term.name,
        branch: offering.branch,
        schedule: offering.schedule,
        startDate: term.startDate,
        endDate: term.endDate,
        studentCount: offering.currentCount || (offering.students || []).length || 0,
        capacity: offering.capacity || offering.class?.capacity || 20,
        totalSessions: term.totalSessions || 0,
      })),
  )
})

// Removed availableBranches and availableSchedulesForBranch as they are combined into offeringSelectItems

const selectedProgram = computed(() => props.programs.find((item) => item.id === form.programId))
const selectedStudent = computed(() => props.students.find((item) => item.id === form.studentId))
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

const confirmRows = computed(() => {
  const base = [
    { key: 'Parent', value: props.parents?.find((item) => item.id === form.parentId)?.name || 'N/A' },
    { key: 'Student', value: selectedStudent.value?.name || 'N/A' },
    { key: 'Program', value: selectedProgram.value?.name || 'N/A' },
    { key: 'Class', value: selectedOffering.value?.className || 'N/A' },
    { key: 'Term', value: selectedOffering.value?.termName || 'N/A', badge: true, type: 'blue' },
    {
      key: 'Branch/Schedule',
      value: selectedOffering.value
        ? `${selectedOffering.value.branch?.abbr || selectedOffering.value.branch?.name} - ${selectedOffering.value.schedule?.day} (${selectedOffering.value.schedule?.time})`
        : 'N/A',
    },
    { key: 'EnrolledSessions', value: `${form.enrolledSessions || 0} sessions` },
  ]
  
  if (form.isSponsorship) {
    base.push({ key: 'IsSponsorship', value: 'Yes', valueClass: 'text-primary font-bold' })
  }
  if (form.isProrated) {
    base.push({ key: 'IsProrated', value: 'Yes', valueClass: 'text-warning font-bold' })
  }
  if (form.discountAmount > 0) {
    base.push({ key: 'DiscountAmount', value: form.discountType === 'percent' ? `${form.discountAmount}%` : `$${form.discountAmount}` })
  }
  if (form.isCustomPrice) {
    base.push({ key: 'CustomPrice', value: `$${form.customPrice}` })
  }

  base.push({ key: 'Amount', value: `$${formatPrice(finalAmount.value)}`, valueClass: 'font-bold text-lg text-primary' })

  if (props.type === 'pay') {
    return [
      ...base,
      { key: 'PaymentMethod', value: form.paymentMethod === 'online' ? 'Online / Bank' : 'Cash' },
      ...(form.bankName ? [{ key: 'BankName', value: form.bankName }] : []),
      { key: 'Proof', value: form.proof },
      ...(form.remark ? [{ key: 'Remark', value: form.remark, valueClass: 'italic' }] : []),
    ]
  }
  if (props.type === 'cancel') {
    return [...base, { key: 'Reason', value: form.reason, valueClass: 'italic' }]
  }
  if (props.type === 'delete') {
    return [
      ...base,
      { key: 'Status', value: props.enrollment?.status },
      { key: 'DeleteConfirm', value: form.deleteConfirm, valueClass: 'text-error font-bold' },
    ]
  }
  if (form.remark && props.type !== 'pay' && props.type !== 'cancel') {
    base.push({ key: 'Remark', value: form.remark, valueClass: 'italic' })
  }
  return base
})

const parentSelectItems = computed(() =>
  activeParents.value.map((parent) => ({
    id: parent.id,
    name: parent.name,
    profileURL: parent.profileURL,
    children: (props.students || []).filter((s) => s.parentId === parent.id),
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

const offeringSelectItems = computed(() =>
  availableOfferings.value.map((off) => ({
    id: off.id,
    name: off.name,
    className: off.className,
    branchName: off.branch?.abbr || off.branch?.name,
    branchColor: off.branch?.color || 'blue',
    scheduleDay: off.schedule?.day,
    scheduleTime: off.schedule?.time,
    studentCount: off.studentCount,
    capacity: off.capacity,
    profileURL: off.branch?.profileURL || getActionIcon('navigation/branch'),
  })),
)

// Removed unused select items

const handleFinalSubmit = () => {
  emit('submit', {
    ...getPayload(),
    enrollAt: new Date().toISOString().split('T')[0],
    amount: Number(finalAmount.value || 0),
  })
  showConfirm.value = false
}

const validationMessage = ref('')
const isFormInvalid = computed(() => {
  return (
    !form.parentId ||
    !form.studentId ||
    !form.programId ||
    !form.classId ||
    !form.termOfferingId ||
    form.discountAmount < 0 ||
    (form.isCustomPrice && form.customPrice < 0)
  )
})

const requestConfirm = () => {
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

  if (props.type === 'cancel') {
    if (!form.reason) {
      validationMessage.value = 'Please provide a cancellation reason.'
      triggerShake('reason')
      return
    }
    showConfirm.value = true
    return
  }

  if (props.type === 'pay') {
    if (form.paymentMethod === 'online' && !form.bankName) {
      validationMessage.value = 'Please select a bank.'
      triggerShake('bankName')
      return
    }
    if (!form.proof) {
      validationMessage.value = 'Please provide proof of payment.'
      triggerShake('proof')
      return
    }
    showConfirm.value = true
    return
  }

  const isValid = validate({
    required: ['parentId', 'studentId', 'programId', 'classId', 'termOfferingId'],
    custom: {
      discountAmount: (val) => val >= 0 || 'Discount cannot be negative',
      customPrice: (val) => (form.isCustomPrice ? val >= 0 || 'Price cannot be negative' : true),
    },
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
    validationMessage.value = 'No changes detected. Please update at least one field.'
    setTimeout(() => {
      validationMessage.value = ''
    }, 3000)
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

// Removed handleClassChange and handleBranchChange as they are now handled by handleOfferingChange

const handleOfferingChange = (offeringId) => {
  const offering = availableOfferings.value.find((item) => item.id === offeringId)
  if (offering) {
    form.termOfferingId = offeringId
    form.classId = offering.classId
    form.branchId = offering.branch?.id || ''
    form.termId = offering.termId
  }
  clearError('termOfferingId')
}

const handleDisabledClick = (field) => {
  if (field === 'studentId' && !form.parentId) {
    validationMessage.value = 'Please select a parent first'
    setTimeout(() => { validationMessage.value = '' }, 3000)
    errors.parentId = 'Please select a parent first'
    triggerShake('parentId')
  } else if (field === 'programId' && !form.studentId) {
    validationMessage.value = 'Please select a student first'
    setTimeout(() => { validationMessage.value = '' }, 3000)
    errors.studentId = 'Please select a student first'
    triggerShake('studentId')
  } else if (field === 'termOfferingId' && !form.programId) {
    validationMessage.value = 'Please select a program first'
    setTimeout(() => { validationMessage.value = '' }, 3000)
    errors.programId = 'Please select a program first'
    triggerShake('programId')
  }
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
          enrollAt: (
            props.enrollment.enrollAt ||
            props.enrollment.enrollmentDate ||
            new Date().toISOString()
          ).split('T')[0],
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
          enrollAt: new Date().toISOString().split('T')[0],
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

const modalTitle = computed(() => {
  const titles = {
    pay: 'Pay Enrollment',
    cancel: 'Cancel Enrollment',
    delete: 'Delete Enrollment',
    edit: 'Edit Enrollment',
    add: 'Add Enrollment',
  }
  return titles[props.type] || 'Enrollment Action'
})

const submitLabel = computed(() => {
  if (props.type === 'pay') return 'Pay'
  if (props.type === 'cancel') return 'Cancel'
  if (props.type === 'delete') return 'Delete'
  if (props.type === 'edit') return 'Update'
  return 'Add'
})

defineExpose({ setStudent })
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
    <form id="enrollmentForm" novalidate @submit.prevent="requestConfirm" class="enroll-form-root">
      <div v-if="type === 'add' || type === 'edit'" class="ui-form-grid">
        <AppSelect
          v-model="form.parentId"
          :items="parentSelectItems"
          label="Parent Name"
          placeholder="Search Active Parent..."
          required
          :error="errors.parentId"
          :shake="shaking.parentId"
          @change="selectParent"
        >
          <template #item="{ item }">
            <div class="flex items-center gap-3 w-full">
              <div
                class="w-8 h-8 rounded-md border border-outline-std overflow-hidden bg-white shrink-0 shadow-sm"
              >
                <img
                  :src="item.profileURL || getActionIcon('edit')"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="flex flex-col flex-1">
                <span class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
              </div>
              <div v-if="item.children?.length" class="flex -space-x-2 ml-auto">
                <div
                  v-for="child in item.children"
                  :key="child.id"
                  class="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-surface-subtle shadow-sm"
                  :title="child.name"
                >
                  <img
                    :src="child.profileURL || getActionIcon('student')"
                    class="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </template>
        </AppSelect>

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
          @click-disabled="handleDisabledClick('studentId')"
        >
          <template #item-badge="{ item }">
            <AppBadge v-if="item.age" status="student">{{ item.age }} years old</AppBadge>
          </template>
        </AppSelect>

        <div
          v-if="form.parentId && availableStudents.length === 0"
          class="col-span-2 p-4 bg-warning-soft border border-warning/20 rounded-xl flex items-center gap-3 animate-fade-in"
        >
          <img :src="getActionIcon('cancel')" class="w-5 h-5 brightness-0 grayscale opacity-60" />
          <span class="text-xs font-bold text-content-dark opacity-70"
            >This parent has no children registered. Add a child in the Students module first.</span
          >
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
          @click-disabled="handleDisabledClick('programId')"
        >
          <template #selected="{ item }">
            <div v-if="item" class="flex items-center gap-2 flex-1 overflow-hidden">
              <span class="text-sm font-semibold text-content-dark truncate flex-1"
                >{{ item.name }}
              </span>
              <AppBadge :status="item.type" :type="item.type" />
            </div>
          </template>
          <template #item-badge="{ item }">
            <AppBadge :status="item.type" />
          </template>
        </AppSelect>

        <AppSelect
          v-model="form.termOfferingId"
          :items="offeringSelectItems"
          label="Class Product"
          placeholder="Select Offering..."
          required
          :error="errors.termOfferingId"
          :shake="shaking.termOfferingId"
          :disabled="!form.programId"
          @change="handleOfferingChange"
          @click-disabled="handleDisabledClick('termOfferingId')"
        >
          <template #selected="{ item }">
            <div v-if="item" class="flex items-center gap-2 flex-1 overflow-hidden">
              <AppBadge :status="item.scheduleDay" type="purple" />
              <span class="text-sm font-semibold text-content-dark truncate flex-1">{{
                item.scheduleTime
              }}</span>
              <AppBadge :status="item.branchName" :type="item.branchColor" />
            </div>
          </template>
          <template #item="{ item }">
            <div class="flex flex-col w-full gap-0.5">
              <div class="flex items-center justify-between">
                <span class="text-sm font-bold text-content-dark">{{ item.className }}</span>
                <AppBadge :status="item.branchName" :type="item.branchColor" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold"
                  >{{ item.scheduleDay }} ({{ item.scheduleTime }})</span
                >
                <span
                  class="text-xs font-bold"
                  :class="item.capacity - item.studentCount <= 3 ? 'text-error' : 'text-success'"
                >
                  {{ item.capacity - item.studentCount }} slots left
                </span>
              </div>
            </div>
          </template>
        </AppSelect>

        <div
          v-if="form.classId && availableOfferings.length === 0"
          class="col-span-2 p-4 bg-error-soft border border-error/10 rounded-xl flex items-center gap-3 animate-fade-in"
        >
          <img :src="getActionIcon('cancel')" class="w-5 h-5" />
          <span class="text-xs font-bold text-error"
            >No active or upcoming terms offer this class yet.</span
          >
        </div>
      </div>

      <transition
        v-if="type === 'add' || type === 'edit'"
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
                <AppBadge :status="formatDateOnly(selectedOffering.startDate)" type="green" />
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">End Date</span>
                <AppBadge :status="formatDateOnly(selectedOffering.endDate)" type="red" />
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
                      class="px-2 py-1 rounded-xs text-xs font-semibold transition-all"
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
                      class="px-2 py-1 rounded-xs text-xs font-semibold transition-all"
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

      <!-- Content for Pay Action -->
      <div v-if="type === 'pay'" class="flex flex-col gap-lg">
        <div
          class="bg-white border border-outline-std rounded-std p-lg flex flex-col gap-lg shadow-sm"
          v-if="displaySummary"
        >
          <div class="grid grid-cols-2 gap-x-lg gap-y-md">
            <!-- Parent -->
            <div class="flex flex-col gap-xs">
              <span class="text-2xs font-semibold text-content-muted tracking-wider opacity-60"
                >Parent Name</span
              >
              <div class="enroll-identity-row bg-primary-soft/40 border-primary/10">
                <img
                  :src="displaySummary.parentAvatar"
                  class="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                />
                <span class="text-sm font-bold text-content-dark tracking-tight">{{
                  displaySummary.parentName
                }}</span>
              </div>
            </div>
            <!-- Student -->
            <div class="flex flex-col gap-xs">
              <span class="text-2xs font-semibold text-content-muted tracking-wider opacity-60"
                >Student Name</span
              >
              <div class="enroll-identity-row bg-primary-soft/40 border-primary/10">
                <img
                  :src="displaySummary.studentAvatar"
                  class="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                />
                <span class="text-sm font-bold text-content-dark tracking-tight">{{
                  displaySummary.studentName
                }}</span>
              </div>
            </div>
            <!-- Program -->
            <div class="flex flex-col gap-xs">
              <span class="text-2xs font-semibold text-content-muted tracking-wider opacity-60"
                >Program Selection</span
              >
              <div class="enroll-identity-row bg-surface-subtle/30 border-outline-std/20">
                <img
                  :src="displaySummary.programAvatar"
                  class="w-8 h-8 rounded-full text-content-dark border-2 border-white shadow-sm"
                />
                <span class="text-sm font-semibold text-content-dark tracking-tighter">{{
                  displaySummary.programName
                }}</span>
              </div>
            </div>
            <!-- Class & Branch -->
            <div class="flex flex-col gap-xs">
              <span class="text-2xs font-semibold text-content-muted tracking-wider opacity-60"
                >Class and Branch</span
              >
              <div
                class="enroll-identity-row bg-surface-subtle/30 border-outline-std/20 flex-col !items-start gap-1 p-3"
              >
                <div class="flex items-center justify-between w-full">
                  <span class="text-xs font-semibold"
                    >{{ displaySummary.scheduleDay }} ({{ displaySummary.scheduleTime }})</span
                  >
                  <AppBadge
                    :status="displaySummary.branchAbbr"
                    :type="displaySummary.branchColor"
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            class="flex items-center justify-between bg-gradient-to-br from-primary to-primary-dark p-xl rounded-std shadow-xl shadow-primary/20 mt-lg border border-primary-dark/30"
          >
            <div class="flex flex-col gap-1">
              <span class="text-xs font-bold text-white/70 uppercase tracking-widest"
                >Calculated Tuition Fee</span
              >
              <div class="flex gap-xs">
                <AppBadge
                  :status="displaySummary.mode || displaySummary.status"
                  class="bg-white/20 text-white border-none"
                />
              </div>
            </div>
            <div class="text-white text-right">
              <span class="text-3xl font-black tracking-tighter"
                >${{ formatPrice(displaySummary.amount) }}</span
              >
            </div>
          </div>
        </div>

        <AppAlert type="warning" class="mt-md">
          <div class="flex flex-col gap-0.5">
            <strong class="text-sm font-semibold tracking-tight"
              >Final Verification Required</strong
            >
            <span class="text-xs opacity-90 font-medium"
              >By confirming, you verify that the payment proof matches the tuition amount. This
              action is irreversible.</span
            >
          </div>
        </AppAlert>

        <div class="flex flex-col gap-xs mt-lg">
          <label class="text-xs font-semibold text-content-muted">Payment Channel Selection</label>
          <div class="grid grid-cols-2 gap-sm mt-1">
            <button
              type="button"
              class="enroll-channel-btn"
              :class="
                form.paymentMethod === 'online'
                  ? 'enroll-channel-btn--online'
                  : 'enroll-channel-btn--inactive'
              "
              @click="form.paymentMethod = 'online'"
            >
              <span class="text-xl">💳</span>
              <span>Online / Bank</span>
            </button>
            <button
              type="button"
              class="enroll-channel-btn"
              :class="
                form.paymentMethod === 'cash'
                  ? 'enroll-channel-btn--cash'
                  : 'enroll-channel-btn--inactive'
              "
              @click="form.paymentMethod = 'cash'"
            >
              <span class="text-xl">💵</span>
              <span>Cash Payment</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-lg mt-md">
          <AppSelect
            v-if="form.paymentMethod === 'online'"
            v-model="form.bankName"
            :items="
              ['ABA', 'Wing', 'ACLEDA', 'Canadia', 'Sathapana', 'Other'].map((b) => ({
                id: b,
                name: b,
              }))
            "
            label="Issuing Bank"
            placeholder="Select Bank..."
            required
            :error="errors.bankName"
            :shake="shaking.bankName"
            :searchable="false"
            @change="clearError('bankName')"
          />

          <AppInput
            v-model="form.proof"
            :label="form.paymentMethod === 'online' ? 'Transaction Code' : 'Receipt ID'"
            :placeholder="form.paymentMethod === 'online' ? 'e.g. 123456' : 'e.g. REC-001'"
            required
            :error="errors.proof"
            :shake="shaking.proof"
            class="col-span-2"
            @input="clearError('proof')"
          />
        </div>

        <AppInput
          v-model="form.remark"
          type="textarea"
          label="Internal Processing Remarks"
          placeholder="Add any specific notes for audit trailing..."
          :error="errors.remark"
          :shake="shaking.remark"
          @input="clearError('remark')"
        />
      </div>

      <!-- Content for Cancel Action -->
      <div v-if="type === 'cancel'" class="flex flex-col gap-lg">
        <AppAlert type="warning">
          <div class="flex flex-col gap-0.5">
            <strong class="text-sm font-semibold tracking-tight"
              >Program Termination Warning</strong
            >
            <span class="text-xs opacity-90 font-medium"
              >Marking this enrollment as cancelled will permanently release the reserved seat in
              the session schedule.</span
            >
          </div>
        </AppAlert>

        <div class="flex flex-col gap-xs">
          <div class="flex flex-wrap gap-xs mb-sm mt-1">
            <button
              v-for="preset in cancelPresets"
              :key="preset"
              type="button"
              class="px-md py-1.5 border-2 rounded-sm text-2xs cursor-pointer font-semibold transition-all"
              :class="
                form.reason === preset
                  ? 'bg-primary text-white border-primary shadow-md scale-105'
                  : 'bg-surface-light border-outline-std/50 hover:bg-primary-soft hover:text-primary hover:border-primary/20'
              "
              @click="selectPreset(preset)"
            >
              {{ preset }}
            </button>
          </div>
          <AppInput
            v-model="form.reason"
            type="textarea"
            label="Cancellation Logic / Reason"
            required
            :error="errors.reason"
            :shake="shaking.reason"
            placeholder="Provide a detailed cancel reason..."
            @input="clearError('reason')"
          />
        </div>
      </div>

      <!-- Content for Delete Action -->
      <div v-if="type === 'delete'" class="flex flex-col gap-lg">
        <!-- Identity Summary (consistent with pay modal) -->
        <div
          class="bg-white border border-outline-std rounded-std p-lg flex flex-col gap-lg shadow-sm"
          v-if="displaySummary"
        >
          <div class="grid grid-cols-2 gap-x-lg gap-y-md">
            <!-- Parent -->
            <div class="flex flex-col gap-xs">
              <span class="text-2xs font-semibold text-content-muted tracking-wider opacity-60"
                >Parent Name</span
              >
              <div class="enroll-identity-row">
                <img
                  :src="displaySummary.parentAvatar"
                  class="w-8 h-8 rounded-full border border-white shadow-sm"
                />
                <span class="text-sm font-semibold text-content-dark tracking-tight">{{
                  displaySummary.parentName
                }}</span>
              </div>
            </div>
            <!-- Student -->
            <div class="flex flex-col gap-xs">
              <span class="text-2xs font-semibold text-content-muted tracking-wider opacity-60"
                >Student Name</span
              >
              <div class="enroll-identity-row">
                <img
                  :src="displaySummary.studentAvatar"
                  class="w-8 h-8 rounded-full border border-white shadow-sm"
                />
                <span class="text-sm font-semibold text-content-dark tracking-tight">{{
                  displaySummary.studentName
                }}</span>
              </div>
            </div>
            <!-- Program -->
            <div class="flex flex-col gap-xs">
              <span class="text-2xs font-semibold text-content-muted tracking-wider opacity-60"
                >Program</span
              >
              <div class="enroll-identity-row bg-surface-subtle/30 border-outline-std/20">
                <img
                  :src="displaySummary.programAvatar"
                  class="w-8 h-8 rounded-full text-content-dark border-2 border-white shadow-sm"
                />
                <span class="text-sm font-semibold text-content-dark tracking-tighter">{{
                  displaySummary.programName
                }}</span>
              </div>
            </div>
            <!-- Class & Branch -->
            <div class="flex flex-col gap-xs">
              <span class="text-2xs font-semibold text-content-muted tracking-wider opacity-60"
                >Class and Branch</span
              >
              <div
                class="enroll-identity-row bg-surface-subtle/30 border-outline-std/20 flex-col !items-start gap-1 p-3"
              >
                <div class="flex items-center justify-between w-full">
                  <span class="text-sm font-bold text-content-dark">{{
                    displaySummary.className
                  }}</span>
                  <AppBadge
                    :status="displaySummary.branchAbbr"
                    :type="displaySummary.branchColor"
                  />
                </div>
                <div class="flex items-center justify-between w-full opacity-70">
                  <span class="text-xs font-semibold"
                    >{{ displaySummary.scheduleDay }} ({{ displaySummary.scheduleTime }})</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <AppAlert type="error">
          <div class="flex flex-col gap-0.5">
            <strong class="text-sm font-semibold tracking-tight">⚠ Permanent Data Deletion</strong>
            <span class="text-xs opacity-90 font-medium"
              >This will erase all linked financial logs and attendance records. This action is
              irreversible and cannot be undone.</span
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

      <AppConfirmOverlay
        :show="showConfirm"
        :title="
          type === 'cancel'
            ? 'Cancel Enrollment'
            : type === 'delete'
              ? 'Delete Enrollment'
              : type === 'pay'
                ? 'Confirm Payment'
                : 'Confirm Enrollment'
        "
        :subtitle="
          type === 'cancel'
            ? 'This will immediately cancel the enrollment and free up the schedule spot.'
            : type === 'delete'
              ? 'This action is irreversible and deletes historical records.'
              : 'Please verify details before proceeding.'
        "
        :icon="modalIcon"
        :image="selectedStudent?.profileURL || getImageUrl('profiles/avatar-student')"
        :rows="confirmRows"
        :totalAmount="finalAmount"
        totalLabel="Price to Pay"
        :confirmLabel="submitLabel"
        :loading="loading"
        @back="showConfirm = false"
        @confirm="handleFinalSubmit"
      />
    </form>

    <template #footer>
      <div class="flex flex-col justify-end w-full gap-md">
        <AppAlert v-if="validationMessage" type="error" class="w-full">
          {{ validationMessage }}
        </AppAlert>
        <AppAlert v-if="isEditMode && !isChanged" type="info" class="w-full">
          No modifications detected. Please update at least one field to enable saving.
        </AppAlert>
        <div class="flex items-center justify-between w-full">
          <div
            v-if="hasAnyError"
            class="text-error font-bold text-sm flex items-center gap-2 animate-bounce"
          >
            <img :src="getActionIcon('cancel')" class="w-4 h-4" />
            <span>Please fill in all required fields and correct errors.</span>
          </div>
          <div v-else></div>
          <div class="flex items-center gap-3 ml-auto">
            <button type="button" class="ui-btn-cancel" @click="$emit('close')">Cancel</button>
            <AppButton
              type="button"
              variant="primary"
              :loading="loading"
              :disabled="loading"
              :class="{ 'opacity-60 grayscale-[0.2]': (isEditMode && !isChanged) || isFormInvalid }"
              @click="requestConfirm"
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
