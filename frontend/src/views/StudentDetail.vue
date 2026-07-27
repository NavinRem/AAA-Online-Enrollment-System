<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import DataTable from '@/components/common/data/DataTable.vue'
import { studentService } from '@/services/studentService'
import { parentService } from '@/services/parentService'
import { enrollmentService } from '@/services/enrollmentService'
import { programService } from '@/services/programService'
import { classService } from '@/services/classService'
import { formatDateOnly, calculateAge, generateClassSessions } from '@/utils/formatUtils'
import { getAcademicStatus, enrichEnrollments } from '@/utils/enrollmentHelper'
import StudentActionModal from '@/components/students/StudentActionModal.vue'
import AppButton from '@/components/common/ui/AppButton.vue'

import { getActionIcon, getParentProfileURL, getProgramProfileURL } from '@/utils/assetHelper'
import { branchService } from '@/services/branchService'
import EntityProfileCard from '@/components/common/detail/EntityProfileCard.vue'
import EntityInfoCard from '@/components/common/detail/EntityInfoCard.vue'
import TimestampCard from '@/components/common/detail/TimestampCard.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AuditBadge from '@/components/common/ui/AuditBadge.vue'

import { useDataStore } from '@/stores/dataStore'

const dataStore = useDataStore()

const route = useRoute()
const router = useRouter()

const student = ref(null)
const parent = ref(null)
const enrollments = ref([])
const branches = ref([])
const classAttendanceData = ref({})
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
  const latest = activeProgramsList.value[0]
  if (!latest) return { abbr: 'No Branch', color: 'neutral' }
  let abbr = latest.branchAbbr || 'No Branch'
  if (abbr === 'HQ') abbr = 'No Branch'
  return {
    abbr,
    color: abbr === 'No Branch' ? 'neutral' : latest.branchColor || 'blue',
  }
})

const activeProgramsList = computed(() => {
  return enrollments.value.filter((e) => {
    const status = String(e.status || e.academicStatus || '').toLowerCase()
    const payment = String(e.paymentStatus || e.status || '').toLowerCase()
    const isActive = !['transferred', 'cancelled', 'stopped', 'deleted'].includes(status)
    const isPaidStatus = ['paid', 'confirmed', 'success'].includes(payment) || status === 'paid'
    return isActive && isPaidStatus
  })
})

const enrollmentOptions = computed(() => {
  return activeProgramsList.value.map((e) => ({
    label: `${e.termName} - ${e.programName} (${e.branchAbbr})`,
    value: e.id,
    programName: e.programName,
    termName: e.termName,
    branchAbbr: e.branchAbbr,
    branchColor: e.branchColor,
    classId: e.classId,
    term: e.class?.term,
    schedule: e.class?.schedule || e.class?.schedules?.[0],
  }))
})

const selectedEnrollment = computed(() => {
  return (
    activeProgramsList.value.find((e) => String(e.id) === String(selectedEnrollmentId.value)) ||
    activeProgramsList.value[0] ||
    null
  )
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
  const total = sessions.value.length
  const enrolled = enrollment.enrolledSessions
  const startIndex = enrolled && total > 0 && enrolled < total ? total - enrolled : 0

  return sessions.value.map((session, index) => {
    const sessionData = attendanceMap[session.id] || {}
    const rawVal = sessionData[studentId]
    const metaVal = sessionData[`${studentId}_meta`]
    const status =
      index < startIndex
        ? 'N'
        : metaVal?.status || (typeof rawVal === 'object' ? rawVal.status : rawVal) || 'N'
    const scheduleTime =
      enrollment.class?.schedule?.time ||
      enrollment.class?.schedules?.[0]?.time ||
      enrollment.schedule?.time ||
      '-'

    return {
      ...session,
      no: index + 1,
      label: `Session ${index + 1}`,
      time: scheduleTime,
      program: enrollment.program || enrollment.class?.program,
      programName:
        enrollment.programName ||
        enrollment.program?.name ||
        enrollment.class?.program?.name ||
        '-',
      programProfileURL: getProgramProfileURL(
        enrollment.program?.profileURL || enrollment.class?.program?.profileURL,
        enrollment.program?.category?.name ||
          enrollment.program?.category ||
          enrollment.class?.program?.category?.name ||
          enrollment.class?.program?.category,
        enrollment.program?.category?.profileURL || enrollment.class?.program?.category?.profileURL,
      ),
      programType: enrollment.program?.type || enrollment.class?.program?.type,
      status,
      modifiedBy:
        metaVal?.modifiedBy || metaVal?.createdBy || enrollment.modifiedBy || enrollment.createdBy,
      createdBy: metaVal?.createdBy || enrollment.createdBy,
      updatedAt: metaVal?.updatedAt || enrollment.updatedAt || enrollment.createdAt || session.date,
      remark: metaVal?.remark || (index < startIndex ? 'Not enrolled' : '-'),
    }
  })
})

