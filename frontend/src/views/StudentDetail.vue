<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import StatusBadge from '@/components/common/ui/StatusBadge.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import TableToolbar from '@/components/common/data/TableToolbar.vue'
import DetailedSummaryCard from '@/components/common/cards/DetailedSummaryCard.vue'
import { userService } from '@/services/userService'
import { enrollmentService } from '@/services/enrollmentService'
import { programService } from '@/services/programService'
import { trackingService } from '@/services/trackingService'
import { formatDate, formatDateOnly, calculateAge } from '@/utils/formatUtils'
import { calculateStudentStatus } from '@/utils/statusUtils'
import { filterDetailEnrollments, getAcademicStatus } from '@/utils/enrollmentHelper'
import StudentActionModal from '@/components/students/StudentActionModal.vue'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'

import { getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { branchService } from '@/services/branchService'

const route = useRoute()
const router = useRouter()

const student = ref(null)
const parent = ref(null)
const enrollments = ref([])
const attendanceHistory = ref([])
const progressData = ref(null)
const branches = ref([])

const computedStatus = computed(() => {
  if (!student.value) return 'Inactive'
  return calculateStudentStatus(student.value, enrollments.value)
})

const primaryParent = computed(() => {
  const role = String(parent.value?.role || '').toLowerCase()
  return role.includes('parent') ? parent.value : null
})

const loading = ref(true)
const errorMessage = ref('')
const globalSuccess = ref('')
const globalError = ref('')
const submitting = ref(false)

const isParentInactive = computed(() => {
  return (parent.value?.status || 'Active').toLowerCase() === 'inactive'
})

const isArchived = computed(() => {
  return student.value?.archived || student.value?.status === 'Stopped'
})

const activeDropdown = ref(null)
const programMenuStyles = ref({})

const toggleProgramFilter = (tab, event) => {
  if (activeDropdown.value === tab) {
    activeDropdown.value = null
    return
  }

  activeDropdown.value = tab
  const rect = event.currentTarget.getBoundingClientRect()
  programMenuStyles.value = {
    top: `${rect.bottom + 8}px`,
    left: `${rect.left}px`,
    minWidth: '220px',
  }
}

const closeProgramFilter = (event) => {
  setTimeout(() => {
    const menu = document.querySelector('.program-filter-menu')
    if (menu && menu.contains(event.relatedTarget)) return
    activeDropdown.value = null
  }, 200)
}

const selectProgramFilter = (tab, id) => {
  if (tab === 'attendance') selectedAttendanceProgramId.value = id
  if (tab === 'behavior') selectedBehaviorProgramId.value = id
  if (tab === 'exam') selectedExamFilter.value = id
  activeDropdown.value = null
}

const getSelectedProgramLabel = (tab) => {
  if (tab === 'exam') {
    const opt = examFilterOptions.value.find((o) => o.id === selectedExamFilter.value)
    return opt ? opt.title : 'All Exams'
  }

  let id = 'all'
  if (tab === 'attendance') id = selectedAttendanceProgramId.value
  if (tab === 'behavior') id = selectedBehaviorProgramId.value

  if (id === 'all') return 'All Programs'
  const p = registeredPrograms.value.find((p) => p.id === id)
  return p ? p.title : 'All Programs'
}

const activeTab = ref('academic')
const currentFilter = ref('all')
const searchQuery = ref('')
const selectedAttendanceProgramId = ref('all')
const selectedBehaviorProgramId = ref('all')
const selectedExamFilter = ref('all')

const registeredPrograms = computed(() => {
  if (!enrollments.value.length) return []
  return enrollments.value
    .map((e) => ({
      id: e.programId,
      title: e.programTitle || 'Unknown Program',
    }))
    .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i)
})

const attendanceProgramOptions = computed(() => {
  const idsWithLogs = new Set(attendanceHistory.value.map((a) => a.programId))
  return registeredPrograms.value.filter((p) => idsWithLogs.has(p.id))
})

