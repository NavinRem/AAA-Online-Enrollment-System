<script setup>
import { ref, onMounted, computed } from 'vue'
import DashboardLayout from '../components/DashboardLayout.vue'
import SummaryCard from '../components/SummaryCard.vue'
import { registrationService } from '../services/registrationService'
import { userService } from '../services/userService'
import { courseService } from '../services/courseService'

const registrations = ref([])
const parents = ref([])
const students = ref([])
const courses = ref([])
const sessions = ref([])
const loading = ref(true)
const searchQuery = ref('')
const showModal = ref(false)
const submitting = ref(false)

const formData = ref({
  parentId: '',
  studentId: '',
  courseId: '',
  sessionId: '',
})

onMounted(async () => {
  await fetchRegistrations()
  await loadFormData()
})

const fetchRegistrations = async () => {
  try {
    loading.value = true
    const data = await registrationService.getAll()
    registrations.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch registrations', error)
  } finally {
    loading.value = false
  }
}

const loadFormData = async () => {
  try {
    const [usersRes, coursesRes, studentsRes] = await Promise.all([
      userService.getAllUsers(),
      courseService.getAllCourses(),
      userService.getAllStudents(),
    ])
    parents.value = Array.isArray(usersRes)
      ? usersRes.filter((u) => u.role === 'parent' || u.role === 'guardian')
      : []
    courses.value = Array.isArray(coursesRes) ? coursesRes : []
    students.value = Array.isArray(studentsRes) ? studentsRes : []
  } catch (err) {
    console.error('Failed to load form data', err)
  }
}

const availableStudents = computed(() => {
  if (!formData.value.parentId) return []
  return students.value.filter(
    (s) => s.parentId === formData.value.parentId || s.parent_id === formData.value.parentId,
  )
})

const selectedCoursePrice = computed(() => {
  const c = courses.value.find((c) => c.id === formData.value.courseId)
  return c ? c.price || 180 : 0
})

const handleCourseChange = async () => {
  formData.value.sessionId = ''
  if (!formData.value.courseId) {
    sessions.value = []
    return
  }
  try {
    const data = await courseService.getSessions(formData.value.courseId)
    sessions.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Failed to load sessions', err)
  }
}

const handleCreateEnrollment = async () => {
  if (
    !formData.value.parentId ||
    !formData.value.studentId ||
    !formData.value.courseId ||
    !formData.value.sessionId
  )
    return
  submitting.value = true
  try {
    const parent = parents.value.find((p) => p.uid === formData.value.parentId)
    const student = students.value.find((s) => s.id === formData.value.studentId)
    const course = courses.value.find((c) => c.id === formData.value.courseId)
    const session = sessions.value.find((s) => s.id === formData.value.sessionId)

    const payload = {
      parent_id: parent.uid,
      parentName: parent.name || parent.email || 'Parent',
      student_id: student.id,
      studentName: student.fullname || student.name || 'Student',
      course_id: course.id,
      courseTitle: course.title || course.name || 'Course',
      session_id: session.id,
      sessionSchedule: session.schedule?.day + ' ' + session.schedule?.timeslot,
      amount: selectedCoursePrice.value,
      status: 'unpaid',
      paymentStatus: 'unpaid',
      enrollAt: new Date().toISOString(),
    }

    await registrationService.createEnrollment(payload)
    showModal.value = false
    formData.value = { parentId: '', studentId: '', courseId: '', sessionId: '' }
    await fetchRegistrations() // Refresh table
  } catch (err) {
    console.error('Failed to create enrollment', err)
    alert('Failed to create enrollment. Please check the console.')
  } finally {
    submitting.value = false
  }
}

const isPaid = (status) => status?.toLowerCase() === 'paid' || status?.toLowerCase() === 'confirmed'
const isCancelled = (status) =>
  status?.toLowerCase() === 'canceled' || status?.toLowerCase() === 'cancelled'
const isUnpaid = (status) => status && !isPaid(status) && !isCancelled(status)

const totalRegistration = computed(() => registrations.value.length)
const totalPaidRegistration = computed(
  () => registrations.value.filter((r) => isPaid(r.status || r.paymentStatus)).length,
)
const totalCancelledRegistration = computed(
  () => registrations.value.filter((r) => isCancelled(r.status || r.paymentStatus)).length,
)
const totalUnpaidRegistration = computed(
  () => registrations.value.filter((r) => isUnpaid(r.status || r.paymentStatus)).length,
)

const filteredRegistrations = computed(() => {
  if (!searchQuery.value) return registrations.value
  const query = searchQuery.value.toLowerCase()
  return registrations.value.filter(
    (r) =>
      (r.parentName || r.parent_name || '').toLowerCase().includes(query) ||
      (r.studentName || r.student_name || '').toLowerCase().includes(query) ||
      (r.courseTitle || r.course_title || '').toLowerCase().includes(query),
  )
})

