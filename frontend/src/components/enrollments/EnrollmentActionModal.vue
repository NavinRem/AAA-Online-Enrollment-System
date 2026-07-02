<script setup>
import { ref, computed, watch } from 'vue'
import { useActionModal } from '@/composables/useActionModal'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppModal from '@/components/common/ui/AppModal.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppConfirmOverlay from '@/components/common/ui/AppConfirmOverlay.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import EnrollmentSelectionPanel from './forms/EnrollmentSelectionPanel.vue'
import EnrollmentOfferingOverview from './forms/EnrollmentOfferingOverview.vue'
import EnrollmentPricingPanel from './forms/EnrollmentPricingPanel.vue'
import EnrollmentPayPanel from './forms/EnrollmentPayPanel.vue'
import EnrollmentCancelPanel from './forms/EnrollmentCancelPanel.vue'
import EnrollmentDeletePanel from './forms/EnrollmentDeletePanel.vue'
import { getActionIcon, getImageUrl, getProgramProfileURL } from '@/utils/assetHelper'
import { formatPrice, sortSchedulesChronologically } from '@/utils/formatUtils'
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
  id: '',
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
      id: props.enrollment.id || '',
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
      remark: props.enrollment.remark || '',
      transferredSessions: props.enrollment.transferredSessions || 0,
      receiptId: props.enrollment.receiptId || '',
      transactionId: props.enrollment.transactionId || '',
      bankName: props.enrollment.bankName || '',
      paymentMethod: props.enrollment.paymentMethod || 'online',
      paymentStatus: props.type === 'pay' ? 'paid' : (props.enrollment.paymentStatus || 'paid'),
      status: props.type === 'pay' ? 'paid' : (props.enrollment.status || 'paid'),
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


const showConfirm = ref(false)
const isEditMode = computed(
  () => props.type === 'edit' || (props.type !== 'add' && !!props.enrollment),
)
// In transfer mode, parent/student/program are locked, but offering is free to change
const isTransferMode = computed(() => props.type === 'transfer')

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
const isChanged = computed(() => props.type !== 'edit' || isDirty.value)
const hasAnyError = computed(() => Object.values(errors).some(Boolean))

const activeParents = computed(() =>
  (props.parents || []).filter((parent) => (parent.status || 'Active').toLowerCase() === 'active'),
)

