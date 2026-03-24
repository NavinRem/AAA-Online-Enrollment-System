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
import { trackingService } from '@/services/trackingService'
import { programService } from '@/services/programService'
import { formatDate, formatDateOnly, calculateAge } from '@/utils/dateFormatter'
import { calculateStudentStatus } from '@/utils/studentStatusHelper'
import { filterDetailEnrollments, getAcademicStatus } from '@/utils/enrollmentHelper'
import StudentActionModal from '@/components/students/StudentActionModal.vue'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'

import { getImageUrl } from '@/utils/assetHelper'

const route = useRoute()
const router = useRouter()

const student = ref(null)
const parent = ref(null)
const enrollments = ref([])
const attendanceHistory = ref([])
const progressData = ref(null)

const computedStatus = computed(() => {
  if (!student.value) return 'Inactive'
  return calculateStudentStatus(student.value, enrollments.value)
})

const primaryParent = computed(() => {
  const role = String(parent.value?.role || '').toLowerCase()
  return role.includes('parent') ? parent.value : null
})

const primaryGuardian = computed(() => {
  const role = String(parent.value?.role || '').toLowerCase()
  return role.includes('guardian') ? parent.value : null
})

const loading = ref(true)
const errorMessage = ref('')
const globalSuccess = ref('')
const globalError = ref('')
const submitting = ref(false)

const activeDropdown = ref(null) // 'attendance', 'behavior', 'exam' or null
const programMenuStyles = ref({})

const toggleProgramFilter = (tab, event) => {
  if (activeDropdown.value === tab) {
    activeDropdown.value = null
    return
  }

  activeDropdown.value = tab
  const rect = event.currentTarget.getBoundingClientRect()
  programMenuStyles.value = {
    top: `${rect.bottom + window.scrollY + 8}px`,
    left: `${rect.left + window.scrollX}px`,
    minWidth: '220px'
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
    const opt = examFilterOptions.value.find(o => o.id === selectedExamFilter.value)
    return opt ? opt.title : 'All Exams'
  }

  let id = 'all'
  if (tab === 'attendance') id = selectedAttendanceProgramId.value
  if (tab === 'behavior') id = selectedBehaviorProgramId.value

  if (id === 'all') return 'All Programs'
  const p = registeredPrograms.value.find(p => p.id === id)
  return p ? p.title : 'All Programs'
}

const activeTab = ref('academic') // 'academic', 'attendance', 'behavior', 'exam'
const currentFilter = ref('all')
const searchQuery = ref('')
const selectedAttendanceProgramId = ref('all')
const selectedBehaviorProgramId = ref('all')
const selectedExamFilter = ref('all')

const registeredPrograms = computed(() => {
  if (!enrollments.value.length) return []
  return enrollments.value
    .map(e => ({
      id: e.programId || e.courseId,
      title: e.programTitle || 'Unknown Program'
    }))
    .filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i)
})

const attendanceProgramOptions = computed(() => {
  const idsWithLogs = new Set(attendanceHistory.value.map(a => a.programId || a.courseId))
  return registeredPrograms.value.filter(p => idsWithLogs.has(p.id))
})

const behaviorProgramOptions = computed(() => {
  const idsWithLogs = new Set((progressData.value?.behaviorLogs || []).map(b => b.programId || b.courseId))
  return registeredPrograms.value.filter(p => idsWithLogs.has(p.id))
})

const examFilterOptions = computed(() => {
  // Get unique terms from enrollments
  const terms = enrollments.value
    .map(e => e.termName || e.term)
    .filter((v, i, a) => v && a.indexOf(v) === i)
    .sort()
    .map(t => ({ id: `term:${t}`, title: `Term: ${t}` }))

  return [
    { id: 'all', title: 'All Exams' },
    { id: 'passed', title: 'Result: Passed' },
    { id: 'failed', title: 'Result: Failed' },
    ...terms
  ]
})

const getFilterOptions = (tab) => {
  if (tab === 'exam') return examFilterOptions.value
  const options = tab === 'attendance' ? attendanceProgramOptions.value :
    tab === 'behavior' ? behaviorProgramOptions.value : []
  return options.length > 0 ? options : registeredPrograms.value
}

