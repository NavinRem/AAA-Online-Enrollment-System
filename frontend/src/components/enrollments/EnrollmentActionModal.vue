<script setup>
import { ref, computed, watch } from 'vue'
import { useActionModal } from '@/composables/useActionModal'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppInput from '@/components/common/ui/AppInput.vue'
import AppSelect from '@/components/common/ui/AppSelect.vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppConfirmOverlay from '@/components/common/ui/AppConfirmOverlay.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import { getActionIcon, getImageUrl, getProgramProfileURL } from '@/utils/assetHelper'
import { formatPrice, formatDateOnly } from '@/utils/formatUtils'
import { useModalText } from '@/composables/useModalText'
import { getSessionCounts } from '@/utils/programHelper'
import { filterEnrolledPrograms } from '@/utils/dropdownUtils'

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

const getInitialData = () => ({
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
  transactionId: '',
  receiptId: '',
  bankName: '',
  reason: '',
  deleteConfirm: '',
  paymentMethod: 'online',
  paymentStatus: 'paid',
  transferredSessions: 0,
})

const mapSourceToForm = () => {
  if (props.enrollment) {
    return {
      ...getInitialData(),
      parentId: props.enrollment.parentId || '',
      studentId: props.enrollment.studentId || '',
      programId: props.enrollment.programId || '',
      classId: props.enrollment.classId || '',
      termId: props.enrollment.termId || props.enrollment.term?.id || '',
      termOfferingId: props.enrollment.termOfferingId || props.enrollment.term?.offeringId || '',
      branchId: props.enrollment.class?.branch?.id || props.enrollment.branchId || '',
      scheduleId: props.enrollment.termOfferingId || '',
      enrollAt: props.enrollment.enrollAt || new Date().toISOString(),
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
      transferredSessions: props.enrollment.transferredSessions || 0,
    }
  }
  return getInitialData()
}

const {
  localData: form,
  isDirty,
  errors,
  shaking,
  validate,
  clearError,
  triggerShake,
  getPayload,
} = useActionModal(props, emit, {
  getInitialData,
  mapSourceToForm,
  sourceKey: 'enrollment',
  autoClear: 3000,
})

const cancelPresets = ['Schedule Conflict', 'Relocation', 'Financial Issue', 'Duplicated']
const selectPreset = (preset) => {
  if (form.reason === preset) {
    form.reason = ''
  } else {
    form.reason = preset
  }
}

const showConfirm = ref(false)
const isEditMode = computed(
  () => props.type === 'edit' || (props.type !== 'add' && !!props.enrollment),
)

const displaySummary = computed(() => {
  const e = props.enrollment
  if (!e) return null

  const classObj = e.class || {}
  const branchObj = classObj.branch || e.branch || {}

  return {
    studentName: e.student?.name || e.studentName,
    programName: e.program?.name || e.programName,
    amount: e.finalPrice || e.totalPrice || e.amount || 0,
    status: e.status || 'Pending',
    studentAvatar: e.student?.profileURL || null,
    parentAvatar: e.parent?.profileURL || null,
    programAvatar: e.program?.profileURL || null,
    parentName: e.parent?.name || e.parentName || 'Parent',
    className: classObj.name || e.className || 'N/A',
    scheduleDay: classObj.schedule
      ? classObj.schedule.day
      : e.classSchedule
        ? e.classSchedule.split(' ')[0]
        : '',
    scheduleTime: classObj.schedule
      ? classObj.schedule.startTime || classObj.schedule.time
      : e.classSchedule
        ? e.classSchedule.split(' ')[1]?.replace(/[()]/g, '')
        : '',
    branchName: branchObj.name || branchObj.abbr || e.branchName || 'HQ',
    branchAbbr: branchObj.abbr || e.branchAbbr || 'HQ',
    branchColor: branchObj.color || e.branchColor || 'blue',
    termName: classObj.term?.name || e.termName || 'N/A',
  }
})
const isChanged = computed(() => !isEditMode.value || isDirty.value)
const hasAnyError = computed(() => Object.values(errors).some(Boolean))

const activeParents = computed(() =>
  (props.parents || []).filter((parent) => (parent.status || 'Active').toLowerCase() === 'active'),
)

const availableStudents = computed(() => {
  if (!form.parentId) return []
  return props.students.filter((student) => student.parentId === form.parentId)
})

