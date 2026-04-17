<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import StatusBadge from '@/components/common/ui/StatusBadge.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import DetailedSummaryCard from '@/components/common/cards/DetailedSummaryCard.vue'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'
import { programService } from '@/services/programService'
import { enrollmentService } from '@/services/enrollmentService'
import { userService } from '@/services/userService'
import { getProgramProfileURL, getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { getProgramDisplayStatus, isSessionInProgress } from '@/utils/programHelper'
import ProgramActionModal from '@/components/programs/ProgramActionModal.vue'
import { isPaid } from '@/utils/statusUtils'
import { enrichEnrollments } from '@/utils/enrollmentHelper'

const route = useRoute()
const router = useRouter()

const program = ref(null)
const sessions = ref([])
const enrollments = ref([])
const students = ref([])
const loading = ref(true)
const errorMessage = ref('')
const now = ref(new Date())

const activeTab = ref('overview')
const searchQuery = ref('')

const initData = async () => {
  const id = route.params.id
  loading.value = true
  errorMessage.value = ''

  try {
    const [pData, sData, eData, stdData] = await Promise.all([
      programService.getProgram(id),
      programService.getSessions(id),
      enrollmentService.getAllEnrollments(),
      userService.getAllStudents(),
    ])

    program.value = pData
    sessions.value = Array.isArray(sData) ? sData : []

    const allEnrollments = Array.isArray(eData) ? eData : []
    enrollments.value = allEnrollments.filter((e) => String(e.programId || '') === String(id))

    students.value = Array.isArray(stdData) ? stdData : []
  } catch (err) {
    console.error('Error fetching program details:', err)
    errorMessage.value = 'Failed to load program details'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  initData()
  const interval = setInterval(() => {
    now.value = new Date()
  }, 60000)
  return () => clearInterval(interval)
})

const statsCards = computed(() => {
  if (!program.value) return []

  const paidEnrollmentsCount = enrollments.value.filter((e) =>
    isPaid(e.status || e.paymentStatus),
  ).length
  const totalRevenue = enrollments.value
    .filter((e) => isPaid(e.status || e.paymentStatus))
    .reduce((sum, e) => sum + Number(e.amount || program.value.price || 0), 0)

  const scheduledCount = sessionInstances.value.filter((i) => i.status === 'Scheduled').length
  const maxCapacity = Number(program.value.maxCapacity || program.value.capacity || 5)
  const remainingCapacity = Math.max(0, maxCapacity - paidEnrollmentsCount)

  return [
    {
      label: 'Total Enrolled',
      value: paidEnrollmentsCount,
      image: getImageUrl('data-metric-card/total-enrolled'),
      color: 'bg-primary-soft',
    },
    {
      label: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      image: getImageUrl('data-metric-card/program-revenue'),
      color: 'bg-success-soft',
    },
    {
      label: 'Active Sessions',
      value: scheduledCount,
      image: getImageUrl('data-metric-card/remaining-sessions'),
      color: 'bg-warning-soft',
    },
    {
      label: 'Remaining Slots',
      value: remainingCapacity,
      image: getImageUrl('data-metric-card/enrollment-capacity'),
      color: remainingCapacity < 2 ? 'bg-error/10' : 'bg-surface-subtle',
    },
  ]
})

const enrolledStudents = computed(() => {
  if (!enrollments.value.length) return []

  const enriched = enrichEnrollments(
    enrollments.value,
    [],
    students.value,
    [program.value].filter(Boolean),
  )

  return enriched.filter((e) => {
    const studentName = e.studentName || 'Unknown Student'
    if (!searchQuery.value) return true
    return studentName.toLowerCase().includes(searchQuery.value.toLowerCase())
  })
})

const sessionInstances = computed(() => {
  if (!program.value || sessions.value.length === 0) return []

  const instances = []
  const start = new Date(program.value.startDate)
  const end = new Date(program.value.endDate)
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  sessions.value.forEach((session) => {
    const dayName = session.schedule?.day
    if (!dayName) return

    const targetDayIndex = days.indexOf(dayName)
    let current = new Date(start)

    while (current.getDay() !== targetDayIndex) {
      current.setDate(current.getDate() + 1)
    }

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      const isToday = dateStr === now.value.toISOString().split('T')[0]
      const isPastDay =
        current < new Date(now.value.getFullYear(), now.value.getMonth(), now.value.getDate())

      let status = 'Scheduled'
      if (isToday) {
        if (isSessionInProgress(session.schedule, now.value)) {
          status = 'In Progress'
        } else {
          const times = (session.schedule?.timeslot || '').split('-').map((t) => t.trim())
          if (times.length === 2) {
            const [hours, minutes] = times[1].split(':').map(Number)
            const endMinutes = hours * 60 + minutes
            const currentMinutes = now.value.getHours() * 60 + now.value.getMinutes()
            if (currentMinutes > endMinutes) status = 'Past'
          }
        }
      } else if (isPastDay) {
        status = 'Past'
      }

      instances.push({
        id: `${session.id}-${dateStr}`,
        date: dateStr,
        day: dayName,
        timeslot: session.schedule?.timeslot,
        status: status,
      })

      current.setDate(current.getDate() + 7)
    }
  })

  return instances.sort((a, b) => a.date.localeCompare(b.date))
})

