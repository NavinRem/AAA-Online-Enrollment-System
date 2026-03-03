<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '../components/DashboardLayout.vue'
import { registrationService } from '../services/registrationService'
import { userService } from '../services/userService'
import { courseService } from '../services/courseService'

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

    // Fetch enrollment
    const data = await registrationService.get(id)
    if (!data) throw new Error('Enrollment not found')
    enrollment.value = data

    // Fetch related records in parallel safely
    const [userRes, allUsersRes, allStudentsRes, courseRes, sessionsRes] = await Promise.allSettled(
      [
        userService.getProfile(data.parent_id),
        userService.getAllUsers(),
        userService.getAllStudents(),
        courseService.getCourse(data.course_id),
        courseService.getSessions(data.course_id),
      ],
    )

    // Resolve Parent
    if (userRes.status === 'fulfilled' && userRes.value) {
      parent.value = userRes.value
    } else if (allUsersRes.status === 'fulfilled') {
      parent.value = (allUsersRes.value || []).find((u) => u.uid === data.parent_id)
      if (!parent.value) {
        parent.value = { name: data.parentName || 'Unknown', email: 'N/A', role: 'parent' }
      }
    }

    // Resolve Student
    if (allStudentsRes.status === 'fulfilled') {
      student.value = (allStudentsRes.value || []).find((s) => s.id === data.student_id)
    }
    if (!student.value) {
      student.value = { fullname: data.studentName || 'Unknown' }
    }

    // Resolve Course
    if (courseRes.status === 'fulfilled') {
      course.value = courseRes.value || { title: data.courseTitle || 'Unknown Course' }
    }

    // Resolve Session
    if (sessionsRes.status === 'fulfilled') {
      session.value = (sessionsRes.value || []).find((s) => s.id === data.session_id)
      if (!session.value) {
        session.value = { schedule: { day: 'Unknown', timeslot: data.sessionSchedule || '' } }
      }
    }
  } catch (error) {
    console.error('Failed to load enrollment details', error)
    errorMessage.value = error.message || 'Failed to load details'
  } finally {
    loading.value = false
  }
})

// Format helpers
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return (
    d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) +
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
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}
</script>

<template>
  <DashboardLayout>
    <div class="dashboard-content detail-page">
      <div v-if="loading" class="loading-state">Loading details...</div>
      <div v-else-if="errorMessage" class="error-state">
        <p>⚠️ {{ errorMessage }}</p>
        <button class="back-link" @click="router.push('/enrollments')">Go Back</button>
      </div>

      <div v-else class="detail-container">
        <!-- Header -->
        <div class="header-section">
          <h1 class="page-title">Registration Details</h1>
          <button class="back-btn" @click="router.push('/enrollments')">Back</button>
        </div>

        <div class="content-grid">
          <!-- Left Main Grid -->
          <div class="main-cards-grid">
            <!-- Parent Info Card -->
            <div class="detail-card">
              <h3 class="card-caption">Parent/Guardian Information</h3>
              <div class="avatar-wrapper">
                <img
                  src="/src/assets/parent-avatar.svg"
                  alt="Parent"
                  class="avatar-icon"
                  onerror="
                    this.src =
                      'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%2364748b\'><path d=\'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z\'/></svg>'
                  "
                />
              </div>
              <div class="info-block-light">
                <p>
                  <strong>Fullname:</strong> {{ parent?.name || enrollment.parentName || 'N/A' }}
                </p>
                <p><strong>Email:</strong> {{ parent?.email || 'N/A' }}</p>
                <p><strong>Phone Number:</strong> {{ parent?.phone || 'N/A' }}</p>
                <p>
                  <strong>Role:</strong>
                  {{ parent?.role === 'parent' ? 'Parent' : parent?.role || 'Guardian' }}
                </p>
              </div>
            </div>

            <!-- Student Info Card -->
            <div class="detail-card">
              <h3 class="card-caption">Student Information</h3>
              <div class="avatar-wrapper">
                <img
                  src="/src/assets/child-avatar.svg"
                  alt="Student"
                  class="avatar-icon"
                  onerror="
                    this.src =
                      'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%2300aeef\'><path d=\'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z\'/></svg>'
                  "
                />
              </div>
              <div class="info-block-light">
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
              </div>
            </div>

            <!-- Enrollment Info Card -->
            <div class="detail-card">
              <h3 class="card-caption">Enrollment Information</h3>
              <div class="avatar-wrapper">
                <img
                  src="/src/assets/course-avatar.svg"
                  alt="Course"
                  class="avatar-icon"
                  onerror="
                    this.src =
                      'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%23f59e0b\'><path d=\'M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z\'/></svg>'
                  "
                />
              </div>
              <div class="info-block-light">
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
              </div>
            </div>

            <!-- Session Info Card -->
            <div class="detail-card">
              <h3 class="card-caption">Session Information</h3>
              <div class="avatar-wrapper">
                <img
                  src="/src/assets/session-avatar.svg"
                  alt="Session"
                  class="avatar-icon"
                  onerror="
                    this.src =
                      'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%234ade80\'><path d=\'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95a15.65 15.65 0 00-1.38-3.56A8.03 8.03 0 0118.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.987 7.987 0 015.08 16zm2.95-8H5.08a7.987 7.987 0 013.6-3.56c-.6 1.11-1.06 2.31-1.38 3.56zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 01-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z\'/></svg>'
                  "
                />
              </div>
              <div class="info-block-light">
                <p>
                  <strong>Course:</strong> {{ course?.title || enrollment.courseTitle || 'N/A' }}
                </p>
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
              </div>
            </div>
          </div>

          <!-- Right Sidebar -->
          <div class="sidebar-cards">
            <!-- Basic Information -->
            <div class="summary-card">
              <h3 class="summary-title">Basic Information</h3>
              <div class="summary-content">
                <div class="detail-row align-center">
                  <strong>Registration Status</strong>
                </div>
                <div class="detail-row">
                  <span style="font-size: 0.9rem; margin-right: 8px">Status:</span>
                  <span
                    class="status-badge"
                    :class="{
                      success:
                        enrollment.paymentStatus?.toLowerCase() === 'paid' &&
                        enrollment.status !== 'cancelled',
                      danger: enrollment.status === 'cancelled',
                      warning:
                        enrollment.paymentStatus !== 'paid' && enrollment.status !== 'cancelled',
                    }"
                  >
                    {{
                      enrollment.status === 'cancelled'
                        ? 'Canceled'
                        : enrollment.paymentStatus?.toLowerCase() === 'paid'
                          ? 'Paid'
                          : 'Unpaid'
                    }}
                  </span>
                </div>
                <div class="mt-3">
                  <p class="summary-label">Registration ID:</p>
                  <p class="summary-value">{{ enrollment.id }}</p>
                </div>
                <div class="mt-3">
                  <p class="summary-label">Registration Date:</p>
                  <p class="summary-value">
                    {{
                      formatDate(
                        enrollment.enrollAt || enrollment.createdAt || enrollment.timestamp,
                      )
                    }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Payment Summary -->
            <div class="summary-card">
              <h3 class="summary-title">Payment Summary</h3>
              <div class="summary-content">
                <div class="detail-row align-center">
                  <span style="font-weight: 700; font-size: 0.95rem">Total Amount:</span>
                  <span class="amount-badge"
                    >${{ enrollment.amount || enrollment.totalAmount || 180 }}</span
                  >
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
              </div>
            </div>

            <!-- Program Summary -->
            <div class="summary-card">
              <h3 class="summary-title">Program Summary</h3>
              <div class="summary-content">
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
                    {{ session?.schedule?.timeslot || enrollment.sessionSchedule || 'N/A' }}
                  </p>
                </div>
                <div class="mt-3">
                  <span class="date-badge start">Start Date</span>
                  <p class="summary-value date-sub">
                    {{ formatDate(session?.startDate || enrollment.enrollAt) }}
                  </p>
                </div>
                <div class="mt-3">
                  <span class="date-badge end">End Date</span>
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
              </div>
            </div>
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
  gap: 20px;
  margin-bottom: 25px;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #1a1a1a;
  letter-spacing: -0.5px;
  margin: 0;
}