const availablePrograms = computed(() => {
  return filterEnrolledPrograms(
    props.programs || [],
    form.studentId,
    props.enrollments || [],
    props.enrollment?.id,
  )
})

const availableOfferings = computed(() => {
  if (!form.programId) return []

  const activeSchedules = new Set()
  if (form.studentId && props.enrollments) {
    const studentEnrollments = props.enrollments.filter(
      (e) =>
        String(e.studentId) === String(form.studentId) &&
        ['paid', 'unpaid', 'active', 'confirmed', 'success'].includes(e.status) &&
        e.isDeleted !== true &&
        String(e.id) !== String(props.enrollment?.id),
    )

    studentEnrollments.forEach((e) => {
      let day = ''
      let time = ''

      if (props.terms) {
        for (const term of props.terms) {
          if (term.offerings) {
            const off = term.offerings.find(
              (o) =>
                String(o.offeringId) === String(e.termOfferingId) ||
                String(o.id) === String(e.termOfferingId),
            )
            if (off && off.schedule) {
              day = off.schedule.day
              time = off.schedule.time
              break
            }
          }
        }
      }

      if (!day || !time) {
        if (e.class?.schedule) {
          day = e.class.schedule.day
          time = e.class.schedule.time || e.class.schedule.startTime
        }
      }

      if (day && time) {
        activeSchedules.add(`${day}-${time}`)
      }
    })
  }

  const offerings = (props.terms || []).flatMap((term) =>
    (term.offerings || [])
      .filter((offering) => {
        const isMatch =
          offering.program?.id === form.programId || offering.class?.programId === form.programId
        if (!isMatch) return false

        const isCurrentSelection =
          isEditMode.value &&
          String(offering.offeringId) === String(props.enrollment?.termOfferingId)

        // For new selections, enforce active term check
        if (!isCurrentSelection) {
          const today = new Date().toISOString().split('T')[0]
          if ((term.endDate || '') < today || term.isDeleted) return false
        }

        // Schedule conflict check
        if (!isCurrentSelection && offering.schedule?.day && offering.schedule?.time) {
          if (activeSchedules.has(`${offering.schedule.day}-${offering.schedule.time}`)) {
            return false
          }
        }

        const currentCount = offering.currentCount || (offering.students || []).length || 0

        const classInfo = props.classes?.find((c) => String(c.id) === String(offering.classId))
        const scheduleInfo = classInfo?.schedules?.find((s) => s.id === offering.schedule?.id)
        const capacity = scheduleInfo?.capacity || classInfo?.capacity || offering.capacity || 20

        return isCurrentSelection || currentCount < capacity
      })
      .map((offering) => {
        const classInfo = props.classes?.find((c) => String(c.id) === String(offering.classId))
        const scheduleInfo = classInfo?.schedules?.find((s) => s.id === offering.schedule?.id)
        const capacity = scheduleInfo?.capacity || classInfo?.capacity || offering.capacity || 20

        let branchStartDate = term.startDate
        let branchEndDate = term.endDate

        if (term.branchSettings) {
          const bId = offering.branch?.id || offering.branchId || offering.branch?.abbr
          const setting = term.branchSettings.find((s) => String(s.branchId) === String(bId))
          if (setting && setting.startDate) branchStartDate = setting.startDate
          if (setting && setting.endDate) branchEndDate = setting.endDate
        }

        return {
          id: offering.offeringId,
          classId: offering.classId,
          className: offering.class?.name || 'Class',
          name: `${term.name} | ${offering.branch?.abbr || offering.branch?.name || 'Branch'} - ${offering.schedule?.day || 'Day'} (${offering.schedule?.time || 'Time'})`,
          termId: term.id,
          termName: term.name,
          branch: offering.branch,
          schedule: offering.schedule,
          startDate: branchStartDate,
          endDate: branchEndDate,
          studentCount: offering.currentCount || (offering.students || []).length || 0,
          capacity: capacity,
          totalSessions: term.totalSessions || 0,
        }
      }),
  )

  // Sort so active (earlier start date) terms appear first
  return offerings.sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0))
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

  if (form.transferredSessions > 0 && sessionInfo.value && sessionInfo.value.total > 0) {
    const sessionRate = (selectedProgram.value?.basePrice || 0) / sessionInfo.value.total
    price -= sessionRate * form.transferredSessions
  }

  const discountBase = Number(form.discountAmount || 0)
  const discount = form.discountType === 'percent' ? (price * discountBase) / 100 : discountBase
  return Math.max(0, price - discount)
})