const behaviorProgramOptions = computed(() => {
  const idsWithLogs = new Set((progressData.value?.behaviorLogs || []).map((b) => b.programId))
  return registeredPrograms.value.filter((p) => idsWithLogs.has(p.id))
})

const examFilterOptions = computed(() => {
  const terms = enrollments.value
    .map((e) => e.termName || e.term)
    .filter((v, i, a) => v && a.indexOf(v) === i)
    .sort()
    .map((t) => ({ id: `term:${t}`, title: `Term: ${t}` }))

  return [
    { id: 'all', title: 'All Exams' },
    { id: 'passed', title: 'Result: Passed' },
    { id: 'failed', title: 'Result: Failed' },
    ...terms,
  ]
})

const getFilterOptions = (tab) => {
  if (tab === 'exam') return examFilterOptions.value
  const options =
    tab === 'attendance'
      ? attendanceProgramOptions.value
      : tab === 'behavior'
        ? behaviorProgramOptions.value
        : []
  return options.length > 0 ? options : registeredPrograms.value
}

watch(activeTab, () => {
  currentFilter.value = 'all'
})

const actionModal = ref({
  isOpen: false,
  type: '',
  student: null,
  enrollment: null,
})

const openActionModal = (type, enrollment = null) => {
  globalError.value = ''
  globalSuccess.value = ''
  actionModal.value = {
    isOpen: true,
    type,
    student: student.value,
    enrollment,
  }
}

const submitActionModal = async (formData) => {
  const { type, student: currentStudent } = actionModal.value
  submitting.value = true
  globalError.value = ''

  try {
    const sid = String(currentStudent.id || currentStudent.uid || '')
    if (type === 'edit') {
      const updatePayload = {
        ...formData,
        profileURL: formData.profileURL,
      }
      await userService.updateStudent(sid, updatePayload)
      globalSuccess.value = 'Student profile updated!'
    } else if (type === 'override') {
      const isStopping = formData.status === 'Stopped'
      await userService.updateStudent(sid, {
        status: formData.status,
        overrideReason: formData.overrideReason,
        overrideRemark: formData.overrideRemark,
        archived: isStopping,
      })

      if (isStopping && student.value?.parentId) {
        try {
          await userService.updateUser(student.value.parentId, { status: 'Inactive' })
        } catch (autoErr) {
          console.warn('Auto-deactivation of parent failed', autoErr)
        }
      }

      const activeEnrollments = enrollments.value.filter((r) => {
        const status = getAcademicStatus(r)
        return status === 'Studying'
      })

      if (activeEnrollments.length > 0) {
        await Promise.all(
          activeEnrollments.map((enrollment) =>
            enrollmentService.updateEnrollment(enrollment.id, {
              status: formData.status,
              overrideReason: formData.overrideReason,
              overrideRemark: formData.overrideRemark,
              academicStatus: formData.status,
            }),
          ),
        )
      }

      globalSuccess.value = `Student and ${activeEnrollments.length} active programs updated!`
    } else if (type === 'enrollment-override' && actionModal.value.enrollment) {
      const eid = actionModal.value.enrollment.id
      await enrollmentService.updateEnrollment(eid, {
        status: formData.status,
        overrideReason: formData.overrideReason,
        overrideRemark: formData.overrideRemark,
        academicStatus: formData.status,
      })
      globalSuccess.value = 'Program status updated!'
    } else if (type === 'enrollment-delete' && actionModal.value.enrollment) {
      if (formData.deleteConfirm !== 'DELETE') throw new Error('Please type DELETE to confirm.')
      await enrollmentService.deleteEnrollment(actionModal.value.enrollment.id)
      globalSuccess.value = 'Academic record deleted permanently!'
    } else if (type === 'delete') {
      if (formData.deleteConfirm !== 'DELETE') throw new Error('Please type DELETE to confirm.')
      await userService.deleteStudent(sid)
      router.push('/students')
      return
    }

    setTimeout(() => {
      actionModal.value.isOpen = false
      globalSuccess.value = ''
    }, 1500)

    try {
      await fetchData(sid)
    } catch (fetchErr) {
      console.warn('Data refreshed partially after modal save:', fetchErr)
    }
  } catch (err) {
    console.error('Action failed:', err)
    globalError.value = err.message || 'Action failed'
  } finally {
    submitting.value = false
  }
}

