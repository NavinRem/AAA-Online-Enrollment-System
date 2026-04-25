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
  return p ? p.name : 'All Programs'
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
    academicStatus: currentFilter.value === 'all' ? null : currentFilter.value,
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
    <DetailPageLayout :loading="loading" :errorMessage="errorMessage" backRoute="/students" title="Student Profile">
      <template #header-actions v-if="student">
        <div class="flex items-center gap-3">
          <AppButton variant="secondary" class="rounded-xl border-outline-std bg-white/50 backdrop-blur-sm"
            @click="openActionModal('edit')" :disabled="isParentInactive || isArchived">
            <img :src="getActionIcon('edit')" class="w-4 h-4 opacity-70" />
            <span class="font-bold">Edit Profile</span>
          </AppButton>
          <AppButton variant="secondary" class="rounded-xl border-outline-std bg-white/50 backdrop-blur-sm"
            @click="openActionModal('override')" :disabled="isParentInactive || isArchived">
            <img :src="getActionIcon('quick-action')" class="w-4 h-4 opacity-70" />
            <span class="font-bold">Status</span>
          </AppButton>
          <div class="w-px h-6 bg-outline-std mx-1"></div>
          <AppButton variant="danger" class="rounded-xl shadow-lg shadow-error/10" @click="openActionModal('delete')"
            :disabled="isParentInactive || isArchived">
            <img :src="getActionIcon('delete')" class="w-4 h-4 invert" />
            <span class="font-black">Delete</span>
          </AppButton>
        </div>
      </template>

      <template #left-content v-if="student">
        <!-- Identity Header Card -->
        <div
          class="mb-8 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white to-surface-subtle border border-white p-8 shadow-sm">
          <div class="absolute top-0 right-0 p-8">
            <AppBadge :status="student.status || 'Inactive'" />
          </div>
          <div class="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            <div class="relative group">
              <div
                class="w-32 h-32 rounded-3xl overflow-hidden ring-4 ring-primary/5 shadow-xl transition-transform duration-500 group-hover:scale-105">
                <img :src="student.profileURL" class="w-full h-full object-cover" />
              </div>
            </div>
            <div class="flex flex-col items-center md:items-start text-center md:text-left">
              <h1 class="text-4xl font-black text-content-dark tracking-tight mb-2">{{ student.name }}</h1>
              <div class="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                <span
                  class="px-3 py-1 rounded-lg bg-primary/5 text-primary text-xs font-black uppercase tracking-widest">{{
                    student.id.slice(-8) }}</span>
                <span class="w-1 h-1 rounded-full bg-content-muted/30"></span>
                <span class="text-sm font-bold text-content-muted">{{ calculateAge(student.dob) }} Years Old</span>
                <span class="w-1 h-1 rounded-full bg-content-muted/30"></span>
                <span class="text-sm font-bold text-content-muted">{{ formatDateOnly(student.dob) }}</span>
              </div>

              <!-- Parent Info Shortcut -->
              <div v-if="parent"
                class="flex items-center gap-3 p-3 rounded-2xl bg-white border border-outline-std shadow-sm group cursor-pointer hover:border-primary/30 transition-colors"
                @click="router.push(`/parents/${parent.id}`)">
                <div class="w-8 h-8 rounded-lg overflow-hidden ring-2 ring-primary/5">
                  <img :src="parent.profileURL" class="w-full h-full object-cover" />
                </div>
                <div class="flex flex-col">
                  <span
                    class="text-[10px] font-black text-content-muted uppercase tracking-tighter leading-none mb-1">Primary
                    Parent</span>
                  <span class="text-xs font-black text-content-dark group-hover:text-primary transition-colors">{{
                    parent.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Metrics Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div v-for="stat in studentStats" :key="stat.label"
            class="bg-white rounded-2xl p-6 border border-outline-std shadow-sm hover:shadow-md transition-all duration-300 group">
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-xl flex items-center justify-center bg-surface-subtle group-hover:bg-primary/5 transition-colors">
                <img :src="stat.image" class="w-6 h-6 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div class="flex flex-col">
                <span class="text-[10px] font-black text-content-muted uppercase tracking-widest leading-none mb-1">{{
                  stat.label }}</span>
                <span class="text-xl font-black text-content-dark tracking-tight">{{ stat.value }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab Interface -->
        <div class="bg-white rounded-[2.5rem] border border-outline-std shadow-sm overflow-hidden min-h-[600px]">
          <div class="flex items-center gap-2 p-3 bg-surface-subtle/30 border-b border-outline-std">
            <button v-for="tab in ['academic', 'attendance', 'behavior', 'exam']" :key="tab"
              class="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300"
              :class="activeTab === tab ? 'bg-white text-primary shadow-sm ring-1 ring-black/5' : 'text-content-muted hover:text-content-dark hover:bg-white/50'"
              @click="activeTab = tab">
              {{ tab }}
            </button>
          </div>

          <div class="p-8">
            <div class="flex items-center justify-between mb-8">
              <h3 class="text-2xl font-black text-content-dark tracking-tight capitalize">{{ activeTab }} Repository
              </h3>

              <!-- Refined Filters -->
              <div v-if="activeTab !== 'academic' && registeredPrograms.length > 0" class="relative">
                <button
                  class="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-outline-std bg-white text-xs font-bold text-content-dark hover:border-primary/30 transition-all shadow-sm"
                  @click="toggleProgramFilter(activeTab, $event)" @blur="closeProgramFilter">
                  <span class="opacity-50 font-black uppercase tracking-tighter">Filtering:</span>
                  <span>{{ getSelectedProgramLabel(activeTab) }}</span>
                  <span class="ml-1 opacity-30">▼</span>
                </button>
              </div>
            </div>

            <!-- Content Area -->
            <transition name="fade-up" mode="out-in">
              <div :key="activeTab">
                <!-- Academic View -->
                <div v-if="activeTab === 'academic'">
                  <div v-if="filteredAcademic.length > 0" class="grid gap-4">
                    <div v-for="(item, idx) in filteredAcademic" :key="item.id || idx"
                      class="flex items-center p-6 rounded-3xl border border-outline-std bg-white hover:border-primary/20 transition-all group">
                      <div
                        class="w-10 h-10 rounded-xl bg-surface-subtle flex items-center justify-center font-black text-content-muted/30 text-xs mr-6">
                        {{ idx + 1 }}
                      </div>
                      <div class="flex-1 flex flex-col">
                        <span
                          class="text-base font-black text-content-dark group-hover:text-primary transition-colors tracking-tight">{{
                            item.program?.name || '-' }}</span>
                        <span class="text-[10px] font-black text-content-muted uppercase tracking-widest">Enrolled on {{
                          formatDateOnly(item.enrollAt || item.createdAt) }}</span>
                      </div>
                      <div class="flex-1 hidden md:flex flex-col items-center">
                        <span class="text-[10px] font-black text-content-muted uppercase tracking-tighter mb-1">Academic
                          Cycle</span>
                        <AppBadge :status="item.termName || '—'" type="blue" />
                      </div>
                      <div class="flex-1 hidden lg:flex flex-col items-center">
                        <span
                          class="text-[10px] font-black text-content-muted uppercase tracking-tighter mb-1">Schedule</span>
                        <div class="flex items-center gap-2">
                          <span
                            class="px-2 py-0.5 rounded-md bg-surface-subtle text-[10px] font-black text-content-dark border border-outline-std">{{
                            item.class?.day || 'N/A' }}</span>
                          <span class="text-[10px] font-bold text-content-muted">{{ item.class?.timeslot || 'TBD'
                            }}</span>
                        </div>
                      </div>
                      <div class="w-32 flex justify-center">
                        <AppBadge :status="getAcademicStatus(item)" />
                      </div>
                    </div>
                  </div>
                  <div v-else class="flex flex-col items-center justify-center py-24 opacity-30">
                    <img :src="getImageUrl('common/no-data')" class="w-24 mb-4 grayscale" />
                    <span class="text-sm font-black uppercase tracking-widest">No Academic History Found</span>
                  </div>
                </div>

                <!-- Attendance View -->
                <div v-if="activeTab === 'attendance'">
                  <div v-if="filteredAttendance.length > 0"
                    class="overflow-hidden rounded-3xl border border-outline-std">
                    <table class="w-full text-left">
                      <thead class="bg-surface-subtle/50">
                        <tr>
                          <th class="px-6 py-4 text-[10px] font-black text-content-muted uppercase tracking-widest">No
                          </th>
                          <th class="px-6 py-4 text-[10px] font-black text-content-muted uppercase tracking-widest">
                            Course</th>
                          <th class="px-6 py-4 text-[10px] font-black text-content-muted uppercase tracking-widest">
                            Session Date</th>
                          <th
                            class="px-6 py-4 text-[10px] font-black text-content-muted uppercase tracking-widest text-center">
                            Outcome</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-outline-std">
                        <tr v-for="(item, idx) in filteredAttendance" :key="item.id || idx"
                          class="hover:bg-surface-subtle/20 transition-colors">
                          <td class="px-6 py-5 text-xs font-black text-content-muted/30 tabular-nums">{{ idx + 1 }}</td>
                          <td class="px-6 py-5 font-bold text-content-dark text-sm">{{ item.programName }}</td>
                          <td class="px-6 py-5">
                            <div class="flex flex-col">
                              <span class="text-xs font-black text-content-dark uppercase tracking-tight">{{
                                formatDateOnly(item.date || item.attendanceDate) }}</span>
                              <span
                                class="text-[10px] font-bold text-content-muted uppercase tabular-nums opacity-60">Session
                                Check-in</span>
                            </div>
                          </td>
                          <td class="px-6 py-5 text-center">
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
                        <td class="font-bold text-content-dark">{{ item.programName || '-' }}</td>
                        <td>
                          <span class="text-xs font-black text-content-muted tracking-tight">{{
                            formatDateTime(item.date || item.behaviorDate || item.createdAt)
                            }}</span>
                        </td>
                        <td class="text-center">
                          <AppBadge :status="item.category || item.status || 'General'" />
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
                        <td class="font-bold text-content-dark">{{ item.programName || '-' }}</td>
                        <td class="text-center font-black text-content-muted/70 text-xs">
                          {{ formatDateOnly(item.date || item.examDate) }}
                        </td>
                        <td class="text-xs font-bold text-content-muted">{{ item.examiner || '-' }}</td>
                        <td class="text-center font-black text-lg text-primary tracking-tighter">
                          {{ item.score || '-' }}
                        </td>
                        <td class="text-center">
                          <AppBadge :status="item.score >= 50 ? 'Passed' : 'Failed'" />
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
            </transition>
          </div>
        </div>
      </template>

      <template #right-content v-if="student">
        <!-- Student Identity Card -->
        <div class="ui-detail-card flex flex-col items-center text-center p-0 overflow-hidden">
          <div class="w-full h-32 bg-gradient-to-br from-primary to-magenta opacity-10"></div>
          <div class="relative -mt-16 mb-md">
            <div class="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden">
              <img :src="student?.profileURL || getImageUrl('profiles/avatar-student')" alt="Student Profile"
                class="w-full h-full object-cover" />
            </div>
            <div class="absolute bottom-1 right-1">
              <AppBadge :status="computedStatus" :showLabel="false" />
            </div>
          </div>

          <div class="px-xl pb-xl flex flex-col items-center">
            <h2 class="text-2xl font-black text-content-dark tracking-tighter mb-xs">
              {{ student?.name }}
            </h2>
            <AppBadge :status="computedStatus" />

            <div class="w-full h-px bg-surface-light my-xl"></div>

            <div class="ui-data-list w-full grid-cols-1 gap-y-lg">
              <div class="ui-data-item">
                <span class="ui-data-label text-left">Date of Birth</span>
                <span class="ui-data-value text-left flex items-center justify-between">
                  {{ formatDateOnly(student?.dob) || '—' }}
                  <AppBadge :status="'Age: ' + (calculateAge(student?.dob) || '—')" type="blue" />
                </span>
              </div>
              <div class="ui-data-item">
                <span class="ui-data-label text-left">Internal Status</span>
                <span class="ui-data-value text-left text-content-muted text-xs font-medium">
                  {{ student?.archived ? 'Archived Record' : 'Active Account' }}
                </span>
              </div>
            </div>

            <div v-if="student?.overrideReason"
              class="mt-xl p-md bg-warning/5 border border-warning/10 rounded-sm w-full text-left">
              <div class="flex items-center gap-xs mb-xs">
                <img :src="getActionIcon('quick-action')" class="w-4.5 h-4.5 opacity-60" />
                <span class="text-3xs font-black uppercase text-warning tracking-widest">Manual Override</span>
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
          <div v-if="student?.parentInfo || student?.parentId"
            class="group flex items-center gap-md p-md rounded-sm bg-surface-light cursor-pointer transition-all hover:bg-white hover:shadow-md hover:ring-2 hover:ring-primary/20"
            @click="router.push(`/parents/${student?.parentId}`)">
            <div class="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-border">
              <img :src="student?.parentInfo?.profileURL || getImageUrl('profiles/avatar-parent')" alt="Parent Profile"
                class="w-full h-full object-cover" />
            </div>
            <div class="flex flex-col">
              <span
                class="font-black text-content-dark tracking-tighter group-hover:text-primary transition-colors text-base">{{
                  student?.parentInfo?.name || student?.parentName || 'Parent Name' }}</span>
              <span class="text-2xs text-content-muted uppercase font-bold tracking-widest">Legal Guardian</span>
            </div>
          </div>
          <div v-else
            class="p-xl text-center border-2 border-dashed border-surface-light rounded-sm opacity-30 text-xs font-bold italic">
            No relationships linked.
          </div>
        </div>

        <!-- Timestamps -->
        <div class="flex flex-col gap-sm mt-lg px-md opacity-40">
          <div class="flex items-center justify-between text-3xs font-black uppercase tracking-tighter">
            <span>Joined Portal</span>
            <span class="text-content-dark">{{ formatDate(student?.createdAt) }}</span>
          </div>
          <div class="flex items-center justify-between text-3xs font-black uppercase tracking-tighter">
            <span>Last Profile Update</span>
            <span class="text-content-dark">{{
              formatDate(student?.updatedAt || student?.createdAt)
              }}</span>
          </div>
        </div>
      </template>
    </DetailPageLayout>

    <StudentActionModal :isOpen="actionModal.isOpen" :type="actionModal.type" :student="actionModal.student"
      :enrollment="actionModal.enrollment" :loading="submitting" :error="globalError" :success="globalSuccess"
      :branches="branches" @close="actionModal.isOpen = false" @submit="submitActionModal" />
  </DashboardLayout>
</template>