const availableStudents = computed(() => {
  if (!form.parentId) return []
  return props.students.filter((student) => String(student.parentId) === String(form.parentId))
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
  const activeBranchIdentifiers = new Set()

  if (form.studentId && props.enrollments) {
    const activeStatuses = ['paid', 'unpaid', 'active', 'confirmed', 'success', 'pending', 'partial']
    const studentEnrollments = props.enrollments.filter(
      (e) =>
        String(e.studentId) === String(form.studentId) &&
        activeStatuses.includes(String(e.status || '').toLowerCase().trim()) &&
        e.isDeleted !== true &&
        String(e.id) !== String(props.enrollment?.id),
    )

    studentEnrollments.forEach((e) => {
      let day = ''
      let time = ''
      let bId = e.branchId || e.branch?.id || e.class?.branch?.id || e.class?.branchId
      let bAbbr = e.branchAbbr || e.branch?.abbr || e.class?.branch?.abbr

      if (props.terms) {
        for (const term of props.terms) {
          if (term.offerings) {
            const off = term.offerings.find(
              (o) =>
                String(o.offeringId) === String(e.termOfferingId) ||
                String(o.id) === String(e.termOfferingId),
            )
            if (off) {
              if (off.schedule) {
                day = off.schedule.day
                time = off.schedule.time
              }
              if (off.branchId || off.branch?.id) bId = off.branchId || off.branch?.id
              if (off.branch?.abbr) bAbbr = off.branch?.abbr
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

      if (!bId && e.classId && props.classes) {
        const cls = props.classes.find((c) => String(c.id) === String(e.classId))
        if (cls) {
          bId = cls.branchId || cls.branch?.id
          bAbbr = bAbbr || cls.branch?.abbr
        }
      }

      if (day && time) {
        activeSchedules.add(`${day}-${time}`)
      }
      ;[
        bId,
        bAbbr,
        e.branchId,
        e.branch?.id,
        e.branchAbbr,
        e.branch?.abbr,
        e.class?.branchId,
        e.class?.branch?.id,
        e.class?.branch?.abbr,
      ]
        .filter(Boolean)
        .forEach((val) => activeBranchIdentifiers.add(String(val).toLowerCase().trim()))
    })
  }

  const offerings = (props.terms || []).flatMap((term) =>
    (term.offerings || [])
      .filter((offering) => {
        const isMatch =
          String(offering.program?.id) === String(form.programId) ||
          String(offering.class?.programId) === String(form.programId) ||
          String(offering.programId) === String(form.programId) ||
          String(offering.classId) === String(form.programId)
        if (!isMatch) return false

        const isCurrentSelection =
          isEditMode.value &&
          String(offering.offeringId) === String(props.enrollment?.termOfferingId)

        // For transfer mode, allow current offering and ALL valid future offerings for the same program
        // For new selections, enforce active term check
        if (!isCurrentSelection) {
          // In transfer mode, also skip the old class the student is coming FROM
          if (isTransferMode.value && String(offering.offeringId) === String(props.enrollment?.termOfferingId)) return false
          if (term.isDeleted) return false
          if (term.endDate) {
             const todayDate = new Date()
             todayDate.setHours(0,0,0,0)
             const tEnd = new Date(term.endDate)
             if (tEnd < todayDate) return false
          }
        }

        return true
      })
      .map((offering) => {
        const isCurrentSelection =
          isEditMode.value &&
          String(offering.offeringId) === String(props.enrollment?.termOfferingId)

        let disabledReason = ''
        if (!isCurrentSelection && !props.success) {
          const hasExistingBranch = activeBranchIdentifiers.size > 0
          if (hasExistingBranch) {
            const offBranchIdentifiers = [
              offering.branch?.id,
              offering.branchId,
              offering.branch?.abbr,
              offering.class?.branch?.id,
              offering.class?.branchId,
              offering.class?.branch?.abbr,
            ]
              .filter(Boolean)
              .map((val) => String(val).toLowerCase().trim())

            const isSameBranch =
              offBranchIdentifiers.length === 0 ||
              offBranchIdentifiers.some((id) => activeBranchIdentifiers.has(id))
            if (!isSameBranch) {
              disabledReason = 'Branch Conflict'
            }
          }

          if (!disabledReason && offering.schedule?.day && offering.schedule?.time) {
            if (activeSchedules.has(`${offering.schedule.day}-${offering.schedule.time}`)) {
              disabledReason = 'Schedule Conflict'
            }
          }
        }

        const classInfo = props.classes?.find((c) => String(c.id) === String(offering.classId))
        const scheduleInfo = classInfo?.schedules?.find((s) => s.id === offering.schedule?.id)
        const capacity = scheduleInfo?.capacity || classInfo?.capacity || offering.capacity || 20
        const currentCount = offering.currentCount || (offering.students || []).length || 0

        if (!isCurrentSelection && currentCount >= capacity && !disabledReason) {
            disabledReason = 'Class Full'
        }

        let branchStartDate = term.startDate
        let branchEndDate = term.endDate

        if (term.branchSettings) {
          const bId = offering.branch?.id || offering.branchId || offering.branch?.abbr
          const setting = term.branchSettings.find((s) => String(s.branchId) === String(bId))
          if (setting && setting.startDate) branchStartDate = setting.startDate
          if (setting && setting.endDate) branchEndDate = setting.endDate
        }

        const baseName = `${term.name} | ${offering.branch?.abbr || offering.branch?.name || 'Branch'} - ${offering.schedule?.day || 'Day'} (${offering.schedule?.time || 'Time'})`

        return {
          id: offering.offeringId,
          classId: offering.classId,
          className: offering.class?.name || 'Class',
          name: disabledReason ? `${baseName} [${disabledReason}]` : baseName,
          termId: term.id,
          termName: term.name,
          branch: offering.branch,
          branchId: offering.branch?.id || offering.branchId,
          schedule: offering.schedule,
          startDate: branchStartDate,
          endDate: branchEndDate,
          studentCount: offering.currentCount || (offering.students || []).length || 0,
          capacity: capacity,
          totalSessions: term.totalSessions || 0,
          disabledReason: disabledReason,
        }
      }),
  )

  // Sort by schedule first, then by active (earlier start date) terms so it's chronologically ordered
  const sortedBySchedule = sortSchedulesChronologically(offerings, 'schedule')
  return sortedBySchedule.sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0))
})

const selectedProgram = computed(() => props.programs.find((item) => item.id === form.programId))
const selectedStudent = computed(() => props.students.find((item) => item.id === form.studentId))
const selectedOffering = computed(() => {
  const off = availableOfferings.value.find((item) => item.id === form.termOfferingId)
  if (
    off &&
    (off.disabledReason || off.capacity - off.studentCount <= 0 || off.studentCount >= off.capacity)
  ) {
    return null
  }
  return off
})

const selectedOfferingConflict = computed(() => {
  if (props.success || !form.termOfferingId) return null
  const off = availableOfferings.value.find((item) => item.id === form.termOfferingId)
  if (!off || (!off.disabledReason && off.capacity - off.studentCount > 0 && off.studentCount < off.capacity)) return null

  if (off.disabledReason === 'Branch Conflict') {
    return {
      title: 'Branch Conflict',
      message: 'A student cannot enroll in programs across different branches. Ensure that all enrolled programs are studied in the same branch to prevent location conflicts.',
    }
  }
  else if (off.disabledReason === 'Schedule Conflict') {
    return {
      title: 'Schedule Conflict',
      message: 'The student is already enrolled in another program on this exact schedule day and time. Please choose a class with a different schedule to prevent time overlap.',
    }
  }
  else if (off.disabledReason === 'Class Full' || off.capacity - off.studentCount <= 0 || off.studentCount >= off.capacity) {
    return {
      title: 'Class Full',
      message: 'This class is full and cannot be enrolled unless a student cancels their enrollment so a seat becomes available.',
    }
  }
  return {
    title: off.disabledReason || 'Cannot Select Class',
    message: `Cannot select this class: ${off.disabledReason || 'Class unavailable'}`,
  }
})

const sessionInfo = computed(() => {
  if (!selectedOffering.value) return null
  return getSessionCounts(
    selectedOffering.value.startDate,
    selectedOffering.value.endDate,
    {
      [selectedOffering.value.schedule?.day || '']: selectedOffering.value.schedule?.time || '',
    },
    selectedOffering.value.totalSessions,
  )
})

const oldSessionInfo = computed(() => {
  if (!isTransferMode.value || !props.enrollment) return null
  const list = availableOfferings.value || props.offerings || []
  const oldOff = list.find(
    (o) =>
      String(o.offeringId) === String(props.enrollment.termOfferingId) ||
      String(o.id) === String(props.enrollment.termOfferingId),
  )
  if (!oldOff) {
    return { remaining: props.enrollment.enrolledSessions || 0 }
  }
  return getSessionCounts(
    oldOff.startDate,
    oldOff.endDate,
    { [oldOff.schedule?.day || '']: oldOff.schedule?.time || '' },
    oldOff.totalSessions,
  )
})

const extraSessionsToPay = computed(() => {
  if (!isTransferMode.value || !sessionInfo.value) return 0
  const newRem = sessionInfo.value.remaining || 0
  const oldRem = oldSessionInfo.value?.remaining || props.enrollment?.enrolledSessions || 0
  return Math.max(0, newRem - oldRem)
})

const oldBranchName = computed(() => {
  return props.enrollment?.branch?.name || props.enrollment?.branch?.abbr || 'previous branch'
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
    disabledReason: off.disabledReason,
  })),
)