// Reset sub-filter when navigating tabs
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
      await userService.updateStudent(sid, formData)
      globalSuccess.value = 'Student profile updated!'
    } else if (type === 'override') {
      // 1. Update student level override
      await userService.updateStudent(sid, {
        status: formData.status,
        overrideReason: formData.overrideReason,
        overrideRemark: formData.overrideRemark,
      })

      // 2. Cascade: Update all "Studying" enrollments with same status/reason
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
              academicStatus: formData.status, // Explicitly set display status
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

    await fetchData(sid)
    setTimeout(() => {
      actionModal.value.isOpen = false
      globalSuccess.value = ''
    }, 1500)
  } catch (err) {
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

    const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

    return `${dateStr} at ${timeStr}`
  } catch (e) {
    return '-'
  }
}

// Reset filter logic moved to activeTab watch

// Dynamic filter options based on tab
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
    academicStatus: currentFilter.value === 'all' ? null : currentFilter.value
  })

  return result
    .filter(r => searchQuery.value ? (r.programTitle || '').toLowerCase().includes(searchQuery.value.toLowerCase()) : true)
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
    result = result.filter(a => (a.programId === selectedAttendanceProgramId.value || a.courseId === selectedAttendanceProgramId.value))
  }
  return result.sort((a, b) => new Date(b.date || b.attendanceDate || b.createdAt) - new Date(a.date || a.attendanceDate || a.createdAt))
})

const filteredBehavior = computed(() => {
  let result = progressData.value?.behaviorLogs || []
  if (selectedBehaviorProgramId.value !== 'all') {
    result = result.filter(b => (b.programId === selectedBehaviorProgramId.value || b.courseId === selectedBehaviorProgramId.value))
  }
  return result.sort((a, b) => new Date(b.date || b.behaviorDate || b.createdAt) - new Date(a.date || a.behaviorDate || a.createdAt))
})

const filteredExams = computed(() => {
  let result = progressData.value?.examRecords || progressData.value?.examLogs || []
  const filter = selectedExamFilter.value

  if (filter !== 'all') {
    if (filter === 'passed') {
      result = result.filter(e => Number(e.score || 0) >= 50)
    } else if (filter === 'failed') {
      result = result.filter(e => Number(e.score || 0) < 50)
    } else if (filter.startsWith('term:')) {
      const term = filter.replace('term:', '')
      result = result.filter(e => (e.termName || e.term) === term)
    } else {
      // Fallback for program ID if needed, though we primarily use strings now
      result = result.filter(e => (e.programId === filter || e.courseId === filter))
    }
  }
  return result.sort((a, b) => new Date(b.date || b.examDate) - new Date(a.date || a.examDate))
})

const studentStats = computed(() => {
  // 1. Academic History: Number of confirmed enrollments
  const academicCount = enrollments.value.length

  // 2. Attendance Rate: Based on 'present' status in history
  let attendanceRate = '0%'
  if (attendanceHistory.value.length > 0) {
    const presentCount = attendanceHistory.value.filter(a => (a.status || '').toLowerCase() === 'present').length
    attendanceRate = Math.round((presentCount / attendanceHistory.value.length) * 100) + '%'
  }

  // 3. Behavior Standing: From progress data or default
  const behaviorStanding = progressData.value?.overallProgress || 'Good'

  // 4. Exam Average: Find highest score from enrollments or default
  const examAverage = enrollments.value.reduce((max, e) => {
    const score = parseInt(e.score || 0)
    return score > max ? score : max
  }, 0) || '-'

  return [
    {
      label: 'Academic History',
      value: academicCount,
      image: getImageUrl('data-metric-card/academic-history'),
      color: '#e0f2fe'
    },
    {
      label: 'Attendance',
      value: attendanceRate,
      image: getImageUrl('data-metric-card/attendance'),
      color: '#e0f2fe'
    },
    {
      label: 'Behavior Standing',
      value: behaviorStanding,
      image: getImageUrl('data-metric-card/behavior'),
      color: '#e0f2fe'
    },
    {
      label: 'Exam Average',
      value: examAverage,
      image: getImageUrl('data-metric-card/exam'),
      color: '#e0f2fe'
    }
  ]
})

