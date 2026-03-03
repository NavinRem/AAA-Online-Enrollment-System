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
const errorMessage = ref('')
const successMessage = ref('')

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

const parentSearchQuery = ref('')
const isParentDropdownOpen = ref(false)

const filteredParents = computed(() => {
  if (!parentSearchQuery.value) return parents.value
  const q = parentSearchQuery.value.toLowerCase()
  return parents.value.filter(
    (p) => (p.name || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q),
  )
})

const selectedParentLabel = computed(() => {
  if (!formData.value.parentId) return 'Choose a parent'
  const p = parents.value.find((p) => p.uid === formData.value.parentId)
  return p ? p.name || p.email : 'Choose a parent'
})

const selectParent = (uid) => {
  formData.value.parentId = uid
  isParentDropdownOpen.value = false
  errorMessage.value = ''
  formData.value.studentId = ''
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
      status: 'pending',
      paymentStatus: 'unpaid',
      enrollAt: new Date().toISOString(),
    }

    await registrationService.createEnrollment(payload)
    successMessage.value = 'Successfully created enrollment!'
    setTimeout(() => {
      showModal.value = false
      formData.value = { parentId: '', studentId: '', courseId: '', sessionId: '' }
    }, 1500)
    await fetchRegistrations() // Refresh table
  } catch (err) {
    console.error('Failed to create enrollment', err)
    errorMessage.value = err.message || 'Failed to create enrollment. Please try again.'
  } finally {
    submitting.value = false
  }
}

const openModal = () => {
  showModal.value = true
  errorMessage.value = ''
  successMessage.value = ''
  formData.value = { parentId: '', studentId: '', courseId: '', sessionId: '' }
}

const isPaid = (status) => status?.toLowerCase() === 'paid' || status?.toLowerCase() === 'confirmed'
const isCancelled = (status) =>
  status?.toLowerCase() === 'canceled' || status?.toLowerCase() === 'cancelled'

// --- Unified Action Modal State ---
const actionModal = ref({
  isOpen: false,
  type: '', // 'edit', 'pay', 'cancel', 'delete'
  enrollment: null,
  amount: 0,
  proof: '',
  reason: '',
  remark: '',
  deleteConfirm: '',
})

const openActionModal = (type, item) => {
  errorMessage.value = ''
  successMessage.value = ''
  actionModal.value = {
    isOpen: true,
    type,
    enrollment: item,
    amount: item.amount || item.totalAmount || 0,
    proof: '',
    reason: '',
    remark: item.remark || '',
    deleteConfirm: '',
  }
}

const closeActionModal = () => {
  actionModal.value.isOpen = false
}

