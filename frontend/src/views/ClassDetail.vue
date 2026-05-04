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
import { getImageUrl, getActionIcon, getProgramProfileURL } from '@/utils/assetHelper'
import { calculateClassProgress, formatDateOnly } from '@/utils/formatUtils'
import { getStatusTheme } from '@/utils/badgeUtils'
import ClassActionModal from '@/components/classes/ClassActionModal.vue'
import DataTable from '@/components/common/data/DataTable.vue'

const route = useRoute()
const router = useRouter()

const classData = ref(null)
const enrollments = ref([])
const programData = ref(null)
const loading = ref(true)
const errorMessage = ref('')

const classStats = computed(() => {
  if (!classData.value) return []

  const progress = calculateClassProgress(classData.value.term?.startDate, classData.value.term?.endDate, classData.value.schedule?.day, classData.value.schedule?.time)

  return [
    {
      label: 'Remaining Sessions',
      value: `<span class="text-primary">${progress.remainingSessions || 0}</span> / ${progress.totalWeeks || 0}`,
      image: getImageUrl('data-metric-card/remaining-sessions'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Student Capacity',
      value: `${classData.value.enrolledCount || 0} / ${classData.value.maxCapacity || 20}`,
      image: getImageUrl('data-metric-card/total-enrolled'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Total Teachers',
      value: classData.value.teachers?.length || 0,
      image: getImageUrl('data-metric-card/enrollment-capacity'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Class Status',
      value: progress.status || 'Active',
      image: getImageUrl('dashboard/card-upcoming-program'),
      color: 'var(--color-primary-light)',
    }
  ]
})

const sessions = computed(() => {
  const dayOfWeek = classData.value?.day || classData.value?.schedule?.day
  if (!classData.value?.term?.startDate || !dayOfWeek) return []
  const startDate = new Date(classData.value.term.startDate)
  const total = classData.value.term.totalSessions || classData.value.totalSessions || 12

  const dates = []
  const dayMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 }
  const targetDay = dayMap[dayOfWeek]

  let current = new Date(startDate)
  while (current.getDay() !== targetDay) {
    current.setDate(current.getDate() + 1)
  }

  for (let i = 0; i < total; i++) {
    dates.push({
      id: i + 1,
      label: `Session ${i + 1}`,
      date: new Date(current),
    })
    current.setDate(current.getDate() + 7)
  }
  return dates
})

const attendanceHeaders = computed(() => {
  const base = [
    { label: 'NO', width: '50px', align: 'center' },
    { label: 'NAME', width: '220px' },
    { label: 'LEVEL', width: '100px', align: 'center' },
    { label: 'TIMESLOT', width: '150px', align: 'center' },
  ]

  const sessionCols = sessions.value.map(s => ({
    label: s.label,
    subLabel: formatDateOnly(s.date),
    width: '90px',
    align: 'center',
    class: 'session-col'
  }))

  const extraCols = [
    { label: 'EXAM', width: '90px', align: 'center' },
    { label: 'REPORT CARD', width: '110px', align: 'center' },
    { label: 'CERTIFICATE', width: '110px', align: 'center' },
    { label: 'REMARK', width: '180px' }
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
    const [data, enrollmentData] = await Promise.all([
      classService.getClass(id),
      enrollmentService.getAllEnrollments({ classId: id })
    ])
    // Ensure defaults for critical rendering fields
    if (!data.schedule) {
      data.schedule = { day: 'TBA', time: 'N/A' }
    }
    data.maxCapacity = data.maxCapacity || 20
    data.enrolledCount = data.enrolledCount || 0

    classData.value = data
    enrollments.value = enrollmentData || []

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
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-primary-light transition-all duration-300 hover:bg-primary hover:border-primary group"
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
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DetailMetricCard v-for="stat in classStats" :key="stat.label" v-bind="stat" />
        </div>

        <!-- Table Content -->

        <section
          class="overflow-y-auto animate-fade-in max-h-[700px] border border-outline-std rounded-[2rem] bg-white shadow-sm">
          <DataTable :title="currentTableTitle" :headers="currentHeaders" :items="currentItems" :loading="loading"
            :entityName="currentEntityName" :flexible="true" :hasSearch="false" :hasFilter="false">

            <template #row="{ item, index, headers }">
              <td class="ui-cell text-center font-bold text-content-muted/20" :style="{ width: headers[0].width }">
                {{ index + 1 }}
              </td>
              <td class="ui-cell">
                <div class="flex items-center gap-3">
                  <div class="flex flex-col">
                    <span class="text-sm font-semibold text-content-dark leading-tight">{{ item.student?.name || 'Unknown'
                    }}</span>
                    <span class="text-[10px] font-semibold text-primary uppercase tracking-widest">{{
                      item.student?.nickname || 'No Nick' }}</span>
                  </div>
                </div>
              </td>
              <td class="ui-cell text-center text-xs font-semibold text-content-muted">
                {{ classData.program?.level || 'L1' }}
              </td>
              <td class="ui-cell text-center">
                <div class="flex flex-col items-center">
                  <span class="text-[10px] font-semibold text-content-dark tabular-nums tracking-tight">{{
                    classData.schedule.time }}</span>
                </div>
              </td>

              <!-- Session Columns -->
              <td v-for="session in sessions" :key="session.id" class="ui-cell text-center p-1">
                <div class="flex flex-col items-center gap-1">
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-semibold cursor-pointer transition-all hover:scale-110 shadow-sm border border-outline-std"
                    :class="[
                      index % 2 === 0 ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary',
                      session.date < new Date() ? '' : 'opacity-30 bg-gray-100 text-gray-400'
                    ]">
                    {{ session.date < new Date() ? (index % 3 === 0 ? 'A' : 'P') : 'N' }} </div>
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
                <span class="text-[10px] font-semibold text-content-muted italic">New Student</span>
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
          <section class="ui-detail-card">
            <div class="space-y-5">
              <div class="flex justify-between gap-1">
                <span class="text-lg font-bold text-content-dark">Class Name:</span>
                <span class="text-md font-bold text-content-muted">{{ programData?.name ||
                  classData.program?.name || 'N/A'
                  }}</span>
              </div>
              <div class="flex justify-between gap-1 ">
                <span class="text-lg font-bold text-content-dark">Category:</span>
                <span class="text-md font-bold text-content-muted">{{
                  programData?.category || classData.program?.category || 'Standard' }}</span>
              </div>
              <div class="flex justify-between gap-1 ">
                <span class="text-lg font-bold text-content-dark">Level:</span>
                <span class="text-md font-bold text-content-muted">{{
                  programData?.level || classData.program?.level || 'L1' }}</span>
              </div>
              <div class="flex justify-between gap-1 ">
                <span class="text-lg font-bold text-content-dark">Branch:</span>
                <div class="flex items-end">
                  <AppBadge :status="classData.branch?.abbr || 'TBA'" :type="classData.branch?.color || 'blue'" />
                  <span class="text-md font-bold text-content-muted mt-1">{{ classData.branch?.name || 'TBA' }}</span>
                </div>
              </div>
              <div class="flex justify-between gap-1 ">
                <span class="text-lg font-bold text-content-dark">Term:</span>
                <AppBadge :status="classData.term?.name || 'Active Term'" type="blue" />
              </div>
              <div class="flex justify-between gap-1 ">
                <span class="text-lg font-bold text-content-dark">Day:</span>
                <AppBadge :status="classData.schedule.day" type="blue" size="sm" />
              </div>
              <div class="flex justify-between gap-1 ">
                <span class="text-lg font-bold text-content-dark">Time:</span>
                <span class="text-md font-bold text-content-muted tabular-nums">{{ classData.schedule.time }}</span>
              </div>
              <div class="flex justify-between gap-1 ">
                <span class="text-lg font-bold text-content-dark">Class Capacity:</span>
                <span class="text-md font-bold text-content-muted tabular-nums">{{ classData.maxCapacity }}
                  Students</span>
              </div>
              <div class="flex justify-between gap-1 ">
                <span class="text-lg font-bold text-content-dark">Status:</span>
                <AppBadge
                  :status="calculateClassProgress(classData.term?.startDate, classData.term?.endDate, classData.schedule.day, classData.schedule.time).status" />
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
