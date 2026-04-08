<script setup>
import { ref, onMounted, computed, watch } from 'vue'
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
import {
  getProgramProfileURL,
  getImageUrl,
  getActionIcon
} from '@/utils/assetHelper'
import { getProgramDisplayStatus, isSessionInProgress } from '@/utils/programHelper'
import ProgramActionModal from '@/components/programs/ProgramActionModal.vue'
import { isPaid } from '@/utils/statusUtils'


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
      userService.getAllStudents()
    ])

    program.value = pData
    sessions.value = Array.isArray(sData) ? sData : []

    // Filter enrollments for this specific program
    const allEnrollments = Array.isArray(eData) ? eData : []
    enrollments.value = allEnrollments.filter(e => String(e.programId || '') === String(id))

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
  // Refresh live status timer every minute
  const interval = setInterval(() => { now.value = new Date() }, 60000)
  return () => clearInterval(interval)
})

const statsCards = computed(() => {
  if (!program.value) return []

  // 1. Paid Enrollments Only
  const paidEnrollmentsCount = enrollments.value.filter(e => isPaid(e.status || e.paymentStatus)).length

  // 2. Revenue (Paid only)
  const totalRevenue = enrollments.value
    .filter(e => isPaid(e.status || e.paymentStatus))
    .reduce((sum, e) => sum + (Number(e.amount || program.value.price || 0)), 0)

  // 3. Remaining Sessions (Scheduled status from instances)
  const scheduledCount = sessionInstances.value.filter(i => i.status === 'Scheduled').length

  // 4. Capacity (Remaining slots count)
  const maxCapacity = Number(program.value.maxCapacity || program.value.capacity || 5)
  const remainingCapacity = Math.max(0, maxCapacity - paidEnrollmentsCount)

  return [
    { label: 'Total Enrolled', value: paidEnrollmentsCount, image: getImageUrl('data-metric-card/total-enrolled'), color: '#e0f2fe' },
    { label: 'Program Revenue', value: `$${totalRevenue.toLocaleString()}`, image: getImageUrl('data-metric-card/program-revenue'), color: '#f0fdf4' },
    { label: 'Remaining Sessions', value: scheduledCount, image: getImageUrl('data-metric-card/remaining-sessions'), color: '#fff7ed' },
    { label: 'Enrollment Capacity', value: remainingCapacity, image: getImageUrl('data-metric-card/enrollment-capacity'), color: remainingCapacity < 2 ? '#fef2f2' : 'var(--bg-subtle)' }
  ]
})

const enrolledStudents = computed(() => {
  if (!enrollments.value.length) return []

  // Use the standard enrollment helper to enrich data (handles Paid/Unpaid/Cancelled + Academic Status)
  const enriched = enrichEnrollments(enrollments.value, [], students.value, [program.value].filter(Boolean))

  return enriched.filter(e => {
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

  sessions.value.forEach(session => {
    const dayName = session.schedule?.day
    if (!dayName) return

    const targetDayIndex = days.indexOf(dayName)
    let current = new Date(start)

    // Align to target day
    while (current.getDay() !== targetDayIndex) {
      current.setDate(current.getDate() + 1)
    }

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0]
      const isToday = dateStr === now.value.toISOString().split('T')[0]
      const isPastDay = current < new Date(now.value.getFullYear(), now.value.getMonth(), now.value.getDate())

      let status = 'Scheduled'
      if (isToday) {
        if (isSessionInProgress(session.schedule, now.value)) {
          status = 'In Progress'
        } else {
          // Simple time check for today's past sessions
          const times = (session.schedule?.timeslot || '').split('-').map(t => t.trim())
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
        status: status
      })

      current.setDate(current.getDate() + 7)
    }
  })

  return instances.sort((a, b) => a.date.localeCompare(b.date))
})