// Removed unused select items

const handleFinalSubmit = () => {
  const payload = getPayload()
  if (props.type === 'pay') {
    payload.paymentStatus = 'paid'
    payload.status = 'paid'
  }
  emit('submit', {
    ...(props.enrollment ? { id: props.enrollment.id } : {}),
    ...payload,
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

  if (selectedOfferingConflict.value) {
    validationMessage.value = `Cannot proceed: ${selectedOfferingConflict.value.title}. ${selectedOfferingConflict.value.message}`
    triggerShake('termOfferingId')
    return
  }
  if (['add', 'edit', 'transfer'].includes(props.type) && !selectedOffering.value) {
    validationMessage.value = 'Please select a valid class without schedule or branch conflicts to proceed.'
    triggerShake('termOfferingId')
    return
  }

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

  if (props.type === 'edit' && !isChanged.value) {
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
    form.branchId = offering.branchId || offering.branch?.id || ''
    form.termId = offering.termId

    if (offering.disabledReason) {
      triggerShake('termOfferingId')
      return
    }
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
      <EnrollmentSelectionPanel
        v-if="['add', 'edit', 'transfer'].includes(type)"
        :form="form"
        @update:form="(val) => Object.assign(form, val)"
        :errors="errors"
        :shaking="shaking"
        :loading="loading"
        :isEditMode="isEditMode"
        :isTransferMode="isTransferMode"
        :parentSelectItems="parentSelectItems"
        :studentSelectItems="studentSelectItems"
        :programSelectItems="programSelectItems"
        :offeringSelectItems="offeringSelectItems"
        :availableStudents="availableStudents"
        :availableOfferings="availableOfferings"
        @click-disabled="handleDisabledClick"
        @parent-change="selectParent"
        @student-change="handleStudentChange"
        @program-change="handleProgramChange"
        @offering-change="handleOfferingChange"
      />

      <transition
        v-if="['add', 'edit', 'transfer'].includes(type)"
        enter-active-class="transition duration-500 ease-out"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
      >
        <div v-if="selectedOffering" class="enrollment-detail-panel">
          <EnrollmentOfferingOverview
            :selectedProgram="selectedProgram"
            :selectedOffering="selectedOffering"
            :sessionInfo="sessionInfo"
          />

          <AppAlert
            v-if="isTransferMode && selectedOffering && extraSessionsToPay > 0"
            type="warning"
            title="Different Term End Dates & Session Count"
            class="my-4"
          >
            Transfer from <strong>{{ oldBranchName }}</strong>: Target branch ends later and has <strong>{{ sessionInfo?.remaining || 0 }}</strong> remaining sessions, compared to <strong>{{ oldSessionInfo?.remaining || enrollment?.enrolledSessions || 0 }}</strong> remaining paid session(s) from previous branch.
            <br /><br />
            <strong>Note:</strong> {{ extraSessionsToPay }} extra session(s) require additional payment in the new branch.
          </AppAlert>

          <EnrollmentPricingPanel
            :form="form"
            @update:form="(val) => Object.assign(form, val)"
            :errors="errors"
            :shaking="shaking"
            :isEditMode="isEditMode"
            :finalAmount="finalAmount"
            @clear-error="clearError"
          />
        </div>
      </transition>

      <!-- Conflict Alert Panel before confirmation -->
      <transition
        v-if="['add', 'edit', 'transfer'].includes(type)"
        enter-active-class="transition duration-500 ease-out"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
      >
        <div
          v-if="selectedOfferingConflict"
          class="p-5 bg-error-soft border-2 border-error/30 rounded-xl flex flex-col gap-2 shadow-sm animate-fade-in mt-4"
        >
          <div class="flex items-center gap-2 text-error font-bold text-base">
            <img :src="getActionIcon('cancel')" class="w-5 h-5 shrink-0" />
            <span>Cannot Proceed with Enrollment: {{ selectedOfferingConflict.title }}</span>
          </div>
          <p class="text-sm font-semibold text-content-dark leading-relaxed pl-7">
            {{ selectedOfferingConflict.message }}
          </p>
        </div>
      </transition>

      <!-- Content for Pay Action -->
      <EnrollmentPayPanel
        v-if="type === 'pay'"
        :form="form"
        @update:form="(val) => Object.assign(form, val)"
        :displaySummary="displaySummary"
        :errors="errors"
        :shaking="shaking"
        @clear-error="clearError"
      />

      <!-- Content for Cancel Action -->
      <EnrollmentCancelPanel
        v-if="type === 'cancel'"
        :form="form"
        @update:form="(val) => Object.assign(form, val)"
        :errors="errors"
        :shaking="shaking"
        @clear-error="clearError"
      />

      <!-- Content for Delete Action -->
      <EnrollmentDeletePanel
        v-if="type === 'delete'"
        :form="form"
        @update:form="(val) => Object.assign(form, val)"
        :displaySummary="displaySummary"
        :errors="errors"
        :shaking="shaking"
        @clear-error="clearError"
      />

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
        <AppAlert v-if="type === 'edit' && !isChanged" type="info" class="w-full">
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
              :class="{ 'opacity-60 grayscale-20': (type === 'edit' && !isChanged) || isFormInvalid }"
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