const submitActionModal = async () => {
  const { type, enrollment, amount, proof, reason, remark, deleteConfirm } = actionModal.value
  submitting.value = true
  errorMessage.value = ''

  try {
    if (type === 'pay') {
      if (!proof.trim()) throw new Error('Proof of payment (e.g. Receipt #) is required.')
      await registrationService.updateEnrollment(enrollment.id, {
        paymentStatus: 'paid',
        paymentProof: proof,
      })
      const idx = registrations.value.findIndex((r) => r.id === enrollment.id)
      if (idx !== -1) registrations.value[idx].paymentStatus = 'paid'
    } else if (type === 'cancel') {
      if (!reason.trim()) throw new Error('A reason for cancellation must be provided.')
      // Call cancel API, but also update backend with the reason using update if supported, or just cancel API.
      await registrationService.cancelEnrollment(enrollment.id)
      await registrationService.updateEnrollment(enrollment.id, { cancelReason: reason })
      const idx = registrations.value.findIndex((r) => r.id === enrollment.id)
      if (idx !== -1) registrations.value[idx].status = 'cancelled'
    } else if (type === 'delete') {
      if (deleteConfirm !== 'DELETE')
        throw new Error('You must type DELETE specifically to confirm.')
      await registrationService.deleteEnrollment(enrollment.id)
      registrations.value = registrations.value.filter((r) => r.id !== enrollment.id)
    } else if (type === 'edit') {
      if (amount < 0) throw new Error('Amount cannot be negative.')
      await registrationService.updateEnrollment(enrollment.id, {
        amount: Number(amount),
        remark: remark.trim(),
      })
      const idx = registrations.value.findIndex((r) => r.id === enrollment.id)
      if (idx !== -1) {
        registrations.value[idx].amount = Number(amount)
        registrations.value[idx].remark = remark.trim()
      }
    }

    successMessage.value = 'Action completed successfully.'
    // Refetch to be safe, or just let local state handle it
    setTimeout(() => {
      closeActionModal()
      successMessage.value = ''
    }, 1500)
  } catch (err) {
    errorMessage.value = err.message || 'Action failed.'
  } finally {
    submitting.value = false
  }
}

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
  let list = [...registrations.value]

  // Sort descending by date (newest enrollment first)
  list.sort((a, b) => {
    const aDate =
      new Date(
        a.enrollAt || a.createdAt || a.created_at || a.registrationDate || a.timestamp,
      ).getTime() || 0
    const bDate =
      new Date(
        b.enrollAt || b.createdAt || b.created_at || b.registrationDate || b.timestamp,
      ).getTime() || 0
    return bDate - aDate
  })

  // Filter list by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    list = list.filter(
      (r) =>
        (r.parentName || r.parent_name || '').toLowerCase().includes(query) ||
        (r.studentName || r.student_name || '').toLowerCase().includes(query) ||
        (r.courseTitle || r.course_title || '').toLowerCase().includes(query),
    )
  }

  return list
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
            <button class="add-btn" @click="openModal">+ New Enrollment</button>
          </div>
        </div>

        <!-- Add Enrollment Modal -->
        <transition name="modal-fade">
          <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
            <div class="modal-content">
              <div class="modal-header">
                <h3>Create New Enrollment</h3>
                <button class="close-btn" @click="showModal = false">×</button>
              </div>
              <div class="modal-body">
                <transition name="toast-fade">
                  <div v-if="errorMessage" class="alert-box error">
                    <span class="icon">⚠️</span> {{ errorMessage }}
                  </div>
                </transition>
                <transition name="toast-fade">
                  <div v-if="successMessage" class="alert-box success">
                    <span class="icon">✅</span> {{ successMessage }}
                  </div>
                </transition>

                <div class="form-grid">
                  <div class="form-group custom-dropdown-container">
                    <label>Select Parent / Guardian</label>
                    <div class="custom-dropdown" :class="{ open: isParentDropdownOpen }">
                      <div
                        class="dropdown-header"
                        @click="isParentDropdownOpen = !isParentDropdownOpen"
                      >
                        {{ selectedParentLabel }}
                        <span class="chevron"></span>
                      </div>
                      <transition name="toast-fade">
                        <div class="dropdown-menu" v-if="isParentDropdownOpen">
                          <div class="dropdown-search">
                            <input
                              type="text"
                              v-model="parentSearchQuery"
                              placeholder="Search name or email..."
                              autofocus
                            />
                          </div>
                          <ul class="dropdown-list">
                            <li
                              v-for="p in filteredParents"
                              :key="p.uid"
                              class="dropdown-item"
                              :class="{ active: formData.parentId === p.uid }"
                              @click="selectParent(p.uid)"
                            >
                              {{ p.name || p.email }}
                            </li>
                            <li
                              v-if="filteredParents.length === 0"
                              class="dropdown-item no-results"
                            >
                              No matches found.
                            </li>
                          </ul>
                        </div>
                      </transition>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Select Student</label>
                    <select
                      v-model="formData.studentId"
                      :disabled="!formData.parentId"
                      @change="errorMessage = ''"
                    >
                      <option value="" disabled>Choose a student</option>
                      <option v-for="s in availableStudents" :key="s.id" :value="s.id">
                        {{ s.fullname || s.name }}
                      </option>
                    </select>
                    <div
                      v-if="formData.parentId && availableStudents.length === 0"
                      style="margin-top: 5px"
                    >
                      <small class="warning-text" style="margin-bottom: 8px">
                        <span class="icon">ℹ️</span> This parent has not registered a child yet.
                      </small>
                      <button
                        class="outline-btn small-btn"
                        @click="$router.push('/dashboard/students')"
                        style="padding: 6px 12px; font-size: 0.8rem"
                      >
                        + Go to Students Directory
                      </button>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Select Course</label>
                    <select
                      v-model="formData.courseId"
                      @change="
                        () => {
                          handleCourseChange()
                          errorMessage = ''
                        }
                      "
                    >
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
                      @change="errorMessage = ''"
                    >
                      <option value="" disabled>Choose a session time</option>
                      <option v-for="s in sessions" :key="s.id" :value="s.id">
                        {{ s.schedule?.day || 'TBD' }} @ {{ s.schedule?.timeslot || 'TBD' }} ({{
                          s.num_student || 0
                        }}/{{ s.capacity || 20 }} enrolled)
                      </option>
                    </select>
                    <small v-if="formData.courseId && sessions.length === 0" class="warning-text">
                      <span class="icon">⚠️</span> This course has no active sessions to join.
                    </small>
                  </div>
                </div>
                <!-- End form-grid -->

                <div v-if="selectedCoursePrice && formData.courseId" class="price-preview">
                  <span class="price-label">Amount to be paid</span>
                  <strong class="price-value">${{ selectedCoursePrice }}</strong>
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
        </transition>

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
              <th>Remark</th>
              <th>Actions</th>
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
                  :class="{
                    danger: isCancelled(item.status),
                    success: isPaid(item.paymentStatus) && !isCancelled(item.status),
                    warning: !isPaid(item.paymentStatus) && !isCancelled(item.status),
                  }"
                >
                  {{
                    isCancelled(item.status)
                      ? 'CANCELED'
                      : isPaid(item.paymentStatus)
                        ? 'PAID'
                        : 'UNPAID'
                  }}
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
              <td class="remark-cell">
                <span v-if="item.remark" class="remark-text" :title="item.remark">{{
                  item.remark
                }}</span>
                <span v-else class="text-muted">-</span>
              </td>
              <td class="action-cell">
                <div class="inline-actions">
                  <button
                    class="btn-icon edit"
                    title="Edit Enrollment"
                    @click="openActionModal('edit', item)"
                  >
                    ✏️
                  </button>
                  <button
                    v-if="!isPaid(item.paymentStatus) && !isCancelled(item.status)"
                    class="btn-icon check"
                    title="Mark as Paid"
                    @click="openActionModal('pay', item)"
                  >
                    ✓
                  </button>
                  <button
                    v-if="!isCancelled(item.status)"
                    class="btn-icon cancel"
                    title="Cancel Enrollment"
                    @click="openActionModal('cancel', item)"
                  >
                    🚫
                  </button>
                  <button
                    class="btn-icon delete"
                    title="Delete Permanently"
                    @click="openActionModal('delete', item)"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredRegistrations.length === 0 && !loading">
              <td colspan="11" class="empty-state">No enrollments found.</td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Action Modals (Edit, Pay, Cancel, Delete) -->
      <transition name="modal-fade">
        <div v-if="actionModal.isOpen" class="modal-overlay" @click.self="closeActionModal">
          <div class="modal-content action-modal">
            <div class="modal-header">
              <h3 v-if="actionModal.type === 'edit'">Edit Enrollment</h3>
              <h3 v-if="actionModal.type === 'pay'">Mark as Paid</h3>
              <h3 v-if="actionModal.type === 'cancel'">Cancel Enrollment</h3>
              <h3 v-if="actionModal.type === 'delete'" class="danger-text">Delete Permanently</h3>
              <button class="close-btn" @click="closeActionModal">×</button>
            </div>

            <div class="modal-body">
              <transition name="toast-fade">
                <div v-if="errorMessage" class="alert-box error">
                  <span class="icon">⚠️</span> {{ errorMessage }}
                </div>
              </transition>
              <transition name="toast-fade">
                <div v-if="successMessage" class="alert-box success">
                  <span class="icon">✅</span> {{ successMessage }}
                </div>
              </transition>

              <!-- Edit Amount Form -->
              <div v-if="actionModal.type === 'edit'" class="form-group full-width">
                <div class="info-block">
                  <span class="icon">ℹ️</span>
                  <p>
                    <strong>Update Enrollment:</strong> Adjust the administrative price below or
                    attach a special remark/note to this specific enrollment.
                  </p>
                </div>
                <label>Adjust Enrollment Amount ($)</label>
                <input type="number" v-model="actionModal.amount" min="0" step="0.01" />

                <label style="margin-top: 15px">Special Remark / Note (Optional)</label>
                <textarea
                  v-model="actionModal.remark"
                  placeholder="Please write your remark here..."
                ></textarea>
                <div class="preset-chips">
                  <button
                    type="button"
                    class="preset-chip"
                    :class="{ active: actionModal.remark === 'VIP Student' }"
                    @click="actionModal.remark = 'VIP Student'"
                  >
                    VIP Student
                  </button>
                  <button
                    type="button"
                    class="preset-chip"
                    :class="{ active: actionModal.remark === 'Needs extra attention' }"
                    @click="actionModal.remark = 'Needs extra attention'"
                  >
                    Needs extra attention
                  </button>
                  <button
                    type="button"
                    class="preset-chip"
                    :class="{ active: actionModal.remark === 'Parent will pay next week' }"
                    @click="actionModal.remark = 'Parent will pay next week'"
                  >
                    Parent will pay next week
                  </button>
                  <button
                    type="button"
                    class="preset-chip"
                    :class="{ active: actionModal.remark === 'Pending partial refund' }"
                    @click="actionModal.remark = 'Pending partial refund'"
                  >
                    Pending partial refund
                  </button>
                </div>
              </div>

              <!-- Mark Paid Form -->
              <div v-if="actionModal.type === 'pay'" class="form-group full-width">
                <div class="info-block">
                  <span class="icon">💡</span>
                  <p>
                    <strong>How to provide proof:</strong> Please enter the transaction reference
                    number provided by the bank, or type "Cash" followed by the receipt number you
                    gave the parent.
                  </p>
                </div>
                <label>Proof of Payment Reference <span class="required">*</span></label>
                <textarea
                  v-model="actionModal.proof"
                  placeholder="Please write the bank reference number or method here..."
                ></textarea>
                <div class="preset-chips">
                  <button
                    type="button"
                    class="preset-chip"
                    :class="{ active: actionModal.proof === 'Paid in Cash' }"
                    @click="actionModal.proof = 'Paid in Cash'"
                  >
                    Paid in Cash
                  </button>
                  <button
                    type="button"
                    class="preset-chip"
                    :class="{ active: actionModal.proof === 'Paid via Check' }"
                    @click="actionModal.proof = 'Paid via Check'"
                  >
                    Paid via Check
                  </button>
                  <button
                    type="button"
                    class="preset-chip"
                    :class="{ active: actionModal.proof === 'Paid via Bank Transfer' }"
                    @click="actionModal.proof = 'Paid via Bank Transfer'"
                  >
                    Paid via Bank Transfer
                  </button>
                  <button
                    type="button"
                    class="preset-chip"
                    :class="{ active: actionModal.proof === 'Paid via Credit Card' }"
                    @click="actionModal.proof = 'Paid via Credit Card'"
                  >
                    Paid via Credit Card
                  </button>
                </div>
              </div>

              <!-- Cancel Form -->
              <div v-if="actionModal.type === 'cancel'" class="form-group full-width">
                <div class="info-block warning">
                  <span class="icon">⚠️</span>
                  <p>
                    <strong>Cancellation Policy:</strong> A cancellation stops this student from
                    attending the course. You MUST provide the exact reason (e.g., Parent email
                    request on [Date]).
                  </p>
                </div>
                <label>Reason for Cancellation <span class="required">*</span></label>
                <textarea
                  v-model="actionModal.reason"
                  placeholder="Please write your reason here..."
                ></textarea>
                <div class="preset-chips">
                  <button
                    type="button"
                    class="preset-chip"
                    :class="{ active: actionModal.reason === 'Parent requested via email' }"
                    @click="actionModal.reason = 'Parent requested via email'"
                  >
                    Parent requested via email
                  </button>
                  <button
                    type="button"
                    class="preset-chip"
                    :class="{ active: actionModal.reason === 'Parent requested via phone' }"
                    @click="actionModal.reason = 'Parent requested via phone'"
                  >
                    Parent requested via phone
                  </button>
                  <button
                    type="button"
                    class="preset-chip"
                    :class="{ active: actionModal.reason === 'Did not pay on time' }"
                    @click="actionModal.reason = 'Did not pay on time'"
                  >
                    Did not pay on time
                  </button>
                  <button
                    type="button"
                    class="preset-chip"
                    :class="{ active: actionModal.reason === 'Course schedule conflict' }"
                    @click="actionModal.reason = 'Course schedule conflict'"
                  >
                    Course schedule conflict
                  </button>
                  <button
                    type="button"
                    class="preset-chip"
                    :class="{ active: actionModal.reason === 'Duplicate enrollment' }"
                    @click="actionModal.reason = 'Duplicate enrollment'"
                  >
                    Duplicate enrollment
                  </button>
                </div>
              </div>

              <!-- Delete Form -->
              <div v-if="actionModal.type === 'delete'" class="form-group full-width">
                <div class="info-block danger">
                  <span class="icon">🛑</span>
                  <p>
                    <strong>Critical Warning:</strong> Deleting an enrollment removes the record
                    entirely. It can never be recovered. This should only be used for accidental
                    duplicate registrations.
                  </p>
                </div>
                <label>Confirm Deletion <span class="required">*</span></label>
                <p style="margin-bottom: 15px; color: #555; font-size: 0.95rem">
                  Please type <strong class="danger-text">DELETE</strong> below to confirm you have
                  authorization to erase this record.
                </p>
                <input type="text" v-model="actionModal.deleteConfirm" placeholder="Type DELETE" />
              </div>
            </div>

            <div class="modal-footer">
              <button class="cancel-btn" @click="closeActionModal">Nevermind</button>
              <button
                class="save-btn"
                :class="{
                  'danger-btn': actionModal.type === 'delete' || actionModal.type === 'cancel',
                }"
                @click="submitActionModal"
                :disabled="submitting"
              >
                {{ submitting ? 'Processing...' : 'Confirm Action' }}
              </button>
            </div>
          </div>
        </div>
      </transition>
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