const studentHeaders = [
  { label: 'No', width: '60px', align: 'center' },
  { label: 'Student' },
  { label: 'Enrolled Date' },
  { label: 'Academic Status', align: 'center' },
  { label: 'Payment Status', align: 'center' }
]

const handleStudentClick = (enroll) => {
  const sId = enroll.studentId
  if (sId) {
    router.push(`/students/${sId}`)
  }
}

// Modal Logic
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
      initData() // Refresh page data
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
    <DetailPageLayout :loading="loading" :errorMessage="errorMessage" backRoute="/programs" title="Program Detail">
      <template #header-actions v-if="program">
        <div class="actions-wrapper">
          <button class="btn-icon-modern btn-edit" title="Edit Program" @click="openActionModal('edit')">
            <img :src="getActionIcon('edit')" />
          </button>
          <button class="btn-icon-modern btn-delete" title="Delete Program" @click="openActionModal('delete')">
            <img :src="getActionIcon('delete')" />
          </button>
        </div>
      </template>

      <template #left-content v-if="program">
        <!-- Dashboard-style Metrics Top Row -->
        <div class="metrics-row fade-in">
          <DataMetricCard v-for="card in statsCards" :key="card.label" :label="card.label" :value="card.value"
            :image="card.image" :color="card.color" />
        </div>

        <!-- Custom Tab Navigation Row -->
        <div class="tabs-navigation-wrapper fade-in">
          <div class="tabs-navigation">
            <AppButton variant="ghost" :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">
              Overview
            </AppButton>
            <AppButton variant="ghost" :class="{ active: activeTab === 'students' }" @click="activeTab = 'students'">
              Enrolled Students
            </AppButton>
            <AppButton variant="ghost" :class="{ active: activeTab === 'sessions' }" @click="activeTab = 'sessions'">
              Sessions History
            </AppButton>
          </div>
        </div>

        <!-- Tab Content -->
        <div class="tab-content-container">
          <div v-if="activeTab === 'overview'" class="detail-section-card fade-in">
            <div class="overview-layout-container">
              <!-- Program Metadata Grid (Highlights) -->
              <div class="overview-section">
                <div class="section-header">
                  <h3>Program Highlights</h3>
                </div>
                <div class="grid-2-columns">
                  <div class="info-item vertical">
                    <span class="info-label">CATEGORY:</span>
                    <strong>{{ program.category || 'General' }}</strong>
                  </div>

                  <div class="info-item vertical">
                    <span class="info-label">ACADEMIC TERM:</span>
                    <strong>{{ program.termName || 'Term 1 2026' }}</strong>
                  </div>

                  <div class="info-item vertical">
                    <span class="info-label">LEVEL:</span>
                    <strong>{{ program.levelName || program.level || 'Beginner' }}</strong>
                  </div>

                  <div class="info-item vertical">
                    <span class="info-label">STATUS:</span>
                    <StatusBadge :status="getProgramDisplayStatus(program, sessions, now)" />
                  </div>

                  <div class="info-item vertical">
                    <span class="info-label">START DATE:</span>
                    <strong>{{ program.startDate || 'N/A' }}</strong>
                  </div>

                  <div class="info-item vertical">
                    <span class="info-label">END DATE:</span>
                    <strong>{{ program.endDate || 'N/A' }}</strong>
                  </div>

                  <div class="info-item vertical">
                    <span class="info-label">TOTAL SESSIONS:</span>
                    <strong>{{ program.numberSessions }} Sessions</strong>
                  </div>

                  <div class="info-item vertical">
                    <span class="info-label">TOTAL TUITION FEE:</span>
                    <strong class="price-highlight">${{ (Number(program.price) || 0).toLocaleString() }}</strong>
                  </div>

                  <div class="info-item vertical">
                    <span class="info-label">SCHEDULE:</span>
                    <strong>{{ program.schedule?.day }}</strong>
                    <strong>{{ program.schedule?.timeslot }}</strong>
                  </div>

                  <div class="info-item vertical">
                    <span class="info-label">COST PER SESSION:</span>
                    <strong>${{ (Number(program.price || 0) / (Number(program.numberSessions) || 1)).toFixed(2)
                    }}</strong>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Students Tab -->
          <div v-if="activeTab === 'students'" class="detail-section-card full-width fade-in">
            <div class="section-header">
              <h3>Enrolled Student List</h3>
              <div class="header-search search-wrapper">
                <img :src="getActionIcon('search')" class="search-icon-mini" />
                <input type="text" v-model="searchQuery" placeholder="Search students..." />
              </div>
            </div>
            <div class="table-container">
              <table v-if="enrolledStudents.length > 0">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Student Name</th>
                    <th>Enrolled Date</th>
                    <th class="text-center">Academic Status</th>
                    <th class="text-center">Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in enrolledStudents" :key="item.id || idx" @click="handleStudentClick(item)"
                    class="clickable-row">
                    <td class="text-center">{{ idx + 1 }}</td>
                    <td>
                      <div class="user-info">
                        <div class="avatar-mini">
                          <img :src="item.studentPhoto || getImageUrl('profiles/avatar-student')" alt="student" />
                        </div>
                        <strong>{{ item.studentName }}</strong>
                      </div>
                    </td>
                    <td>{{ item.enrollAt || 'N/A' }}</td>
                    <td class="text-center">
                      <StatusBadge :status="item.academicStatus" />
                    </td>
                    <td class="text-center">
                      <StatusBadge :status="item.displayStatus" />
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="empty-state">
                <p>No students enrolled in this program yet.</p>
              </div>
            </div>
          </div>

          <!-- Sessions History Tab -->
          <div v-if="activeTab === 'sessions'" class="detail-section-card">
            <div class="table-responsive">
              <table class="data-table fixed-layout">
                <thead>
                  <tr>
                    <th style="width: 20%">Date</th>
                    <th style="width: 20%">Day</th>
                    <th style="width: 40%">Time Slot</th>
                    <th class="text-center" style="width: 20%">Status</th>
                  </tr>
                </thead>
                <tbody v-if="sessionInstances.length > 0">
                  <tr v-for="item in sessionInstances" :key="item.id">
                    <td><strong>{{ item.date }}</strong></td>
                    <td>{{ item.day }}</td>
                    <td>{{ item.timeslot }}</td>
                    <td class="text-center">
                      <StatusBadge :status="item.status" />
                    </td>
                  </tr>
                </tbody>
                <tbody v-else>
                  <tr>
                    <td colspan="5" class="text-center" style="padding: 40px; color: #64748b;">
                      No session history available for this period.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>

      <template #right-content v-if="program">
        <div class="profile-header">
          <div class="profile-preview">
            <img :src="getProgramProfileURL(program.profileURL || program.imageURL, program.category)"
              alt="Program Icon" />
          </div>
          <h2 class="profile-title">{{ program.title }}</h2>
        </div>

        <DetailedSummaryCard subtitle="Program Description" style="margin-bottom: 20px;">
          <p class="summary-value">{{ program.description || 'No detailed description provided.' }}</p>
        </DetailedSummaryCard>

        <DetailedSummaryCard subtitle="Assigned Teachers">
          <div class="relationships-list">
            <div v-for="t in program.teachers" :key="t.id" class="relationship-item">
              <img :src="t.profileURL" alt="Teacher" class="small-avatar" />
              <div class="teacher-info">
                <strong>{{ t.name || t.fullname || 'Unknown Teacher' }}</strong>
                <span>{{ t.role || 'Teacher' }}</span>
              </div>
            </div>
            <div v-if="!program.teachers || program.teachers.length === 0" class="text-muted text-center"
              style="padding: 10px;">
              {{ program.teacherName ? program.teacherName : 'No teachers assigned.' }}
            </div>
          </div>
        </DetailedSummaryCard>

      </template>
    </DetailPageLayout>

    <ProgramActionModal :isOpen="actionModal.isOpen" :type="actionModal.type" :program="actionModal.program"
      :loading="actionModal.loading" :error="actionModal.error" :success="actionModal.success" @close="closeModal"
      @submit="handleActionSubmit" />
  </DashboardLayout>
