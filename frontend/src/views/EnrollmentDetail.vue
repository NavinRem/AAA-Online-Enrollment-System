<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/DashboardLayout.vue'
import AppButton from '@/components/AppButton.vue'
import AppBadge from '@/components/AppBadge.vue'
import DetailCard from '@/components/DetailCard.vue'
import DetailedSummaryCard from '@/components/DetailedSummaryCard.vue'
import { registrationService } from '@/services/registrationService'
import { userService } from '@/services/userService'
import { courseService } from '@/services/courseService'

// Images
import parentAvatar from '@/assets/images/female-profile-parent.jpg'
import childAvatar from '@/assets/images/child-profile.png'
import courseAvatar from '@/assets/images/robotic-class.png'
import sessionAvatar from '@/assets/images/program.png'

const route = useRoute()
const router = useRouter()

const enrollment = ref(null)
const parent = ref(null)
const student = ref(null)
const course = ref(null)
const session = ref(null)

const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  try {
    const id = route.params.id
    if (!id) throw new Error('No Enrollment ID provided')

    const data = await registrationService.get(id)
    if (!data) throw new Error('Enrollment not found')
    enrollment.value = data

    const [userRes, allUsersRes, allStudentsRes, courseRes, sessionsRes] = await Promise.allSettled(
      [
        userService.getProfile(data.parent_id),
        userService.getAllUsers(),
        userService.getAllStudents(),
        courseService.getCourse(data.course_id),
        courseService.getSessions(data.course_id),
      ],
    )

    if (userRes.status === 'fulfilled' && userRes.value) parent.value = userRes.value
    else if (allUsersRes.status === 'fulfilled') {
      parent.value = (allUsersRes.value || []).find((u) => u.uid === data.parent_id) || {
        name: data.parentName || 'Unknown',
        email: 'N/A',
        role: 'parent',
      }
    }

    if (allStudentsRes.status === 'fulfilled') {
      student.value = (allStudentsRes.value || []).find((s) => s.id === data.student_id) || {
        fullname: data.studentName || 'Unknown',
      }
    }

    if (courseRes.status === 'fulfilled')
      course.value = courseRes.value || { title: data.courseTitle || 'Unknown' }

    if (sessionsRes.status === 'fulfilled') {
      session.value = (sessionsRes.value || []).find((s) => s.id === data.session_id) || {
        schedule: { day: 'Unknown', timeslot: data.sessionSchedule || '' },
      }
    }
  } catch (error) {
    errorMessage.value = error.message || 'Failed to load details'
  } finally {
    loading.value = false
  }
})

// Helpers
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return (
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  )
}

const calculateAge = (dob) => {
  if (!dob) return 'N/A'
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age
}
</script>