.amount-badge {
  background: #a2dbff;
  color: #1a1a1a;
  padding: 6px 14px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.8rem;
}

.remark-cell {
  max-width: 150px;
}

.remark-text {
  font-size: 0.8rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 6px 10px;
  border-radius: 30px;
  display: inline-block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: default;
  font-weight: 500;
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

/* Modal Styles & Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .modal-content {
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.modal-fade-enter-from .modal-content,
.modal-fade-leave-to .modal-content {
  transform: scale(0.95) translateY(10px);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #ffffff;
  width: 520px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 25px 30px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fdfdfd;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 800;
  color: #1a1a1a;
  letter-spacing: -0.3px;
}

.close-btn {
  background: #f5f5f5;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  cursor: pointer;
  color: #666;
  transition: all 0.2s ease;
  line-height: 1;
}

.close-btn:hover {
  background: #e0e0e0;
  color: #1a1a1a;
  transform: rotate(90deg);
}

.modal-body {
  padding: 20px 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.alert-box {
  padding: 14px 20px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: -5px;
}

.alert-box.error {
  background: #fdeaea;
  color: #c62828;
  border: 1px solid #ef9a9a;
}

.alert-box.success {
  background: #e6f8ea;
  color: #2e7d32;
  border: 1px solid #a5d6a7;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 700;
  color: #444;
  letter-spacing: -0.2px;
}

.form-group select,
.form-group input[type='text'],
.form-group input[type='number'],
.form-group textarea {
  padding: 14px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  font-size: 0.95rem;
  font-family: inherit;
  background: #fcfcfc;
  color: #1a1a1a;
  transition: all 0.2s ease;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-group select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 16px;
}

.form-group select:hover,
.form-group input[type='text']:hover,
.form-group input[type='number']:hover,
.form-group textarea:hover {
  border-color: #b3b3b3;
}

.form-group select:focus,
.form-group input[type='text']:focus,
.form-group input[type='number']:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #00aeef;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(0, 174, 239, 0.1);
}

.form-group select:disabled,
.form-group input:disabled,
.form-group textarea:disabled {
  background-color: #f5f5f5;
  color: #999;
  cursor: not-allowed;
  border-color: #eee;
  background-image: none;
}

.preset-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 5px;
}

.preset-chip {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  padding: 8px 14px;
  font-size: 0.85rem;
  color: #1a1a1a;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  line-height: 1.2;
}

.preset-chip:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.preset-chip.active {
  background: #f0f4f8;
  border-color: #9cb2c6;
  color: #3f5d7d;
}

/* Custom Dropdown Styles */
.custom-dropdown-container {
  position: relative;
}
.custom-dropdown {
  position: relative;
  width: 100%;
}
.dropdown-header {
  padding: 14px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  font-size: 0.95rem;
  background: #fcfcfc;
  color: #1a1a1a;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
}
.dropdown-header:hover {
  border-color: #b3b3b3;
}
.custom-dropdown.open .dropdown-header {
  border-color: #00aeef;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(0, 174, 239, 0.1);
}
.chevron {
  width: 16px;
  height: 16px;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-size: contain;
  background-repeat: no-repeat;
  transition: transform 0.2s;
}
.custom-dropdown.open .chevron {
  transform: rotate(180deg);
}
.dropdown-menu {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  width: 100%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  border: 1px solid #e0e0e0;
  z-index: 100;
  overflow: hidden;
  max-height: 250px;
  display: flex;
  flex-direction: column;
}
.dropdown-search {
  padding: 10px;
  border-bottom: 1px solid #eee;
  background: #fdfdfd;
}
.dropdown-search input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-size: 0.9rem;
  box-sizing: border-box;
  font-family: inherit;
}
.dropdown-search input:focus {
  outline: none;
  border-color: #00aeef;
}
.dropdown-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
}
.dropdown-item {
  padding: 12px 16px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #333;
  transition: background 0.2s;
}
.dropdown-item:hover {
  background: #f5f5f5;
}
.dropdown-item.active {
  background: #e1f5fe;
  color: #00aeef;
  font-weight: 700;
}
.dropdown-item.no-results {
  color: #999;
  cursor: default;
  text-align: center;
}
.dropdown-item.no-results:hover {
  background: white;
}

