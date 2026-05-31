<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDataStore } from '@/stores/dataStore'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import DataTable from '@/components/common/data/DataTable.vue'
import DetailMetricCard from '@/components/common/data/DetailMetricCard.vue'
import { termService } from '@/services/termService'
import { getImageUrl, getActionIcon, getProgramProfileURL } from '@/utils/assetHelper'
import {
  formatPrice,
  formatShortDate,
  formatDateOnly,
  calculateClassProgress,
  calculateOfferingStatus,
} from '@/utils/formatUtils'
import { calculateTermEndDate } from '@/utils/sessionHelper'
import TermActionModal from '@/components/terms/TermActionModal.vue'
import ClassActionModal from '@/components/classes/ClassActionModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import { teacherService } from '@/services/teacherService'
import { useSearch, classSearchMapper, studentSearchMapper } from '@/composables/useSearch'
import { useTableActions } from '@/composables/useTableActions'

const route = useRoute()
const router = useRouter()
const dataStore = useDataStore()

const loading = ref(true)
const errorMessage = ref('')
const term = ref(null)
const branches = ref([])
const activeBranchId = ref(null)
const activeSubTab = ref('classes') // 'classes' or 'students'

const { activeMenuId, isMenuAbove, menuStyles, toggleMenu, closeMenu } = useTableActions()

const classActionModal = ref({
  isOpen: false,
  type: 'add',
  classItem: null,
  context: null,
  loading: false,
  error: '',
  success: '',
})

const initData = async () => {
  const id = route.params.id
  loading.value = true
  errorMessage.value = ''

  try {
    const [tData] = await Promise.all([
      termService.getTerm(id),
      dataStore.fetchBranches(),
      dataStore.fetchTrials(),
      dataStore.fetchEnrollments(),
      dataStore.fetchStudents(),
      dataStore.fetchPrograms(),
    ])

    term.value = tData.data || tData
    branches.value = dataStore.branches

    if (term.value.branchIds && term.value.branchIds.length > 0) {
      activeBranchId.value = term.value.branchIds[0]
    }
  } catch (err) {
    console.error('Error fetching term details:', err)
    errorMessage.value = 'Failed to load term details'
  } finally {
    loading.value = false
  }
}

onMounted(initData)

const termBranches = computed(() => {
  if (!term.value || !branches.value.length) return []
  return term.value.branchIds
    .map((id) => branches.value.find((b) => String(b.id) === String(id)))
    .filter(Boolean)
})

const activeBranch = computed(() => {
  return branches.value.find((b) => String(b.id) === String(activeBranchId.value))
})

const activeBranchSetting = computed(() => {
  if (!term.value || !activeBranchId.value || !term.value.branchSettings) return null
  return term.value.branchSettings.find((s) => String(s.branchId) === String(activeBranchId.value))
})

const rawBranchOfferings = computed(() => {
  if (!term.value || !activeBranchId.value) return []

  const setting = activeBranchSetting.value || term.value
  const startDate = new Date(setting.startDate)
  const endDate = new Date(setting.endDate)
  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(23, 59, 59, 999)

  // Filter offerings belonging to the active branch
  const rawOfferings = (term.value.offerings || []).filter(
    (o) => String(o.branchId) === String(activeBranchId.value),
  )

  return rawOfferings.map((off) => {
    // Enrich with latest program data from store
    const liveProgram = dataStore.programs.find(
      (p) =>
        String(p.id) === String(off.program?.id) ||
        String(p.id) === String(off.classId) ||
        String(p.id) === String(off.programId),
    )
    const program = liveProgram || off.program

    // Find enrollments for this specific offering from the branch-pre-filtered list
    const offeringEnrollments = branchEnrollments.value.filter((e) => {
      const isSameTerm = String(e.termId) === String(term.value.id)

      // Strict matching: If termOfferingId is provided, it MUST match
      if (e.termOfferingId) {
        return String(e.termOfferingId) === String(off.offeringId)
      }

      // Fallback matching: If no termOfferingId, match by class and branch/date
      const isSameClass =
        String(e.classId) === String(off.classId) || String(e.programId) === String(off.programId)
      if (!isSameClass || !isSameTerm) return false

      const enrollDate = new Date(e.enrollAt || e.createdAt)
      const matchesBranchAndDate =
        String(e.branchId) === String(activeBranchId.value) &&
        enrollDate >= startDate &&
        enrollDate <= endDate

      // If we match by class and branch/date, but have no offeringId,
      // we only count it in the FIRST offering of this class to avoid double counting
      // Note: This is a simple heuristic. Better would be to fix the data at source.
      const firstOfferingOfClass = term.value.offerings.find(
        (o) =>
          String(o.branchId) === String(activeBranchId.value) &&
          (String(o.classId) === String(off.classId) ||
            String(o.programId) === String(off.programId)),
      )

      const isFirstOffering = String(firstOfferingOfClass?.offeringId) === String(off.offeringId)

      return matchesBranchAndDate && isFirstOffering
    })

    const students = offeringEnrollments
      .map((e) => {
        const student = dataStore.students.find((s) => String(s.id) === String(e.studentId))
        if (!student) return null

        return {
          ...student,
          paymentStatus: e.paymentStatus,
          status: e.status,
          enrollmentId: e.id,
          revenue: Number(e.finalPrice || e.totalPrice || 0),
        }
      })
      .filter(Boolean)

    const responsibleTeacherIds = new Set((off.teacherIds || []).map(String))
    
    // Merge teachers from specific sessions so they show in the table
    ;(off.sessionTeachers || []).forEach(sessionData => {
      if (!sessionData) return
      let sessionTeachersArray = []
      if (sessionData.teachers && Array.isArray(sessionData.teachers)) {
        sessionTeachersArray = sessionData.teachers
      } else if (Array.isArray(sessionData)) {
        sessionTeachersArray = sessionData
      } else if (sessionData.id) {
        sessionTeachersArray = [sessionData]
      }
      sessionTeachersArray.forEach(t => {
        if (t && t.id) responsibleTeacherIds.add(String(t.id))
      })
    })

    const responsibleTeachers = Array.from(responsibleTeacherIds)
      .map((tid) => {
        return (teachers.value || []).find((t) => String(t.id) === String(tid))
      })
      .filter(Boolean)

    return {
      ...off,
      program,
      students,
      responsibleTeachers,
      currentCount: students.length,
      revenue: students.reduce((sum, s) => sum + (s.revenue || 0), 0),
    }
  })
})

