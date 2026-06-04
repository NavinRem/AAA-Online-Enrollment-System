<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import { classService } from '@/services/classService'
import { enrollmentService } from '@/services/enrollmentService'
import { programService } from '@/services/programService'
import { termService } from '@/services/termService'
import { getActionIcon, getProgramProfileURL, getStudentProfileURL } from '@/utils/assetHelper'
import {
  calculateClassProgress,
  formatDateOnly,
  generateClassSessions,
  DEFAULT_CAPACITY,
} from '@/utils/formatUtils'
import AppButton from '@/components/common/ui/AppButton.vue'
import ClassActionModal from '@/components/classes/ClassActionModal.vue'
import DataTable from '@/components/common/data/DataTable.vue'
import { useSearch, enrollmentSearchMapper } from '@/composables/useSearch'
import { useDataStore } from '@/stores/dataStore'
import { getStatusTheme, getStatusFilter } from '@/utils/badgeUtils'

const route = useRoute()
const router = useRouter()
const dataStore = useDataStore()

import { attendanceService } from '@/services/attendanceService'

const classData = ref(null)
const enrollments = ref([])
const terms = ref([])
const attendanceData = ref({}) // sessionId -> { studentId -> status }
const programData = ref(null)
const loading = ref(true)
const errorMessage = ref('')

const attendanceError = ref('')

const ATTENDANCE_STATUS = {
  P: { label: 'P', color: 'green', theme: 'bg-success/10 text-success' },
  A: { label: 'A', color: 'red', theme: 'bg-error-soft text-error' },
  M: {
    label: 'M',
    color: 'purple',
    theme: 'bg-primary-soft text-primary border border-primary/20 font-black',
  },
  L: { label: 'L', color: 'yellow', theme: 'bg-warning-soft text-warning' },
  N: { label: 'N', color: 'gray', theme: 'bg-surface-subtle text-content-muted/40' },
}

const getAttendanceStatus = (sessionId, studentId) => {
  return attendanceData.value[sessionId]?.[studentId] || 'N'
}

let isSyncing = false
const syncQueue = []

const processSyncQueue = async () => {
  if (isSyncing || syncQueue.length === 0) return
  isSyncing = true
  const task = syncQueue.shift()
  try {
    await task()
  } finally {
    isSyncing = false
    processSyncQueue()
  }
}

const isSessionDisabled = (sessionDate, studentStatus, sessionIndex, enrolledSessions) => {
  if (['cancelled', 'suspended', 'transferred'].includes(studentStatus)) return true
  if (enrolledSessions && sessionIndex >= enrolledSessions) return true
  const sDate = new Date(sessionDate).setHours(0, 0, 0, 0)
  const now = new Date().setHours(0, 0, 0, 0)
  return sDate > now
}

const getSessionDisableReason = (sessionDate, studentStatus, sessionIndex, enrolledSessions) => {
  if (['cancelled', 'suspended', 'transferred'].includes(studentStatus))
    return `Student is ${studentStatus}`
  if (enrolledSessions && sessionIndex >= enrolledSessions)
    return `Exceeded enrolled limit (${enrolledSessions} sessions)`
  const sDate = new Date(sessionDate).setHours(0, 0, 0, 0)
  const now = new Date().setHours(0, 0, 0, 0)
  if (sDate > now) return 'Session is in the future'
  return ''
}

const handleAttendanceClick = (
  sessionDate,
  sessionId,
  studentId,
  studentStatus,
  sessionIndex,
  enrolledSessions,
) => {
  if (isSessionDisabled(sessionDate, studentStatus, sessionIndex, enrolledSessions)) {
    attendanceError.value = getSessionDisableReason(
      sessionDate,
      studentStatus,
      sessionIndex,
      enrolledSessions,
    )
    setTimeout(() => {
      attendanceError.value = ''
    }, 3000)
  } else {
    toggleAttendanceDropdown(sessionId, studentId)
  }
}

const toggleEnrollmentField = async (enrollmentId, field) => {
  try {
    const item = filteredEnrollments.value.find((e) => e.id === enrollmentId)
    if (!item) return
    const newValue = !item[field]
    item[field] = newValue
    await enrollmentService.updateEnrollment(enrollmentId, { [field]: newValue })
    await dataStore.fetchAllCommonData(true, ['enrollments'])
  } catch (error) {
    console.error('Failed to update field:', error)
  }
}

const updateAttendanceStatus = async (sessionId, studentId, status) => {
  if (!attendanceData.value[sessionId]) {
    attendanceData.value[sessionId] = {}
  }

  const oldStatus = attendanceData.value[sessionId][studentId]
  if (oldStatus === status) return

  // 1. Reactive Clone Update
  // We clone the inner object to ensure Vue detects the change properly
  const newSessionData = { ...attendanceData.value[sessionId] }
  newSessionData[studentId] = status
  attendanceData.value[sessionId] = newSessionData

  syncQueue.push(async () => {
    try {
      const updates = []

      // Resolve term ID in case 'all' is selected
      const resolvedTermId =
        termFilter.value === 'all'
          ? terms.value.find((t) => t.isCurrent)?.id || terms.value[0]?.id
          : termFilter.value

      // 2. Persist primary change
      updates.push(
        attendanceService.recordAttendance(
          classData.value.id,
          sessionId,
          attendanceData.value[sessionId],
          resolvedTermId,
          scheduleFilter.value,
        ),
      )

      // 3. Makeup Logic
      if (status === 'M') {
        for (const session of sessions.value) {
          if (session.id === sessionId) continue
          if (attendanceData.value[session.id]?.[studentId] === 'A') {
            const linkedData = { ...attendanceData.value[session.id] }
            linkedData[studentId] = 'M'
            attendanceData.value[session.id] = linkedData

            updates.push(
              attendanceService.recordAttendance(
                classData.value.id,
                session.id,
                linkedData,
                resolvedTermId,
                scheduleFilter.value,
              ),
            )
            break
          }
        }
      }

      await Promise.all(updates)
    } catch (error) {
      console.error('Failed to save attendance', error)
      // Rollback
      const rollbackData = { ...attendanceData.value[sessionId] }
      rollbackData[studentId] = oldStatus
      attendanceData.value[sessionId] = rollbackData

      attendanceError.value = `Failed to sync: ${error.message || error}`
      setTimeout(() => {
        attendanceError.value = ''
      }, 5000)
    }
  })

  processSyncQueue()
}