const attendanceStats = computed(() => {
  const records = studentAttendanceRecords.value
  const enrollment = selectedEnrollment.value
  if (!records.length) return { totalEnrolled: 0, present: 0, absent: 0 }

  const totalSessions = records.length
  const totalEnrolled = Number(enrollment?.enrolledSessions) || totalSessions
  const present = records.filter((r) => ['P', 'L', 'M'].includes(r.status)).length
  const absent = records.filter((r) => r.status === 'A').length

  return { totalEnrolled, present, absent }
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
    image: getParentProfileURL(parent.value?.profileURL),
  },
  { label: 'Phone', value: parent.value?.phone },
  { label: 'Email', value: parent.value?.email },
])

const toggleDropdown = (event) => {
  if (event) event.stopPropagation()
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
  const enrollment = enrollments.value.find((e) => String(e.id) === String(id))
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

watch(enrollments, (newEnrollments) => {
  if (newEnrollments.length > 0 && !selectedEnrollmentId.value) {
    selectedEnrollmentId.value = newEnrollments[0].id
    fetchClassAttendance(newEnrollments[0].classId)
  }
})

const attendanceHeaders = [
  { label: 'No', width: '60px', align: 'center' },
  { label: 'Session', width: '120px' },
  { label: 'Date', width: '200px' },
  { label: 'Program', width: '230px' },
  { label: 'Time', width: '200px' },
  { label: 'Status', align: 'center', width: '90px' },
  { label: 'Modified By', width: '160px' },
  { label: 'Remark' },
]

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
      await dataStore.fetchAllCommonData(true, ['students', 'enrollments'])
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

  } catch (error) {
    console.error('Failed to load student details', error)
    errorMessage.value = error.message || 'Failed to load details'
  } finally {
    loading.value = false
  }
}

const handleOutsideClick = (e) => {
  if (dropdownOpen.value) {
    const btn = document.getElementById('enrollment-filter-btn')
    if (btn && !btn.contains(e.target)) {
      dropdownOpen.value = false
    }
  }
}