const groupedBranchOfferings = computed(() => {
  const map = new Map()
  rawBranchOfferings.value.forEach((off) => {
    const classId = off.classId || off.program?.id
    if (!map.has(classId)) {
      map.set(classId, {
        id: `group-${classId}`,
        classId: classId,
        program: off.program,
        schedules: [],
        totalRevenue: 0,
        uniqueStudentCount: 0,
        status: off.status,
      })
    }
    const group = map.get(classId)
    const setting = activeBranchSetting.value || term.value

    const computedStatus = calculateOfferingStatus({
      termStartDate: setting.startDate,
      termEndDate: setting.endDate,
      schedule: off.schedule,
      program: off.program,
      offering: off,
    })

    group.schedules.push({
      ...off.schedule,
      currentCount: off.currentCount,
      status: computedStatus,
      offeringId: off.offeringId,
      revenue: off.revenue || 0,
      teachers: off.responsibleTeachers || [],
    })
  })

  // Calculate REAL group metrics from the unique set of enrollments for this class group
  const setting = activeBranchSetting.value || term.value
  const startDate = new Date(setting.startDate)
  const endDate = new Date(setting.endDate)
  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(23, 59, 59, 999)

  map.forEach((group, classId) => {
    // Get all enrollments matching this class/program in this branch/term
    const groupEnrollments = branchEnrollments.value.filter((e) => {
      const isSameClass =
        String(e.classId) === String(classId) || String(e.programId) === String(classId)
      return isSameClass
    })

    group.totalRevenue = groupEnrollments.reduce(
      (sum, e) => sum + Number(e.finalPrice || e.totalPrice || 0),
      0,
    )
    group.uniqueStudentCount = new Set(groupEnrollments.map((e) => e.studentId)).size
  })

  const dayOrder = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 7,
  }

  const groups = Array.from(map.values())
  groups.forEach((g) => {
    g.schedules.sort((a, b) => {
      const dayA = dayOrder[a.day] || 99
      const dayB = dayOrder[b.day] || 99
      if (dayA !== dayB) return dayA - dayB
      return (a.time || '').localeCompare(b.time || '')
    })
  })

  return groups.sort((a, b) => (a.program?.name || '').localeCompare(b.program?.name || ''))
})

const branchStudents = computed(() => {
  const studentMap = new Map()
  rawBranchOfferings.value.forEach((offering) => {
    ;(offering.students || []).forEach((s) => {
      if (!studentMap.has(s.id || s.studentId)) {
        studentMap.set(s.id || s.studentId, {
          ...s,
          offeringName: `${offering.program?.name || 'Program'} - ${offering.schedule?.day || ''} ${offering.schedule?.time || ''}`,
        })
      }
    })
  })
  return Array.from(studentMap.values())
})


const branchEnrollments = computed(() => {
  if (!term.value || !activeBranchId.value) return []

  const setting = activeBranchSetting.value || term.value
  const startDate = new Date(setting.startDate)
  const endDate = new Date(setting.endDate)
  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(23, 59, 59, 999)

  return dataStore.enrollments.filter((e) => {
    const isSameBranch = String(e?.['class']?.branch?.id || e?.branchId) === String(activeBranchId.value)
    if (!isSameBranch) return false
    const enrollDate = new Date(e.createdAt || e.enrollAt)
    return enrollDate >= startDate && enrollDate <= endDate
  })
})