const allOfferings = computed(() =>
  terms.value.flatMap((term) =>
    (term.offerings || [])
      .filter((offering) => String(offering.classId) === String(classData.value?.id))
      .map((offering) => {
        // Resolve branch-specific dates from branchSettings
        let startDate = term.startDate
        let endDate = term.endDate
        if (offering.branchId && term.branchSettings) {
          const setting = term.branchSettings.find(
            (s) => String(s.branchId) === String(offering.branchId),
          )
          if (setting) {
            startDate = setting.startDate
            endDate = setting.endDate
          }
        }
        return {
          ...offering,
          termId: term.id,
          termName: term.name,
          termStartDate: startDate,
          termEndDate: endDate,
        }
      }),
  ),
)

// Scoped offerings for metrics based on selected term filter
const selectedTermOfferings = computed(() => {
  if (termFilter.value === 'all') {
    const currentTermIds = terms.value.filter((t) => t.isCurrent).map((t) => String(t.id))
    return allOfferings.value.filter((o) => currentTermIds.includes(String(o.termId)))
  }
  return allOfferings.value.filter((o) => String(o.termId) === String(termFilter.value))
})

const groupedTeachers = computed(() => {
  const teacherMap = {}
  selectedTermOfferings.value.forEach((offering) => {
    ;(offering.teachers || []).forEach((teacher) => {
      const id = teacher.id || teacher._id
      if (!teacherMap[id]) {
        teacherMap[id] = {
          ...teacher,
          branches: new Map(), // Use Map to ensure unique branches by ID/Abbr
        }
      }
      if (offering.branch) {
        teacherMap[id].branches.set(offering.branch.id || offering.branch.abbr, offering.branch)
      }
    })
  })
  return Object.values(teacherMap).map((t) => ({
    ...t,
    branches: Array.from(t.branches.values()),
  }))
})

const primarySchedule = computed(() => {
  if (classData.value?.schedule?.day || classData.value?.schedule?.time)
    return classData.value.schedule
  return classData.value?.schedules?.[0] || { day: 'TBA', time: 'N/A' }
})

const uniqueBranches = computed(() => {
  const branchMap = new Map()

  // First, map all branches that the class itself is assigned to
  const classBranchIds = classData.value?.branchIds || []
  const classBranches =
    classData.value?.branches ||
    classBranchIds
      .map((id) => dataStore.branches.find((b) => String(b.id) === String(id)))
      .filter(Boolean)

  if (classBranches.length > 0) {
    classBranches.forEach((branch) => {
      const liveBranch = dataStore.branches.find((b) => String(b.id) === String(branch.id))
      branchMap.set(String(branch.id), {
        id: branch.id,
        name: branch.name,
        abbr: liveBranch?.abbr || branch.abbr || branch.name,
        color: liveBranch?.color || branch.color || 'gray', // Will be overridden if available
        studentCount: 0,
        isAvailable: false, // Default to false until we find an offering
      })
    })
  }

  // Then, override/update with active offerings for the current term
  selectedTermOfferings.value.forEach((offering) => {
    if (offering.branch?.id) {
      const branchId = String(offering.branch.id)
      const liveBranch = dataStore.branches.find((b) => String(b.id) === branchId)

      if (!branchMap.has(branchId)) {
        branchMap.set(branchId, {
          id: branchId,
          name: offering.branch.name,
          abbr: liveBranch?.abbr || offering.branch.abbr || offering.branch.name,
          color: liveBranch?.color || offering.branch.color || 'blue',
          studentCount: 0,
          isAvailable: true,
        })
      } else {
        const existing = branchMap.get(branchId)
        existing.isAvailable = true
        existing.color = liveBranch?.color || offering.branch.color || 'blue'
      }

      const paidStudentsCount = enrollments.value.filter(
        (e) =>
          (String(e.branchId) === branchId || String(e.class?.branch?.id) === branchId) &&
          String(e.termId) === String(offering.termId) &&
          (['paid', 'success'].includes(e.status) || ['paid', 'success'].includes(e.paymentStatus)),
      ).length

      branchMap.get(branchId).studentCount = paidStudentsCount
    }
  })
  return Array.from(branchMap.values())
})