const handleStudentClick = (enroll) => {
  const sId = enroll.studentId
  if (sId) {
    router.push(`/students/${sId}`)
  }
}

const actionModal = ref({
  isOpen: false,
  type: 'edit',
  program: null,
  loading: false,
  error: '',
  success: '',
})

const openActionModal = (type) => {
  actionModal.value = {
    isOpen: true,
    type,
    program: program.value,
    loading: false,
    error: '',
    success: '',
  }
}

const closeModal = () => {
  actionModal.value.isOpen = false
  actionModal.value.error = ''
  actionModal.value.success = ''
}

const handleActionSubmit = async (formData) => {
  actionModal.value.loading = true
  actionModal.value.error = ''
  try {
    if (actionModal.value.type === 'edit') {
      await programService.updateProgram(program.value.id, formData)
      actionModal.value.success = 'Program updated successfully!'
    } else if (actionModal.value.type === 'delete') {
      await programService.deleteProgram(program.value.id)
      actionModal.value.success = 'Program deleted successfully!'
      setTimeout(() => {
        router.push('/programs')
      }, 1500)
      return
    }

    setTimeout(() => {
      closeModal()
      initData()
    }, 1500)
  } catch (error) {
    actionModal.value.error = error.message || 'Action failed'
  } finally {
    actionModal.value.loading = false
  }
}
</script>