const branchDisplayData = computed(() => {
  if (!term.value) return null
  const setting = activeBranchSetting.value || term.value
  const progress = calculateClassProgress(setting.startDate, setting.endDate)
  return {
    status: progress.status,
    startDate: setting.startDate,
    endDate: setting.endDate,
    remainingSessions: progress.remainingSessions > 0 ? progress.remainingSessions : term.value.totalSessions
  }
})

// Search & Filtering for Classes
const classCurrentPage = ref(1)
const classPageSize = ref(10)
const classFilter = ref('all')
const { searchQuery: classSearchQuery, searchResults: classSearchResults } = useSearch(
  groupedBranchOfferings,
  classSearchMapper,
)

const classFilterOptions = computed(() => {
  const options = [{ label: 'All Programs', value: 'all', image: getActionIcon('filter') }]
  const programsInBranch = new Map()
  groupedBranchOfferings.value.forEach((g) => {
    if (g.program?.name && !programsInBranch.has(g.program.name)) {
      programsInBranch.set(g.program.name, g.program)
    }
  })
  Array.from(programsInBranch.keys())
    .sort()
    .forEach((name) => {
      const p = programsInBranch.get(name)
      options.push({
        label: name,
        value: name,
        image: getProgramProfileURL(
          p.profileURL,
          p.category?.name || p.category,
          p.category?.profileURL,
        ),
      })
    })

  // Days Section
  options.push({ isDivider: true })
  options.push({ isHeader: true, label: 'Filter by Day' })
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const dayColors = {
    Monday: 'blue',
    Tuesday: 'magenta',
    Wednesday: 'green',
    Thursday: 'orange',
    Friday: 'purple',
    Saturday: 'blue',
    Sunday: 'red',
  }
  const daysInBranch = new Set()
  groupedBranchOfferings.value.forEach((g) => {
    ;(g.schedules || []).forEach((s) => {
      if (s.day) daysInBranch.add(s.day)
    })
  })

  days.forEach((day) => {
    if (daysInBranch.has(day)) {
      options.push({
        label: `${day} Classes`,
        value: `day-${day}`,
        color: dayColors[day],
        image: getActionIcon('calendar'),
      })
    }
  })

  return options
})

const filteredClasses = computed(() => {
  let list = classSearchResults.value
  if (classFilter.value !== 'all') {
    if (classFilter.value.startsWith('day-')) {
      const targetDay = classFilter.value.replace('day-', '')
      // Show only programs with schedules on that day
      list = list.filter((c) => (c.schedules || []).some((s) => s.day === targetDay))
      // Filter the schedules within each program to only show the selected day
      list = list.map((item) => {
        const daySchedules = item.schedules.filter((s) => s.day === targetDay)
        return {
          ...item,
          schedules: daySchedules,
          totalRevenue: daySchedules.reduce((sum, s) => sum + (s.revenue || 0), 0),
        }
      })
    } else {
      list = list.filter((c) => c.program?.name === classFilter.value)
    }
  }
  return list
})

const paginatedClasses = computed(() => {
  const start = (classCurrentPage.value - 1) * classPageSize.value
  return filteredClasses.value.slice(start, start + classPageSize.value)
})

// Search & Filtering for Students
const studentCurrentPage = ref(1)
const studentPageSize = ref(10)
const studentFilter = ref('all')
const { searchQuery: studentSearchQuery, searchResults: studentSearchResults } = useSearch(
  branchStudents,
  studentSearchMapper,
)

const studentFilterOptions = [
  { label: 'All Students', value: 'all' },
  { label: 'Active', value: 'active', color: 'green' },
  { label: 'Inactive', value: 'inactive', color: 'red' },
  { label: 'Paid', value: 'paid', color: 'blue' },
  { label: 'Unpaid', value: 'unpaid', color: 'yellow' },
]

const filteredStudents = computed(() => {
  let list = studentSearchResults.value
  if (studentFilter.value !== 'all') {
    if (studentFilter.value === 'paid' || studentFilter.value === 'unpaid') {
      list = list.filter((s) => s.paymentStatus === studentFilter.value)
    } else {
      list = list.filter((s) => s.status === studentFilter.value)
    }
  }
  return list
})

const paginatedStudents = computed(() => {
  const start = (studentCurrentPage.value - 1) * studentPageSize.value
  return filteredStudents.value.slice(start, start + studentPageSize.value)
})

const totalTermTrials = computed(() => {
  if (!term.value) return 0
  let trialCount = 0
  const sortedSettings = [...(term.value.branchSettings || [])].sort(
    (a, b) => new Date(a.endDate || a.startDate) - new Date(b.endDate || b.startDate)
  )
  const branchIds = term.value.branchIds || (term.value.branchId ? [term.value.branchId] : [])

  branchIds.forEach((bId) => {
    const setting = sortedSettings.find((s) => String(s.branchId) === String(bId))
    const startDate = new Date(setting?.startDate || term.value.startDate)
    const endDate = new Date(setting?.endDate || term.value.endDate)
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)

    const branchTrials = dataStore.trials.filter((t) => {
      const isSameBranch = String(t.branch?.id || t.branchId) === String(bId)
      const trialDate = new Date(t.trialDate)
      return isSameBranch && trialDate >= startDate && trialDate <= endDate
    })
    trialCount += branchTrials.length
  })
  return trialCount
})

