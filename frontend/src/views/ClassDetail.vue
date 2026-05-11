<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import DetailMetricCard from '@/components/common/data/DetailMetricCard.vue'
import { classService } from '@/services/classService'
import { enrollmentService } from '@/services/enrollmentService'
import { programService } from '@/services/programService'
import { termService } from '@/services/termService'
import { getImageUrl, getActionIcon, getProgramProfileURL } from '@/utils/assetHelper'
import { calculateClassProgress, formatDateOnly, generateClassSessions } from '@/utils/formatUtils'
import ClassActionModal from '@/components/classes/ClassActionModal.vue'
import DataTable from '@/components/common/data/DataTable.vue'

const route = useRoute()
const router = useRouter()

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
  L: { label: 'L', color: 'yellow', theme: 'bg-warning-soft text-warning' },
  N: { label: 'N', color: 'gray', theme: 'bg-surface-subtle text-content-muted/40' }
}

const getAttendanceStatus = (sessionId, studentId) => {
  return attendanceData.value[sessionId]?.[studentId] || 'N'
}

const toggleAttendance = async (sessionId, studentId) => {
  const current = getAttendanceStatus(sessionId, studentId)
  const sequence = ['N', 'P', 'A', 'L']
  const next = sequence[(sequence.indexOf(current) + 1) % sequence.length]

  // Optimistic update
  if (!attendanceData.value[sessionId]) {
    attendanceData.value[sessionId] = {}
  }
  attendanceData.value[sessionId][studentId] = next

  try {
    await attendanceService.recordAttendance(classData.value.id, sessionId, attendanceData.value[sessionId])
  } catch (error) {
    console.error('Failed to save attendance', error)
    // Revert on error
  }
}

const allOfferings = computed(() =>
  terms.value.flatMap((term) =>
    (term.offerings || [])
      .filter((offering) => offering.classId === classData.value?.id)
      .map((offering) => ({
        ...offering,
        termId: term.id,
        termName: term.name,
        termStartDate: term.startDate,
        termEndDate: term.endDate,
      })),
  ),
)

const activeUpcomingOfferings = computed(() =>
  allOfferings.value.filter((offering) => {
    if (!offering.termEndDate) return true
    return new Date(offering.termEndDate) >= new Date()
  }),
)

const primarySchedule = computed(() => {
  if (classData.value?.schedule?.day || classData.value?.schedule?.time) return classData.value.schedule
  return classData.value?.schedules?.[0] || { day: 'TBA', time: 'N/A' }
})

const uniqueBranchNames = computed(() =>
  [...new Set(
    activeUpcomingOfferings.value
      .map((offering) => offering.branch?.name)
      .filter(Boolean),
  )],
)

const totalStudentsAcrossOfferings = computed(() =>
  allOfferings.value.reduce(
    (total, offering) => total + Number(offering.currentCount || offering.students?.length || 0),
    0,
  ),
)

const classStats = computed(() => {
  if (!classData.value) return []

  return [
    {
      label: 'Linked Schedules',
      value: classData.value.schedules?.length || 0,
      image: getImageUrl('data-metric-card/remaining-sessions'),
    },
    {
      label: 'Active Offerings',
      value: activeUpcomingOfferings.value.length,
      image: getImageUrl('data-metric-card/total-enrolled'),
    },
    {
      label: 'Branch Coverage',
      value: uniqueBranchNames.value.length,
      image: getImageUrl('data-metric-card/enrollment-capacity'),
    },
    {
      label: 'Total Students',
      value: totalStudentsAcrossOfferings.value,
      image: getImageUrl('programs/upcoming-program'),
    }
  ]
})

const sessions = computed(() => {
  const referenceOffering = activeUpcomingOfferings.value[0] || allOfferings.value[0]
  const dayOfWeek = primarySchedule.value?.day
  const total = referenceOffering?.term?.totalSessions || referenceOffering?.totalSessions || 12
  return generateClassSessions(referenceOffering?.termStartDate, dayOfWeek, total)
})

const attendanceHeaders = computed(() => {
  const base = [
    { label: 'No', width: '50px', align: 'center' },
    { label: 'Name', width: '220px' },
    { label: 'Level', width: '100px', align: 'center' },
    { label: 'Timeslot', width: '150px', align: 'center' },
  ]

  const sessionCols = sessions.value.map(s => ({
    label: s.label,
    subLabel: formatDateOnly(s.date),
    width: '90px',
    align: 'center',
    class: 'session-col'
  }))

  const extraCols = [
    { label: 'Exam', width: '90px', align: 'center' },
    { label: 'Report Card', width: '110px', align: 'center' },
    { label: 'Certificate', width: '110px', align: 'center' },
    { label: 'Remark', width: '180px' }
  ]

  return [...base, ...sessionCols, ...extraCols]
})

const currentHeaders = attendanceHeaders
const currentItems = enrollments
const currentEntityName = computed(() => 'student')
const currentTableTitle = computed(() => 'Student Attendance')

const actionModal = ref({
  isOpen: false,
  type: 'edit',
  loading: false,
  error: '',
  success: ''
})

