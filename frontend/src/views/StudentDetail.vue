<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import TableToolbar from '@/components/common/data/TableToolbar.vue'
import DetailedSummaryCard from '@/components/common/cards/DetailedSummaryCard.vue'
import { studentService } from '@/services/studentService'
import { parentService } from '@/services/parentService'
import { enrollmentService } from '@/services/enrollmentService'
import { programService } from '@/services/programService'
import { classService } from '@/services/classService'
import { trackingService } from '@/services/trackingService'
import { formatDate, formatDateOnly, calculateAge } from '@/utils/formatUtils'
import { filterDetailEnrollments, getAcademicStatus, enrichEnrollments } from '@/utils/enrollmentHelper'
import { getStatusTheme, getStatusFilter, getStatusUI } from '@/utils/badgeUtils'
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
  return student.value?.status || 'Inactive'
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
const hoveredOption = ref(null)

const toggleProgramFilter = (tab, event) => {
  if (activeDropdown.value === tab) {
    activeDropdown.value = null
    return
  }

  activeDropdown.value = tab
  const rect = event.currentTarget.getBoundingClientRect()
  programMenuStyles.value = {
    top: `${rect.bottom + window.scrollY + 8}px`,
    right: `${window.innerWidth - rect.right - window.scrollX}px`,
    minWidth: '180px',
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
  if (tab === 'academic') academicFilter.value = id
  else if (tab === 'attendance') attendanceFilter.value = id
  else if (tab === 'behavior') behaviorFilter.value = id
  else if (tab === 'exam') examFilter.value = id
  activeDropdown.value = null
}

const getSelectedProgramLabel = (tab) => {
  const val = getActiveFilterValue(tab)
  if (val === 'all') {
    return tab === 'exam' ? 'All Exams' : (tab === 'academic' ? 'All Status' : 'Filter')
  }
  return val
}

const activeTab = ref('academic')
const academicFilter = ref('all')
const attendanceFilter = ref('all')
const behaviorFilter = ref('all')
const examFilter = ref('all')
const searchQuery = ref('')

const isFilterActive = computed(() => {
  if (activeTab.value === 'academic') return academicFilter.value !== 'all'
  if (activeTab.value === 'attendance') return attendanceFilter.value !== 'all'
  if (activeTab.value === 'behavior') return behaviorFilter.value !== 'all'
  if (activeTab.value === 'exam') return examFilter.value !== 'all'
  return false
})

const getActiveFilterValue = (tab) => {
  if (tab === 'academic') return academicFilter.value
  if (tab === 'attendance') return attendanceFilter.value
  if (tab === 'behavior') return behaviorFilter.value
  if (tab === 'exam') return examFilter.value
  return 'all'
}

const filterThemeStyles = computed(() => {
  const val = getActiveFilterValue(activeTab.value)
  if (val === 'all') return {}
  const theme = getStatusTheme(val)
  return {
    backgroundColor: theme.backgroundColor || 'var(--color-primary-soft)',
    color: theme.color || 'var(--color-primary)'
  }
})

const registeredPrograms = computed(() => {
  if (!enrollments.value.length) return []
  return enrollments.value
    .map((e) => ({
      id: e.programId,
      name: e.programName || 'Unknown Program',
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
      delete updatePayload.updatedAt
      delete updatePayload.createdAt
      await studentService.updateStudent(sid, updatePayload)
      globalSuccess.value = 'Student profile updated!'
    } else if (type === 'override') {
      const isStopping = formData.status === 'Stopped'
      await studentService.updateStudent(sid, {
        status: formData.status,
        overrideReason: formData.overrideReason,
        overrideRemark: formData.overrideRemark,
        archived: isStopping,
      })

      if (isStopping && student.value?.parentId) {
        try {
          await parentService.updateParent(student.value.parentId, { status: 'Inactive' })
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
          activeEnrollments.map((e) =>
            enrollmentService.updateEnrollment(e.id, {
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
      await studentService.deleteStudent(sid)
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
    academicStatus: academicFilter.value === 'all' ? null : academicFilter.value,
  })

  return result
    .filter((r) =>
      searchQuery.value
        ? (r.programName || '').toLowerCase().includes(searchQuery.value.toLowerCase())
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
  if (attendanceFilter.value !== 'all') {
    result = result.filter((a) => (a.status || 'Present').toLowerCase() === attendanceFilter.value.toLowerCase())
  }
  return result.sort(
    (a, b) =>
      new Date(b.date || b.attendanceDate || b.createdAt) -
      new Date(a.date || a.attendanceDate || a.createdAt),
  )
})

const filteredBehavior = computed(() => {
  let result = progressData.value?.behaviorLogs || []
  if (behaviorFilter.value !== 'all') {
    result = result.filter((b) => (b.category || b.status || 'General').toLowerCase() === behaviorFilter.value.toLowerCase())
  }
  return result.sort(
    (a, b) =>
      new Date(b.date || b.behaviorDate || b.createdAt) -
      new Date(a.date || a.behaviorDate || a.createdAt),
  )
})

const filteredExams = computed(() => {
  let result = progressData.value?.examRecords || progressData.value?.examLogs || []
  const filter = examFilter.value

  if (filter !== 'all') {
    if (filter === 'Passed') {
      result = result.filter((e) => Number(e.score || 0) >= 50)
    } else if (filter === 'Failed') {
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
      studentService.getStudent(id),
      branchService.getAllBranches(),
    ])
    if (!studentData) throw new Error('Student not found')
    student.value = studentData
    branches.value = branchData || []
    const pId = studentData.parentId
    if (pId) {
      try {
        parent.value = await parentService.getParent(pId)
      } catch (e) {
        console.warn('Could not fetch parent context silently', e)
      }
    }
    const [allEnrollments, allPrograms, allParents, allStudents, allClasses] = await Promise.all([
      enrollmentService.getAllEnrollments(),
      programService.getAllPrograms(),
      parentService.getAllParents(),
      studentService.getAllStudents(),
      classService.getAllClasses(),
    ])

    const sid = String(id)
    const rawEnrollments = (allEnrollments || []).filter((r) => String(r.studentId || '') === sid)

    enrollments.value = enrichEnrollments(
      rawEnrollments,
      allParents,
      allStudents,
      allPrograms,
      allClasses,
    )
    try {
      const [attendance, progress] = await Promise.all([
        trackingService.getAttendanceHistory(id),
        trackingService.getStudentProgress(id),
      ])
      attendanceHistory.value = attendance || []
      if (progress) {
        progressData.value = progress
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
    <DetailPageLayout :loading="loading" :errorMessage="errorMessage" backRoute="/students" title="Student Profile"
      sidebarWidth="sm">
      <template #header-actions v-if="student">
        <div class="flex items-center gap-3">
          <button v-if="!isArchived && !isParentInactive"
            class="w-11 h-11 flex items-center justify-center rounded-full border transition-all duration-300 bg-primary-light hover:bg-primary hover:border-primary group"
            title="Edit Profile" @click="openActionModal('edit')">
            <img :src="getActionIcon('edit')" class="w-5 h-5 group-hover:opacity-100" />
          </button>
          <button v-if="!isArchived && !isParentInactive"
            class="w-11 h-11 flex items-center justify-center rounded-full border transition-all duration-300 bg-primary-light hover:bg-purple hover:border-purple group"
            title="Update Status" @click="openActionModal('override')">
            <img :src="getActionIcon('edit')" class="w-5 h-5 group-hover:opacity-100" />
          </button>
          <div class="w-px h-6 bg-outline-std mx-1"></div>
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border bg-error-soft transition-all duration-300 hover:bg-error hover:border-error group"
            title="Delete Student" @click="openActionModal('delete')">
            <img :src="getActionIcon('delete')" class="w-5 h-5 icon-danger group-hover:opacity-100" />
          </button>
        </div>
      </template>

      <template #left-content v-if="student">
        <!-- Metrics Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="stat in studentStats" :key="stat.label"
            class="bg-white rounded-md p-6 border border-outline-std shadow-sm hover:shadow-md transition-all duration-300 group">
            <div class="flex items-center gap-4">
              <div
                class="rounded-xl flex items-center justify-center bg-surface-subtle group-hover:bg-primary/5 transition-colors">
                <img :src="stat.image" class="w-10 h-10 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div class="flex flex-col">
                <span class="text-[10px] font-black text-content-muted uppercase tracking-widest leading-none mb-1">{{
                  stat.label }}</span>
                <span class="text-xl font-black text-content-dark tracking-tight">{{ stat.value }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="flex items-center gap-2 p-2 bg-white rounded-full border border-outline-std w-fit">
          <button v-for="tab in ['academic', 'attendance', 'behavior', 'exam']" :key="tab"
            class="px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300"
            :class="activeTab === tab ? 'bg-primary text-white shadow-md ring-1 ring-black/5 scale-[1.02]' : 'text-content-muted hover:text-content-dark hover:bg-white/50'"
            @click="activeTab = tab">
            {{ tab }}
          </button>
        </div>

        <section class="ui-detail-card overflow-hidden animate-fade-in min-h-[500px]">
          <div class="flex items-center gap-4">
            <h3 class="text-lg font-black text-content-dark whitespace-nowrap capitalize">{{ activeTab }} Table
            </h3>
            <div class="h-px flex-1 bg-gray-100"></div>
            <!-- Refined Filters -->
            <div v-if="true" class="relative">
              <button class="px-4 py-2 text-xs font-black uppercase rounded-lg transition-all flex items-center gap-2"
                :class="!isFilterActive ? 'bg-primary-light hover:bg-primary' : ''"
                :style="isFilterActive ? filterThemeStyles : {}" @click="toggleProgramFilter(activeTab, $event)">
                <img :src="getActionIcon('filter')" class="w-3 h-3"
                  :style="{ filter: getStatusFilter(isFilterActive ? getActiveFilterValue(activeTab) : 'filter') }" />
                {{ isFilterActive ? getSelectedProgramLabel(activeTab) : 'Filter' }}
              </button>

              <Teleport to="body">
                <transition enter-active-class="transition duration-200 ease-out"
                  enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
                  leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100"
                  leave-to-class="opacity-0">
                  <div v-if="activeDropdown === activeTab"
                    class="fixed bg-white rounded-xl shadow-2xl border border-outline-std z-[9999] p-2 min-w-[180px] overflow-hidden"
                    :style="programMenuStyles" @mousedown.stop>
                    <div v-for="option in filterOptions"
                      :key="option.id || option.value"
                      class="px-4 py-2.5 text-sm font-bold cursor-pointer transition-all rounded-lg flex items-center justify-between group"
                      :class="[
                        getActiveFilterValue(activeTab) === (option.id || option.value) ? 'shadow-sm' : '',
                        getActiveFilterValue(activeTab) === (option.id || option.value) ? '' : 'text-content-muted'
                      ]" :style="getActiveFilterValue(activeTab) === (option.id || option.value) || hoveredOption === (option.id || option.value) ? {
                        backgroundColor: getStatusTheme(option.id || option.value).backgroundColor,
                        color: getStatusTheme(option.id || option.value).color,
                        transform: hoveredOption === (option.id || option.value) ? 'translateX(4px)' : ''
                      } : {}" @click="selectProgramFilter(activeTab, option.id || option.value)"
                      @mouseenter="hoveredOption = (option.id || option.value)" @mouseleave="hoveredOption = null">
                      <span>{{ option.name || option.title || option.label }}</span>
                      <div v-if="(option.id || option.value) !== 'all'"
                        class="w-2 h-2 rounded-full transition-transform group-hover:scale-125"
                        :style="{ backgroundColor: getStatusTheme(option.id || option.value).color }"></div>
                    </div>
                  </div>
                </transition>
              </Teleport>
            </div>
          </div>

          <!-- Content Area -->
          <transition name="fade-up" mode="out-in">
            <div :key="activeTab">
              <!-- Academic View -->
              <div v-if="activeTab === 'academic'">
                <div v-if="filteredAcademic.length > 0"
                  class="overflow-x-auto rounded-md border border-gray-100 bg-white">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-gray-50/50">
                        <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest">No</th>
                        <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest">Program</th>
                        <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest">Enrolled Date
                        </th>
                        <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest text-center">
                          Status</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
                      <tr v-for="(item, idx) in filteredAcademic" :key="item.id || idx"
                        class="hover:bg-gray-50/50 transition-colors">
                        <td class=" p-md text-xs font-bold text-content-muted">{{ idx + 1 }}</td>
                        <td class=" p-md">
                          <div class="flex flex-col">
                            <span class="text-sm font-bold text-content-dark">{{ item.program?.name || '-' }}</span>
                            <span class="text-xs font-bold text-content-muted">{{ item.class?.day || 'N/A' }} | {{
                              item.class?.timeslot || 'TBD' }}</span>
                          </div>
                        </td>
                        <td class=" p-md text-xs font-bold text-content-muted tabular-nums">{{
                          formatDateOnly(item.enrollAt || item.createdAt) }}</td>
                        <td class=" p-md text-center">
                          <AppBadge :status="getAcademicStatus(item)" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="flex flex-col items-center justify-center py-24 opacity-30">
                  <img :src="getImageUrl('common/no-data')" class="w-24 mb-4 grayscale" />
                  <span class="text-sm font-black uppercase tracking-widest">No Academic History Found</span>
                </div>
              </div>

              <!-- Attendance View -->
              <div v-if="activeTab === 'attendance'">
                <div v-if="filteredAttendance.length > 0"
                  class="overflow-x-auto rounded-md border border-gray-100 bg-white">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-gray-50/50">
                        <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest">No</th>
                        <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest">Course</th>
                        <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest">Session Date
                        </th>
                        <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest text-center">
                          Outcome</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
                      <tr v-for="(item, idx) in filteredAttendance" :key="item.id || idx"
                        class="hover:bg-gray-50/50 transition-colors">
                        <td class=" p-md text-xs font-bold text-content-muted">{{ idx + 1 }}</td>
                        <td class=" p-md font-bold text-content-dark text-sm">{{ item.programName }}</td>
                        <td class=" p-md text-xs font-bold text-content-muted tabular-nums">{{ formatDateOnly(item.date
                          || item.attendanceDate) }}</td>
                        <td class=" p-md text-center">
                          <AppBadge :status="item.status || 'Present'" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="flex flex-col items-center justify-center py-24 opacity-30">
                  <img :src="getImageUrl('common/no-data')" class="w-24 mb-4 grayscale" />
                  <span class="text-sm font-black uppercase tracking-widest">No Attendance Logs</span>
                </div>
              </div>

              <!-- Behavior Content -->
              <div v-if="activeTab === 'behavior'">
                <div v-if="filteredBehavior.length > 0"
                  class="overflow-x-auto rounded-md border border-gray-100 bg-white">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-gray-50/50">
                        <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest">No</th>
                        <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest">Program</th>
                        <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest">Date</th>
                        <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest text-center">
                          Result</th>
                        <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest">Remark</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
                      <tr v-for="(item, idx) in filteredBehavior" :key="item.id || idx"
                        class="hover:bg-gray-50/50 transition-colors">
                        <td class=" p-md text-xs font-bold text-content-muted">{{ idx + 1 }}</td>
                        <td class=" p-md font-bold text-content-dark text-sm">{{ item.programName || '-' }}</td>
                        <td class=" p-md text-xs font-bold text-content-muted tabular-nums">{{ formatDateTime(item.date
                          || item.behaviorDate || item.createdAt) }}</td>
                        <td class=" p-md text-center">
                          <AppBadge :status="item.category || item.status || 'General'" />
                        </td>
                        <td class=" p-md text-xs text-content-muted font-bold">
                          {{ item.remark || item.note || item.displayStatus || '-' }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="flex flex-col items-center justify-center p-20 gap-md opacity-40">
                  <img :src="getImageUrl('common/no-data')" class="w-20" />
                  <p class="text-sm font-bold">No behavior logs found.</p>
                </div>
              </div>

              <!-- Exam Content -->
              <div v-if="activeTab === 'exam'">
                <div v-if="filteredExams.length > 0" class="overflow-x-auto rounded-md border border-gray-100 bg-white">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-gray-50/50">
                        <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest">No</th>
                        <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest">Program</th>
                        <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest">Date</th>
                        <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest">Examiner</th>
                        <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest text-center">
                          Score</th>
                        <th class=" p-md text-xs font-black text-content-muted uppercase tracking-widest text-center">
                          Status</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
                      <tr v-for="(item, idx) in filteredExams" :key="item.id || idx"
                        class="hover:bg-gray-50/50 transition-colors">
                        <td class=" p-md text-xs font-bold text-content-muted">{{ idx + 1 }}</td>
                        <td class=" p-md font-bold text-content-dark text-sm">{{ item.programName || '-' }}</td>
                        <td class=" p-md text-xs font-bold text-content-muted tabular-nums">{{ formatDateOnly(item.date
                          || item.examDate) }}</td>
                        <td class=" p-md text-xs font-bold text-content-muted">{{ item.examiner || '-' }}</td>
                        <td class=" p-md text-center font-black text-primary">{{ item.score || '-' }}</td>
                        <td class=" p-md text-center">
                          <AppBadge :status="item.score >= 50 ? 'Passed' : 'Failed'" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="flex flex-col items-center justify-center p-20 gap-md opacity-40">
                  <img :src="getImageUrl('common/no-data')" class="w-20" />
                  <p class="text-sm font-bold">No exam records found.</p>
                </div>
              </div>
            </div>
          </transition>
        </section>
      </template>

      <template #right-content v-if="student">
        <div class="flex flex-col gap-8">
          <!-- Basic Info Card -->
          <section class="ui-detail-card flex flex-col items-center gap-6">
            <h2 class="w-full font-black text-content-dark text-center">Basic Information</h2>
            <div class="relative group">
              <div
                class="w-40 h-40 rounded-full overflow-hidden ring-4 ring-white shadow-2xl transition-transform duration-500 group-hover:scale-105 border-2 border-gray-100">
                <img :src="student?.profileURL || getImageUrl('profiles/avatar-student')" alt="Student Profile"
                  class="w-full h-full object-cover" />
              </div>
            </div>
          </section>

          <!-- Student Information Card -->
          <section class="ui-detail-card bg-primary-soft/30 border-primary/10">
            <h6 class="font-black uppercase tracking-widest text-content-muted">Student Information</h6>

            <div class="space-y-5">
              <div class="flex justify-between gap-1">
                <span class="text-lg font-black text-content-dark">Student Name:</span>
                <span class="text-md font-bold text-content-muted">{{ student?.name }}</span>
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-black text-content-dark">Date of Birth:</span>
                <span class="text-md font-bold text-content-muted">{{ formatDateOnly(student?.dob) || '—' }}</span>
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-black text-content-dark">Age:</span>
                <div>
                  <AppBadge :status="(student?.age || '—') + ' years old'" type="blue" />
                </div>
              </div>
              <div class="flex justify-between gap-1">
                <span class="text-lg font-black text-content-dark">Status:</span>
                <div>
                  <AppBadge :status="computedStatus" />
                </div>
              </div>

              <div v-if="student?.overrideReason"
                class="flex flex-col gap-1 mt-4 p-4 bg-warning/5 border border-warning/10 rounded-xl">
                <div class="flex items-center gap-2 mb-2">
                  <img :src="getActionIcon('quick-action')" class="w-4 h-4 opacity-60" />
                  <span class="text-xs font-black uppercase text-warning tracking-widest">Manual Override</span>
                </div>
                <p class="text-sm font-bold text-content-dark mb-1">Reason: {{ student?.overrideReason }}</p>
                <p class="text-xs text-content-muted leading-relaxed italic">{{ student?.overrideRemark }}</p>
              </div>
            </div>
          </section>

          <!-- Relationships Card -->
          <section class="ui-detail-card bg-primary-soft/30 border-primary/10">
            <h6 class="font-black uppercase tracking-widest text-content-muted">Primary Relationships</h6>
            <div class="space-y-4">
              <div v-if="student?.parentInfo || student?.parentId" @click="router.push(`/parents/${student?.parentId}`)"
                class="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-subtle transition-all cursor-pointer group">
                <div class="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm">
                  <img :src="student?.parentInfo?.profileURL || getImageUrl('profiles/avatar-parent')"
                    class="w-full h-full object-cover" />
                </div>
                <span class="text-md font-bold text-content-dark group-hover:text-primary transition-colors">{{
                  student?.parentInfo?.name || student?.parentName || 'Parent Name' }}</span>
                <AppBadge class="ml-auto text-xs px-2 py-0.5">
                  Parent
                </AppBadge>
              </div>
              <div v-else class="text-md font-bold text-content-muted/60 italic text-center p-2">
                No relationships linked.
              </div>
            </div>
          </section>

          <!-- Account Timestamp Card -->
          <section class="ui-detail-card bg-surface-subtle/50">
            <h6 class="font-black uppercase tracking-widest text-content-muted">Account Timestamp</h6>
            <div class="space-y-6">
              <div class="flex items-center gap-3">
                <AppBadge type="green" class="text-md px-2 py-xs">
                  Created At
                </AppBadge>
                <div class="text-sm font-bold text-content-muted leading-tight tabular-nums">
                  {{ formatDate(student?.createdAt) }}
                </div>
              </div>

              <div class="flex items-center gap-3">
                <AppBadge type="blue" class="text-md px-2 py-xs">
                  Updated At
                </AppBadge>
                <div class="text-sm font-bold text-content-muted leading-tight tabular-nums">
                  {{ formatDate(student?.updatedAt || student?.createdAt) }}
                </div>
              </div>
            </div>
          </section>
        </div>
      </template>
    </DetailPageLayout>

    <StudentActionModal :isOpen="actionModal.isOpen" :type="actionModal.type" :student="actionModal.student"
      :enrollment="actionModal.enrollment" :loading="submitting" :error="globalError" :success="globalSuccess"
      :branches="branches" @close="actionModal.isOpen = false" @submit="submitActionModal" />
  </DashboardLayout>
</template>