const statsCards = computed(() => {
  if (!term.value) return []

  const offerings = rawBranchOfferings.value
  const enrollments = branchEnrollments.value
  const revenue = enrollments.reduce((sum, e) => sum + (e.finalPrice || e.totalPrice || 0), 0)
  const uniqueStudents = new Set(enrollments.map((e) => e.studentId)).size

  return [
    {
      label: 'Total Classes',
      value: offerings.length,
      image: getImageUrl('data-metric-card/total-enrolled'),
    },
    {
      label: 'Enrolled Students',
      value: uniqueStudents,
      image: getImageUrl('data-metric-card/total-enrolled'),
    },
    {
      label: 'Term Revenue',
      value: `$${formatPrice(revenue)}`,
      image: getImageUrl('data-metric-card/program-revenue'),
    },
    {
      label: 'Total Trials',
      value: totalTermTrials.value,
      image: getImageUrl('enrollment/total-enrollment'),
    },
  ]
})

const classHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Class Identity', width: '250px' },
  { label: 'Schedule', width: '180px', align: 'center' },
  { label: 'Teachers', width: '120px', align: 'center' },
  { label: 'Enrolled', align: 'center', width: '100px' },
  { label: 'Revenue', align: 'center', width: '130px' },
  { label: 'Status', align: 'center', width: '110px' },
  { label: 'Action', align: 'center', width: '80px' },
]

const sessionModal = ref({
  isOpen: false,
  offeringId: null,
  programId: null,
  programName: '',
  schedule: null,
})

/**
 * Initializes sessionTeachers for a given offering if they are unset.
 * Automatically seeds with the offering's default responsible teachers.
 */
const initializeOfferingTeachers = async (offeringId) => {
  const offering = (term.value?.offerings || []).find((o) => String(o.offeringId) === String(offeringId))
  if (!offering) return

  const currentSessions = offering.sessionTeachers || []
  const needsInit = currentSessions.length === 0 || currentSessions.every((t) => t === null)
  if (!needsInit) return // Already has data

  const responsibleTeachers = (offering.teacherIds || [])
    .map((tid) => teachers.value.find((t) => String(t.id) === String(tid)))
    .filter(Boolean)

  if (responsibleTeachers.length === 0) return // No teachers to seed with

  const primaryTeacher = responsibleTeachers[0]
  const defaultTeacherData = {
    teachers: [{ id: primaryTeacher.id, name: primaryTeacher.name, profileURL: primaryTeacher.profileURL }],
  }
  const newSessionTeachers = Array(term.value.totalSessions).fill(defaultTeacherData)

  try {
    await termService.updateTermOffering(term.value.id, offering.offeringId, {
      sessionTeachers: newSessionTeachers,
    })
    // Mutate in place so Vue picks up the change without full re-fetch
    offering.sessionTeachers = [...newSessionTeachers]
    term.value = { ...term.value } // Trigger deep reactivity
  } catch (err) {
    console.error('Failed to initialize session teachers for offering', offeringId, err)
  }
}

const openSessionModal = async (item) => {
  if (!item || !item.schedules || item.schedules.length === 0) return

  // Initialize ALL schedules' session teachers upfront so switching tabs works immediately
  await Promise.all(item.schedules.map((s) => initializeOfferingTeachers(s.offeringId)))

  const firstSched = item.schedules[0]
  sessionModal.value = {
    isOpen: true,
    offeringId: firstSched.offeringId,
    programId: item.program?.id,
    programName: item.program?.name || 'Class',
    schedule: firstSched,
    allSchedules: item.schedules, // Pass all so modal can show schedule tabs
  }
}

const teachers = ref([])

const loadTeachers = async () => {
  try {
    const data = await teacherService.getAllTeachers()
    teachers.value = data.data || data
  } catch (err) {
    console.error('Failed to load teachers', err)
  }
}

onMounted(() => {
  initData()
  loadTeachers()
})

const studentHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Student Identity' },
  { label: 'Enrolled Class' },
  { label: 'Payment', align: 'center', width: '120px' },
  { label: 'Status', align: 'center', width: '120px' },
]

const modal = ref({
  isOpen: false,
  type: 'edit',
  loading: false,
  error: '',
  success: '',
})

const openModal = (type) => {
  modal.value.type = type
  modal.value.isOpen = true
}