.back-btn {
  background: #e6f6fd;
  color: #00aeef;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}
.back-btn:hover {
  background: #d4effc;
}

.content-grid {
  display: grid;
  grid-template-columns: 2.2fr 1fr;
  gap: 24px;
  align-items: start;
}

/* Left Grid */
.main-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.detail-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  text-align: center;
  display: flex;
  flex-direction: column;
}

.card-caption {
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 20px;
  font-size: 1.1rem;
}

.avatar-wrapper {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  border-radius: 50%;
  border: 2px solid #e1f5fe;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  background: #fafafa;
}

.avatar-icon {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.info-block-light {
  background: #eef6fc;
  border-radius: 12px;
  padding: 16px;
  text-align: left;
  flex-grow: 1;
}

.info-block-light p {
  margin: 0 0 10px;
  font-size: 0.9rem;
  color: #333;
  line-height: 1.4;
}
.info-block-light p:last-child {
  margin-bottom: 0;
}
.info-block-light p strong {
  color: #1a1a1a;
  font-weight: 700;
  margin-right: 5px;
}

/* Right Sidebar */
.sidebar-cards {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.summary-card {
  background: white;
  border-radius: 16px;
  padding: 0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
  overflow: hidden;
}

.summary-title {
  padding: 20px 20px 15px;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: #1a1a1a;
  border-bottom: 1px solid #f0f0f0;
}

.summary-content {
  background: #eef6fc;
  padding: 20px;
  margin: 20px;
  border-radius: 12px;
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

/* Badges */
.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 700;
  display: inline-block;
  white-space: nowrap;
}
.status-badge.success {
  background: #e6f8ea;
  color: #2e7d32;
}
.status-badge.warning {
  background: #fff8e1;
  color: #f57f17;
}
.status-badge.danger {
  background: #ffebee;
  color: #c62828;
}

.amount-badge {
  background: #00aeef;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.9rem;
}

.date-badge {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  display: inline-block;
  margin-bottom: 5px;
}
.date-badge.start {
  background: #e6f8ea;
  color: #2e7d32;
}
.date-badge.end {
  background: #ffebee;
  color: #c62828;
}
.date-sub {
  font-size: 0.85rem;
  color: #444;
}

/* Responsive */
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