</template>

<style scoped>
/* Search in Header */
.header-search {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 250px;
}

.header-search .search-icon-mini {
  position: absolute;
  left: 12px;
  width: 14px;
  height: 14px;
  opacity: 0.4;
  pointer-events: none;
}

.header-search input {
  width: 100%;
  padding: 8px 12px 8px 34px !important;
  border: 1.5px solid #e2e8f0 !important;
  border-radius: 8px !important;
  font-size: 0.9rem !important;
  outline: none !important;
  background: white !important;
  transition: all 0.2s;
}

.header-search input:focus {
  border-color: #00aeef !important;
  box-shadow: 0 0 0 3px rgba(0, 174, 239, 0.1) !important;
}

@import '@/assets/styles/detail-view.css';

/* Program-specific tweaks */
.q-row {
  display: flex;
  gap: 40px;
}

.session-quick-view {
  margin-top: 30px;
  padding-top: 24px;
  border-top: 1px dashed #e2e8f0;
}

.q-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.q-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.q-value {
  font-size: 1.1rem;
  font-weight: 800;
  color: #1e293b;
}

.schedule-summary-box {
  background: var(--bg-subtle);
  padding: 20px;
  border-radius: 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid #f1f5f9;
}

.schedule-summary-box .day {
  font-size: 1.2rem;
  font-weight: 800;
  color: #00aeef;
}