const updateSessionTeacher = async (offeringId, weekIndex, teacherIds) => {
  try {
    const sourceOffering = (term.value.offerings || []).find((o) => o.offeringId === offeringId)
    if (!sourceOffering) return

    // teacherIds is now an array of IDs from the multi-select
    const selectedTeachersData = (teacherIds || []).map(tid => {
      const teacher = teachers.value.find((t) => t.id === tid)
      return teacher
        ? {
            id: teacher.id,
            name: teacher.name,
            profileURL: teacher.profileURL,
          }
        : null
    }).filter(Boolean)

    // Find all offerings for the same program/class and day in this branch
    // This allows assigning a teacher once for the whole day at this branch
    const affectedOfferings = (term.value.offerings || []).filter(
      (o) =>
        String(o.branchId) === String(activeBranchId.value) &&
        (o.classId === sourceOffering.classId || o.programId === sourceOffering.programId) &&
        o.schedule?.day === sourceOffering.schedule?.day,
    )

    // Update all affected offerings in parallel
    await Promise.all(
      affectedOfferings.map(async (off) => {
        const sessionTeachers = [...(off.sessionTeachers || [])]
        while (sessionTeachers.length < term.value.totalSessions) {
          sessionTeachers.push(null)
        }

        // Store it as an object to prevent Firestore INVALID_ARGUMENT (nested array) error
        sessionTeachers[weekIndex] = { teachers: selectedTeachersData }

        await termService.updateTermOffering(term.value.id, off.offeringId, {
          sessionTeachers: sessionTeachers,
        })
        // Update local state for reactivity
        off.sessionTeachers = [...sessionTeachers]
      }),
    )

    // Trigger reactivity for term object
    term.value = { ...term.value }
  } catch (err) {
    console.error('Failed to update session teachers:', err)
    errorMessage.value = 'Failed to update session faculty'
  }
}

const openAddClassModal = () => {
  classActionModal.value = {
    isOpen: true,
    type: 'add',
    classItem: null,
    context: {
      termName: term.value.name,
      branchName: activeBranch.value?.name,
      existingOfferings: term.value.offerings?.filter((o) => o.branchId === activeBranchId.value) || [],
    },
    loading: false,
    error: '',
    success: '',
  }
}

const handleClassActionSubmit = async (payload) => {
  classActionModal.value.loading = true
  classActionModal.value.error = ''
  try {
    if (classActionModal.value.type === 'remove') {
      const classGroup = classActionModal.value.classItem
      const apiPayload = {
        deleteOfferingsRequest: classGroup.offeringId
          ? { offeringId: classGroup.offeringId }
          : {
              branchId: activeBranchId.value,
              programId: classGroup.classId,
            },
      }
      await termService.updateTerm(term.value.id, apiPayload)
      classActionModal.value.success = classGroup.offeringId ? 'Schedule removed' : 'Class removed from branch'
    } else {
      // Add mode
      await termService.updateTerm(term.value.id, {
        newOfferingsRequest: {
          ...payload,
          branchIds: [activeBranchId.value],
        },
      })
      classActionModal.value.success = 'Classes added successfully'
    }

    // Force global store to sync
    await dataStore.fetchTerms(true)
    setTimeout(() => {
      classActionModal.value.isOpen = false
      classActionModal.value.success = ''
      initData()
    }, 1500)
  } catch (err) {
    classActionModal.value.error = err.message || 'Action failed'
  } finally {
    classActionModal.value.loading = false
  }
}

const confirmRemoveClass = (classGroup) => {
  classActionModal.value = {
    isOpen: true,
    type: 'remove',
    classItem: classGroup,
    context: {
      termName: term.value.name,
      branchName: activeBranch.value?.name,
    },
    loading: false,
    error: '',
    success: '',
  }
}

const confirmRemoveSchedule = (sched) => {
  classActionModal.value = {
    isOpen: true,
    type: 'remove',
    classItem: {
      offeringId: sched.offeringId,
      deleteConfirm: ''
    },
    context: {
      termName: term.value.name,
      branchName: activeBranch.value?.name,
    },
    loading: false,
    error: '',
    success: '',
  }
}

const handleActionSubmit = async (payload) => {
  modal.value.loading = true
  modal.value.error = ''
  try {
    if (modal.value.type === 'delete') {
      await termService.deleteTerm(term.value.id)
      modal.value.success = 'Term deleted successfully'
      setTimeout(() => router.push('/terms'), 1500)
    } else {
      await termService.updateTerm(term.value.id, payload)
      modal.value.success = 'Term updated successfully'
      setTimeout(() => {
        modal.value.isOpen = false
        initData()
      }, 1500)
    }
  } catch (err) {
    modal.value.error = err.message || 'Action failed'
  } finally {
    modal.value.loading = false
  }
}
</script>