const fetchData = async (id) => {
  try {
    loading.value = true
    errorMessage.value = ''

    // 1. Fetch Student Profile
    const studentData = await userService.getStudent(id)
    if (!studentData) throw new Error('Student not found')
    student.value = studentData

    // 2. Fetch associated Parent profile if reference exists
    const pId = studentData.parentId
    console.log('Student Parent ID:', pId)
    if (pId) {
      try {
        const pData = await userService.getProfile(pId)
        console.log('Fetched Parent Data:', pData)
        parent.value = pData
      } catch (e) {
        console.warn('Could not fetch parent context silently', e)
      }
    }

    // 3. Fetch Enrollments & Programs
    const [allEnrollments, allPrograms] = await Promise.all([
      enrollmentService.getAllEnrollments(),
      programService.getAllPrograms()
    ])

    const programs = allPrograms || []

    enrollments.value = (allEnrollments || [])
      .filter((r) => String(r.studentId || '') === String(id))
      .map(r => {
        const program = programs.find(c => (c.id || c.uid) === (r.programId || r.courseId))
        return {
          ...r,
          programTitle: program?.title || r.programTitle || r.courseTitle || 'Unknown Program',
          termName: program?.termName || program?.term || r.termName || null,
          schedule: program?.schedule || r.schedule || null,
          startDate: program?.startDate || r.startDate || null,
          endDate: program?.endDate || r.endDate || null,
          sessionSchedule: r.sessionSchedule || (program?.schedule ? `${program.schedule.day} ${program.schedule.timeslot}` : null)
        }
      })

    // 4. Fetch Attendance & Progress
    try {
      const [attendance, progress] = await Promise.all([
        trackingService.getAttendanceHistory(id),
        trackingService.getStudentProgress(id)
      ])

      // Enrich logs with course titles
      attendanceHistory.value = (attendance || []).map(a => {
        const program = programs.find(c => (c.id || c.uid) === (a.programId || a.courseId))
        return { ...a, programTitle: program?.title || a.programTitle || a.courseTitle || 'Unknown Program' }
      })

      if (progress) {
        progress.behaviorLogs = (progress.behaviorLogs || []).map(b => {
          const program = programs.find(c => (c.id || c.uid) === (b.programId || b.courseId))
          return { ...b, programTitle: program?.title || b.programTitle || b.courseTitle || 'Unknown Program' }
        })

        progress.examRecords = (progress.examRecords || []).map(e => {
          const program = programs.find(c => (c.id || c.uid) === (e.programId || e.courseId))
          return { ...e, programTitle: program?.title || e.programTitle || e.courseTitle || 'Unknown Program' }
        })
      }

      progressData.value = progress || null
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
    <DetailPageLayout :loading="loading" :errorMessage="errorMessage" backRoute="/students" title="Student Details">
      <template #header-actions v-if="student">
        <div class="actions-wrapper">
          <button class="btn-icon edit" title="Edit Profile" @click="openActionModal('edit')">
            ✏️
          </button>
          <button class="btn-icon cancel" title="Override Status" @click="openActionModal('override')">
            ⏸️
          </button>
          <button class="btn-icon delete" title="Delete Student" @click="openActionModal('delete')">
            🗑️
          </button>
        </div>
      </template>

      <template #left-content v-if="student">
        <!-- Student Quick Stats Row -->
        <div class="metrics-row">
          <DataMetricCard v-for="stat in studentStats" :key="stat.label" :label="stat.label" :value="stat.value"
            :image="stat.image" :color="stat.color" />
        </div>

        <!-- Custom Tab Navigation -->
        <div class="tabs-navigation-wrapper">
          <div class="tabs-navigation">
            <AppButton variant="ghost" :class="{ active: activeTab === 'academic' }" @click="activeTab = 'academic'">
              Academic History
            </AppButton>
            <AppButton variant="ghost" :class="{ active: activeTab === 'attendance' }"
              @click="activeTab = 'attendance'">
              Attendance Record
            </AppButton>
            <AppButton variant="ghost" :class="{ active: activeTab === 'behavior' }" @click="activeTab = 'behavior'">
              Behavior Record
            </AppButton>
            <AppButton variant="ghost" :class="{ active: activeTab === 'exam' }" @click="activeTab = 'exam'">
              Exam Record
            </AppButton>
          </div>

          <div class="global-filter">
            <TableToolbar :hasSearch="false" :hasFilter="true" :currentFilter="currentFilter"
              @update:currentFilter="currentFilter = $event" :filterOptions="filterOptions" />
          </div>
        </div>

        <!-- Tab Content -->
        <div class="tab-content-container">
          <!-- Academic History Tab -->
          <div v-if="activeTab === 'academic'" class="detail-section-card full-width">
            <div class="section-header">
              <h3>Academic History List</h3>
            </div>
            <div class="table-container table-scroll-container">
              <table v-if="filteredAcademic.length > 0">
                <thead>
                  <tr>
                    <th width="30">No</th>
                    <th width="150">Program Title</th>
                    <th width="100">Term</th>
                    <th width="100">Schedule</th>
                    <th class="text-center" width="100">Status</th>
                    <th class="text-center" width="120">Enroll Date</th>
                    <th class="text-center" width="120">Start Date</th>
                    <th class="text-center" width="120">End Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in filteredAcademic" :key="item.id || idx">
                    <td class="text-center">{{ idx + 1 }}</td>
                    <td><strong>{{ item.programTitle || '-' }}</strong></td>
                    <td class="text-center">
                      <StatusBadge :status="item.termName || 'No Term'" type="blue" />
                    </td>
                    <td>
                      <div class="schedule-info" v-if="item.schedule || item.sessionSchedule">
                        <span class="day">{{ (item.schedule?.day || (typeof item.sessionSchedule === 'string' ?
                          item.sessionSchedule.split(' ')[0] : '')) }}</span>
                        <span class="time">{{ (item.schedule?.timeslot || (typeof item.sessionSchedule === 'string' ?
                          item.sessionSchedule.split(' ').slice(1).join(' ') : '')) }}</span>
                      </div>
                      <span v-else class="help-text-small">N/A</span>
                    </td>
                    <td class="text-center">
                      <StatusBadge :status="getAcademicStatus(item)" />
                    </td>
                    <td class="text-center">{{ formatDateOnly(item.enrollAt || item.createdAt) }}</td>
                    <td class="text-center">{{ formatDateOnly(item.startDate) }}</td>
                    <td class="text-center">{{ formatDateOnly(item.endDate) }}</td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="empty-state">
                <p>No academic records found.</p>
              </div>
            </div>
          </div>

          <!-- Attendance Record Tab -->
          <div v-if="activeTab === 'attendance'" class="detail-section-card full-width">
            <div class="section-header">
              <h3>Attendance Record List</h3>
              <div class="filter-dropdown-container" v-if="registeredPrograms.length > 0">
                <AppButton variant="secondary" :class="{ active: selectedAttendanceProgramId !== 'all' }"
                  @click="toggleProgramFilter('attendance', $event)" @blur="closeProgramFilter">
                  {{ getSelectedProgramLabel('attendance') }}
                </AppButton>
                <Teleport to="body">
                  <transition name="toast-fade">
                    <div v-if="activeDropdown === 'attendance'" :key="'dropdown-attendance'"
                      class="filter-dropdown-menu program-filter-menu scrollable-menu" :style="programMenuStyles"
                      @mousedown.stop>
                      <div class="filter-option" :class="{ active: selectedAttendanceProgramId === 'all' }"
                        @click.stop="selectProgramFilter('attendance', 'all')">
                        All Programs
                      </div>
                      <div v-for="p in getFilterOptions('attendance')" :key="p.id" class="filter-option"
                        :class="{ active: selectedAttendanceProgramId === p.id }"
                        @click.stop="selectProgramFilter('attendance', p.id)">
                        {{ p.title }}
                      </div>
                    </div>
                  </transition>
                </Teleport>
              </div>
            </div>
            <div class="table-container table-scroll-container">
              <table v-if="filteredAttendance.length > 0">
                <thead>
                  <tr>
                    <th width="60">No</th>
                    <th width="240">Program</th>
                    <th width="200">Marked Timestamp</th>
                    <th width="150">Marked By</th>
                    <th class="text-center" width="120">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in filteredAttendance" :key="item.id || idx">
                    <td class="text-center">{{ idx + 1 }}</td>
                    <td>{{ item.programTitle || item.courseTitle || '-' }}</td>
                    <td>{{ formatDateTime(item.date || item.attendanceDate || item.createdAt) }}</td>
                    <td>{{ item.markedBy || '-' }}</td>
                    <td class="text-center">
                      <StatusBadge :status="item.status || item.displayStatus" />
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="empty-state">
                <p>No attendance records found for this selection.</p>
              </div>
            </div>
          </div>

          <!-- Behavior Record Tab -->
          <div v-if="activeTab === 'behavior'" class="detail-section-card full-width">
            <div class="section-header">
              <h3>Behavior Record List</h3>
              <div class="filter-dropdown-container" v-if="registeredPrograms.length > 0">
                <AppButton variant="secondary" :class="{ active: selectedBehaviorProgramId !== 'all' }"
                  @click="toggleProgramFilter('behavior', $event)" @blur="closeProgramFilter">
                  {{ getSelectedProgramLabel('behavior') }}
                </AppButton>
                <Teleport to="body">
                  <transition name="toast-fade">
                    <div v-if="activeDropdown === 'behavior'" :key="'dropdown-behavior'"
                      class="filter-dropdown-menu program-filter-menu scrollable-menu" :style="programMenuStyles"
                      @mousedown.stop>
                      <div class="filter-option" :class="{ active: selectedBehaviorProgramId === 'all' }"
                        @click.stop="selectProgramFilter('behavior', 'all')">
                        All Programs
                      </div>
                      <div v-for="p in getFilterOptions('behavior')" :key="p.id" class="filter-option"
                        :class="{ active: selectedBehaviorProgramId === p.id }"
                        @click.stop="selectProgramFilter('behavior', p.id)">
                        {{ p.title }}
                      </div>
                    </div>
                  </transition>
                </Teleport>
              </div>
            </div>
            <div class="table-container table-scroll-container">
              <table v-if="filteredBehavior.length > 0">
                <thead>
                  <tr>
                    <th width="60">No</th>
                    <th width="240">Program</th>
                    <th width="200">Marked Timestamp</th>
                    <th class="text-center" width="150">Category</th>
                    <th>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in filteredBehavior" :key="item.id || idx">
                    <td class="text-center">{{ idx + 1 }}</td>
                    <td>{{ item.programTitle || item.courseTitle || '-' }}</td>
                    <td>{{ formatDateTime(item.date || item.behaviorDate || item.createdAt) }}</td>
                    <td class="text-center">
                      <StatusBadge :status="item.category || item.status || 'General'" />
                    </td>
                    <td>{{ item.remark || item.note || item.displayStatus || '-' }}</td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="empty-state">
                <p>No behavior records found for this selection.</p>
              </div>
            </div>
          </div>

          <!-- Exam Record Tab -->
          <div v-if="activeTab === 'exam'" class="detail-section-card full-width">
            <div class="section-header">
              <h3>Exam Record List</h3>
              <div class="filter-dropdown-container" v-if="registeredPrograms.length > 0">
                <AppButton variant="secondary" :class="{ active: selectedExamFilter !== 'all' }"
                  @click="toggleProgramFilter('exam', $event)" @blur="closeProgramFilter">
                  {{ getSelectedProgramLabel('exam') }}
                </AppButton>
                <Teleport to="body">
                  <transition name="toast-fade">
                    <div v-if="activeDropdown === 'exam'" :key="'dropdown-exam'"
                      class="filter-dropdown-menu program-filter-menu scrollable-menu" :style="programMenuStyles"
                      @mousedown.stop>
                      <div v-for="p in getFilterOptions('exam')" :key="p.id" class="filter-option"
                        :class="{ active: selectedExamFilter === p.id }"
                        @click.stop="selectProgramFilter('exam', p.id)">
                        {{ p.title }}
                      </div>
                    </div>
                  </transition>
                </Teleport>
              </div>
            </div>
            <div class="table-container table-scroll-container">
              <table v-if="filteredExams.length > 0">
                <thead>
                  <tr>
                    <th width="60">No</th>
                    <th width="240">Program</th>
                    <th class="text-center" width="150">Exam Date</th>
                    <th width="200">Examiner</th>
                    <th class="text-center" width="100">Score</th>
                    <th class="text-center" width="120">Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in filteredExams" :key="item.id || idx">
                    <td class="text-center">{{ idx + 1 }}</td>
                    <td>{{ item.programTitle || item.courseTitle || '-' }}</td>
                    <td class="text-center">{{ formatDateOnly(item.date || item.examDate) }}</td>
                    <td>{{ item.examiner || '-' }}</td>
                    <td class="text-center"><strong>{{ item.score || '-' }}</strong></td>
                    <td class="text-center">
                      <StatusBadge :status="item.score >= 50 ? 'Passed' : 'Failed'" />
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="empty-state">
                <p>No exam records found for this selection.</p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #right-content v-if="student">
        <DetailedSummaryCard title="Basic Information" subtitle="Student Information">
          <template #outside>
            <div class="profile-header">
              <div class="profile-preview">
                <img :src="student?.profileURL || getImageUrl('profiles/avatar-student')" alt="Student Profile" />
              </div>
            </div>
          </template>

          <div class="scrollable-info-body">
            <div class="detail-info-group">
              <div class="info-item vertical">
                <span class="info-label">FULLNAME:</span>
                <strong>{{ student?.fullName || student?.name || 'Unknown' }}</strong>
              </div>
              <div class="info-item vertical">
                <span class="info-label">DATE OF BIRTH:</span>
                <strong>{{ formatDateOnly(student?.dob || student?.DoB) || '-' }}</strong>
              </div>
              <div class="info-item vertical">
                <span class="info-label">AGE:</span>
                <strong>{{ calculateAge(student?.dob || student?.DoB) || '-' }}</strong>
              </div>
              <div class="info-item vertical">
                <span class="info-label">MEDICAL NOTE:</span>
                <strong>{{ student?.medicalNote || 'None' }}</strong>
              </div>
              <div class="info-item vertical">
                <span class="info-label">STATUS:</span>
                <StatusBadge :status="computedStatus" />
              </div>
              <div class="info-item vertical" v-if="student?.overrideReason">
                <span class="info-label">OVERRIDE REASON:</span>
                <strong style="color: #ef4444">{{ student?.overrideReason }}</strong>
              </div>
              <div class="info-item vertical" v-if="student?.overrideRemark">
                <span class="info-label">OVERRIDE REMARK:</span>
                <strong>{{ student?.overrideRemark }}</strong>
              </div>
            </div>

            <div class="timestamp-group" style="margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
              <div class="timestamp-item">
                <StatusBadge status="Joined At" />
                <p>{{ formatDate(student?.createdAt) }}</p>
              </div>
              <div class="timestamp-item">
                <StatusBadge status="Updated At" />
                <p>{{ formatDate(student?.updatedAt || student?.createdAt) }}</p>
              </div>
            </div>
          </div>
        </DetailedSummaryCard>

        <DetailedSummaryCard subtitle="Relationships">
          <div class="relationships-list scrollable-info-body">
            <div class="relationship-category ">
              <span class="category-title">Parent</span>
              <div class="relationship-item" v-if="primaryParent">
                <img :src="primaryParent.profileURL || getImageUrl('profiles/avatar-parent')" alt="Parent Avatar"
                  class="small-avatar" />
                <div class="child-info">
                  <strong>{{
                    primaryParent.name ||
                    'Parent Name'
                    }}</strong>
                </div>
              </div>
              <div v-else class="empty-relation-box">
                <!-- <p>No parent mapped.</p> -->
              </div>
            </div>
            <div class="relationship-category" style="margin-top: 5px">
              <span class="category-title">Guardian</span>
              <div class="relationship-item" v-if="primaryGuardian">
                <img :src="primaryGuardian.profileURL || getImageUrl('profiles/avatar-guardian')" alt="Guardian Avatar"
                  class="small-avatar" />
                <div class="child-info">
                  <strong>{{
                    primaryGuardian.name ||
                    primaryGuardian.fullName ||
                    primaryGuardian.fullname ||
                    primaryGuardian.displayName ||
                    primaryGuardian.email ||
                    'Guardian Name'
                    }}</strong>
                </div>
              </div>
              <div v-else class="empty-relation-box">
                <!-- <p>No guardian mapped.</p> -->
              </div>
            </div>
          </div>
        </DetailedSummaryCard>
      </template>
    </DetailPageLayout>

    <StudentActionModal :isOpen="actionModal.isOpen" :type="actionModal.type" :student="actionModal.student"
      :enrollment="actionModal.enrollment" :loading="submitting" :error="globalError" :success="globalSuccess"
      @close="actionModal.isOpen = false" @submit="submitActionModal" />
  </DashboardLayout>
</template>

<style scoped>
@import '@/assets/styles/detail-view.css';
</style>