const confirmRows = computed(() => {
  const base = [
    {
      key: 'Parent',
      value:
        displaySummary.value?.parentName ||
        props.parents?.find((item) => item.id === form.parentId)?.name ||
        'N/A',
    },
    {
      key: 'Student',
      value: displaySummary.value?.studentName || selectedStudent.value?.name || 'N/A',
    },
    {
      key: 'Program',
      value: displaySummary.value?.programName || selectedProgram.value?.name || 'N/A',
    },
    {
      key: 'Class',
      value: displaySummary.value?.programName || selectedProgram.value?.name || 'N/A',
    },
    {
      key: 'Term',
      value: displaySummary.value?.termName || selectedOffering.value?.termName || 'N/A',
    },
    {
      key: 'Branch',
      value:
        displaySummary.value && displaySummary.value.branchAbbr
          ? displaySummary.value.branchAbbr
          : selectedOffering.value
            ? selectedOffering.value.branch?.abbr || selectedOffering.value.branch?.name
            : 'N/A',
      badge: true,
      type:
        displaySummary.value && displaySummary.value.branchColor
          ? displaySummary.value.branchColor
          : selectedOffering.value
            ? selectedOffering.value.branch?.color
            : 'gray',
    },
    {
      key: 'Schedule',
      value:
        displaySummary.value && displaySummary.value.scheduleDay
          ? `${displaySummary.value.scheduleDay} (${displaySummary.value.scheduleTime})`
          : selectedOffering.value
            ? `${selectedOffering.value.schedule?.day} (${selectedOffering.value.schedule?.time})`
            : 'N/A',
      badge: true,
      type: 'day',
      colorValue:
        displaySummary.value && displaySummary.value.scheduleDay
          ? displaySummary.value.scheduleDay
          : selectedOffering.value
            ? selectedOffering.value.schedule?.day
            : '',
      timeValue:
        displaySummary.value && displaySummary.value.scheduleTime
          ? displaySummary.value.scheduleTime
          : selectedOffering.value
            ? selectedOffering.value.schedule?.time
            : '',
    },
    { key: 'EnrolledSessions', value: `${form.enrolledSessions || 0} sessions` },
  ]

  if (form.isSponsorship) {
    base.push({ key: 'IsSponsorship', value: 'Yes', valueClass: 'text-primary font-bold' })
  }
  if (form.isProrated) {
    base.push({ key: 'IsProrated', value: 'Yes', valueClass: 'text-warning font-bold' })
  }
  if (form.transferredSessions > 0) {
    base.push({
      key: 'PriorPaidSessions',
      value: `${form.transferredSessions}`,
      valueClass: 'text-success font-bold',
    })
  }
  if (form.discountAmount > 0) {
    base.push({
      key: 'DiscountAmount',
      value:
        form.discountType === 'percent' ? `${form.discountAmount}%` : `$${form.discountAmount}`,
    })
  }
  if (form.isCustomPrice) {
    base.push({ key: 'CustomPrice', value: `$${form.customPrice}` })
  }

  base.push({
    key: 'Amount',
    value: `$${formatPrice(finalAmount.value)}`,
    valueClass: 'font-bold text-lg text-primary',
  })

  if (props.type === 'pay') {
    return [
      ...base,
      { key: 'PaymentMethod', value: form.paymentMethod === 'online' ? 'Online / Bank' : 'Cash' },
      ...(form.bankName ? [{ key: 'BankName', value: form.bankName }] : []),
      { key: 'ReceiptID', value: form.receiptId },
      ...(form.paymentMethod === 'online'
        ? [{ key: 'TransactionCode', value: form.transactionId }]
        : []),
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
    termName: off.termName,
    profileURL: off.branch?.profileURL || getActionIcon('navigation/branch'),
  })),
)

// Removed unused select items

