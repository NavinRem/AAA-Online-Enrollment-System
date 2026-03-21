<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import StatusBadge from '@/components/common/ui/StatusBadge.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import DetailedSummaryCard from '@/components/common/cards/DetailedSummaryCard.vue'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'
import { courseService } from '@/services/courseService'
import { enrollmentService } from '@/services/enrollmentService'
import { userService } from '@/services/userService'
import { getCourseIcon } from '@/utils/courseHelper'
import { getProgramDisplayStatus, isSessionInProgress } from '@/utils/programHelper'
import { enrichEnrollments } from '@/utils/enrollmentHelper'
import { isPaid, getStatusDisplay, getStatusCategory } from '@/utils/statusHelper'
import { getImageUrl, getIconUrl } from '@/utils/assetHelper'


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

const fetchAllData = async () => {
  const id = route.params.id
  loading.value = true
  errorMessage.value = ''

  try {
    const [pData, sData, eData, stdData] = await Promise.all([
      courseService.getCourse(id),
      courseService.getSessions(id),
      enrollmentService.getAllEnrollments(),
      userService.getAllStudents()
    ])

    program.value = pData
    sessions.value = Array.isArray(sData) ? sData : []

    // Filter enrollments for this specific program
    const allEnrollments = Array.isArray(eData) ? eData : []
    enrollments.value = allEnrollments.filter(e => String(e.courseId || e.course_id) === String(id))

    students.value = Array.isArray(stdData) ? stdData : []
  } catch (err) {
    console.error('Error fetching program details:', err)
    errorMessage.value = 'Failed to load program details'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAllData()
  // Refresh live status timer every minute
  const interval = setInterval(() => { now.value = new Date() }, 60000)
  return () => clearInterval(interval)
})