<template>
  <DashboardLayout>
    <DetailPageLayout :loading="loading" :errorMessage="errorMessage" backRoute="/programs" title="Program Details">
      <template #header-actions v-if="program">
        <div class="flex items-center gap-md">
          <AppButton variant="secondary" title="Edit Program" @click="openActionModal('edit')">
            <img :src="getActionIcon('edit')" class="w-4.5 h-4.5" /> Edit
          </AppButton>
          <AppButton variant="danger" title="Delete Program" @click="openActionModal('delete')">
            <img :src="getActionIcon('delete')" class="w-4.5 h-4.5 invert" /> Delete
          </AppButton>
        </div>
      </template>

      <template #left-content v-if="program">
        <!-- Metrics -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg mb-xl">
          <DataMetricCard v-for="card in statsCards" :key="card.label" v-bind="card" />
        </div>

        <!-- Tab Navigation -->
        <div class="ui-tabs-nav">
          <button class="ui-tab-item" :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">
            Overview
          </button>
          <button class="ui-tab-item" :class="{ active: activeTab === 'students' }" @click="activeTab = 'students'">
            Enrolled Students
          </button>
          <button class="ui-tab-item" :class="{ active: activeTab === 'classes' }" @click="activeTab = 'classes'">
            Class History
          </button>
        </div>

        <!-- Tab Content -->
        <div class="ui-detail-card min-h-[400px]">
          <div v-if="activeTab === 'overview'">
            <div class="ui-section-header">
              <h3 class="ui-section-title">Program Highlights</h3>
            </div>
            <div class="ui-data-list grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-xl">
              <div class="ui-data-item">
                <span class="ui-data-label">Program Category</span>
                <span class="ui-data-value text-base">{{
                  program.category || 'General Curriculum'
                  }}</span>
              </div>
              <div class="ui-data-item">
                <span class="ui-data-label">Academic Term</span>
                <span class="ui-data-value text-base">{{
                  program.termName || 'Not Specified'
                  }}</span>
              </div>
              <div class="ui-data-item">
                <span class="ui-data-label">Difficulty Level</span>
                <span class="ui-data-value text-base">{{
                  program.levelName || program.level || 'Beginner'
                  }}</span>
              </div>
              <div class="ui-data-item">
                <span class="ui-data-label">Execution Status</span>
                <StatusBadge :status="getProgramDisplayStatus(program, sessions, now)" />
              </div>
              <div class="ui-data-item">
                <span class="ui-data-label">Admission Price</span>
                <span class="ui-data-value text-xl font-black text-primary tracking-tighter">${{ (Number(program.basePrice || program.price)
                  || 0).toLocaleString() }}</span>
              </div>
              <div class="ui-data-item">
                <span class="ui-data-label">Term Duration</span>
                <span class="ui-data-value text-xs font-bold text-content-muted flex items-center gap-xs">
                  {{ program.startDate }} <span class="opacity-30">—</span> {{ program.endDate }}
                </span>
              </div>
              <div class="ui-data-item">
                <span class="ui-data-label">Active Schedule</span>
                <div class="flex flex-col gap-0.5">
                  <span class="ui-data-value text-base tracking-tight">{{
                    program.schedule?.day
                    }}</span>
                  <span class="text-xs font-black text-content-muted uppercase">{{
                    program.schedule?.timeslot
                    }}</span>
                </div>
              </div>
              <div class="ui-data-item">
                <span class="ui-data-label">Session Quota</span>
                <span class="ui-data-value text-base">{{ program.totalSessions || program.numberSessions }} Total Units</span>
              </div>
              <div class="ui-data-item">
                <span class="ui-data-label">Cost Efficiency</span>
                <span class="ui-data-value text-base">${{
                  (Number(program.basePrice || program.price || 0) / (Number(program.totalSessions || program.numberSessions) || 1)).toFixed(2)
                }}
                  <span class="text-2xs opacity-40">/ unit</span></span>
              </div>
            </div>
          </div>

          <div v-if="activeTab === 'students'">
            <div class="ui-section-header">
              <h3 class="ui-section-title">Class Roster</h3>
              <div class="relative w-64">
                <input type="text" v-model="searchQuery" placeholder="Quick search students..."
                  class="w-full pl-9 pr-4 py-2 border border-outline-std rounded-sm text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                <img :src="getActionIcon('search')" class="absolute left-3 top-2.5 w-4.5 h-4.5 opacity-30" />
              </div>
            </div>
            <table v-if="enrolledStudents.length > 0" class="ui-premium-table">
              <thead>
                <tr>
                  <th class="text-center" width="50">No</th>
                  <th>Full Name</th>
                  <th>Registry Date</th>
                  <th class="text-center">Academic</th>
                  <th class="text-center">Financial</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in enrolledStudents" :key="item.id || idx" @click="handleStudentClick(item)"
                  class="group cursor-pointer hover:bg-surface-light transition-colors">
                  <td class="text-center font-bold text-content-muted/40">{{ idx + 1 }}</td>
                  <td>
                    <div class="flex items-center gap-md">
                      <div class="w-8 h-8 rounded-full overflow-hidden border border-outline-std">
                        <img :src="item.studentPhoto || getImageUrl('profiles/avatar-student')"
                          class="w-full h-full object-cover" />
                      </div>
                      <span
                        class="font-black text-content-dark tracking-tighter group-hover:text-primary transition-colors">{{
                        item.studentName }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="text-xs font-bold text-content-muted">{{
                      item.enrollAt || 'N/A'
                      }}</span>
                  </td>
                  <td class="text-center">
                    <StatusBadge :status="item.academicStatus" />
                  </td>
                  <td class="text-center">
                    <StatusBadge :status="item.displayStatus" />
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="flex flex-col items-center justify-center p-20 gap-md opacity-30">
              <img :src="getImageUrl('common/no-data')" class="w-20" />
              <p class="text-sm font-bold">No active enrollments found for this program.</p>
            </div>
          </div>

          <div v-if="activeTab === 'classes'">
            <div class="ui-section-header">
              <h3 class="ui-section-title">Attendance Tracking Ledger</h3>
            </div>
            <table class="ui-premium-table">
              <thead>
                <tr>
                  <th>Execution Date</th>
                  <th>Scheduled Day</th>
                  <th>Time Allocation</th>
                  <th class="text-center">Registry Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in sessionInstances" :key="item.id">
                  <td>
                    <span class="font-black text-content-dark tracking-tighter">{{
                      item.date
                      }}</span>
                  </td>
                  <td>
                    <span class="text-xs font-black text-content-muted uppercase">{{
                      item.day
                      }}</span>
                  </td>
                  <td>
                    <span class="text-xs font-bold text-content-muted">{{ item.timeslot }}</span>
                  </td>
                  <td class="text-center">
                    <StatusBadge :status="item.status" />
                  </td>
                </tr>
                <tr v-if="sessionInstances.length === 0">
                  <td colspan="4" class="py-20 text-center text-content-muted italic text-xs">
                    No execution history initialized for this term.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

      <template #right-content v-if="program">
        <div class="ui-detail-card flex flex-col items-center text-center p-0 overflow-hidden">
          <div class="w-full h-32 bg-primary/5">
            <img :src="getProgramProfileURL(program.profileURL || program.imageURL, program.category)"
              class="w-full h-full object-cover opacity-10 hover:opacity-20 transition-opacity" />
          </div>
          <div class="relative -mt-16 mb-md">
            <div class="w-32 h-32 rounded-std border-4 border-white shadow-xl bg-white p-4">
              <img :src="getProgramProfileURL(program.profileURL || program.imageURL, program.category)
                " alt="Program Icon" class="w-full h-full object-contain" />
            </div>
          </div>

          <div class="px-xl pb-xl w-full">
            <h2 class="text-2xl font-black text-content-dark tracking-tighter mb-md leading-tight">
              {{ program.name || program.title }}
            </h2>

            <div class="w-full h-px bg-surface-light my-xl"></div>

            <DetailedSummaryCard subtitle="Program Synopsis" class="bg-transparent p-0 mt-0">
              <p
                class="text-xs text-content-muted leading-relaxed font-medium text-left bg-surface-subtle p-md rounded-sm border border-outline-std/30 italic">
                {{
                  program.description ||
                  'No descriptive overview provided for this academic program.'
                }}
              </p>
            </DetailedSummaryCard>

            <div class="mt-lg pt-lg border-t border-surface-light w-full">
              <h3 class="text-3xs font-black uppercase text-content-muted tracking-widest mb-md text-left">
                Academic Instructors
              </h3>
              <div class="flex flex-col gap-sm">
                <div v-for="t in program.teachers" :key="t.id"
                  class="flex items-center gap-md p-md bg-surface-light rounded-sm border border-outline-std/20 group">
                  <div
                    class="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-border">
                    <img :src="t.profileURL" alt="Teacher" class="w-full h-full object-cover" />
                  </div>
                  <div class="flex flex-col text-left">
                    <span
                      class="text-sm font-black text-content-dark tracking-tighter group-hover:text-primary transition-colors leading-none mb-1">{{
                        t.name || t.fullname || 'Faculty Staff' }}</span>
                    <span class="text-3xs font-black uppercase text-content-muted tracking-widest">{{ t.role || 'Primary
                      Teacher' }}</span>
                  </div>
                </div>
                <div v-if="!program.teachers || program.teachers.length === 0"
                  class="text-center p-md bg-surface-light rounded-sm italic text-xs text-content-muted opacity-50 font-bold">
                  {{ program.teacherName || 'No staff assigned' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </DetailPageLayout>

    <ProgramActionModal :isOpen="actionModal.isOpen" :type="actionModal.type" :program="actionModal.program"
      :loading="actionModal.loading" :error="actionModal.error" :success="actionModal.success" @close="closeModal"
      @submit="handleActionSubmit" />
  </DashboardLayout>
</template>