const handleFinalSubmit = () => {
  emit('submit', {
    ...getPayload(),
    enrollAt: form.enrollAt || new Date().toISOString(),
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
    if (form.paymentMethod === 'online') {
      if (!form.bankName) {
        validationMessage.value = 'Please select a bank.'
        triggerShake('bankName')
        return
      }
      if (!form.transactionId) {
        validationMessage.value = 'Please provide a transaction code.'
        triggerShake('transactionId')
        return
      }
    }
    if (!form.receiptId) {
      validationMessage.value = 'Please provide a receipt ID.'
      triggerShake('receiptId')
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
  if (isEditMode.value) {
    const msgs = {
      parentId: 'Parent selection cannot be changed after enrollment.',
      studentId: 'Student selection cannot be changed after enrollment.',
      programId: 'Program cannot be changed after enrollment.',
      termOfferingId: 'Class offering cannot be changed after enrollment.',
    }
    validationMessage.value = msgs[field] || 'This field cannot be changed after enrollment.'
    setTimeout(() => {
      validationMessage.value = ''
    }, 3000)
    return
  }

  if (field === 'studentId' && !form.parentId) {
    validationMessage.value = 'Please select a parent first'
    setTimeout(() => {
      validationMessage.value = ''
    }, 3000)
    errors.parentId = 'Please select a parent first'
    triggerShake('parentId')
  } else if (field === 'programId' && !form.studentId) {
    validationMessage.value = 'Please select a student first'
    setTimeout(() => {
      validationMessage.value = ''
    }, 3000)
    errors.studentId = 'Please select a student first'
    triggerShake('studentId')
  } else if (field === 'termOfferingId' && !form.programId) {
    validationMessage.value = 'Please select a program first'
    setTimeout(() => {
      validationMessage.value = ''
    }, 3000)
    errors.programId = 'Please select a program first'
    triggerShake('programId')
  }
}

watch(
  () => [sessionInfo.value, form.isProrated],
  ([info, isProrated]) => {
    form.enrolledSessions = info ? (isProrated ? info.remaining : info.total) : 0
  },
)

const setStudent = (studentId) => {
  form.studentId = studentId
  handleStudentChange()
}

const { modalTitle, submitLabel, modalIcon } = useModalText(() => props.type, 'Enrollment')

defineExpose({ setStudent })
</script>

<template>
  <AppModal
    :show="isOpen"
    @close="$emit('close')"
    :title="modalTitle"
    :icon="modalIcon"
    :error="error"
    :success="success"
  >
    <form id="enrollmentForm" novalidate @submit.prevent="requestConfirm" class="enroll-form-root">
      <div v-if="type === 'add' || type === 'edit'" class="ui-form-grid">
        <AppSelect
          v-model="form.parentId"
          :items="parentSelectItems"
          label="Parent"
          placeholder="Select Parent"
          required
          :disabled="isEditMode"
          :error="errors.parentId"
          :shake="shaking.parentId"
          :loading="loading"
          searchPlaceholder="Search parent name..."
          @click-disabled="handleDisabledClick('parentId')"
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
          label="Student"
          placeholder="Select Student"
          required
          :disabled="!form.parentId || isEditMode"
          :error="errors.studentId"
          :shake="shaking.studentId"
          :loading="loading"
          searchPlaceholder="Search student name..."
          @click-disabled="handleDisabledClick('studentId')"
          @change="handleStudentChange"
        >
          <template #selected="{ item }">
            <div v-if="item" class="flex items-center gap-2 flex-1 overflow-hidden">
              <div
                class="w-7 h-7 rounded-full border border-outline-std overflow-hidden bg-white shrink-0"
              >
                <img
                  :src="item.profileURL || getActionIcon('student')"
                  class="w-full h-full object-cover"
                />
              </div>
              <span class="text-sm font-semibold text-content-dark truncate flex-1">{{
                item.name
              }}</span>
              <AppBadge v-if="item.age" status="student">{{ item.age }} years old</AppBadge>
            </div>
            <span v-else class="text-content-light text-sm italic opacity-70">Select Student</span>
          </template>
          <template #item="{ item }">
            <div class="flex items-center gap-3 w-full">
              <div
                class="w-8 h-8 rounded-md border border-outline-std overflow-hidden bg-white shrink-0 shadow-sm"
              >
                <img
                  :src="item.profileURL || getActionIcon('student')"
                  class="w-full h-full object-cover"
                />
              </div>
              <div class="flex flex-col flex-1">
                <span class="text-sm font-semibold text-content-dark">{{ item.name }}</span>
              </div>
              <div class="ml-auto flex items-center">
                <AppBadge v-if="item.age" status="student">{{ item.age }} years old</AppBadge>
              </div>
            </div>
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
          placeholder="Select Program"
          required
          :disabled="!form.studentId"
          :error="errors.programId"
          :shake="shaking.programId"
          :loading="loading"
          @click-disabled="handleDisabledClick('programId')"
          @change="handleProgramChange"
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
          label="Available Classes"
          placeholder="Select a class to enroll"
          required
          :disabled="!form.programId"
          :error="errors.termOfferingId"
          :shake="shaking.termOfferingId"
          :loading="loading"
          @click-disabled="handleDisabledClick('termOfferingId')"
          @change="handleOfferingChange"
        >
          <template #selected="{ item }">
            <div v-if="item" class="flex items-center gap-2 flex-1 overflow-hidden">
              <AppBadge :status="item.termName" type="purple" />
              <AppBadge :status="item.scheduleDay" type="day" />
              <span class="text-sm font-semibold text-content-dark truncate flex-1">{{
                item.scheduleTime
              }}</span>
              <AppBadge :status="item.branchName" :type="item.branchColor" />
            </div>
          </template>
          <template #item="{ item }">
            <div class="flex flex-col w-full gap-0.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-content-dark">{{ item.className }}</span>
                  <AppBadge :status="item.termName" type="blue" />
                </div>
                <AppBadge :status="item.branchName" :type="item.branchColor" />
              </div>
              <div class="flex items-center justify-between mt-1">
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
              <div v-if="isEditMode" class="enroll-info-item col-span-2">
                <AppInput
                  v-model.number="form.transferredSessions"
                  type="number"
                  label="Prior Paid Sessions Credit"
                  placeholder="0"
                  :error="errors.transferredSessions"
                  :shake="shaking.transferredSessions"
                />
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
                    <div class="text-lg font-bold">
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
        <div v-if="displaySummary" class="flex flex-col gap-lg">
          <div class="enroll-twin-card">
            <span class="enroll-section-label">Enrollment Details</span>
            <div class="enroll-info-grid">
              <div class="enroll-info-item">
                <span class="enroll-info-key">Student</span>
                <div class="flex items-center gap-2">
                  <img :src="displaySummary.studentAvatar" class="w-6 h-6 rounded-full" />
                  <span class="enroll-info-val">{{ displaySummary.studentName }}</span>
                </div>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Parent</span>
                <div class="flex items-center gap-2">
                  <img :src="displaySummary.parentAvatar" class="w-6 h-6 rounded-full" />
                  <span class="enroll-info-val">{{ displaySummary.parentName }}</span>
                </div>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Program</span>
                <div class="flex items-center gap-2">
                  <img :src="displaySummary.programAvatar" class="w-6 h-6 rounded-full" />
                  <span class="enroll-info-val">{{ displaySummary.programName }}</span>
                </div>
              </div>
              <div class="enroll-info-item">
                <span class="enroll-info-key">Schedule</span>
                <span class="enroll-info-val text-primary font-bold">
                  {{ displaySummary.scheduleDay }} ({{ displaySummary.scheduleTime }})
                </span>
              </div>
              <div class="enroll-info-item col-span-2">
                <span class="enroll-info-key">Branch</span>
                <AppBadge :status="displaySummary.branchAbbr" :type="displaySummary.branchColor" />
              </div>
            </div>
          </div>

          <div class="enroll-twin-card">
            <span class="enroll-section-label">Payment Summary</span>
            <div class="enroll-info-grid">
              <div class="enroll-info-item col-span-2 mt-2">
                <div class="ui-summary-card">
                  <div class="ui-summary-content">
                    <span class="ui-summary-label text-white font-bold text-lg"
                      >Total Amount Due</span
                    >
                    <div class="enroll-tuition-savings flex gap-2 mt-1">
                      <AppBadge :status="displaySummary.mode || displaySummary.status" />
                    </div>
                  </div>
                  <span class="ui-summary-amount"> ${{ formatPrice(displaySummary.amount) }} </span>
                </div>
              </div>
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
          <div
            class="flex items-center gap-2 p-2 bg-white rounded-2xl border border-outline-std mt-1 w-fit"
          >
            <button
              type="button"
              @click="form.paymentMethod = 'online'"
              class="py-2 px-5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 border border-transparent"
              :class="
                form.paymentMethod === 'online'
                  ? 'bg-primary text-white shadow-md ring-1 ring-black/5'
                  : 'text-content-muted hover:text-content-dark hover:bg-surface-subtle/50'
              "
            >
              <img
                :src="getActionIcon('pay')"
                class="w-4 h-4"
                :class="{ 'brightness-200': form.paymentMethod === 'online' }"
              />
              Online / Bank
            </button>
            <button
              type="button"
              @click="form.paymentMethod = 'cash'"
              class="py-2 px-5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 border border-transparent"
              :class="
                form.paymentMethod === 'cash'
                  ? 'bg-primary text-white shadow-md ring-1 ring-black/5'
                  : 'text-content-muted hover:text-content-dark hover:bg-surface-subtle/50'
              "
            >
              <img
                :src="getActionIcon('cash')"
                class="w-4 h-4"
                :class="{ 'brightness-200': form.paymentMethod === 'cash' }"
              />
              Cash Payment
            </button>
          </div>
        </div>

        <div class="ui-form-grid mt-md">
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
            v-model="form.receiptId"
            label="Receipt ID"
            placeholder="e.g. REC-001"
            required
            :error="errors.receiptId"
            :shake="shaking.receiptId"
            :class="form.paymentMethod === 'online' ? '' : 'col-span-2'"
            @input="clearError('receiptId')"
          />

          <AppInput
            v-if="form.paymentMethod === 'online'"
            v-model="form.transactionId"
            label="Transaction Code"
            placeholder="e.g. 123456"
            required
            :error="errors.transactionId"
            :shake="shaking.transactionId"
            @input="clearError('transactionId')"
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
              >Marking this enrollment as cancelled will release the reserved seat. Cancellation can be undone later. Paid enrollments will remain in historical records but will no longer be marked for future attendance.</span
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

        <div class="enroll-twin-card" v-if="displaySummary">
          <div class="enroll-info-grid">
            <div class="flex flex-col gap-xs">
              <span class="text-2xs font-semibold text-content-muted uppercase tracking-wider"
                >Parent</span
              >
              <div class="flex items-center gap-sm">
                <img :src="displaySummary.parentAvatar" class="w-8 h-8 rounded-full" />
                <span class="text-sm font-semibold">{{ displaySummary.parentName }}</span>
              </div>
            </div>
            <div class="flex flex-col gap-xs">
              <span class="text-2xs font-semibold text-content-muted uppercase tracking-wider"
                >Student</span
              >
              <div class="flex items-center gap-sm">
                <img :src="displaySummary.studentAvatar" class="w-8 h-8 rounded-full" />
                <span class="text-sm font-semibold">{{ displaySummary.studentName }}</span>
              </div>
            </div>
            <div class="flex flex-col gap-xs col-span-2">
              <span class="text-2xs font-semibold text-content-muted uppercase tracking-wider"
                >Program</span
              >
              <div class="flex items-center gap-sm">
                <img :src="displaySummary.programAvatar" class="w-8 h-8 rounded-full" />
                <span class="text-sm font-semibold">{{ displaySummary.programName }}</span>
              </div>
            </div>
          </div>
        </div>

        <AppAlert type="error" class="mb-lg">
          <div class="flex gap-3">
            <img :src="getActionIcon('delete')" class="w-5 h-5 mt-0.5" />
            <div class="flex flex-col gap-0.5">
              <strong class="text-sm font-semibold tracking-tight">Permanent Data Deletion</strong>
              <p class="text-xs opacity-90 mt-1">
                This action will completely remove this enrollment from the system. Type
                <strong>DELETE</strong> below to confirm.
              </p>
            </div>
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
        :title="modalTitle"
        :icon="modalIcon"
        :subtitle="
          type === 'cancel'
            ? 'This will immediately cancel the enrollment and free up the schedule spot.'
            : type === 'delete'
              ? 'This action is irreversible and deletes historical records.'
              : 'Please verify details before proceeding.'
        "
        :image="selectedStudent?.profileURL || getImageUrl('profiles/avatar-student')"
        :rows="confirmRows"
        :totalAmount="finalAmount"
        totalLabel="Price to Pay"
        :confirmLabel="submitLabel"
        :loading="loading"
        @back="showConfirm = false"
        @confirm="handleFinalSubmit"
      >
        <template #row-Schedule="{ row }">
          <div class="flex items-center gap-2">
            <AppBadge :status="row.colorValue" type="day" />
            <span class="app-confirm-val text-sm font-semibold text-content-dark">{{
              row.timeValue
            }}</span>
          </div>
        </template>
      </AppConfirmOverlay>
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
              :class="{ 'opacity-60 grayscale-20': (isEditMode && !isChanged) || isFormInvalid }"
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