const normalizeDate = (val) => {
  const date = new Date(val)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

// Resolve the correct start/end dates directly from term.branchSettings
// This is the single source of truth for session date generation — no offering chain
const selectedTermDates = computed(() => {
  const term = terms.value.find((t) => String(t.id) === String(termFilter.value))
  if (!term) return { startDate: null, endDate: null }

  // Resolve branch-specific dates from branchSettings
  if (branchFilter.value && term.branchSettings) {
    const setting = term.branchSettings.find(
      (s) => String(s.branchId) === String(branchFilter.value),
    )
    if (setting) {
      return { startDate: setting.startDate, endDate: setting.endDate }
    }
  }

  // Fallback to global term dates
  return { startDate: term.startDate, endDate: term.endDate }
})

const sessions = computed(() => {
  const { startDate, endDate } = selectedTermDates.value
  if (!startDate) return []

  // Get day of week from the selected schedule (class blueprint), not from offering
  const schedule = classData.value?.schedules?.find(
    (s) => String(s.id) === String(scheduleFilter.value),
  )
  const dayOfWeek = schedule?.day || primarySchedule.value?.day

  // Calculate total sessions
  const term = terms.value.find((t) => String(t.id) === String(termFilter.value))
  let total = term?.totalSessions || programData.value?.totalSessions
  if (!total) {
    const diff = normalizeDate(endDate) - normalizeDate(startDate)
    total = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000)) + 1
  }

  const baseSessions = generateClassSessions(startDate, dayOfWeek, total, endDate)

  // Audit: Enrich session IDs with term + branch prefix.
  // CRITICAL: This ensures attendance data is scoped to specific term/branch offerings,
  // preventing "Session 1" from Term A being overwritten by "Session 1" from Term B.
  return baseSessions.map((s) => ({
    ...s,
    id: `${termFilter.value}_${branchFilter.value}_${s.id}`,
  }))
})

const attendanceHeaders = computed(() => {
  const base = [
    { label: 'No', width: '50px', align: 'center' },
    { label: 'Name', width: '220px' },
    { label: 'Start Date', width: '120px', align: 'center' },
    { label: 'Sessions Enrolled', width: '140px', align: 'center' },
  ]

  const sessionCols = sessions.value.map((s) => ({
    label: s.label,
    subLabel: formatDateOnly(s.date),
    width: '120px',
    align: 'center',
    class: 'session-col',
  }))

  const extraCols = [
    { label: 'Exam', width: '90px', align: 'center' },
    { label: 'Report Card', width: '110px', align: 'center' },
    { label: 'Certificate', width: '110px', align: 'center' },
    { label: 'Remark', width: '180px' },
  ]

  return [...base, ...sessionCols, ...extraCols]
})

const currentEntityName = computed(() => 'student')
const currentTableTitle = computed(() => 'Student Attendance')

// Search & Pagination
const currentPage = ref(1)
const pageSize = ref(10)

// Filters
const termFilter = ref('all')
const branchFilter = ref('all')
const scheduleFilter = ref('all')

const termOptions = computed(() => {
  return terms.value
    .map((t) => {
      const progress = calculateClassProgress(t.startDate, t.endDate)
      return {
        label: t.name,
        value: t.id,
        isCurrent: t.isCurrent,
        status: progress.status,
      }
    })
    .sort((a, b) => {
      if (a.isCurrent) return -1
      if (b.isCurrent) return 1
      return a.status === 'active' ? -1 : 1
    })
})

const branchFilterOptions = computed(() => {
  return uniqueBranches.value.map((b) => ({
    label: b.name,
    value: b.id,
    color: b.color,
    badge: { status: b.abbr, type: b.color },
  }))
})

const filteredEnrollments = computed(() => {
  const filtered = enrollments.value.filter((e) => {
    // Audit: Only successful/eligible enrollments are shown for attendance
    if (!['paid', 'success'].includes(e.status) && !['paid', 'success'].includes(e.paymentStatus))
      return false

    const termMatch = termFilter.value === 'all' || String(e.termId) === String(termFilter.value)

    const branchId = e.branchId || e.class?.branch?.id
    const branchMatch =
      branchFilter.value === 'all' || String(branchId) === String(branchFilter.value)

    const scheduleId = e.scheduleId || e.class?.schedule?.id
    const scheduleMatch =
      scheduleFilter.value === 'all' || String(scheduleId) === String(scheduleFilter.value)

    return termMatch && branchMatch && scheduleMatch
  })

  // Sort alphabetically by student name for clean organization
  return filtered.sort((a, b) => {
    const nameA = (a.student?.name || '').toLowerCase()
    const nameB = (b.student?.name || '').toLowerCase()
    return nameA.localeCompare(nameB)
  })
})

const { searchResults } = useSearch(filteredEnrollments, enrollmentSearchMapper)

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return searchResults.value.slice(start, start + pageSize.value)
})

const dropdowns = ref({
  term: false,
  branch: false,
  schedule: false,
})

const filterMenuStyles = ref({})

const activeAttendanceCell = ref(null)

const toggleAttendanceDropdown = (sessionId, studentId) => {
  const cellId = `${sessionId}-${studentId}`
  if (activeAttendanceCell.value === cellId) {
    activeAttendanceCell.value = null
  } else {
    activeAttendanceCell.value = cellId
  }
}

const toggleDropdown = (type, event) => {
  const isOpening = !dropdowns.value[type]
  // Close all first
  dropdowns.value.term = false
  dropdowns.value.branch = false
  dropdowns.value.schedule = false

  dropdowns.value[type] = isOpening

  if (isOpening && event) {
    const rect = event.currentTarget.getBoundingClientRect()
    filterMenuStyles.value = {
      top: `${rect.bottom + window.scrollY + 8}px`,
      left: `${Math.min(rect.left + window.scrollX, window.innerWidth - 250)}px`,
      minWidth: '240px',
    }
  }
}

const selectFilter = (type, value) => {
  if (type === 'term') termFilter.value = value
  else if (type === 'branch') branchFilter.value = value
  else if (type === 'schedule') scheduleFilter.value = value

  dropdowns.value.term = false
  dropdowns.value.branch = false
  dropdowns.value.schedule = false
}

const getActiveLabel = (type) => {
  if (type === 'term') {
    const opt = termOptions.value.find((o) => String(o.value) === String(termFilter.value))
    return opt ? opt.label : termOptions.value[0]?.label || 'Term'
  } else if (type === 'branch') {
    const opt = branchFilterOptions.value.find(
      (o) => String(o.value) === String(branchFilter.value),
    )
    return opt || branchFilterOptions.value[0] || { label: 'Branch', color: 'gray' }
  } else {
    const opt = scheduleOptions.value.find((o) => String(o.id) === String(scheduleFilter.value))
    return opt ? opt.name : scheduleOptions.value[0]?.name || 'Schedule'
  }
}