const formatDateTime = (date) => {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return '-'

    const dateStr = d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    const timeStr = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })

    return `${dateStr} at ${timeStr}`
  } catch (e) {
    return '-'
  }
}

const filterOptions = computed(() => {
  if (activeTab.value === 'academic') {
    return [
      { label: 'All Status', value: 'all' },
      { label: 'Studying', value: 'Studying' },
      { label: 'Graduated', value: 'Graduated' },
      { label: 'Suspended', value: 'Suspended' },
      { label: 'Stopped', value: 'Stopped' },
    ]
  }
  if (activeTab.value === 'attendance') {
    return [
      { label: 'All Status', value: 'all' },
      { label: 'Present', value: 'Present' },
      { label: 'Late', value: 'Late' },
      { label: 'Permission', value: 'Permission' },
      { label: 'Absent', value: 'Absent' },
      { label: 'Make-up', value: 'Make-up' },
    ]
  }
  if (activeTab.value === 'behavior') {
    return [
      { label: 'All Status', value: 'all' },
      { label: 'Excellent', value: 'Excellent' },
      { label: 'Good/Fair', value: 'Good/Fair' },
      { label: 'Warning', value: 'Warning' },
      { label: 'Serious', value: 'Serious' },
    ]
  }
  if (activeTab.value === 'exam') {
    return [
      { label: 'All Exams', value: 'all' },
      { label: 'Passed', value: 'Passed' },
      { label: 'Failed', value: 'Failed' },
    ]
  }
  return [{ label: 'All', value: 'all' }]
})

const filteredAcademic = computed(() => {
  const result = filterDetailEnrollments(enrollments.value, {
    academicStatus: currentFilter.value === 'all' ? null : currentFilter.value,
  })

  return result
    .filter((r) =>
      searchQuery.value
        ? (r.programTitle || '').toLowerCase().includes(searchQuery.value.toLowerCase())
        : true,
    )
    .sort((a, b) => {
      const aAct = getAcademicStatus(a) === 'Studying' ? 1 : 0
      const bAct = getAcademicStatus(b) === 'Studying' ? 1 : 0
      if (aAct !== bAct) return bAct - aAct
      const dateA = new Date(a.enrollAt || a.createdAt || 0)
      const dateB = new Date(b.enrollAt || b.createdAt || 0)
      return dateB - dateA
    })
})

const filteredAttendance = computed(() => {
  let result = [...attendanceHistory.value]
  if (selectedAttendanceProgramId.value !== 'all') {
    result = result.filter((a) => a.programId === selectedAttendanceProgramId.value)
  }
  return result.sort(
    (a, b) =>
      new Date(b.date || b.attendanceDate || b.createdAt) -
      new Date(a.date || a.attendanceDate || a.createdAt),
  )
})

const filteredBehavior = computed(() => {
  let result = progressData.value?.behaviorLogs || []
  if (selectedBehaviorProgramId.value !== 'all') {
    result = result.filter((b) => b.programId === selectedBehaviorProgramId.value)
  }
  return result.sort(
    (a, b) =>
      new Date(b.date || b.behaviorDate || b.createdAt) -
      new Date(a.date || a.behaviorDate || a.createdAt),
  )
})

const filteredExams = computed(() => {
  let result = progressData.value?.examRecords || progressData.value?.examLogs || []
  const filter = selectedExamFilter.value

  if (filter !== 'all') {
    if (filter === 'passed') {
      result = result.filter((e) => Number(e.score || 0) >= 50)
    } else if (filter === 'failed') {
      result = result.filter((e) => Number(e.score || 0) < 50)
    } else if (filter.startsWith('term:')) {
      const term = filter.replace('term:', '')
      result = result.filter((e) => (e.termName || e.term) === term)
    } else {
      result = result.filter((e) => e.programId === filter)
    }
  }
  return result.sort((a, b) => new Date(b.date || b.examDate) - new Date(a.date || a.examDate))
})