.schedule-summary-box .time {
  font-size: 1rem;
  font-weight: 600;
  color: #475569;
}

.teachers-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.relationships-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 250px;
  overflow-y: auto;
  padding-right: 8px;
}

/* Custom Clean Scrollbar for Sidebar */
.relationships-list::-webkit-scrollbar {
  width: 5px;
}

.relationships-list::-webkit-scrollbar-track {
  background: transparent;
}

.relationships-list::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}

.relationships-list::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

.relationship-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-subtle);
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  transition: all 0.2s;
}

.relationship-item:hover {
  background: #f1f5f9;
  border-color: #e2e8f0;
}

.relationship-item.clickable {
  cursor: pointer;
}

.relationship-item.clickable:hover {
  transform: translateX(4px);
}

.small-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.teacher-info {
  display: flex;
  flex-direction: column;
}

.teacher-info strong {
  font-size: 1rem;
  color: #0f172a;
}

.teacher-info span {
  font-size: 0.8rem;
  color: #94a3b8;
}

.text-center {
  text-align: center;
}

.grid-2-columns {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.mt-4 {
  margin-top: 32px;
}

.overview-layout-container {
  display: flex;
  flex-direction: column;
}

.data-table.fixed-layout {
  table-layout: fixed;
}

.overview-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar-info-group {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sidebar-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 20px 0;
  border: none;
}

/* Scrollable Tables Styling */
.table-container,
.table-responsive {
  max-height: 480px;
  overflow-y: auto;
  padding-right: 4px;
}

.table-container table,
.table-responsive table {
  border-collapse: separate;
  border-spacing: 0;
}

.table-container table thead th,
.table-responsive table thead th {
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
  box-shadow: inset 0 -2px 0 var(--bg-subtle);
}

/* Custom Scrollbar */
.table-container::-webkit-scrollbar,
.table-responsive::-webkit-scrollbar {
  width: 5px;
}

.table-container::-webkit-scrollbar-track,
.table-responsive::-webkit-scrollbar-track {
  background: transparent;
}

.table-container::-webkit-scrollbar-thumb,
.table-responsive::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}

.table-container::-webkit-scrollbar-thumb:hover,
.table-responsive::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>