const getActiveScheduleDay = () => {
  const opt = scheduleOptions.value.find((o) => String(o.id) === String(scheduleFilter.value))
  return opt ? opt.day : scheduleOptions.value[0]?.day || ''
}

const handleClickOutside = (e) => {
  if (
    !e.target.closest('#term-filter-btn') &&
    !e.target.closest('#branch-filter-btn') &&
    !e.target.closest('#schedule-filter-btn') &&
    !e.target.closest('.attendance-dropdown-trigger') &&
    !e.target.closest('.attendance-dropdown-menu')
  ) {
    dropdowns.value.term = false
    dropdowns.value.branch = false
    dropdowns.value.schedule = false
    activeAttendanceCell.value = null
  }
}

const actionModal = ref({
  isOpen: false,
  type: 'edit',
  loading: false,
  error: '',
  success: '',
})

const openActionModal = (type) => {
  actionModal.value = {
    isOpen: true,
    type,
    loading: false,
    error: '',
    success: '',
  }
}

const handleModalSubmit = async (payload) => {
  actionModal.value.loading = true
  actionModal.value.error = ''
  try {
    if (actionModal.value.type === 'edit') {
      await classService.updateClass(classData.value.id, payload)
      actionModal.value.success = 'Class updated successfully!'
    } else if (actionModal.value.type === 'delete') {
      await classService.deleteClass(classData.value.id)
      actionModal.value.success = 'Class deleted successfully!'
      await dataStore.fetchAllCommonData(true, ['classes'])
      setTimeout(() => {
        router.push('/classes')
      }, 1500)
      return
    }

    await dataStore.fetchAllCommonData(true, ['classes'])
    setTimeout(() => {
      actionModal.value.isOpen = false
      fetchData(classData.value.id)
    }, 1500)
  } catch (err) {
    actionModal.value.error = err.message || 'Action failed'
  } finally {
    actionModal.value.loading = false
  }
}

const getScheduleStatus = (schedule) => {
  const currentTermId =
    termFilter.value === 'all'
      ? terms.value.find((t) => t.isCurrent)?.id || terms.value[0]?.id
      : termFilter.value
  const currentBranchId =
    branchFilter.value === 'all' ? uniqueBranches.value[0]?.id : branchFilter.value

  const off = allOfferings.value.find(
    (o) =>
      (String(o.termId) === String(currentTermId) ||
        String(o.term?.id) === String(currentTermId)) &&
      (String(o.branchId) === String(currentBranchId) ||
        String(o.branch?.id) === String(currentBranchId)) &&
      (String(o.scheduleId) === String(schedule.id) ||
        String(o.schedule?.id) === String(schedule.id)),
  )

  if (!off) {
    const isFull = schedule.status === 'full'
    return { status: schedule.status || 'Active', type: isFull ? 'red' : 'green' }
  }

  const count = Number(off.currentCount || off.students?.length || 0)
  const capacity = Number(schedule.capacity || off?.capacity || DEFAULT_CAPACITY)

  if (count >= capacity) return { status: 'Full', type: 'red' }

  const startDate = off.termStartDate || off.term?.startDate
  const endDate = off.termEndDate || off.term?.endDate

  if (startDate && endDate) {
    const progress = calculateClassProgress(startDate, endDate, schedule.day, schedule.time)
    if (progress.status === 'ongoing') return { status: 'Ongoing', type: 'blue' }
    if (progress.status === 'archived') return { status: 'Completed', type: 'gray' }
  }

  return { status: 'Active', type: 'green' }
}

const getScheduleCapacity = (schedule) => {
  const currentTermId =
    termFilter.value === 'all'
      ? terms.value.find((t) => t.isCurrent)?.id || terms.value[0]?.id
      : termFilter.value
  const currentBranchId =
    branchFilter.value === 'all' ? uniqueBranches.value[0]?.id : branchFilter.value

  const off = allOfferings.value.find(
    (o) =>
      (String(o.termId) === String(currentTermId) ||
        String(o.term?.id) === String(currentTermId)) &&
      (String(o.branchId) === String(currentBranchId) ||
        String(o.branch?.id) === String(currentBranchId)) &&
      (String(o.scheduleId) === String(schedule.id) ||
        String(o.schedule?.id) === String(schedule.id)),
  )

  return schedule.capacity || off?.capacity || DEFAULT_CAPACITY
}

const scheduleOptions = computed(() => {
  if (!classData.value?.schedules) return []
  return classData.value.schedules.map((s) => ({
    id: s.id,
    name: `${s.day} (${s.time})`,
    day: s.day,
  }))
})

const isInitializing = ref(true)

const fetchData = async (id) => {
  if (!id) return
  loading.value = true
  errorMessage.value = ''
  isInitializing.value = true
  try {
    const [data, enrollmentData, attendanceMap, termData] = await Promise.all([
      classService.getClass(id),
      enrollmentService.getAllEnrollments({ classId: id }),
      attendanceService.getClassAttendance(id),
      termService.getAllTerms(),
      dataStore.fetchBranches(),
    ])
    const normalizedSchedule = data.schedule || data.schedules?.[0] || { day: 'TBA', time: 'N/A' }
    data.schedule = normalizedSchedule

    classData.value = data
    terms.value = termData?.data || termData || []
    enrollments.value = enrollmentData?.data || enrollmentData || []
    attendanceData.value = attendanceMap || {}

    if (data?.programId) {
      const pData = await programService.getProgram(data.programId)
      programData.value = pData?.data || pData
    }

    // Set default filters — always select a concrete option, no "All" state
    if (terms.value.length > 0) {
      const currentTerm = terms.value.find((t) => t.isCurrent) || terms.value[0]
      if (currentTerm) {
        termFilter.value = currentTerm.id
      }
    }

    await nextTick()

    if (uniqueBranches.value.length > 0) {
      branchFilter.value = uniqueBranches.value[0].id
    }

    if (classData.value?.schedules?.length > 0) {
      scheduleFilter.value = classData.value.schedules[0].id
    }

    isInitializing.value = false
  } catch (err) {
    console.error('Failed to fetch class details:', err)
    errorMessage.value = err.message || 'Failed to load class details'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  window.addEventListener('mousedown', handleClickOutside)
  if (route.params.id) fetchData(route.params.id)
})