const studentStats = computed(() => {
  const academicCount = enrollments.value.length
  let attendanceRate = '0%'
  if (attendanceHistory.value.length > 0) {
    const presentCount = attendanceHistory.value.filter(
      (a) => (a.status || '').toLowerCase() === 'present',
    ).length
    attendanceRate = Math.round((presentCount / attendanceHistory.value.length) * 100) + '%'
  }
  const behaviorStanding = progressData.value?.overallProgress || 'Good'
  const examAverage =
    enrollments.value.reduce((max, e) => {
      const score = parseInt(e.score || 0)
      return score > max ? score : max
    }, 0) || '-'

  return [
    {
      label: 'Academic History',
      value: academicCount,
      image: getImageUrl('data-metric-card/academic-history'),
      color: 'bg-primary-soft',
    },
    {
      label: 'Attendance',
      value: attendanceRate,
      image: getImageUrl('data-metric-card/attendance'),
      color: 'bg-primary-soft',
    },
    {
      label: 'Behavior Standing',
      value: behaviorStanding,
      image: getImageUrl('data-metric-card/behavior'),
      color: 'bg-primary-soft',
    },
    {
      label: 'Exam Average',
      value: examAverage,
      image: getImageUrl('data-metric-card/exam'),
      color: 'bg-primary-soft',
    },
  ]
})

const fetchData = async (id) => {
  try {
    loading.value = true
    errorMessage.value = ''
    const [studentData, branchData] = await Promise.all([
      userService.getStudent(id),
      branchService.getAllBranches(),
    ])
    if (!studentData) throw new Error('Student not found')
    student.value = studentData
    branches.value = branchData || []
    const pId = studentData.parentId
    if (pId) {
      try {
        parent.value = await userService.getProfile(pId)
      } catch (e) {
        console.warn('Could not fetch parent context silently', e)
      }
    }
    const [allEnrollments, allPrograms] = await Promise.all([
      enrollmentService.getAllEnrollments(),
      programService.getAllPrograms(),
    ])
    const programs = allPrograms || []
    enrollments.value = (allEnrollments || [])
      .filter((r) => String(r.studentId || '') === String(id))
      .map((r) => {
        const program = programs.find((c) => (c.id || c.uid) === r.programId)
        return {
          ...r,
          programTitle:
            program?.title ||
            r.program?.title ||
            r.programTitle ||
            r.courseTitle ||
            'Unknown Program',
          parentName: r.parent?.name || r.parentName || 'Parent',
          studentName: r.student?.name || r.studentName || 'Student',
          termName: program?.termName || program?.term || r.termName || null,
          schedule: program?.schedule || r.schedule || null,
          startDate: program?.startDate || r.startDate || null,
          endDate: program?.endDate || r.endDate || null,
          sessionSchedule:
            r.sessionSchedule ||
            (program?.schedule ? `${program.schedule.day} ${program.schedule.timeslot}` : null),
        }
      })
    try {
      const [attendance, progress] = await Promise.all([
        trackingService.getAttendanceHistory(id),
        trackingService.getStudentProgress(id),
      ])
      attendanceHistory.value = (attendance || []).map((a) => {
        const program = programs.find((c) => (c.id || c.uid) === a.programId)
        return {
          ...a,
          programTitle: program?.title || a.programTitle || a.courseTitle || 'Unknown Program',
        }
      })
      if (progress) {
        progress.behaviorLogs = (progress.behaviorLogs || []).map((b) => {
          const program = programs.find((c) => (c.id || c.uid) === b.programId)
          return {
            ...b,
            programTitle: program?.title || b.programTitle || b.courseTitle || 'Unknown Program',
          }
        })
        progress.examRecords = (progress.examRecords || []).map((e) => {
          const program = programs.find((c) => (c.id || c.uid) === e.programId)
          return {
            ...e,
            programTitle: program?.title || e.programTitle || e.courseTitle || 'Unknown Program',
          }
        })
        progressData.value = progress || null
      }
    } catch (e) {
      console.warn('Could not fetch tracking data silently', e)
    }
  } catch (error) {
    console.error('Failed to load student details', error)
    errorMessage.value = error.message || 'Failed to load details'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (route.params.id) fetchData(route.params.id)
})