<template>
  <DashboardLayout>
    <DetailPageLayout
      :loading="loading"
      :errorMessage="errorMessage"
      backRoute="/terms"
      title="Term Analytics"
      sidebarWidth="sm"
    >
      <template #header-actions v-if="term">
        <div class="flex items-center gap-3">
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-primary-soft transition-all duration-300 hover:bg-primary hover:border-primary group"
            title="Edit Term"
            @click="openModal('edit')"
          >
            <img :src="getActionIcon('edit')" class="w-5 h-5 brightness-0 transition-all" />
          </button>
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-error-soft transition-all duration-300 hover:bg-error hover:border-error group"
            title="Delete Term"
            @click="openModal('delete')"
          >
            <img :src="getActionIcon('delete')" class="w-5 h-5 brightness-0 transition-all" />
          </button>
        </div>
      </template>

      <template #left-content v-if="term">
        <!-- Metrics Grid for Branch -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DetailMetricCard v-for="stat in statsCards" :key="stat.label" v-bind="stat" />
        </div>

        <!-- Branch Selector & Sub Tabs -->
        <div class="flex flex-col gap-md">
          <div
            class="flex flex-wrap items-center gap-2 p-2 bg-white rounded-2xl border border-outline-std w-fit"
          >
            <button
              v-for="branch in termBranches"
              :key="branch.id"
              class="px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 border border-transparent"
              :class="
                activeBranchId === branch.id
                  ? 'shadow-md ring-1 ring-black/5'
                  : 'text-content-muted hover:text-content-dark hover:bg-surface-subtle/50'
              "
              :style="
                activeBranchId === branch.id
                  ? {
                      backgroundColor: `var(--color-${branch.color || 'blue'})`,
                      color: 'white',
                    }
                  : {}
              "
              @click="activeBranchId = branch.id"
            >
              {{ branch.name }}
            </button>
          </div>

          <div
            class="flex items-center gap-1 p-1 bg-white rounded-xl border border-outline-std w-fit"
          >
            <button
              v-for="tab in ['classes', 'students']"
              :key="tab"
              class="px-8 py-2.5 rounded-lg text-xs font-bold transition-all duration-300"
              :class="
                activeSubTab === tab
                  ? 'bg-primary text-white shadow-md'
                  : 'text-content-muted hover:text-content-dark'
              "
              @click="activeSubTab = tab"
            >
              {{ tab }}
            </button>
          </div>
        </div>

        <section
          class="overflow-hidden animate-fade-in h-[650px] border border-outline-std rounded-md bg-white shadow-sm flex flex-col"
        >
          <DataTable
            v-if="activeSubTab === 'classes'"
            title="Branch Classes"
            :headers="classHeaders"
            :items="paginatedClasses"
            entityName="class"
            :flexible="false"
            :hasSearch="true"
            v-model:searchQuery="classSearchQuery"
            v-model:currentFilter="classFilter"
            :filterOptions="classFilterOptions"
            :hasFilter="true"
            :hasPagination="true"
            v-model:currentPage="classCurrentPage"
            :pageSize="classPageSize"
            :totalItems="filteredClasses.length"
          >
            <template #toolbar-actions>
              <AppButton
                variant="primary"
                size="md"
                @click="openAddClassModal"
              >
                <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
                <span class="font-bold tracking-tight">Add Class</span>
              </AppButton>
            </template>
            <template #row="{ item, index, headers }">
              <td class="ui-cell text-center" :style="{ width: headers[0].width }">
                {{ (classCurrentPage - 1) * classPageSize + index + 1 }}
              </td>
              <td class="ui-cell" :style="{ width: headers[1].width }">
                <div class="flex items-center gap-4">
                  <div
                    class="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/80 shadow-sm bg-surface-subtle p-1.5"
                  >
                    <img
                      :src="
                        getProgramProfileURL(
                          item.program?.profileURL,
                          item.program?.category?.name || item.program?.category,
                          item.program?.category?.profileURL,
                        )
                      "
                      class="w-full h-full object-contain"
                    />
                  </div>
                  <div class="flex flex-col">
                    <span class="leading-tight">{{ item.program?.name || 'Program' }}</span>
                    <span class="mt-0.5 text-xs font-semibold text-content-muted">{{
                      item.program?.category?.name || item.program?.category || 'Uncategorized'
                    }}</span>
                  </div>
                </div>
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[2].width }">
                <div class="flex flex-col items-center justify-center gap-4 py-6">
                  <div
                    v-for="(sched, idx) in item.schedules"
                    :key="sched.offeringId || idx"
                    class="flex items-center gap-1 group/sched"
                  >
                    <div
                      class="flex flex-col items-center justify-center py-2 bg-primary-light group-hover:bg-primary/30 px-lg rounded-sm min-w-32 relative"
                    >
                      <span class="text-xs font-bold leading-none">{{ sched.day }}</span>
                      <span
                        class="text-3xs font-semibold text-content-muted mt-1 leading-none tabular-nums"
                        >{{ sched.time }}</span
                      >
                      <span class="text-4xs font-bold text-primary/70 mt-1 uppercase tracking-wider" v-if="term?.startDate && term?.totalSessions">
                        Ends {{ formatDateOnly(calculateTermEndDate(term.startDate, term.totalSessions, sched.day)) }}
                      </span>
                      <button
                        type="button"
                        title="Remove Schedule"
                        @click.stop="confirmRemoveSchedule(sched)"
                        class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-error text-white rounded-full flex items-center justify-center opacity-0 group-hover/sched:opacity-100 transition-opacity shadow-sm hover:scale-110 active:scale-95"
                      >
                        <img :src="getActionIcon('delete')" class="w-2.5 h-2.5 brightness-0 invert" />
                      </button>
                    </div>
                  </div>
                </div>
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[3].width }">
                <div class="flex flex-col items-center justify-center gap-4 py-6">
                  <div
                    v-for="(sched, idx) in item.schedules"
                    :key="sched.offeringId || idx"
                    class="h-10 flex items-center justify-center"
                  >
                    <!-- Teacher Avatar Stack -->
                    <div v-if="sched.teachers && sched.teachers.length > 0" class="flex -space-x-2">
                      <div
                        v-for="teacher in sched.teachers.slice(0, 3)"
                        :key="teacher.id"
                        class="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm bg-surface-subtle group-hover:scale-110 transition-transform"
                        :title="teacher.name"
                      >
                        <img
                          :src="teacher.profileURL || getImageUrl('profiles/avatar-teacher-man')"
                          class="w-full h-full object-cover"
                        />
                      </div>
                      <div
                        v-if="sched.teachers.length > 3"
                        class="w-8 h-8 rounded-full border-2 border-white bg-primary-soft flex items-center justify-center text-4xs font-black text-primary shadow-sm"
                      >
                        +{{ sched.teachers.length - 3 }}
                      </div>
                    </div>
                    <span v-else class="text-4xs font-bold text-content-muted/30 italic"
                      >No teacher</span
                    >
                  </div>
                </div>
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[4].width }">
                <div class="flex flex-col items-center justify-center gap-4 py-6">
                  <div
                    v-for="(sched, idx) in item.schedules"
                    :key="sched.offeringId || idx"
                    class="flex items-center justify-center h-10"
                  >
                    <AppBadge :status="sched.currentCount || 0" type="blue" />
                  </div>
                </div>
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[5].width }">
                <span class="text-sm font-bold text-primary tabular-nums"
                  >${{ formatPrice(item.totalRevenue) }}</span
                >
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[6].width }">
                <div class="flex flex-col items-center justify-center gap-4 py-6">
                  <div
                    v-for="(sched, idx) in item.schedules"
                    :key="sched.offeringId || idx"
                    class="flex items-center justify-center h-10"
                  >
                    <AppBadge :status="sched.status" />
                  </div>
                </div>
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[7].width }">
                <div class="flex items-center justify-center py-6 h-full relative">
                  <button
                    class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-subtle text-content-muted hover:text-content-dark transition-all"
                    @click.stop="toggleMenu($event, item.id)"
                  >
                    <span class="font-bold text-xl leading-none mb-1">⋮</span>
                  </button>

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
                        v-if="activeMenuId === item.id"
                        class="ui-dropdown-menu"
                        :class="{ 'origin-bottom': isMenuAbove, 'origin-top': !isMenuAbove }"
                        :style="menuStyles"
                        @click.stop
                      >
                        <button
                          class="ui-dropdown-item ui-dropdown-item-info group"
                          @click="
                            () => {
                              openSessionModal(item)
                              closeMenu()
                            }
                          "
                        >
                          <img
                            :src="getActionIcon('edit')"
                            class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity"
                          />
                          <span class="font-semibold">Manage Class</span>
                        </button>

                        <div class="h-px bg-surface-light mx-1 my-1"></div>

                        <button
                          class="ui-dropdown-item ui-dropdown-item-danger group font-bold"
                          @click="
                            () => {
                              confirmRemoveClass(item)
                              closeMenu()
                            }
                          "
                        >
                          <img
                            :src="getActionIcon('delete')"
                            class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity icon-danger"
                          />
                          Remove Class
                        </button>
                      </div>
                    </transition>
                  </Teleport>
                </div>
              </td>
            </template>
          </DataTable>

          <DataTable
            v-else-if="activeSubTab === 'students'"
            title="Enrolled Students"
            :headers="studentHeaders"
            :items="paginatedStudents"
            entityName="student"
            :flexible="false"
            :hasSearch="true"
            v-model:searchQuery="studentSearchQuery"
            v-model:currentFilter="studentFilter"
            :filterOptions="studentFilterOptions"
            :hasFilter="true"
            :hasPagination="true"
            v-model:currentPage="studentCurrentPage"
            :pageSize="studentPageSize"
            :totalItems="filteredStudents.length"
          >
            <template #row="{ item, index, headers }">
              <td class="ui-cell text-center" :style="{ width: headers[0].width }">
                {{ (studentCurrentPage - 1) * studentPageSize + index + 1 }}
              </td>
              <td class="ui-cell" :style="{ width: headers[1].width }">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full overflow-hidden bg-surface-subtle border border-outline-std"
                  >
                    <img
                      :src="item.profileURL || getImageUrl('common/default-avatar')"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <div class="flex flex-col">
                    <span class="font-bold text-content-dark text-sm">{{ item.name }}</span>
                    <span class="text-3xs text-content-muted font-bold tracking-tighter">{{
                      item.studentId
                    }}</span>
                  </div>
                </div>
              </td>
              <td class="ui-cell" :style="{ width: headers[2].width }">
                <span class="text-xs font-bold text-content-dark">{{ item.offeringName }}</span>
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[3].width }">
                <AppBadge :status="item.paymentStatus || 'unpaid'" />
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[4].width }">
                <AppBadge :status="item.status || 'active'" />
              </td>
            </template>
          </DataTable>
        </section>
      </template>

      <template #right-content v-if="term">
        <div class="flex flex-col gap-md">
          <!-- Identity Card -->
          <section class="ui-detail-card flex flex-col items-center gap-4 py-6">
            <h2 class="w-full font-bold text-content-dark text-center">Basic Information</h2>
            <div class="relative group">
              <div
                class="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-2xl transition-transform duration-500 group-hover:scale-105 border-2 border-gray-100 bg-surface-subtle flex items-center justify-center p-6"
              >
                <img
                  :src="getImageUrl('enrollment/total-enrollment')"
                  alt="Term Icon"
                  class="w-full h-full object-contain"
                />
              </div>
            </div>
            <div class="text-center">
              <h3 class="text-lg text-content-dark font-extrabold mt-md">{{ term.name }}</h3>
              <span class="text-sm font-bold text-content-muted mt-1"
                >{{ term.totalSessions }} Weekly Sessions</span
              >
            </div>
          </section>

          <section class="ui-detail-card !py-8">
            <div
              v-if="activeBranch"
              class="flex flex-col items-center gap-2 w-full pb-6 border-b border-outline-std/50"
            >
              <span class="text-sm font-bold text-content-muted">Selected Branch</span>
              <AppBadge
                :status="activeBranch.name"
                :type="activeBranch.color"
                class="px-6 py-1.5 text-sm"
              />
            </div>

            <div class="grid grid-cols-2 gap-x-12 gap-y-8 w-full" v-if="branchDisplayData">
              <div class="flex flex-col items-center gap-2">
                <span class="text-sm font-bold text-content-muted">Status</span>
                <AppBadge :status="branchDisplayData.status" />
              </div>
              <div class="flex flex-col items-center gap-2">
                <span class="text-sm font-bold text-content-muted">Remaining</span>
                <span class="text-lg font-bold text-content-dark"
                  >{{ branchDisplayData.remainingSessions || 0 }}</span
                >
              </div>
              <div class="flex flex-col items-center gap-2">
                <span class="text-sm font-bold text-content-muted">Duration</span>
                <span class="text-lg font-bold text-content-dark"
                  >{{ term.totalSessions }} Weeks</span
                >
              </div>
              <div class="flex flex-col items-center gap-2">
                <span class="text-sm font-bold text-content-muted">Sessions</span>
                <span class="text-lg font-bold text-content-dark"
                  >{{ term.totalSessions }} Total</span
                >
              </div>
              <div class="flex flex-col items-center gap-2">
                <span class="text-sm font-bold text-content-muted">Start Date</span>
                <AppBadge :status="formatShortDate(branchDisplayData.startDate)" type="green" />
              </div>
              <div class="flex flex-col items-center gap-2">
                <span class="text-sm font-bold text-content-muted">End Date</span>
                <AppBadge :status="formatShortDate(branchDisplayData.endDate)" type="red" />
              </div>
            </div>
          </section>
        </div>
      </template>
    </DetailPageLayout>

    <TermActionModal
      v-if="modal.isOpen"
      :isOpen="modal.isOpen"
      :type="modal.type"
      :term="term"
      :branches="branches"
      :loading="modal.loading"
      :error="modal.error"
      :success="modal.success"
      @close="modal.isOpen = false"
      @submit="handleActionSubmit"
    />

    <ClassActionModal
      v-if="classActionModal.isOpen"
      :isOpen="classActionModal.isOpen"
      :type="classActionModal.type"
      :classInstance="classActionModal.classItem"
      :context="classActionModal.context"
      @close="classActionModal.isOpen = false"
      @submit="handleClassActionSubmit"
      :loading="classActionModal.loading"
      :error="classActionModal.error"
      :success="classActionModal.success"
    />

    <!-- Weekly Session Management Modal -->
    <TermActionModal
      v-if="sessionModal.isOpen"
      :isOpen="sessionModal.isOpen"
      type="session"
      :term="term"
      :offeringId="sessionModal.offeringId"
      :programId="sessionModal.programId"
      :programName="sessionModal.programName"
      :schedule="sessionModal.schedule"
      :allSchedules="sessionModal.allSchedules"
      :teachers="teachers"
      :activeBranch="activeBranch"
      @close="sessionModal.isOpen = false"
      @update-teacher="
        ({ offeringId, weekIndex, teacherId }) =>
          updateSessionTeacher(offeringId, weekIndex, teacherId)
      "
      @switch-schedule="async (sched) => {
        sessionModal.offeringId = sched.offeringId
        sessionModal.schedule = sched
        await initializeOfferingTeachers(sched.offeringId)
      }"
    />
  </DashboardLayout>
</template>

<style scoped>
.ui-detail-card {
  @apply bg-white rounded-xl p-8 border border-outline-std shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-primary/5;
}
</style>