<template>
  <DashboardLayout>
    <div class="dashboard-content detail-page">
      <div v-if="loading" class="loading-state">Loading details...</div>
      <div v-else-if="errorMessage" class="error-state">
        <p>⚠️ {{ errorMessage }}</p>
        <AppButton variant="subtle" @click="router.push('/enrollments')">Go Back</AppButton>
      </div>

      <div v-else class="detail-container">
        <div class="header-section">
          <h1 class="page-title">Registration Details</h1>
          <div class="header-right-tools">
            <AppButton variant="light" size="sm" @click="router.push('/enrollments')">
              Back
            </AppButton>
          </div>
        </div>

        <div class="content-grid">
          <div class="main-cards-grid">
            <DetailCard title="Parent/Guardian Information" :avatarUrl="parentAvatar">
              <p><strong>Fullname:</strong> {{ parent?.name || enrollment.parentName || 'N/A' }}</p>
              <p><strong>Email:</strong> {{ parent?.email || 'N/A' }}</p>
              <p><strong>Phone Number:</strong> {{ parent?.phone || 'N/A' }}</p>
              <p>
                <strong>Role:</strong>
                {{ parent?.role === 'parent' ? 'Parent' : parent?.role || 'Guardian' }}
              </p>
            </DetailCard>

            <DetailCard title="Student Information" :avatarUrl="childAvatar">
              <p>
                <strong>Fullname:</strong>
                {{ student?.fullname || student?.name || enrollment.studentName || 'N/A' }}
              </p>
              <p><strong>Date of birth:</strong> {{ student?.dob || 'N/A' }}</p>
              <p><strong>Age:</strong> {{ calculateAge(student?.dob) }}</p>
              <p>
                <strong>Medical Note:</strong>
                {{ student?.medicalNotes || student?.medical_note || 'None' }}
              </p>
            </DetailCard>

            <DetailCard title="Enrollment Information" :avatarUrl="courseAvatar">
              <p>
                <strong>Course title:</strong>
                {{ course?.title || enrollment.courseTitle || 'N/A' }}
              </p>
              <p>
                <strong>Session:</strong> {{ session?.schedule?.day || 'N/A' }},
                {{
                  session?.schedule?.timeslot ||
                  session?.schedule?.startTime + '-' + session?.schedule?.endTime ||
                  enrollment.sessionSchedule ||
                  'N/A'
                }}
              </p>
              <p><strong>Number Session Enrolled:</strong> {{ session?.totalSessions || 11 }}</p>
              <p>
                <strong>Date:</strong>
                {{
                  formatDate(enrollment.enrollAt || enrollment.createdAt || enrollment.timestamp)
                }}
              </p>
            </DetailCard>

            <DetailCard title="Session Information" :avatarUrl="sessionAvatar">
              <p><strong>Course:</strong> {{ course?.title || enrollment.courseTitle || 'N/A' }}</p>
              <p>
                <strong>Instructor Name:</strong>
                {{ session?.instructorName || session?.instructor_name || 'Teachername' }}
              </p>
              <p><strong>Total Student:</strong> {{ session?.capacity || 11 }}</p>
              <p>
                <strong>Time Slot:</strong> {{ session?.schedule?.day || 'N/A' }},
                {{
                  session?.schedule?.timeslot ||
                  session?.schedule?.startTime + '-' + session?.schedule?.endTime ||
                  enrollment.sessionSchedule ||
                  'N/A'
                }}
              </p>
            </DetailCard>
          </div>

          <div class="sidebar-cards">
            <DetailedSummaryCard title="Basic Information">
              <div class="detail-row align-center mb-2">
                <strong class="summary-header">Registration Status</strong>
              </div>
              <div class="detail-row mb-3">
                <span class="summary-label mr-2">Status:</span>
                <AppBadge
                  :text="
                    enrollment.status === 'cancelled'
                      ? 'Canceled'
                      : enrollment.paymentStatus?.toLowerCase() === 'paid'
                        ? 'Paid'
                        : 'Unpaid'
                  "
                  :type="
                    enrollment.status === 'cancelled'
                      ? 'danger'
                      : enrollment.paymentStatus?.toLowerCase() === 'paid'
                        ? 'success'
                        : 'warning'
                  "
                />
              </div>
              <div class="mt-3">
                <p class="summary-label">Registration ID:</p>
                <p class="summary-value">{{ enrollment.id }}</p>
              </div>
              <div class="mt-3">
                <p class="summary-label">Registration Date:</p>
                <p class="summary-value">
                  {{
                    formatDate(enrollment.enrollAt || enrollment.createdAt || enrollment.timestamp)
                  }}
                </p>
              </div>
            </DetailedSummaryCard>

            <DetailedSummaryCard title="Payment Summary">
              <div class="detail-row align-center">
                <span class="summary-header">Total Amount</span>
                <AppBadge
                  :text="'$' + (enrollment.amount || enrollment.totalAmount || 180)"
                  type="primary"
                />
              </div>
              <div class="mt-3">
                <p class="summary-label">Transaction ID:</p>
                <p class="summary-value">{{ enrollment.paymentProof || 'N/A' }}</p>
              </div>
              <div class="mt-3">
                <p class="summary-label">Payment Date:</p>
                <p class="summary-value">
                  {{
                    enrollment.paymentStatus?.toLowerCase() === 'paid'
                      ? formatDate(enrollment.updatedAt || enrollment.enrollAt)
                      : 'Pending'
                  }}
                </p>
              </div>
            </DetailedSummaryCard>

            <DetailedSummaryCard title="Program Summary">
              <div class="detail-row">
                <p class="summary-label">Course:</p>
                <p class="summary-value inline">
                  {{ course?.title || enrollment.courseTitle || 'N/A' }}
                </p>
              </div>
              <div class="mt-3">
                <p class="summary-label">Schedule:</p>
                <p class="summary-value">
                  {{ session?.schedule?.day || 'N/A' }},
                  {{
                    session?.schedule?.timeslot ||
                    session?.schedule?.startTime + '-' + session?.schedule?.endTime ||
                    enrollment.sessionSchedule ||
                    'N/A'
                  }}
                </p>
              </div>
              <div class="mt-3">
                <AppBadge text="Start Date" type="success" size="sm" class="mb-1" />
                <p class="summary-value date-sub">
                  {{ formatDate(session?.startDate || enrollment.enrollAt) }}
                </p>
              </div>
              <div class="mt-3">
                <AppBadge text="End Date" type="danger" size="sm" class="mb-1" />
                <p class="summary-value date-sub">
                  {{
                    formatDate(
                      session?.endDate ||
                        new Date(
                          new Date(enrollment.enrollAt || new Date()).getTime() +
                            30 * 24 * 60 * 60 * 1000,
                        ).toISOString(),
                    )
                  }}
                </p>
              </div>
            </DetailedSummaryCard>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.detail-page {
  padding: 30px;
  max-width: 1400px;
  margin: 0 auto;
}
.loading-state,
.error-state {
  text-align: center;
  padding: 50px;
  font-size: 1.1rem;
  color: #666;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}
.header-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
}
.page-title {
  font-size: 2.2rem;
  font-weight: 800;
  color: #1a1a1a;
  letter-spacing: -1px;
  margin: 0;
}
.header-right-tools {
  display: flex;
  gap: 12px;
}
.content-grid {
  display: grid;
  grid-template-columns: 2.2fr 1fr;
  gap: 24px;
  align-items: start;
}
.main-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.sidebar-cards {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.detail-row {
  display: flex;
  align-items: center;
}
.detail-row.align-center {
  justify-content: space-between;
}
.summary-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #555;
  margin: 0 0 4px;
}
.summary-value {
  font-size: 0.9rem;
  color: #1a1a1a;
  margin: 0;
  font-weight: 500;
  line-height: 1.4;
}
.summary-value.inline {
  display: inline-block;
  margin-left: 8px;
}
.mt-3 {
  margin-top: 15px;
}
.mr-2 {
  margin-right: 8px;
}
.mb-1 {
  margin-bottom: 5px;
}
.mb-2 {
  margin-bottom: 8px;
}
.mb-3 {
  margin-bottom: 12px;
}
.summary-header {
  font-weight: 800;
  color: #1a1a1a;
  font-size: 1rem;
}
.date-sub {
  font-size: 0.95rem;
  color: #1a1a1a;
  font-weight: 700;
}

@media (max-width: 1100px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .main-cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>