const formatSession = (item) => {
  return item.sessionSchedule || 'N/A'
}

const formatSessionCount = (item) => {
  return item.sessionCount || 'N/A'
}

const getStatusClass = (status) => {
  if (!status) return 'unpaid'
  const lowStatus = status.toLowerCase()
  if (lowStatus === 'canceled' || lowStatus === 'cancelled') return 'canceled'
  if (lowStatus === 'paid' || lowStatus === 'confirmed') return 'paid'
  return 'unpaid'
}

const displayStatus = (status) => {
  if (!status) return 'Unpaid'
  const s = status.toLowerCase()
  if (s === 'canceled' || s === 'cancelled') return 'Cancelled'
  if (s === 'paid' || s === 'confirmed') return 'Paid'
  return 'Unpaid'
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  if (dateString && typeof dateString === 'object' && dateString.seconds) {
    dateString = dateString.toDate().toISOString()
  }
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'N/A'
    const formatted = date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const time = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    return `${formatted} at ${time} UTC+7`
  } catch (e) {
    return dateString
  }
}
</script>

<template>
  <DashboardLayout>
    <div class="page-container">
      <!-- Enrollment Overview Section -->
      <section class="overview-section card-box">
        <h2 class="section-title">Enrollment Overview</h2>
        <div class="cards-row">
          <SummaryCard
            title="Total Enrollment"
            :value="totalRegistration"
            image="registration.png"
            color="#e1f5fe"
          />
          <SummaryCard
            title="Total Paid Enrollment"
            :value="totalPaidRegistration"
            image="paid-reg.png"
            color="#e1f5fe"
          />
          <SummaryCard
            title="Total Unpaid Enrollment"
            :value="totalUnpaidRegistration"
            image="unpaid1.png"
            color="#e1f5fe"
          />
          <SummaryCard
            title="Total Cancelled Enrollment"
            :value="totalCancelledRegistration"
            image="cancel1.png"
            color="#e1f5fe"
          />
        </div>
      </section>

      <!-- Enrollment Lists Section -->
      <section class="table-section card-box">
        <div class="table-header">
          <h2 class="section-title">Enrollment Lists</h2>
          <div class="header-actions">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input v-model="searchQuery" type="text" placeholder="Search Enrollments" />
            </div>
            <button class="filter-btn">Filter</button>
            <button class="add-btn" @click="showModal = true">+ New Enrollment</button>
          </div>
        </div>

        <!-- Add Enrollment Modal -->
        <div v-if="showModal" class="modal-overlay">
          <div class="modal-content">
            <div class="modal-header">
              <h3>Create New Enrollment</h3>
              <button class="close-btn" @click="showModal = false">×</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Select Parent / Guardian</label>
                <select v-model="formData.parentId">
                  <option value="" disabled>Choose a parent</option>
                  <option v-for="p in parents" :key="p.uid" :value="p.uid">
                    {{ p.name || p.email }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Select Student</label>
                <select v-model="formData.studentId" :disabled="!formData.parentId">
                  <option value="" disabled>Choose a student</option>
                  <option v-for="s in availableStudents" :key="s.id" :value="s.id">
                    {{ s.fullname || s.name }}
                  </option>
                </select>
                <small
                  v-if="formData.parentId && availableStudents.length === 0"
                  class="warning-text"
                >
                  This parent has no registered students.
                </small>
              </div>
              <div class="form-group">
                <label>Select Course</label>
                <select v-model="formData.courseId" @change="handleCourseChange">
                  <option value="" disabled>Choose a course</option>
                  <option v-for="c in courses" :key="c.id" :value="c.id">
                    {{ c.title || c.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>Select Session</label>
                <select
                  v-model="formData.sessionId"
                  :disabled="!formData.courseId || sessions.length === 0"
                >
                  <option value="" disabled>Choose a session time</option>
                  <option v-for="s in sessions" :key="s.id" :value="s.id">
                    {{ s.schedule?.day || 'TBD' }} @ {{ s.schedule?.timeslot || 'TBD' }} ({{
                      s.num_student || 0
                    }}/{{ s.capacity || 20 }} enrolled)
                  </option>
                </select>
                <small v-if="formData.courseId && sessions.length === 0" class="warning-text">
                  This course has no active sessions to join.
                </small>
              </div>
              <div v-if="selectedCoursePrice && formData.courseId" class="price-preview">
                Amount to be paid: <strong>${{ selectedCoursePrice }}</strong>
              </div>
            </div>
            <div class="modal-footer">
              <button class="cancel-btn" @click="showModal = false">Cancel</button>
              <button
                class="save-btn"
                @click="handleCreateEnrollment"
                :disabled="
                  !formData.parentId ||
                  !formData.studentId ||
                  !formData.courseId ||
                  !formData.sessionId ||
                  submitting
                "
              >
                {{ submitting ? 'Submitting...' : 'Confirm Enrollment' }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="loading" class="loading-state">Loading enrollments...</div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Parent/Guardian</th>
              <th>Child</th>
              <th>Course</th>
              <th>Session</th>
              <th>#Session</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Enrolled Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in filteredRegistrations" :key="item.id">
              <td>{{ index + 1 }}</td>
              <td class="bold">{{ item.parentName || item.parent_name || 'Parent' }}</td>
              <td>{{ item.studentName || item.student_name || 'Student' }}</td>
              <td>{{ item.courseTitle || item.course_title || 'Course' }}</td>
              <td>{{ formatSession(item) }}</td>
              <td>{{ formatSessionCount(item) }}</td>
              <td>
                <span
                  class="status-badge"
                  :class="getStatusClass(item.status || item.paymentStatus)"
                >
                  {{ displayStatus(item.status || item.paymentStatus) }}
                </span>
              </td>
              <td>
                <span class="amount-badge">${{ item.amount || item.totalAmount || 180 }}</span>
              </td>
              <td>
                {{
                  formatDate(
                    item.enrollAt ||
                      item.createdAt ||
                      item.created_at ||
                      item.registrationDate ||
                      item.timestamp,
                  )
                }}
              </td>
            </tr>
            <tr v-if="filteredRegistrations.length === 0 && !loading">
              <td colspan="9" class="empty-state">No enrollments found.</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.card-box {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
}

.section-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #333;
  margin-top: 0;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
}

.overview-section .section-title::after,
.table-header .section-title::after {
  content: '';
  flex: 1;
  margin-left: 20px;
  height: 1px;
  background-color: #eee;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.table-header .section-title {
  margin-bottom: 0;
  flex: 1;
}

.header-actions {
  display: flex;
  gap: 15px;
  margin-left: 20px;
}

.cards-row {
  display: flex;
  gap: 20px;
  width: 100%;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 15px;
  color: #999;
  font-size: 0.9rem;
}

.search-box input {
  padding: 10px 15px 10px 40px;
  border-radius: 20px;
  border: 1px solid #eee;
  background: #f8f9fa;
  width: 250px;
  font-size: 0.9rem;
}

.search-box input:focus {
  outline: none;
  border-color: #00aeef;
}

.filter-btn {
  background: #81d4fa;
  color: #1a1a1a;
  border: none;
  padding: 10px 25px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  transition: opacity 0.2s;
}

.filter-btn:hover {
  opacity: 0.8;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th {
  padding-bottom: 15px;
  padding-top: 0;
  color: #1a1a1a;
  font-size: 0.85rem;
  font-weight: 700;
  border-bottom: 1px solid #f0f0f0;
}

.data-table td {
  padding: 20px 0;
  font-size: 0.85rem;
  color: #444;
  border-bottom: 1px solid #f8f8f8;
  vertical-align: middle;
}

.bold {
  font-weight: 600;
  color: #1a1a1a;
}

.status-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
}

.status-badge.paid,
.status-badge.confirmed {
  background: #e6f8ea;
  color: #4caf50;
  border: 1px solid #c8e6c9;
}

.status-badge.unpaid,
.status-badge.pending {
  background: #fff9e6;
  color: #fbc02d;
  border: 1px solid #fff59d;
}

.status-badge.canceled,
.status-badge.cancelled {
  background: #fdeaea;
  color: #e53935;
  border: 1px solid #ef9a9a;
}

.amount-badge {
  background: #a2dbff;
  color: #1a1a1a;
  padding: 6px 14px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.8rem;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.add-btn {
  background: #00aeef;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.add-btn:hover {
  background: #0098d1;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  width: 500px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 20px 25px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #1a1a1a;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.form-group select {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: inherit;
  background: #fdfdfd;
}

.form-group select:focus {
  outline: none;
  border-color: #00aeef;
}

.warning-text {
  color: #e53935;
  font-size: 0.8rem;
}

.price-preview {
  background: #e1f5fe;
  padding: 15px;
  border-radius: 10px;
  text-align: center;
  color: #00aeef;
  font-size: 1.1rem;
}

.modal-footer {
  padding: 20px 25px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

.cancel-btn {
  background: white;
  border: 1px solid #ddd;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

.save-btn {
  background: #00aeef;
  color: white;
  border: none;
  padding: 10px 25px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

@media (max-width: 1200px) {
  .cards-row {
    flex-wrap: wrap;
  }
}
</style>
