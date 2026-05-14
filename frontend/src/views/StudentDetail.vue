<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import DataTable from '@/components/common/data/DataTable.vue'
import { studentService } from '@/services/studentService'
import { parentService } from '@/services/parentService'
import { enrollmentService } from '@/services/enrollmentService'
import { programService } from '@/services/programService'
import { classService } from '@/services/classService'
import {
  formatDateOnly,
  calculateAge,
  generateClassSessions,
} from '@/utils/formatUtils'
import { getAcademicStatus, enrichEnrollments } from '@/utils/enrollmentHelper'
import StudentActionModal from '@/components/students/StudentActionModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'

import { getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { branchService } from '@/services/branchService'
import EntityProfileCard from '@/components/common/detail/EntityProfileCard.vue'
import EntityInfoCard from '@/components/common/detail/EntityInfoCard.vue'
import TimestampCard from '@/components/common/detail/TimestampCard.vue'
import { trackingService } from '@/services/trackingService'

const route = useRoute()
const router = useRouter()

const student = ref(null)
const parent = ref(null)
const enrollments = ref([])
const attendanceHistory = ref([])
const branches = ref([])
const classAttendanceData = ref({}) // classId -> { sessionId -> { studentId -> status } }
const selectedEnrollmentId = ref(null)
const dropdownOpen = ref(false)
const filterMenuStyles = ref({})

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

const inferredGender = computed(() => {
  const url = (student.value?.profileURL || '').toLowerCase()
  if (url.includes('boy')) return 'Male'
  if (url.includes('girl')) return 'Female'
  return student.value?.gender || '-'
})

const enrolledBranch = computed(() => {
  const latest = enrollments.value[0]
  if (!latest)
    return { abbr: student.value?.branchAbbr || 'HQ', color: student.value?.branchColor || 'blue' }
  return {
    abbr: latest.branchAbbr || 'HQ',
    color: latest.branchColor || 'blue',
  }
})

// ──────────────────────────────────────────────
// Tab System
// ──────────────────────────────────────────────
// ──────────────────────────────────────────────
// Enrollment & Attendance System
// ──────────────────────────────────────────────
const enrollmentOptions = computed(() => {
  return enrollments.value.map((e) => ({
    label: `${e.termName} - ${e.programName} (${e.branchAbbr})`,
    value: e.id,
    classId: e.classId,
    term: e.class?.term,
    schedule: e.class?.schedule || e.class?.schedules?.[0],
  }))
})

const selectedEnrollment = computed(() => {
  return enrollments.value.find((e) => e.id === selectedEnrollmentId.value) || enrollments.value[0]
})

const sessions = computed(() => {
  const enrollment = selectedEnrollment.value
  if (!enrollment || !enrollment.class?.term) return []

  const term = enrollment.class.term
  const schedule = enrollment.class.schedule || enrollment.class.schedules?.[0]
  const dayOfWeek = schedule?.day || 'Monday'
  const total = term.totalSessions || 12

  return generateClassSessions(term.startDate, dayOfWeek, total, term.endDate)
})

const studentAttendanceRecords = computed(() => {
  const enrollment = selectedEnrollment.value
  if (!enrollment || !sessions.value.length) return []

  const classId = enrollment.classId
  const attendanceMap = classAttendanceData.value[classId] || {}
  const studentId = student.value?.id

  return sessions.value.map((session) => {
    const sessionData = attendanceMap[session.id] || {}
    const status = sessionData[studentId] || 'N'
    return {
      ...session,
      status,
      remark: '-', // Placeholder for now
    }
  })
})

const attendanceStats = computed(() => {
  const records = studentAttendanceRecords.value
  if (!records.length) return { total: 0, passed: 0, absent: 0, remaining: 0 }

  const total = records.length
  const passed = records.filter((r) => ['P', 'L', 'M'].includes(r.status)).length
  const absent = records.filter((r) => r.status === 'A').length
  const completed = records.filter((r) => r.status !== 'N').length
  const remaining = total - completed

  return { total, passed, absent, remaining }
})

const ATTENDANCE_STATUS = {
  P: { label: 'P', theme: 'bg-success/10 text-success' },
  A: { label: 'A', theme: 'bg-error-soft text-error' },
  M: { label: 'M', theme: 'bg-primary-soft text-primary' },
  L: { label: 'L', theme: 'bg-warning-soft text-warning' },
  N: { label: 'N', theme: 'bg-surface-subtle text-content-muted/40' },
}

const studentInfoFields = computed(() => [
  { label: 'Full Name', value: student.value?.name },
  { label: 'Gender', value: inferredGender.value },
  { label: 'Date of Birth', value: formatDateOnly(student.value?.dob) },
  { label: 'Age', value: student.value?.dob ? `${calculateAge(student.value.dob)} yrs` : '-' },
  {
    label: 'Branch',
    value: enrolledBranch.value.abbr,
    isBadge: true,
    type: enrolledBranch.value.color,
  },
  { label: 'Status', value: student.value?.status || 'Active', isBadge: true },
])

const parentDetailFields = computed(() => [
  {
    label: 'Name',
    value: parent.value?.name,
    image: parent.value?.profileURL || getImageUrl('profiles/avatar-parent'),
  },
  { label: 'Phone', value: parent.value?.phone },
  { label: 'Email', value: parent.value?.email },
])

const toggleDropdown = (event) => {
  dropdownOpen.value = !dropdownOpen.value
  if (dropdownOpen.value && event) {
    const rect = event.currentTarget.getBoundingClientRect()
    filterMenuStyles.value = {
      top: `${rect.bottom + window.scrollY + 8}px`,
      left: `${Math.min(rect.left + window.scrollX, window.innerWidth - 300)}px`,
      minWidth: '280px',
    }
  }
}

const selectEnrollment = (id) => {
  selectedEnrollmentId.value = id
  dropdownOpen.value = false
  const enrollment = enrollments.value.find((e) => e.id === id)
  if (enrollment && !classAttendanceData.value[enrollment.classId]) {
    fetchClassAttendance(enrollment.classId)
  }
}

const fetchClassAttendance = async (classId) => {
  try {
    const { attendanceService } = await import('@/services/attendanceService')
    const attendanceMap = await attendanceService.getClassAttendance(classId)
    classAttendanceData.value[classId] = attendanceMap
  } catch (e) {
    console.error('Failed to fetch attendance for class', classId, e)
  }
}

watch(
  enrollments,
  (newEnrollments) => {
    if (newEnrollments.length > 0 && !selectedEnrollmentId.value) {
      selectedEnrollmentId.value = newEnrollments[0].id
      fetchClassAttendance(newEnrollments[0].classId)
    }
  },
  { immediate: true },
)

const attendanceHeaders = [
  { label: 'No', width: '60px', align: 'center' },
  { label: 'Session' },
  { label: 'Date', width: '200px' },
  { label: 'Outcome', align: 'center', width: '150px' },
  { label: 'Remark' },
  { label: 'Progress', width: '120px', align: 'center' },
]

// ──────────────────────────────────────────────
// Action Modal
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// Data Fetching
// ──────────────────────────────────────────────
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
    const enrollmentData =
      allEnrollments?.data || (Array.isArray(allEnrollments) ? allEnrollments : [])
    const rawEnrollments = enrollmentData.filter((r) => String(r.studentId || '') === sid)

    enrollments.value = enrichEnrollments(
      rawEnrollments,
      allParents,
      allStudents,
      allPrograms,
      allClasses,
    )
    try {
      const attendance = await trackingService.getAttendanceHistory(id)
      attendanceHistory.value = attendance || []
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
      title="Student Profile"
      sidebarWidth="md"
    >
      <template #header-actions v-if="student">
        <div class="flex items-center gap-3">
          <button
            v-if="!isArchived && !isParentInactive"
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std transition-all duration-300 bg-primary-soft hover:bg-primary hover:border-primary group"
            title="Edit Profile"
            @click="openActionModal('edit')"
          >
            <img :src="getActionIcon('edit')" class="w-5 h-5 brightness-0 transition-all" />
          </button>
          <button
            v-if="!isArchived && !isParentInactive"
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std transition-all duration-300 bg-warning-soft hover:bg-warning hover:border-warning group"
            title="Update Status"
            @click="openActionModal('override')"
          >
            <img :src="getActionIcon('view')" class="w-5 h-5 brightness-0 transition-all" />
          </button>
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-error-soft transition-all duration-300 hover:bg-error hover:border-error group"
            title="Delete Student"
            @click="openActionModal('delete')"
          >
            <img :src="getActionIcon('delete')" class="w-5 h-5 brightness-0 transition-all" />
          </button>
        </div>
      </template>

      <template #left-content v-if="student">
        <!-- Table Content Container -->
        <section
          class="overflow-hidden animate-fade-in flex-1 border border-outline-std rounded-[2rem] bg-white shadow-sm flex flex-col min-h-0"
        >
          <DataTable
            title="Attendance Track"
            :headers="attendanceHeaders"
            :items="studentAttendanceRecords"
            :loading="loading"
            entityName="session"
            :flexible="false"
            :hasSearch="false"
            :hasFilter="false"
          >
            <template #toolbar-actions>
              <div class="flex items-center gap-3">
                <div
                  class="flex items-center gap-6 px-6 py-2 bg-surface-subtle rounded-2xl border border-outline-std mr-4"
                >
                  <div class="flex flex-col">
                    <span class="text-3xs font-bold text-content-muted uppercase tracking-wider"
                      >Total</span
                    >
                    <span class="text-lg font-black text-content-dark">{{
                      attendanceStats.total
                    }}</span>
                  </div>
                  <div class="w-px h-8 bg-outline-std/50"></div>
                  <div class="flex flex-col">
                    <span
                      class="text-3xs font-bold text-content-muted uppercase tracking-wider text-success"
                      >Passed</span
                    >
                    <span class="text-lg font-black text-success">{{
                      attendanceStats.passed
                    }}</span>
                  </div>
                  <div class="w-px h-8 bg-outline-std/50"></div>
                  <div class="flex flex-col">
                    <span
                      class="text-3xs font-bold text-content-muted uppercase tracking-wider text-error"
                      >Absent</span
                    >
                    <span class="text-lg font-black text-error">{{ attendanceStats.absent }}</span>
                  </div>
                </div>

                <!-- Enrollment Selector -->
                <div class="relative" id="enrollment-filter-btn">
                  <AppButton
                    variant="secondary"
                    size="md"
                    @click="toggleDropdown($event)"
                    class="!bg-primary !text-white min-w-[240px]"
                  >
                    <img :src="getActionIcon('filter')" class="w-4 h-4 brightness-0 invert" />
                    <span class="font-bold truncate max-w-[200px]">{{
                      selectedEnrollment
                        ? `${selectedEnrollment.programName} (${selectedEnrollment.termName})`
                        : 'Select Enrollment'
                    }}</span>
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
                        v-if="dropdownOpen"
                        class="toolbar-filter-menu shadow-2xl"
                        :style="filterMenuStyles"
                        @mousedown.stop
                      >
                        <div
                          v-for="opt in enrollmentOptions"
                          :key="opt.value"
                          class="toolbar-filter-option"
                          :class="{ 'active-filter-item': selectedEnrollmentId === opt.value }"
                          @click="selectEnrollment(opt.value)"
                        >
                          <div class="flex flex-col gap-0.5">
                            <span class="font-bold text-sm">{{ opt.label }}</span>
                            <span class="text-3xs text-content-muted"
                              >{{ opt.schedule?.day }} at {{ opt.schedule?.time }}</span
                            >
                          </div>
                        </div>
                      </div>
                    </transition>
                  </Teleport>
                </div>
              </div>
            </template>

            <template #row="{ item, index, headers }">
              <td class="ui-cell text-center" :style="{ width: headers[0].width }">
                <span class="font-bold text-content-dark text-sm">{{ index + 1 }}</span>
              </td>
              <td class="ui-cell">
                <span class="font-bold text-content-dark text-sm">{{ item.label }}</span>
              </td>
              <td class="ui-cell tabular-nums font-bold text-content-muted text-xs">
                {{ formatDateOnly(item.date) }}
              </td>
              <td class="ui-cell text-center">
                <div class="flex justify-center">
                  <div
                    class="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-sm border border-outline-std select-none"
                    :class="ATTENDANCE_STATUS[item.status].theme"
                  >
                    {{ ATTENDANCE_STATUS[item.status].label }}
                  </div>
                </div>
              </td>
              <td class="ui-cell italic text-content-muted font-bold text-xs">
                {{ item.remark }}
              </td>
              <td class="ui-cell text-center font-black text-content-dark text-xs tabular-nums">
                {{ index + 1 }}/{{ attendanceStats.total }}
              </td>
            </template>
          </DataTable>
        </section>
      </template>

      <template #right-content v-if="student">
        <div class="flex flex-col gap-8">
          <EntityProfileCard
            :profileURL="student.profileURL"
            title="Basic Information"
            fallbackImage="profiles/avatar-student"
          />
          <EntityInfoCard title="Student Details" :fields="studentInfoFields" />
          <EntityInfoCard v-if="parent" title="Parent Details" :fields="parentDetailFields" />
          <TimestampCard :createdAt="student.createdAt" :updatedAt="student.updatedAt" />
        </div>
      </template>
    </DetailPageLayout>

    <StudentActionModal
      v-model:isOpen="actionModal.isOpen"
      :type="actionModal.type"
      :student="actionModal.student"
      :enrollment="actionModal.enrollment"
      :loading="submitting"
      v-model:error="globalError"
      v-model:success="globalSuccess"
      :branches="branches"
      @submit="submitActionModal"
      @close="actionModal.isOpen = false"
    />
  </DashboardLayout>
</template>