.warning-text {
  color: #e53935;
  font-size: 0.82rem;
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
}

.price-preview {
  background: linear-gradient(145deg, #f0f7ff, #e1f5fe);
  padding: 20px;
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid rgba(0, 174, 239, 0.1);
  margin-top: 5px;
}

.price-label {
  color: #555;
  font-size: 0.95rem;
  font-weight: 600;
}

.price-value {
  color: #00aeef;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.modal-footer {
  padding: 10px 30px 25px;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  background: transparent;
}

.cancel-btn {
  background: white;
  border: 1px solid #ddd;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  color: #555;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: #f8f9fa;
  color: #1a1a1a;
  border-color: #ccc;
}

.outline-btn {
  background: white;
  border: 1px solid #00aeef;
  color: #00aeef;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.outline-btn:hover {
  background: #f0f9ff;
}

.small-btn {
  padding: 8px 16px;
  font-size: 0.85rem;
  border-radius: 8px;
}

.save-btn {
  background: #00aeef;
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 174, 239, 0.2);
}

.save-btn:hover:not(:disabled) {
  background: #0098d1;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 174, 239, 0.3);
}

.save-btn:disabled {
  background: #e0e0e0;
  color: #999;
  cursor: not-allowed;
  box-shadow: none;
}

/* Inline Actions */
.action-cell {
  vertical-align: middle;
}

.inline-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Action Modal Specific Styles */
.action-modal {
  max-width: 450px;
  padding: 0;
  overflow: hidden;
}

.action-modal .modal-header {
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
  padding: 20px 25px;
}

.action-modal .modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #1a1a1a;
}

.action-modal .modal-body {
  padding: 25px;
}

.action-modal .modal-footer {
  background: #f8f9fa;
  border-top: 1px solid #eee;
  padding: 15px 25px;
}

.info-block {
  background: #e3f2fd;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: flex-start;
}

.info-block .icon {
  font-size: 1.2rem;
}

.info-block p {
  margin: 0;
  font-size: 0.9rem;
  color: #0d47a1;
  line-height: 1.4;
}

.info-block p strong {
  display: block;
  margin-bottom: 10px;
}

.info-block.warning {
  background: #fff9e6;
}

.info-block.warning p {
  color: #b78a00;
}

.info-block.danger {
  background: #fdeaea;
}

.info-block.danger p {
  color: #c62828;
}

@media (max-width: 1200px) {
  .cards-row {
    flex-wrap: wrap;
  }
}
</style>
