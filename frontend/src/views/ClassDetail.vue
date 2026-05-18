<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { classService } from '@/services/classService'
import { enrollmentService } from '@/services/enrollmentService'
import { programService } from '@/services/programService'
import { termService } from '@/services/termService'
import { getActionIcon, getProgramProfileURL } from '@/utils/assetHelper'
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

      // 2. Persist primary change
      updates.push(
        attendanceService.recordAttendance(
          classData.value.id,
          sessionId,
          attendanceData.value[sessionId],
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
              attendanceService.recordAttendance(classData.value.id, session.id, linkedData),
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
      errorMessage.value = 'Failed to sync attendance. Please refresh.'
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
          const setting = term.branchSettings.find((s) => String(s.branchId) === String(offering.branchId))
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

// Audit: Use a lookup map for O(1) offering retrieval to avoid redundant .find() in loops
const offeringsMap = computed(() => {
  const map = new Map()
  allOfferings.value.forEach((o) => {
    const key = `${o.termId}_${o.branchId}_${o.scheduleId}`
    map.set(key, o)
  })
  return map
})

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
    ; (offering.teachers || []).forEach((teacher) => {
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
  selectedTermOfferings.value.forEach((offering) => {
    if (offering.branch?.id) {
      const branchId = offering.branch.id
      const liveBranch = dataStore.branches.find((b) => String(b.id) === String(branchId))

      if (!branchMap.has(branchId)) {
        branchMap.set(branchId, {
          id: branchId,
          name: offering.branch.name,
          abbr: liveBranch?.abbr || offering.branch.abbr || offering.branch.name,
          color: liveBranch?.color || offering.branch.color || 'blue',
          studentCount: 0,
        })
      }
      branchMap.get(branchId).studentCount += Number(
        offering.currentCount || offering.students?.length || 0,
      )
    }
  })
  return Array.from(branchMap.values())
})

const totalStudentsAcrossOfferings = computed(() =>
  selectedTermOfferings.value.reduce(
    (total, offering) => total + Number(offering.currentCount || offering.students?.length || 0),
    0,
  ),
)

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
    { label: 'Level', width: '100px', align: 'center' },
    { label: 'Timeslot', width: '150px', align: 'center' },
  ]

  const sessionCols = sessions.value.map((s) => ({
    label: s.label,
    subLabel: formatDateOnly(s.date),
    width: '90px',
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
  return enrollments.value.filter((e) => {
    // Audit: Only successful/eligible enrollments are shown for attendance
    const eligibleStatuses = ['active', 'confirmed', 'trial']
    if (!eligibleStatuses.includes(e.status)) return false

    const termMatch = termFilter.value === 'all' || String(e.termId) === String(termFilter.value)
    const branchMatch =
      branchFilter.value === 'all' || String(e.branchId) === String(branchFilter.value)
    const scheduleMatch =
      scheduleFilter.value === 'all' ||
      String(e.class?.schedule?.id) === String(scheduleFilter.value) ||
      String(e.scheduleId) === String(scheduleFilter.value)

    return termMatch && branchMatch && scheduleMatch
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

const handleClickOutside = (event) => {
  if (dropdowns.value.term || dropdowns.value.branch || dropdowns.value.schedule) {
    const termBtn = document.getElementById('term-filter-btn')
    const branchBtn = document.getElementById('branch-filter-btn')
    const scheduleBtn = document.getElementById('schedule-filter-btn')
    if (
      (!termBtn || !termBtn.contains(event.target)) &&
      (!branchBtn || !branchBtn.contains(event.target)) &&
      (!scheduleBtn || !scheduleBtn.contains(event.target))
    ) {
      dropdowns.value.term = false
      dropdowns.value.branch = false
      dropdowns.value.schedule = false
    }
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
      setTimeout(() => {
        router.push('/classes')
      }, 1500)
      return
    }

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
  const capacity = Number(off.capacity || schedule.capacity || DEFAULT_CAPACITY)

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

  return off?.capacity || schedule.capacity || DEFAULT_CAPACITY
}

const scheduleOptions = computed(() => {
  if (!classData.value?.schedules) return []
  return classData.value.schedules.map((s) => ({
    id: s.id,
    name: `${s.day} (${s.time})`,
  }))
})

const fetchData = async (id) => {
  loading.value = true
  errorMessage.value = ''
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

    if (uniqueBranches.value.length > 0) {
      branchFilter.value = uniqueBranches.value[0].id
    }

    if (classData.value?.schedules?.length > 0) {
      scheduleFilter.value = classData.value.schedules[0].id
    }
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
    <DetailPageLayout :loading="loading" :errorMessage="errorMessage" backRoute="/classes" title="Class Analytics"
      sidebarWidth="md" :scrollable="false">
      <template #header-actions v-if="classData">
        <div class="flex items-center gap-3">
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-primary-soft transition-all duration-300 hover:bg-primary hover:border-primary group"
            title="Edit Class" @click="openActionModal('edit')">
            <img :src="getActionIcon('edit')" class="w-5 h-5 brightness-0 transition-all" />
          </button>
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-error-soft transition-all duration-300 hover:bg-error hover:border-error group"
            title="Delete Class" @click="openActionModal('delete')">
            <img :src="getActionIcon('delete')" class="w-5 h-5 brightness-0 transition-all" />
          </button>
        </div>
      </template>

      <template #left-content v-if="classData">
        <!-- Table Content -->

        <section
          class="overflow-hidden animate-fade-in flex-1 border border-outline-std rounded-[2rem] bg-white shadow-sm flex flex-col min-h-0 mb-6">
          <DataTable :title="currentTableTitle" :headers="attendanceHeaders" :items="paginatedItems" :loading="loading"
            :entityName="currentEntityName" :flexible="false" :hasSearch="false" :hasPagination="true"
            v-model:currentPage="currentPage" :pageSize="pageSize" :totalItems="searchResults.length" :hasFilter="false"
            class="flex-1 min-h-0">
            <template #toolbar-actions>
              <div class="flex items-center gap-3">
                <!-- Term Filter -->
                <div class="relative" id="term-filter-btn">
                  <AppButton variant="secondary" size="md" @click="toggleDropdown('term', $event)"
                    class="!bg-primary !text-white">
                    <img :src="getActionIcon('filter')" class="w-4 h-4 brightness-0 invert" />
                    <span class="font-bold">{{ getActiveLabel('term') }}</span>
                  </AppButton>
                  <Teleport to="body">
                    <transition enter-active-class="transition duration-200 ease-out"
                      enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
                      leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100"
                      leave-to-class="opacity-0">
                      <div v-if="dropdowns.term" class="toolbar-filter-menu" :style="filterMenuStyles" @mousedown.stop>
                        <div v-for="opt in termOptions" :key="opt.value" class="toolbar-filter-option" :class="{
                          'active-filter-item': String(termFilter) === String(opt.value),
                        }" @click="selectFilter('term', opt.value)">
                          {{ opt.label }}
                        </div>
                      </div>
                    </transition>
                  </Teleport>
                </div>

                <!-- Branch Filter -->
                <div class="relative" id="branch-filter-btn">
                  <AppButton variant="secondary" size="md" @click="toggleDropdown('branch', $event)" class="!text-white"
                    :style="{
                      backgroundColor: getActiveLabel('branch').color
                        ? `var(--color-${getActiveLabel('branch').color})`
                        : '#3b82f6',
                    }">
                    <img :src="getActionIcon('filter')" class="w-4 h-4 brightness-0 invert" />
                    <span class="font-bold">{{ getActiveLabel('branch').label }}</span>
                  </AppButton>
                  <Teleport to="body">
                    <transition enter-active-class="transition duration-200 ease-out"
                      enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
                      leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100"
                      leave-to-class="opacity-0">
                      <div v-if="dropdowns.branch" class="toolbar-filter-menu" :style="filterMenuStyles"
                        @mousedown.stop>
                        <div v-for="opt in branchFilterOptions" :key="opt.value" class="toolbar-filter-option" :class="{
                          'active-filter-item': String(branchFilter) === String(opt.value),
                        }" @click="selectFilter('branch', opt.value)">
                          <div class="flex items-center justify-between gap-3">
                            <div v-if="opt.badge" class="shrink-0 flex items-center justify-center min-w-[40px]">
                              <AppBadge :status="opt.badge.status" :type="opt.badge.type" />
                            </div>
                            <div v-else-if="opt.color" class="w-2 h-2 rounded-full mx-1"
                              :style="{ backgroundColor: `var(--color-${opt.color})` }"></div>
                            <span class="truncate">{{ opt.label }}</span>
                          </div>
                        </div>
                      </div>
                    </transition>
                  </Teleport>
                </div>

                <!-- Schedule Filter -->
                <div class="relative" id="schedule-filter-btn" v-if="scheduleOptions.length > 1">
                  <AppButton variant="secondary" size="md" @click="toggleDropdown('schedule', $event)"
                    class="!text-white" style="background-color: #e91e8c">
                    <img :src="getActionIcon('filter')" class="w-4 h-4 brightness-0 invert" />
                    <span class="font-bold">{{ getActiveLabel('schedule') }}</span>
                  </AppButton>
                  <Teleport to="body">
                    <transition enter-active-class="transition duration-200 ease-out"
                      enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
                      leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100"
                      leave-to-class="opacity-0">
                      <div v-if="dropdowns.schedule" class="toolbar-filter-menu" :style="filterMenuStyles"
                        @mousedown.stop>
                        <div v-for="opt in scheduleOptions" :key="opt.id" class="toolbar-filter-option" :class="{
                          'active-filter-item': String(scheduleFilter) === String(opt.id),
                        }" @click="selectFilter('schedule', opt.id)">
                          {{ opt.name }}
                        </div>
                      </div>
                    </transition>
                  </Teleport>
                </div>
              </div>
            </template>

            <template #row="{ item, index, headers }">
              <td class="ui-cell text-center" :style="{ width: headers[0].width }">
                <span class="font-bold text-content-dark text-sm">{{
                  (currentPage - 1) * pageSize + index + 1
                }}</span>
              </td>
              <td class="ui-cell">
                <div class="flex items-center gap-3">
                  <div class="flex flex-col">
                    <span class="font-bold text-content-dark text-sm leading-tight">{{
                      item.student?.name || 'Unknown'
                    }}</span>
                    <span class="text-3xs font-bold text-content-muted tracking-tighter">{{
                      item.student?.nickname || 'No Nick'
                    }}</span>
                  </div>
                </div>
              </td>
              <td class="ui-cell text-center font-bold text-content-dark text-sm">
                {{ classData.program?.level || 'L1' }}
              </td>
              <td class="ui-cell text-center font-bold text-content-muted text-xs tabular-nums">
                {{ primarySchedule.time }}
              </td>

              <!-- Session Columns -->
              <td v-for="session in sessions" :key="session.id" class="ui-cell text-center p-1">
                <div class="flex flex-col items-center gap-1 relative group/cell">
                  <!-- Attendance Select Dropdown -->
                  <div class="relative w-10 h-10">
                    <select :value="getAttendanceStatus(session.id, item.studentId)" @change="
                      updateAttendanceStatus(session.id, item.studentId, $event.target.value)
                      " class="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                      :disabled="session.date > new Date()">
                      <option v-for="(cfg, key) in ATTENDANCE_STATUS" :key="key" :value="key">
                        {{ cfg.label }} -
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
                      </option>
                    </select>
                    <div
                      class="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition-all group-hover/cell:scale-110 shadow-sm border border-outline-std select-none"
                      :class="[
                        ATTENDANCE_STATUS[getAttendanceStatus(session.id, item.studentId)]?.theme || ATTENDANCE_STATUS.N.theme,
                        session.date > new Date()
                          ? 'opacity-20 grayscale cursor-not-allowed'
                          : 'cursor-pointer hover:shadow-md',
                      ]">
                      {{ ATTENDANCE_STATUS[getAttendanceStatus(session.id, item.studentId)]?.label || 'N' }}
                    </div>
                  </div>
                </div>
              </td>

              <!-- Special Columns -->
              <td class="ui-cell text-center">
                <div class="w-8 h-8 rounded-lg bg-surface-subtle border border-outline-std mx-auto"></div>
              </td>
              <td class="ui-cell text-center">
                <div class="w-8 h-8 rounded-lg bg-surface-subtle border border-outline-std mx-auto"></div>
              </td>
              <td class="ui-cell text-center">
                <div class="w-8 h-8 rounded-lg bg-surface-subtle border border-outline-std mx-auto"></div>
              </td>
              <td class="ui-cell">
                <span class="italic">New Student</span>
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
                class="w-40 h-40 rounded-full overflow-hidden ring-4 ring-white shadow-2xl transition-transform duration-500 group-hover:scale-105 border-2 border-gray-100 bg-surface-subtle p-6">
                <img :src="getProgramProfileURL(
                  programData?.profileURL || classData.program?.profileURL,
                  programData?.category || classData.program?.category,
                  programData?.categorySnapshot?.profileURL ||
                  classData.program?.categorySnapshot?.profileURL,
                )
                  " alt="Program Logo" class="w-full h-full object-contain" />
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
                  <div v-for="schedule in classData.schedules || []"
                    :key="schedule.id || `${schedule.day}-${schedule.time}`"
                    class="flex items-center justify-between bg-primary-soft px-4 py-3 rounded-sm border border-outline-std transition-all group">
                    <div class="flex flex-col gap-0.5">
                      <span class="text-sm font-bold text-content-dark group-hover:text-primary transition-colors">{{
                        schedule.day }}</span>
                      <span class="text-xs font-semibold text-primary/80">{{ schedule.time }}</span>
                    </div>

                    <div class="flex items-center gap-4">
                      <div class="w-px h-6 bg-outline-std/50"></div>
                      <div class="flex flex-col items-center shrink-0">
                        <span
                          class="text-xs font-black text-content-muted tracking-tighter leading-none mb-1">Seats</span>
                        <span class="text-sm font-black text-content-dark leading-none">{{
                          getScheduleCapacity(schedule)
                        }}</span>
                      </div>
                      <div class="w-px h-6 bg-outline-std/50"></div>
                      <AppBadge v-bind="getScheduleStatus(schedule)" size="sm"
                        class="min-w-[80px] justify-center shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Branches Section -->
              <div class="flex flex-col gap-3 pt-4 border-t border-outline-std/40">
                <span class="text-base font-bold text-content-dark">Branches</span>
                <div class="grid grid-cols-1 gap-2.5">
                  <div v-for="branch in uniqueBranches" :key="branch.id"
                    class="flex items-center justify-between bg-primary-soft p-2.5 pl-4 rounded-sm border border-outline-std transition-all group">
                    <span class="text-sm font-bold text-content-dark group-hover:text-primary transition-colors">{{
                      branch.name || branch.abbr }}</span>
                    <div class="flex items-center gap-2">
                      <AppBadge :status="branch.abbr" :type="branch.color" size="sm" class="min-w-[60px] shadow-sm" />
                      <AppBadge :status="`${branch.studentCount} Students`" type="gray" size="sm"
                        class="!bg-transparent !border-none font-bold text-content-muted" />
                    </div>
                  </div>
                  <span v-if="uniqueBranches.length === 0"
                    class="text-sm font-bold text-content-muted italic p-4 text-center bg-primary-soft border border-outline-std rounded-sm">No
                    active offerings for this term</span>
                </div>
              </div>

              <!-- Teachers Section -->
              <div class="flex flex-col gap-3 pt-4 border-t border-outline-std/40"
                v-if="selectedTermOfferings.length > 0">
                <span class="text-base font-bold text-content-dark">Teachers</span>
                <div class="grid grid-cols-1 gap-2.5">
                  <div v-for="teacher in groupedTeachers" :key="teacher.id"
                    class="flex items-center justify-between bg-surface-subtle/50 p-2.5 pl-4 rounded-sm border border-outline-std transition-all group hover:bg-white">
                    <div class="flex items-center gap-3">
                      <img :src="teacher.profileURL || getImageUrl('profiles/avatar-teacher-man')"
                        class="w-8 h-8 rounded-full border border-white shadow-sm shrink-0" />
                      <span class="text-sm font-black text-content-dark truncate max-w-[120px]">{{ teacher.name }}</span>
                    </div>
                    <div class="flex items-center gap-1 flex-wrap justify-end">
                      <AppBadge v-for="branch in teacher.branches" :key="branch.id || branch.abbr"
                        :status="branch.abbr || 'HQ'" :type="branch.color || 'blue'" size="xs" />
                    </div>
                  </div>
                  <span v-if="groupedTeachers.length === 0"
                    class="text-xs font-bold text-content-muted italic p-4 text-center bg-primary-soft border border-outline-std rounded-sm">No
                    teachers assigned to this term's sessions</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </template>
    </DetailPageLayout>

    <ClassActionModal :isOpen="actionModal.isOpen" :type="actionModal.type" :classInstance="classData"
      :loading="actionModal.loading" v-model:error="actionModal.error" v-model:success="actionModal.success"
      @close="actionModal.isOpen = false" @submit="handleModalSubmit" />
  </DashboardLayout>
</template>

<style scoped>
.ui-detail-card {
  @apply bg-white rounded-[2rem] p-8 border border-outline-std shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-primary/5;
}

.toolbar-filter-menu {
  @apply fixed bg-white rounded-md shadow-2xl border border-outline-std z-[10000] p-xs min-w-[240px] max-h-[300px] overflow-y-auto;
}

.toolbar-filter-option {
  @apply px-md py-sm text-sm font-semibold cursor-pointer transition-all rounded-sm select-none hover:bg-surface-subtle hover:text-primary;
}

.active-filter-item {
  @apply bg-primary text-white hover:bg-primary hover:text-white !important;
}
</style>