onMounted(() => {
  window.addEventListener('click', handleOutsideClick)
  if (route.params.id) fetchData(route.params.id)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleOutsideClick)
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
      :scrollable="false"
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
          class="overflow-hidden animate-fade-in flex-1 border border-outline-std rounded-xl bg-white shadow-sm flex flex-col min-h-0"
        >
          <DataTable
            title="Attendance Track"
            :headers="attendanceHeaders"
            :items="studentAttendanceRecords"
            :loading="loading"
            entityName="session"
            :flexible="true"
            :hasSearch="false"
            :hasFilter="false"
            emptyMessage="Attendance track is available only after enrollment payment is completed."
          >
            <template #toolbar-actions>
              <div class="flex items-center gap-3">
                <div
                  class="flex items-center gap-6 px-6 py-2 bg-surface-subtle rounded-md border border-outline-std mr-4"
                >
                  <div class="flex flex-col">
                    <span class="text-sm font-bold text-content-muted">Total Enrolled</span>
                    <span class="text-lg font-black text-content-dark">{{
                      attendanceStats.totalEnrolled
                    }}</span>
                  </div>
                  <div class="w-px h-8 bg-outline-std/50"></div>
                  <div class="flex flex-col">
                    <span class="text-sm font-bold text-content-muted">Present</span>
                    <span class="text-lg font-black text-success">{{
                      attendanceStats.present
                    }}</span>
                  </div>
                  <div class="w-px h-8 bg-outline-std/50"></div>
                  <div class="flex flex-col">
                    <span class="text-sm font-bold text-content-muted">Absent</span>
                    <span class="text-lg font-black text-error">{{ attendanceStats.absent }}</span>
                  </div>
                </div>

                <!-- Enrollment Selector -->
                <div
                  v-if="enrollmentOptions.length > 0"
                  class="relative"
                  id="enrollment-filter-btn"
                >
                  <AppButton variant="secondary" size="md" @click="toggleDropdown($event)">
                    <img :src="getActionIcon('filter')" class="w-4 h-4" />
                    <span class="font-bold truncate max-w-52">{{
                      selectedEnrollment
                        ? `${selectedEnrollment.programName} (${selectedEnrollment.termName})`
                        : 'No Paid Enrollment'
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
                        class="fixed bg-white rounded-sm shadow-2xl border border-outline-std z-dropdown p-2 min-w-80 max-w-96 flex flex-col gap-1.5"
                        :style="filterMenuStyles"
                        @mousedown.stop
                        @click.stop
                      >
                        <div
                          v-for="opt in enrollmentOptions"
                          :key="opt.value"
                          class="p-3 rounded-sm border transition-all cursor-pointer flex items-center justify-between gap-3"
                          :class="
                            selectedEnrollmentId === opt.value
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-white hover:bg-surface-subtle border-outline-std/60 text-content-dark'
                          "
                          @click="selectEnrollment(opt.value)"
                        >
                          <div class="flex flex-col gap-1.5 min-w-0 flex-1">
                            <div class="flex items-center justify-between gap-2">
                              <span
                                class="font-extrabold text-sm truncate"
                                :class="
                                  selectedEnrollmentId === opt.value
                                    ? 'text-white font-black'
                                    : 'text-content-dark'
                                "
                              >
                                {{ opt.programName }}
                              </span>
                              <AppBadge
                                :status="opt.branchAbbr"
                                :type="opt.branchColor || 'blue'"
                                size="xs"
                              />
                            </div>
                            <div class="flex items-center gap-2 flex-wrap text-sm">
                              <span
                                class="font-bold"
                                :class="
                                  selectedEnrollmentId === opt.value
                                    ? 'text-white/90'
                                    : 'text-content-muted'
                                "
                              >
                                {{ opt.termName }}
                              </span>
                              <span
                                :class="
                                  selectedEnrollmentId === opt.value
                                    ? 'text-white/60'
                                    : 'text-outline-std'
                                "
                                >•</span
                              >
                              <div class="flex items-center gap-1.5" v-if="opt.schedule?.day">
                                <AppBadge :status="opt.schedule?.day" type="day" size="xs" />
                                <span
                                  class="font-semibold"
                                  :class="
                                    selectedEnrollmentId === opt.value
                                      ? 'text-white'
                                      : 'text-content-dark'
                                  "
                                >
                                  {{ opt.schedule?.time }}
                                </span>
                              </div>
                            </div>
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
              <td class="ui-cell" :style="{ width: headers[1].width }">
                <span class="font-bold text-content-dark text-sm">{{ item.label }}</span>
              </td>
              <td
                class="ui-cell tabular-nums font-bold text-content-dark text-sm"
                :style="{ width: headers[2].width }"
              >
                {{ formatDateOnly(item.date) }}
              </td>
              <td class="ui-cell" :style="{ width: headers[3].width }">
                <div class="ui-identity-cell">
                  <div class="ui-avatar">
                    <img :src="item.programProfileURL" :alt="item.programName" />
                  </div>
                  <div class="ui-identity-info">
                    <span class="truncate block font-bold text-content-dark text-sm">{{
                      item.programName
                    }}</span>
                    <AppBadge v-if="item.programType" :status="item.programType" />
                  </div>
                </div>
              </td>
              <td
                class="ui-cell font-semibold text-content-muted text-sm"
                :style="{ width: headers[4].width }"
              >
                {{ item.time }}
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[5].width }">
                <div class="flex justify-center">
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shadow-sm border border-outline-std select-none"
                    :class="(ATTENDANCE_STATUS[item.status] || ATTENDANCE_STATUS.N).theme"
                    :title="(ATTENDANCE_STATUS[item.status] || ATTENDANCE_STATUS.N).label"
                  >
                    {{ (ATTENDANCE_STATUS[item.status] || ATTENDANCE_STATUS.N).label }}
                  </div>
                </div>
              </td>
              <td class="ui-cell text-left" :style="{ width: headers[6].width }">
                <AuditBadge :meta="item.modifiedBy || item.createdBy" :item="item" />
              </td>
              <td class="ui-cell italic text-content-muted font-bold text-sm">
                {{ item.remark }}
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
            fallbackImage="profiles/avatar-boy"
          />
          <EntityInfoCard title="Student Details" :fields="studentInfoFields" />
          <EntityInfoCard v-if="parent" title="Parent Details" :fields="parentDetailFields" />
          <TimestampCard
            :createdAt="student.createdAt"
            :updatedAt="student.updatedAt"
            :createdBy="student.createdBy"
            :modifiedBy="student.modifiedBy"
            :item="student"
          />
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

<style scoped>
/* Subtle, light scrollbar for horizontal table scrolling */
.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: #e2e8f0 transparent;
}
.overflow-x-auto::-webkit-scrollbar {
  height: 5px;
}
.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-x-auto::-webkit-scrollbar-thumb {
  background-color: #e2e8f0;
  border-radius: 9999px;
}
.overflow-x-auto::-webkit-scrollbar-thumb:hover {
  background-color: #cbd5e1;
}
</style>