onUnmounted(() => {
  window.removeEventListener('mousedown', handleClickOutside)
})

watch(
  () => route.params.id,
  (newId) => {
    if (newId) fetchData(newId)
  },
)

watch(termFilter, (newTermId) => {
  if (isInitializing.value) return
  if (newTermId) {
    // Reset branch filter when term changes to ensure we show valid branches
    if (uniqueBranches.value.length > 0) {
      branchFilter.value = uniqueBranches.value[0].id
    } else {
      branchFilter.value = 'all'
    }
  }
})

watch(branchFilter, (newBranchId) => {
  if (newBranchId && classData.value?.schedules?.length > 0) {
    scheduleFilter.value = classData.value.schedules[0].id
  }
})
</script>

<template>
  <DashboardLayout>
    <DetailPageLayout
      :loading="loading"
      :errorMessage="errorMessage"
      backRoute="/classes"
      title="Class Analytics"
      sidebarWidth="md"
      :scrollable="false"
    >
      <template #header-actions v-if="classData">
        <div class="flex items-center gap-3">
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-primary-soft transition-all duration-300 hover:bg-primary hover:border-primary group"
            title="Edit Class"
            @click="openActionModal('edit')"
          >
            <img :src="getActionIcon('edit')" class="w-5 h-5 brightness-0 transition-all" />
          </button>
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-error-soft transition-all duration-300 hover:bg-error hover:border-error group"
            title="Delete Class"
            @click="openActionModal('delete')"
          >
            <img :src="getActionIcon('delete')" class="w-5 h-5 brightness-0 transition-all" />
          </button>
        </div>
      </template>

      <template #left-content v-if="classData">
        <!-- Table Content -->

        <AppAlert
          :show="!!attendanceError"
          type="error"
          closable
          @close="attendanceError = ''"
          class="mb-3"
        >
          {{ attendanceError }}
        </AppAlert>

        <section
          class="overflow-hidden animate-fade-in flex-1 border border-outline-std rounded-xl bg-white shadow-sm flex flex-col min-h-0 mb-6"
        >
          <DataTable
            :title="currentTableTitle"
            :headers="attendanceHeaders"
            :items="paginatedItems"
            :loading="loading"
            :entityName="currentEntityName"
            :flexible="false"
            :hasSearch="false"
            :hasPagination="true"
            v-model:currentPage="currentPage"
            :pageSize="pageSize"
            :totalItems="searchResults.length"
            :hasFilter="false"
            class="flex-1 min-h-0"
          >
            <template #toolbar-actions>
              <div class="flex items-center gap-3">
                <!-- Term Filter -->
                <div class="relative" id="term-filter-btn">
                  <AppButton variant="secondary" size="md" @click="toggleDropdown('term', $event)">
                    <img :src="getActionIcon('filter')" class="w-4 h-4 brightness-0" />
                    <span>{{ getActiveLabel('term') }}</span>
                  </AppButton>
                  <Teleport to="body">
                    <transition
                      enter-active-class="transition duration-200 ease-out"
                      enter-from-class="transform scale-95 opacity-0"
                      enter-to-class="transform scale-100 opacity-100"
                      leave-active-class="transition duration-150 ease-in"
                      leave-from-class="opacity-100"
                      leave-to-class="opacity-0"
                    >
                      <div
                        v-if="dropdowns.term"
                        class="toolbar-filter-menu"
                        :style="filterMenuStyles"
                        @mousedown.stop
                      >
                        <div
                          v-for="opt in termOptions"
                          :key="opt.value"
                          class="toolbar-filter-option"
                          :class="{
                            'active-filter-item': String(termFilter) === String(opt.value),
                          }"
                          @click="selectFilter('term', opt.value)"
                        >
                          {{ opt.label }}
                        </div>
                      </div>
                    </transition>
                  </Teleport>
                </div>

                <!-- Branch Filter -->
                <div class="relative" id="branch-filter-btn">
                  <AppButton
                    size="md"
                    @click="toggleDropdown('branch', $event)"
                    :style="{
                      backgroundColor: getActiveLabel('branch').color
                        ? getActiveLabel('branch').color
                        : 'var(--color-surface-light)',
                    }"
                  >
                    <img :src="getActionIcon('filter')" class="w-4 h-4 brightness-0 invert" />
                    <span>{{ getActiveLabel('branch').label }}</span>
                  </AppButton>
                  <Teleport to="body">
                    <transition
                      enter-active-class="transition duration-200 ease-out"
                      enter-from-class="transform scale-95 opacity-0"
                      enter-to-class="transform scale-100 opacity-100"
                      leave-active-class="transition duration-150 ease-in"
                      leave-from-class="opacity-100"
                      leave-to-class="opacity-0"
                    >
                      <div
                        v-if="dropdowns.branch"
                        class="toolbar-filter-menu"
                        :style="filterMenuStyles"
                        @mousedown.stop
                      >
                        <div
                          v-for="opt in branchFilterOptions"
                          :key="opt.value"
                          class="toolbar-filter-option"
                          :class="{
                            'active-filter-item': String(branchFilter) === String(opt.value),
                          }"
                          @click="selectFilter('branch', opt.value)"
                        >
                          <div class="flex items-center justify-between gap-3">
                            <div
                              v-if="opt.badge"
                              class="shrink-0 flex items-center justify-center min-w-10"
                            >
                              <AppBadge :status="opt.badge.status" :type="opt.badge.type" />
                            </div>
                            <div
                              v-else-if="opt.color"
                              class="w-2 h-2 rounded-full mx-1"
                              :style="{ backgroundColor: `var(--color-${opt.color})` }"
                            ></div>
                            <span class="truncate">{{ opt.label }}</span>
                          </div>
                        </div>
                      </div>
                    </transition>
                  </Teleport>
                </div>

                <!-- Schedule Filter -->
                <div class="relative" id="schedule-filter-btn" v-if="scheduleOptions.length > 1">
                  <AppButton
                    size="md"
                    @click="toggleDropdown('schedule', $event)"
                    :style="{
                      backgroundColor: getActiveScheduleDay()
                        ? getStatusTheme(getActiveScheduleDay(), 'day').backgroundColor
                        : 'var(--color-surface-light)',
                      color: getActiveScheduleDay()
                        ? getStatusTheme(getActiveScheduleDay(), 'day').color
                        : 'inherit',
                    }"
                  >
                    <img
                      :src="getActionIcon('filter')"
                      class="w-4 h-4 brightness-0"
                      :style="{
                        filter: getActiveScheduleDay()
                          ? getStatusFilter(getActiveScheduleDay(), 'day')
                          : 'invert(0)',
                      }"
                    />
                    <span>{{ getActiveLabel('schedule') }}</span>
                  </AppButton>
                  <Teleport to="body">
                    <transition
                      enter-active-class="transition duration-200 ease-out"
                      enter-from-class="transform scale-95 opacity-0"
                      enter-to-class="transform scale-100 opacity-100"
                      leave-active-class="transition duration-150 ease-in"
                      leave-from-class="opacity-100"
                      leave-to-class="opacity-0"
                    >
                      <div
                        v-if="dropdowns.schedule"
                        class="toolbar-filter-menu"
                        :style="filterMenuStyles"
                        @mousedown.stop
                      >
                        <div
                          v-for="opt in scheduleOptions"
                          :key="opt.id"
                          class="toolbar-filter-option"
                          :class="{
                            'active-filter-item': String(scheduleFilter) === String(opt.id),
                          }"
                          @click="selectFilter('schedule', opt.id)"
                        >
                          {{ opt.name }}
                        </div>
                      </div>
                    </transition>
                  </Teleport>
                </div>
              </div>
            </template>

            <template #row="{ item, index, headers }">
              <td
                class="ui-cell text-center"
                :style="{ width: headers[0].width, minWidth: headers[0].width }"
              >
                <span class="font-bold text-content-dark text-sm">{{
                  (currentPage - 1) * pageSize + index + 1
                }}</span>
              </td>
              <td class="ui-cell" :style="{ width: headers[1].width, minWidth: headers[1].width }">
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-full overflow-hidden bg-surface-subtle border border-outline-std flex-shrink-0"
                  >
                    <img
                      :src="getStudentProfileURL(item.student?.profileURL)"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div class="flex flex-col">
                    <span class="font-bold text-content-dark text-sm leading-tight">{{
                      item.student?.name || 'Unknown'
                    }}</span>
                    <AppBadge
                      v-if="['cancelled', 'suspended', 'transferred'].includes(item.status)"
                      :status="item.status"
                      size="xs"
                    />
                  </div>
                </div>
              </td>
              <td
                class="ui-cell text-center font-bold text-content-dark text-xs"
                :style="{ width: headers[2].width, minWidth: headers[2].width }"
              >
                {{ formatDateOnly(item.enrollAt) || 'N/A' }}
              </td>
              <td
                class="ui-cell text-center font-bold text-content-dark text-xs"
                :style="{ width: headers[3].width, minWidth: headers[3].width }"
              >
                {{ item.enrolledSessions || 0 }} sessions
              </td>

              <!-- Session Columns -->
              <td
                v-for="(session, sIdx) in sessions"
                :key="session.id"
                class="ui-cell text-center p-1"
                :style="{ width: headers[4 + sIdx]?.width, minWidth: headers[4 + sIdx]?.width }"
              >
                <div class="flex flex-col items-center gap-1 relative group/cell">
                  <!-- Attendance Select Dropdown -->
                  <div class="relative w-10 h-10">
                    <div
                      class="attendance-dropdown-trigger w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all group-hover/cell:scale-110 shadow-sm border border-outline-std select-none"
                      :class="[
                        ATTENDANCE_STATUS[getAttendanceStatus(session.id, item.studentId)]?.theme ||
                          ATTENDANCE_STATUS.N.theme,
                        isSessionDisabled(session.date, item.status, sIdx, item.enrolledSessions)
                          ? 'opacity-20 grayscale cursor-not-allowed'
                          : 'cursor-pointer hover:shadow-md',
                      ]"
                      :title="
                        getSessionDisableReason(
                          session.date,
                          item.status,
                          sIdx,
                          item.enrolledSessions,
                        )
                      "
                      @click="
                        handleAttendanceClick(
                          session.date,
                          session.id,
                          item.studentId,
                          item.status,
                          sIdx,
                          item.enrolledSessions,
                        )
                      "
                    >
                      {{
                        ATTENDANCE_STATUS[getAttendanceStatus(session.id, item.studentId)]?.label ||
                        'N'
                      }}
                    </div>

                    <transition
                      enter-active-class="transition duration-150 ease-out"
                      enter-from-class="transform scale-95 opacity-0"
                      enter-to-class="transform scale-100 opacity-100"
                      leave-active-class="transition duration-100 ease-in"
                      leave-from-class="opacity-100"
                      leave-to-class="opacity-0"
                    >
                      <div
                        v-if="activeAttendanceCell === `${session.id}-${item.studentId}`"
                        class="attendance-dropdown-menu absolute z-sticky-header left-1/2 -translate-x-1/2 mt-2 w-36 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden py-1"
                        @mousedown.stop
                      >
                        <div
                          v-for="(cfg, key) in ATTENDANCE_STATUS"
                          :key="key"
                          @click="
                            (updateAttendanceStatus(session.id, item.studentId, key),
                            (activeAttendanceCell = null))
                          "
                          class="px-3 py-2 text-sm font-semibold cursor-pointer hover:bg-gray-50 flex items-center gap-3 transition-colors"
                        >
                          <div
                            class="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                            :class="cfg.theme"
                          >
                            {{ cfg.label }}
                          </div>
                          <span class="text-gray-700">
                            {{
                              key === 'P'
                                ? 'Present'
                                : key === 'A'
                                  ? 'Absent'
                                  : key === 'M'
                                    ? 'Makeup'
                                    : key === 'L'
                                      ? 'Late'
                                      : 'None'
                            }}
                          </span>
                        </div>
                      </div>
                    </transition>
                  </div>
                </div>
              </td>

              <!-- Special Columns -->
              <td
                class="ui-cell text-center"
                :style="{
                  width: headers[4 + sessions.length]?.width,
                  minWidth: headers[4 + sessions.length]?.width,
                }"
              >
                <button
                  @click="toggleEnrollmentField(item.id, 'hasPassedExam')"
                  class="w-6 h-6 rounded-md flex items-center justify-center mx-auto transition-colors border"
                  :class="
                    item.hasPassedExam
                      ? 'bg-green-100 border-green-500 text-green-600'
                      : 'bg-surface-subtle border-outline-std text-content-muted hover:bg-gray-100'
                  "
                  title="Mark Exam Passed"
                >
                  <svg
                    v-if="item.hasPassedExam"
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </button>
              </td>
              <td
                class="ui-cell text-center"
                :style="{
                  width: headers[5 + sessions.length]?.width,
                  minWidth: headers[5 + sessions.length]?.width,
                }"
              >
                <button
                  @click="toggleEnrollmentField(item.id, 'hasReceivedReportCard')"
                  class="w-6 h-6 rounded-md flex items-center justify-center mx-auto transition-colors border"
                  :class="
                    item.hasReceivedReportCard
                      ? 'bg-blue-100 border-blue-500 text-blue-600'
                      : 'bg-surface-subtle border-outline-std text-content-muted hover:bg-gray-100'
                  "
                  title="Mark Report Card Sent"
                >
                  <svg
                    v-if="item.hasReceivedReportCard"
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </button>
              </td>
              <td
                class="ui-cell text-center"
                :style="{
                  width: headers[6 + sessions.length]?.width,
                  minWidth: headers[6 + sessions.length]?.width,
                }"
              >
                <button
                  @click="toggleEnrollmentField(item.id, 'hasReceivedCertificate')"
                  class="w-6 h-6 rounded-md flex items-center justify-center mx-auto transition-colors border"
                  :class="
                    item.hasReceivedCertificate
                      ? 'bg-purple-100 border-purple-500 text-purple-600'
                      : 'bg-surface-subtle border-outline-std text-content-muted hover:bg-gray-100'
                  "
                  title="Mark Certificate Issued"
                >
                  <svg
                    v-if="item.hasReceivedCertificate"
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </button>
              </td>
              <td
                class="ui-cell"
                :style="{
                  width: headers[7 + sessions.length]?.width,
                  minWidth: headers[7 + sessions.length]?.width,
                }"
              >
                <span class="text-xs text-content-muted">{{ item.remark || '-' }}</span>
              </td>
            </template>
          </DataTable>
        </section>
      </template>

      <template #right-content v-if="classData">
        <div class="flex flex-col gap-md">
          <!-- Class Identity Card -->
          <section class="ui-detail-card flex flex-col items-center gap-6">
            <h2 class="w-full font-bold text-content-dark text-center">Basic Information</h2>
            <div class="relative group">
              <div
                class="w-40 h-40 rounded-full overflow-hidden ring-4 ring-white shadow-2xl transition-transform duration-500 group-hover:scale-105 border-2 border-gray-100 bg-surface-subtle p-6"
              >
                <img
                  :src="
                    getProgramProfileURL(
                      programData?.profileURL || classData.program?.profileURL,
                      programData?.category || classData.program?.category,
                      programData?.categorySnapshot?.profileURL ||
                        classData.program?.categorySnapshot?.profileURL,
                    )
                  "
                  alt="Program Logo"
                  class="w-full h-full object-contain"
                />
              </div>
            </div>
          </section>
          <!-- Parameters Card -->
          <section class="ui-detail-card !py-6">
            <div class="space-y-4">
              <div class="flex justify-between items-center gap-1">
                <span class="text-base font-bold text-content-dark">Class Name:</span>
                <span class="text-base font-bold text-content-muted">{{
                  programData?.name || classData.program?.name || 'N/A'
                }}</span>
              </div>
              <div class="flex justify-between items-center gap-1">
                <span class="text-base font-bold text-content-dark">Category:</span>
                <span class="text-base font-bold text-content-muted">{{
                  programData?.category || classData.program?.category || 'Standard'
                }}</span>
              </div>
              <div class="flex justify-between items-center gap-1">
                <span class="text-base font-bold text-content-dark">Level:</span>
                <span class="text-base font-bold text-content-muted">{{
                  programData?.level || classData.program?.level || 'L1'
                }}</span>
              </div>
              <!-- Schedules Section -->
              <div class="flex flex-col gap-3 pt-2">
                <span class="text-base font-bold text-content-dark">Schedules</span>
                <div class="space-y-2.5">
                  <div
                    v-for="schedule in classData.schedules || []"
                    :key="schedule.id || `${schedule.day}-${schedule.time}`"
                    class="flex items-center justify-between bg-primary-soft px-4 py-3 rounded-sm border border-outline-std transition-all group"
                  >
                    <div class="flex flex-col gap-0.5">
                      <span
                        class="text-sm font-bold text-content-dark group-hover:text-primary transition-colors"
                        >{{ schedule.day }}</span
                      >
                      <span class="text-xs font-semibold text-primary/80">{{ schedule.time }}</span>
                    </div>

                    <div class="flex items-center gap-4">
                      <div class="w-px h-6 bg-outline-std/50"></div>
                      <div class="flex flex-col items-center shrink-0">
                        <span
                          class="text-xs font-black text-content-muted tracking-tighter leading-none mb-1"
                          >Seats</span
                        >
                        <span class="text-sm font-black text-content-dark leading-none">{{
                          getScheduleCapacity(schedule)
                        }}</span>
                      </div>
                      <div class="w-px h-6 bg-outline-std/50"></div>
                      <AppBadge
                        v-bind="getScheduleStatus(schedule)"
                        size="sm"
                        class="min-w-20 justify-center shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Branches Section -->
              <div class="flex flex-col gap-3 pt-4 border-t border-outline-std/40">
                <span class="text-base font-bold text-content-dark">Branches</span>
                <div class="grid grid-cols-1 gap-2.5">
                  <div
                    v-for="branch in uniqueBranches"
                    :key="branch.id"
                    class="flex items-center justify-between bg-primary-soft p-2.5 pl-4 rounded-sm border border-outline-std transition-all group"
                  >
                    <span
                      class="text-sm font-bold text-content-dark group-hover:text-primary transition-colors"
                      >{{ branch.name || branch.abbr }}</span
                    >
                    <div class="flex items-center gap-2">
                      <AppBadge
                        :status="branch.abbr"
                        :type="branch.color"
                        size="sm"
                        class="min-w-16 shadow-sm"
                      />
                      <AppBadge
                        v-if="branch.isAvailable"
                        :status="`${branch.studentCount} Students`"
                        size="sm"
                        class="font-bold text-content-muted !bg-transparent !border-none"
                      />
                      <span v-else class="text-xs font-bold text-error mr-2">Unavailable</span>
                    </div>
                  </div>
                  <span
                    v-if="uniqueBranches.length === 0"
                    class="text-sm font-bold text-content-muted italic p-4 text-center bg-primary-soft border border-outline-std rounded-sm"
                    >No active offerings for this term</span
                  >
                </div>
              </div>

              <!-- Teachers Section -->
              <div
                class="flex flex-col gap-3 pt-4 border-t border-outline-std/40"
                v-if="selectedTermOfferings.length > 0"
              >
                <span class="text-base font-bold text-content-dark">Teachers</span>
                <div class="grid grid-cols-1 gap-2.5">
                  <div
                    v-for="teacher in groupedTeachers"
                    :key="teacher.id"
                    class="flex items-center justify-between bg-surface-subtle/50 p-2.5 pl-4 rounded-sm border border-outline-std transition-all group hover:bg-white"
                  >
                    <div class="flex items-center gap-3">
                      <img
                        :src="teacher.profileURL || getImageUrl('profiles/avatar-teacher-man')"
                        class="w-8 h-8 rounded-full border border-white shadow-sm shrink-0"
                      />
                      <span class="text-sm font-black text-content-dark truncate max-w-32">{{
                        teacher.name
                      }}</span>
                    </div>
                    <div class="flex items-center gap-1 flex-wrap justify-end">
                      <AppBadge
                        v-for="branch in teacher.branches"
                        :key="branch.id || branch.abbr"
                        :status="branch.abbr || 'HQ'"
                        :type="branch.color || 'blue'"
                        size="xs"
                      />
                    </div>
                  </div>
                  <span
                    v-if="groupedTeachers.length === 0"
                    class="text-xs font-bold text-content-muted italic p-4 text-center bg-primary-soft border border-outline-std rounded-sm"
                    >No teachers assigned to this term's sessions</span
                  >
                </div>
              </div>
            </div>
          </section>
        </div>
      </template>
    </DetailPageLayout>

    <ClassActionModal
      :isOpen="actionModal.isOpen"
      :type="actionModal.type"
      :classInstance="classData"
      :loading="actionModal.loading"
      v-model:error="actionModal.error"
      v-model:success="actionModal.success"
      @close="actionModal.isOpen = false"
      @submit="handleModalSubmit"
    />
  </DashboardLayout>
</template>

<style scoped>
.ui-detail-card {
  @apply bg-white rounded-xl p-8 border border-outline-std shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-primary/5;
}

.toolbar-filter-menu {
  @apply fixed bg-white rounded-md shadow-2xl border border-outline-std z-dropdown p-xs min-w-60 max-h-80 overflow-y-auto;
}

.toolbar-filter-option {
  @apply px-md py-sm text-sm font-semibold cursor-pointer transition-all rounded-sm select-none hover:bg-surface-subtle hover:text-primary;
}

.active-filter-item {
  @apply bg-primary text-white hover:bg-primary hover:text-white !important;
}

:deep(.table-content-area table) {
  table-layout: fixed;
}
</style>