watch(
  () => route.params.id,
  (newId) => {
    if (newId) fetchData(newId)
  },
)
</script>

<template>
  <DashboardLayout>
    <DetailPageLayout
      :loading="loading"
      :errorMessage="errorMessage"
      backRoute="/students"
      title="Student Details"
    >
      <template #header-actions v-if="student">
        <div class="flex items-center gap-md">
          <AppButton
            variant="secondary"
            title="Edit Profile"
            @click="openActionModal('edit')"
            :disabled="isParentInactive || isArchived"
          >
            <img :src="getActionIcon('edit')" class="w-4 h-4" /> Edit
          </AppButton>
          <AppButton
            variant="secondary"
            title="Override Status"
            @click="openActionModal('override')"
            :disabled="isParentInactive || isArchived"
          >
            <img :src="getActionIcon('quick-action')" class="w-4 h-4" /> Status
          </AppButton>
          <AppButton
            variant="danger"
            title="Delete Student"
            @click="openActionModal('delete')"
            :disabled="isParentInactive || isArchived"
          >
            <img :src="getActionIcon('delete')" class="w-4 h-4 invert" /> Delete
          </AppButton>
        </div>
      </template>

      <template #left-content v-if="student">
        <!-- Alerts -->
        <div v-if="isArchived || isParentInactive" class="mb-lg">
          <div
            v-if="isArchived"
            class="p-md bg-info/10 border-l-4 border-info rounded-sm flex flex-col gap-1"
          >
            <strong class="text-info text-sm">Record Archived</strong>
            <span class="text-xs text-content-muted"
              >This student has stopped studying. This profile and all academic history are now
              read-only.</span
            >
          </div>
          <div
            v-else-if="isParentInactive"
            class="p-md bg-warning/10 border-l-4 border-warning rounded-sm flex flex-col gap-1"
          >
            <strong class="text-warning text-sm">Parent Account Inactive</strong>
            <span class="text-xs text-content-muted"
              >The parent account is inactive. Reactivate it to manage this student.</span
            >
          </div>
        </div>

        <!-- Metrics Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg mb-xl">
          <DataMetricCard v-for="stat in studentStats" :key="stat.label" v-bind="stat" />
        </div>

        <!-- Tab Navigation -->
        <div class="ui-tabs-nav">
          <button
            class="ui-tab-item"
            :class="{ active: activeTab === 'academic' }"
            @click="activeTab = 'academic'"
          >
            Academic History
          </button>
          <button
            class="ui-tab-item"
            :class="{ active: activeTab === 'attendance' }"
            @click="activeTab = 'attendance'"
          >
            Attendance Record
          </button>
          <button
            class="ui-tab-item"
            :class="{ active: activeTab === 'behavior' }"
            @click="activeTab = 'behavior'"
          >
            Behavior Record
          </button>
          <button
            class="ui-tab-item"
            :class="{ active: activeTab === 'exam' }"
            @click="activeTab = 'exam'"
          >
            Exam Record
          </button>
        </div>

        <!-- Tab Content -->
        <div class="ui-detail-card min-h-[400px]">
          <div class="ui-section-header">
            <h3 class="ui-section-title">
              {{ activeTab.charAt(0).toUpperCase() + activeTab.slice(1) }} Record
            </h3>

            <!-- Program Filters for Tracking Tabs -->
            <div v-if="activeTab !== 'academic' && registeredPrograms.length > 0" class="relative">
              <AppButton
                variant="secondary"
                @click="toggleProgramFilter(activeTab, $event)"
                @blur="closeProgramFilter"
              >
                <span class="text-xs">{{ getSelectedProgramLabel(activeTab) }}</span>
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
                    v-if="activeDropdown === activeTab"
                    class="ui-dropdown-menu program-filter-menu"
                    :style="programMenuStyles"
                    @mousedown.stop
                  >
                    <div
                      class="ui-dropdown-item"
                      @click.stop="selectProgramFilter(activeTab, 'all')"
                    >
                      All Programs
                    </div>
                    <div
                      v-for="p in getFilterOptions(activeTab)"
                      :key="p.id"
                      class="ui-dropdown-item"
                      @click.stop="selectProgramFilter(activeTab, p.id)"
                    >
                      {{ p.title }}
                    </div>
                  </div>
                </transition>
              </Teleport>
            </div>
          </div>

          <!-- Academic Content -->
          <div v-if="activeTab === 'academic'">
            <table v-if="filteredAcademic.length > 0" class="ui-premium-table">
              <thead>
                <tr>
                  <th class="text-center" width="50">No</th>
                  <th>Program Title</th>
                  <th class="text-center">Term</th>
                  <th>Schedule</th>
                  <th class="text-center">Status</th>
                  <th class="text-center">Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in filteredAcademic" :key="item.id || idx">
                  <td class="text-center font-bold text-content-muted/40">{{ idx + 1 }}</td>
                  <td>
                    <div class="flex flex-col">
                      <span class="font-bold text-content-dark">{{
                        item.programTitle || '-'
                      }}</span>
                      <span class="text-3xs text-content-muted uppercase font-black"
                        >Enrolled {{ formatDateOnly(item.enrollAt || item.createdAt) }}</span
                      >
                    </div>
                  </td>
                  <td class="text-center">
                    <StatusBadge :status="item.termName || '—'" type="blue" />
                  </td>
                  <td>
                    <div v-if="item.schedule || item.sessionSchedule" class="flex flex-col">
                      <span
                        class="text-xs font-black text-content-dark uppercase tracking-tighter"
                        >{{
                          item.schedule?.day ||
                          (typeof item.sessionSchedule === 'string'
                            ? item.sessionSchedule.split(' ')[0]
                            : '')
                        }}</span
                      >
                      <span class="text-2xs text-content-muted font-bold uppercase">{{
                        item.schedule?.timeslot ||
                        (typeof item.sessionSchedule === 'string'
                          ? item.sessionSchedule.split(' ').slice(1).join(' ')
                          : '')
                      }}</span>
                    </div>
                    <span v-else class="text-content-muted/30 italic text-xs">N/A</span>
                  </td>
                  <td class="text-center"><StatusBadge :status="getAcademicStatus(item)" /></td>
                  <td class="text-center">
                    <div class="flex flex-col text-2xs font-bold text-content-muted gap-0.5">
                      <span>{{ formatDateOnly(item.startDate) }}</span>
                      <span class="opacity-50">—</span>
                      <span>{{ formatDateOnly(item.endDate) }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="flex flex-col items-center justify-center p-20 gap-md opacity-40">
              <img :src="getImageUrl('common/no-data')" class="w-20" />
              <p class="text-sm font-bold">No academic records found.</p>
            </div>
          </div>

          <!-- Attendance Content -->
          <div v-if="activeTab === 'attendance'">
            <table v-if="filteredAttendance.length > 0" class="ui-premium-table">
              <thead>
                <tr>
                  <th class="text-center" width="50">No</th>
                  <th>Program</th>
                  <th>Date & Time</th>
                  <th class="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in filteredAttendance" :key="item.id || idx">
                  <td class="text-center text-content-muted/40 font-bold">{{ idx + 1 }}</td>
                  <td class="font-bold text-content-dark">{{ item.programTitle || '-' }}</td>
                  <td>
                    <div class="flex flex-col">
                      <span class="font-black text-content-dark tracking-tighter uppercase">{{
                        formatDateOnly(item.date || item.attendanceDate || item.createdAt)
                      }}</span>
                      <span class="text-3xs text-content-muted font-bold uppercase">{{
                        formatDateTime(item.date || item.attendanceDate || item.createdAt).split(
                          'at ',
                        )[1]
                      }}</span>
                    </div>
                  </td>
                  <td class="text-center">
                    <StatusBadge :status="item.status || item.displayStatus" />
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="flex flex-col items-center justify-center p-20 gap-md opacity-40">
              <img :src="getImageUrl('common/no-data')" class="w-20" />
              <p class="text-sm font-bold">No attendance logs found.</p>
            </div>
          </div>

          <!-- Behavior Content -->
          <div v-if="activeTab === 'behavior'">
            <table v-if="filteredBehavior.length > 0" class="ui-premium-table">
              <thead>
                <tr>
                  <th class="text-center" width="50">No</th>
                  <th>Program</th>
                  <th>Date</th>
                  <th class="text-center">Result</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in filteredBehavior" :key="item.id || idx">
                  <td class="text-center text-content-muted/40 font-bold">{{ idx + 1 }}</td>
                  <td class="font-bold text-content-dark">{{ item.programTitle || '-' }}</td>
                  <td>
                    <span class="text-xs font-black text-content-muted tracking-tight">{{
                      formatDateTime(item.date || item.behaviorDate || item.createdAt)
                    }}</span>
                  </td>
                  <td class="text-center">
                    <StatusBadge :status="item.category || item.status || 'General'" />
                  </td>
                  <td class="text-xs text-content-muted leading-relaxed font-medium italic">
                    {{ item.remark || item.note || item.displayStatus || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="flex flex-col items-center justify-center p-20 gap-md opacity-40">
              <img :src="getImageUrl('common/no-data')" class="w-20" />
              <p class="text-sm font-bold">No behavior logs found.</p>
            </div>
          </div>

          <!-- Exam Content -->
          <div v-if="activeTab === 'exam'">
            <table v-if="filteredExams.length > 0" class="ui-premium-table">
              <thead>
                <tr>
                  <th class="text-center" width="50">No</th>
                  <th>Program</th>
                  <th class="text-center">Date</th>
                  <th>Examiner</th>
                  <th class="text-center">Score</th>
                  <th class="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in filteredExams" :key="item.id || idx">
                  <td class="text-center text-content-muted/40 font-bold">{{ idx + 1 }}</td>
                  <td class="font-bold text-content-dark">{{ item.programTitle || '-' }}</td>
                  <td class="text-center font-black text-content-muted/70 text-xs">
                    {{ formatDateOnly(item.date || item.examDate) }}
                  </td>
                  <td class="text-xs font-bold text-content-muted">{{ item.examiner || '-' }}</td>
                  <td class="text-center font-black text-lg text-primary tracking-tighter">
                    {{ item.score || '-' }}
                  </td>
                  <td class="text-center">
                    <StatusBadge :status="item.score >= 50 ? 'Passed' : 'Failed'" />
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="flex flex-col items-center justify-center p-20 gap-md opacity-40">
              <img :src="getImageUrl('common/no-data')" class="w-20" />
              <p class="text-sm font-bold">No exam records found.</p>
            </div>
          </div>
        </div>
      </template>

      <template #right-content v-if="student">
        <!-- Student Identity Card -->
        <div class="ui-detail-card flex flex-col items-center text-center p-0 overflow-hidden">
          <div class="w-full h-32 bg-gradient-to-br from-primary to-magenta opacity-10"></div>
          <div class="relative -mt-16 mb-md">
            <div
              class="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden"
            >
              <img
                :src="student?.profile || getImageUrl('profiles/avatar-student')"
                alt="Student Profile"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="absolute bottom-1 right-1">
              <StatusBadge :status="computedStatus" :showLabel="false" />
            </div>
          </div>

          <div class="px-xl pb-xl flex flex-col items-center">
            <h2 class="text-2xl font-black text-content-dark tracking-tighter mb-xs">
              {{ student?.name }}
            </h2>
            <StatusBadge :status="computedStatus" />

            <div class="w-full h-px bg-surface-light my-xl"></div>

            <div class="ui-data-list w-full grid-cols-1 gap-y-lg">
              <div class="ui-data-item">
                <span class="ui-data-label text-left">Date of Birth</span>
                <span class="ui-data-value text-left flex items-center justify-between">
                  {{ formatDateOnly(student?.dob) || '—' }}
                  <StatusBadge
                    :status="'Age: ' + (calculateAge(student?.dob) || '—')"
                    type="blue"
                  />
                </span>
              </div>
              <div class="ui-data-item">
                <span class="ui-data-label text-left">Internal Status</span>
                <span class="ui-data-value text-left text-content-muted text-xs font-medium">
                  {{ student?.archived ? 'Archived Record' : 'Active Account' }}
                </span>
              </div>
              <div class="ui-data-item">
                <span class="ui-data-label text-left">Medical Note</span>
                <span
                  class="ui-data-value text-left text-xs italic text-error/70 bg-error/5 p-sm rounded-sm border border-error/10"
                >
                  {{ student?.medicalNote || 'No special medical requirements logged.' }}
                </span>
              </div>
            </div>

            <div
              v-if="student?.overrideReason"
              class="mt-xl p-md bg-warning/5 border border-warning/10 rounded-sm w-full text-left"
            >
              <div class="flex items-center gap-xs mb-xs">
                <img :src="getActionIcon('quick-action')" class="w-4.5 h-4.5 opacity-60" />
                <span class="text-3xs font-black uppercase text-warning tracking-widest"
                  >Manual Override</span
                >
              </div>
              <p class="text-xs font-bold text-content-dark mb-1">
                Reason: {{ student?.overrideReason }}
              </p>
              <p class="text-2xs text-content-muted leading-relaxed italic">
                {{ student?.overrideRemark }}
              </p>
            </div>
          </div>
        </div>

        <!-- Relationship Card -->
        <div class="ui-detail-card mt-lg">
          <div class="ui-section-header mb-lg">
            <h3 class="text-xs font-black uppercase tracking-widest text-content-muted">
              Primary Relationships
            </h3>
          </div>
          <div
            v-if="student?.parentInfo || student?.parentId"
            class="group flex items-center gap-md p-md rounded-sm bg-surface-light cursor-pointer transition-all hover:bg-white hover:shadow-md hover:ring-2 hover:ring-primary/20"
            @click="router.push(`/parents/${student?.parentId}`)"
          >
            <div
              class="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-border"
            >
              <img
                :src="student?.parentInfo?.profile || getImageUrl('profiles/avatar-parent')"
                alt="Parent Profile"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="flex flex-col">
              <span
                class="font-black text-content-dark tracking-tighter group-hover:text-primary transition-colors text-base"
                >{{ student?.parentInfo?.name || student?.parentName || 'Parent Name' }}</span
              >
              <span class="text-2xs text-content-muted uppercase font-bold tracking-widest"
                >Legal Guardian</span
              >
            </div>
          </div>
          <div
            v-else
            class="p-xl text-center border-2 border-dashed border-surface-light rounded-sm opacity-30 text-xs font-bold italic"
          >
            No relationships linked.
          </div>
        </div>

        <!-- Timestamps -->
        <div class="flex flex-col gap-sm mt-lg px-md opacity-40">
          <div
            class="flex items-center justify-between text-3xs font-black uppercase tracking-tighter"
          >
            <span>Joined Portal</span>
            <span class="text-content-dark">{{ formatDate(student?.createdAt) }}</span>
          </div>
          <div
            class="flex items-center justify-between text-3xs font-black uppercase tracking-tighter"
          >
            <span>Last Profile Update</span>
            <span class="text-content-dark">{{
              formatDate(student?.updatedAt || student?.createdAt)
            }}</span>
          </div>
        </div>
      </template>
    </DetailPageLayout>

    <StudentActionModal
      :isOpen="actionModal.isOpen"
      :type="actionModal.type"
      :student="actionModal.student"
      :enrollment="actionModal.enrollment"
      :loading="submitting"
      :error="globalError"
      :success="globalSuccess"
      :branches="branches"
      @close="actionModal.isOpen = false"
      @submit="submitActionModal"
    />
  </DashboardLayout>
</template>