const statsCards = computed(() => {
  if (!program.value) return []

  const totalEnrolled = enrollments.value.length
  // Revenue: Sum of enrollment amounts ONLY if status is PAID
  const totalRevenue = enrollments.value
    .filter(e => isPaid(e.status || e.paymentStatus))
    .reduce((sum, e) => sum + (Number(e.amount || program.value.price || 0)), 0)

  // Capacity: Enrolled vs Total Capacity of all sessions
  const totalCapacity = sessions.value.reduce((sum, s) => sum + (Number(s.capacity) || 20), 0)
  const capacityPercent = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0

  return [
    { label: 'Total Enrolled', value: totalEnrolled, image: getImageUrl('data-metric-card/total-enrolled'), color: '#e0f2fe' },
    { label: 'Program Revenue', value: `$${totalRevenue.toLocaleString()}`, image: getImageUrl('data-metric-card/program-revenue'), color: '#f0fdf4' },
    { label: 'Remaining Sessions', value: program.value.number_session || program.value.numberSessions || '-', image: getImageUrl('data-metric-card/remaining-sessions'), color: '#fff7ed' },
    { label: 'Enrollment Capacity', value: `${capacityPercent}%`, image: getImageUrl('data-metric-card/enrollment-capacity'), color: capacityPercent > 90 ? '#fef2f2' : '#f8fafc' }
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

const studentHeaders = [
  { label: 'No', width: '60px', align: 'center' },
  { label: 'Student' },
  { label: 'Enrolled Date' },
  { label: 'Academic Status', align: 'center' },
  { label: 'Payment Status', align: 'center' }
]

const handleStudentClick = (enroll) => {
  const sId = enroll.student_id || enroll.studentId
  if (sId) {
    router.push(`/students/${sId}`)
  }
}
</script>

<template>
  <DashboardLayout>
    <DetailPageLayout :loading="loading" :errorMessage="errorMessage" backRoute="/programs" title="Program Detail">
      <template #header-actions v-if="program">
        <div class="actions-wrapper">
          <button class="btn-icon edit" title="Edit Program" @click="openActionModal('edit')">
            ✏️
          </button>
          <button class="btn-icon cancel" title="Override Status" @click="openActionModal('override')">
            ⏸️
          </button>
          <button class="btn-icon delete" title="Delete Program" @click="openActionModal('delete')">
            🗑️
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
              Sessions
            </AppButton>
          </div>

          <div class="global-filter">
            <AppButton variant="secondary" size="sm">Filter</AppButton>
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
                <div class="detail-info-group grid-2-columns">
                  <div class="info-item vertical">
                    <span>CATEGORY:</span>
                    <strong>{{ program.category || 'General' }}</strong>
                  </div>

                  <div class="info-item vertical">
                    <span>ACADEMIC TERM:</span>
                    <strong>{{ program.termName || 'Term 1 2026' }}</strong>
                  </div>

                  <div class="info-item vertical">
                    <span>LEVEL:</span>
                    <strong>{{ program.levelName || program.level || 'Beginner' }}</strong>
                  </div>

                  <div class="info-item vertical">
                    <span>STATUS:</span>
                    <StatusBadge :status="getProgramDisplayStatus(program, sessions, now)" />
                  </div>

                  <div class="info-item vertical">
                    <span>START DATE:</span>
                    <strong>{{ program.startDate || 'N/A' }}</strong>
                  </div>

                  <div class="info-item vertical">
                    <span>END DATE:</span>
                    <strong>{{ program.endDate || 'N/A' }}</strong>
                  </div>

                </div>
              </div>

              <!-- Program Description -->
              <div class="overview-section">
                <div class="section-header">
                  <h3>Program Description</h3>
                </div>
                <div class="description-text">
                  <p>{{ program.description || 'No detailed description provided for this program.' }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Students Tab -->
          <div v-if="activeTab === 'students'" class="detail-section-card full-width fade-in">
            <div class="section-header">
              <h3>Enrolled Student List</h3>
              <div class="header-search">
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

          <!-- Sessions Tab -->
          <div v-if="activeTab === 'sessions'" class="detail-section-card full-width fade-in">
            <div class="section-header">
              <h3>Academic Schedule</h3>
            </div>
            <div class="table-container">
              <table v-if="sessions.length > 0">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Schedule Day</th>
                    <th>Time Slot</th>
                    <th class="text-center">Capacity</th>
                    <th class="text-center">Current Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in sessions" :key="item.id || idx">
                    <td class="text-center">{{ idx + 1 }}</td>
                    <td><strong>{{ item.schedule?.day }}</strong></td>
                    <td>{{ item.schedule?.timeslot }}</td>
                    <td class="text-center">{{ item.capacity || 20 }}</td>
                    <td class="text-center">
                      <StatusBadge :status="isSessionInProgress(item.schedule, now) ? 'In Progress' : 'Scheduled'" />
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="empty-state">
                <p>No sessions scheduled for this program.</p>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #right-content v-if="program">
        <DetailedSummaryCard subtitle="Assigned Teachers" style="margin-top: 10px;">
          <template #outside>
            <div class="profile-header">
              <div class="profile-preview">
                <img
                  :src="program.imageURL || getCourseIcon(program.category || program.title) || getImageUrl('programs/program')"
                  @error="(e) => (e.target.src = getImageUrl('programs/program'))" alt="Program Icon" />
              </div>
              <h2 class="profile-title">{{ program.title }}</h2>
            </div>
          </template>
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

        <DetailedSummaryCard subtitle="Tuition & Schedule" style="margin-top: 10px;">
          <div class="detail-info-group">
            <div class="info-item vertical">
              <span>TOTAL DURATION:</span>
              <strong>{{ program.number_session || program.numberSessions }} Sessions</strong>
            </div>

            <div class="info-item vertical">
              <span>COST PER SESSION:</span>
              <strong>${{ (program.price / (program.number_session || program.numberSessions)).toFixed(2) }} /
                Session</strong>
            </div>

            <div class="info-item vertical">
              <span>TOTAL TUITION FEE:</span>
              <strong class="price-highlight">${{ (Number(program.price) || 0).toLocaleString() }}</strong>
            </div>
            <div class="info-item vertical">
              <span>SCHEDULE:</span>
              <strong>{{ program.schedule?.day }} - {{ program.schedule?.timeslot }}</strong>
            </div>
          </div>
        </DetailedSummaryCard>
      </template>
    </DetailPageLayout>
  </DashboardLayout>
</template>

<style scoped>
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
  background: #f8fafc;
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
}

.relationship-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
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
  gap: 40px;
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
</style>