const openActionModal = (type) => {
  actionModal.value = {
    isOpen: true,
    type,
    loading: false,
    error: '',
    success: ''
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

const fetchData = async (id) => {
  loading.value = true
  errorMessage.value = ''
  try {
    const [data, enrollmentData, attendanceMap, termData] = await Promise.all([
      classService.getClass(id),
      enrollmentService.getAllEnrollments({ classId: id }),
      attendanceService.getClassAttendance(id),
      termService.getAllTerms(),
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
  } catch (err) {
    console.error('Failed to fetch class details:', err)
    errorMessage.value = err.message || 'Failed to load class details'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (route.params.id) fetchData(route.params.id)
})

watch(() => route.params.id, (newId) => {
  if (newId) fetchData(newId)
})
</script>

<template>
  <DashboardLayout>
    <DetailPageLayout :loading="loading" :errorMessage="errorMessage" backRoute="/classes" title="Class Analytics"
      sidebarWidth="sm">
      <template #header-actions v-if="classData">
        <div class="flex items-center">
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-primary-soft transition-all duration-300 hover:bg-primary hover:border-primary group"
            title="Edit Class" @click="openActionModal('edit')">
            <img :src="getActionIcon('edit')" class="w-5 h-5 group-hover:opacity-100 transition-opacity" />
          </button>
          <div class="w-px h-6 bg-outline-std/50 mx-1"></div>
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-error-soft transition-all duration-300 hover:bg-error hover:border-error group"
            title="Delete Class" @click="openActionModal('delete')">
            <img :src="getActionIcon('delete')"
              class="w-5 h-5 icon-danger group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </template>

      <template #left-content v-if="classData">
        <!-- Metrics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DetailMetricCard v-for="stat in classStats" :key="stat.label" v-bind="stat" />
        </div>

        <!-- Table Content -->

        <section
          class="overflow-y-auto animate-fade-in max-h-[700px] border border-outline-std rounded-[2rem] bg-white shadow-sm">
          <DataTable :title="currentTableTitle" :headers="currentHeaders" :items="currentItems" :loading="loading"
            :entityName="currentEntityName" :flexible="true" :hasSearch="false" :hasFilter="false">

            <template #row="{ item, index, headers }">
              <td class="ui-cell text-center" :style="{ width: headers[0].width }">
                {{ index + 1 }}
              </td>
              <td class="ui-cell">
                <div class="flex items-center gap-3">
                  <div class="flex flex-col">
                    <span class="leading-tight">{{ item.student?.name ||
                      'Unknown'
                    }}</span>
                    <span class="">{{
                      item.student?.nickname || 'No Nick' }}</span>
                  </div>
                </div>
              </td>
              <td class="ui-cell text-center">
                {{ classData.program?.level || 'L1' }}
              </td>
              <td class="ui-cell text-center">
                <div class="flex flex-col items-center">
                  <span class="tabular-nums tracking-tight">{{
                    primarySchedule.time }}</span>
                </div>
              </td>

              <!-- Session Columns -->
              <td v-for="session in sessions" :key="session.id" class="ui-cell text-center p-1">
                <div class="flex flex-col items-center gap-1">
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-3xs font-bold cursor-pointer transition-all hover:scale-110 shadow-sm border border-outline-std select-none"
                    :class="[
                      ATTENDANCE_STATUS[getAttendanceStatus(session.id, item.studentId)].theme,
                      session.date > new Date() ? 'opacity-30' : ''
                    ]" @click="toggleAttendance(session.id, item.studentId)">
                    {{ ATTENDANCE_STATUS[getAttendanceStatus(session.id, item.studentId)].label }}
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
                <img
                  :src="getProgramProfileURL(programData?.profileURL || classData.program?.profileURL, programData?.category || classData.program?.category, programData?.categorySnapshot?.profileURL || classData.program?.categorySnapshot?.profileURL)"
                  alt="Program Logo" class="w-full h-full object-contain" />
              </div>
            </div>
          </section>
          <!-- Parameters Card -->
          <section class="ui-detail-card !py-6">
            <div class="space-y-4">
              <div class="flex justify-between items-center gap-1">
                <span class="text-lg font-bold text-content-dark">Class Name:</span>
                <span class="text-md font-bold text-content-muted">{{ programData?.name ||
                  classData.program?.name || 'N/A'
                  }}</span>
              </div>
              <div class="flex justify-between items-center gap-1">
                <span class="text-lg font-bold text-content-dark">Category:</span>
                <span class="text-md font-bold text-content-muted">{{
                  programData?.category || classData.program?.category || 'Standard' }}</span>
              </div>
              <div class="flex justify-between items-center gap-1">
                <span class="text-lg font-bold text-content-dark">Level:</span>
                <span class="text-md font-bold text-content-muted">{{
                  programData?.level || classData.program?.level || 'L1' }}</span>
              </div>
              <div class="flex justify-between items-center gap-1">
                <span class="text-lg font-bold text-content-dark">Schedules:</span>
                <div class="flex flex-wrap justify-end gap-2 max-w-[60%]">
                  <AppBadge v-for="schedule in (classData.schedules || [])"
                    :key="schedule.id || `${schedule.day}-${schedule.time}`"
                    :status="`${schedule.day} · ${schedule.time}`" type="blue" />
                </div>
              </div>
              <div class="flex justify-between items-center gap-1">
                <span class="text-lg font-bold text-content-dark">Branches:</span>
                <div class="flex flex-wrap justify-end gap-2 max-w-[60%]">
                  <AppBadge v-for="branchName in uniqueBranchNames" :key="branchName" :status="branchName"
                    type="blue" />
                  <span v-if="uniqueBranchNames.length === 0" class="text-md font-bold text-content-muted">No active
                    offerings</span>
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
</style>
