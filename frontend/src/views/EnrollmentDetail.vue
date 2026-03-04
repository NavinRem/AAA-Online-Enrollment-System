<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/DashboardLayout.vue'
import AppButton from '@/components/common/AppButton/AppButton.vue'
import StatusBadge from '@/components/common/StatusBadge/StatusBadge.vue'
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

const submitting = ref(false)
const modalError = ref('')
const modalSuccess = ref('')

const actionModal = ref({
  isOpen: false,
  type: '',
  amount: 0,
  proof: '',
  reason: '',
  remark: '',
  deleteConfirm: '',
})

const isPaid = (status) => status?.toLowerCase() === 'paid' || status?.toLowerCase() === 'confirmed'
const isCancelled = (status) =>
  status?.toLowerCase() === 'canceled' || status?.toLowerCase() === 'cancelled'

const openActionModal = (type) => {
  modalError.value = ''
  modalSuccess.value = ''
  actionModal.value = {
    isOpen: true,
    type,
    amount: enrollment.value.amount || enrollment.value.totalAmount || 0,
    proof: '',
    reason: '',
    remark: enrollment.value.remark || '',
    deleteConfirm: '',
  }
}

const closeActionModal = () => {
  actionModal.value.isOpen = false
}

const submitActionModal = async () => {
  const { type, amount, proof, reason, remark, deleteConfirm } = actionModal.value
  submitting.value = true
  modalError.value = ''

  try {
    if (type === 'pay') {
      if (!proof.trim()) throw new Error('Proof of payment (e.g. Receipt #) is required.')
      await registrationService.updateEnrollment(enrollment.value.id, {
        paymentStatus: 'paid',
        paymentProof: proof,
      })
      enrollment.value.paymentStatus = 'paid'
      enrollment.value.paymentProof = proof
    } else if (type === 'cancel') {
      if (!reason.trim()) throw new Error('A reason for cancellation must be provided.')
      await registrationService.cancelEnrollment(enrollment.value.id)
      await registrationService.updateEnrollment(enrollment.value.id, { cancelReason: reason })
      enrollment.value.status = 'cancelled'
    } else if (type === 'delete') {
      if (deleteConfirm !== 'DELETE')
        throw new Error('You must type DELETE specifically to confirm.')
      await registrationService.deleteEnrollment(enrollment.value.id)
      router.push('/enrollments')
      return
    } else if (type === 'edit') {
      if (amount < 0) throw new Error('Amount cannot be negative.')
      await registrationService.updateEnrollment(enrollment.value.id, {
        amount: Number(amount),
        remark: remark.trim(),
      })
      enrollment.value.amount = Number(amount)
      enrollment.value.remark = remark.trim()
    }

    modalSuccess.value = 'Action completed successfully.'
    setTimeout(() => {
      closeActionModal()
    }, 1500)
  } catch (err) {
    modalError.value = err.message || 'Action failed.'
  } finally {
    submitting.value = false
  }
}

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
        name: data.parentName || 'N/A',
        email: 'N/A',
        role: 'Parent',
      }
    }

    if (allStudentsRes.status === 'fulfilled') {
      student.value = (allStudentsRes.value || []).find((s) => s.id === data.student_id) || {
        fullname: data.studentName || 'N/A',
      }
    }

    if (courseRes.status === 'fulfilled')
      course.value = courseRes.value || { title: data.courseTitle || 'N/A' }

    if (sessionsRes.status === 'fulfilled') {
      session.value = (sessionsRes.value || []).find((s) => s.id === data.session_id) || {
        schedule: { day: 'N/A', timeslot: data.sessionSchedule || 'N/A' },
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
        <div class="content-grid main-layout-grid">
          <div class="left-content-area">
            <div class="header-section">
              <AppButton variant="light" size="sm" @click="router.push('/enrollments')">
                Back
              </AppButton>
              <div class="header-actions">
                <button
                  class="btn-icon edit"
                  title="Edit Enrollment"
                  @click="openActionModal('edit')"
                >
                  ✏️
                </button>
                <button
                  v-if="!isPaid(enrollment?.paymentStatus) && !isCancelled(enrollment?.status)"
                  class="btn-icon check"
                  title="Mark as Paid"
                  @click="openActionModal('pay')"
                >
                  ✓
                </button>
                <button
                  v-if="!isCancelled(enrollment?.status)"
                  class="btn-icon cancel"
                  title="Cancel Enrollment"
                  @click="openActionModal('cancel')"
                >
                  🚫
                </button>
                <button
                  class="btn-icon delete"
                  title="Delete Permanently"
                  @click="openActionModal('delete')"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div class="main-cards-grid">
              <DetailCard title="Parent/Guardian Information" :avatarUrl="parentAvatar">
                <p>
                  <strong>Fullname:</strong> {{ parent?.name || enrollment.parentName || 'N/A' }}
                </p>
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
                  {{ student?.medicalNotes || student?.medical_note || 'None given' }}
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
                <p>
                  <strong>Number Session Enrolled:</strong>
                  {{ session?.totalSessions || 'Not specified' }}
                </p>
                <p>
                  <strong>Date:</strong>
                  {{
                    formatDate(enrollment.enrollAt || enrollment.createdAt || enrollment.timestamp)
                  }}
                </p>
              </DetailCard>

              <DetailCard title="Session Information" :avatarUrl="sessionAvatar">
                <p>
                  <strong>Course:</strong> {{ course?.title || enrollment.courseTitle || 'N/A' }}
                </p>
                <p>
                  <strong>Instructor Name:</strong>
                  {{ session?.instructorName || session?.instructor_name || 'Not assigned' }}
                </p>
                <p><strong>Total Student:</strong> {{ session?.capacity || 'N/A' }}</p>
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
          </div>

          <div class="sidebar-cards">
            <DetailedSummaryCard title="Basic Information" subtitle="Registration Status">
              <div class="detail-row align-center mb-2">
                <span class="summary-label">Status</span>
                <StatusBadge
                  :status="
                    enrollment.status === 'cancelled'
                      ? 'Canceled'
                      : enrollment.paymentStatus?.toLowerCase() === 'paid'
                        ? 'Paid'
                        : 'Unpaid'
                  "
                />
              </div>
              <div class="detail-row">
                <span class="summary-label">Registration ID</span>
                <span class="summary-value">{{ enrollment.id }}</span>
              </div>
              <div class="detail-row">
                <span class="summary-label">Registration Date</span>
                <span class="summary-value">{{
                  formatDate(enrollment.enrollAt || enrollment.createdAt || enrollment.timestamp)
                }}</span>
              </div>
            </DetailedSummaryCard>

            <DetailedSummaryCard subtitle="Payment Summary">
              <div class="detail-row align-center">
                <span class="summary-label">Total Amount</span>
                <StatusBadge :status="'$' + (enrollment.amount || enrollment.totalAmount || 0)" />
              </div>
              <div class="detail-row">
                <span class="summary-label">Transaction ID</span>
                <span class="summary-value">{{ enrollment.paymentProof || 'N/A' }}</span>
              </div>
              <div class="detail-row">
                <span class="summary-label">Payment Date</span>
                <span class="summary-value">
                  {{
                    enrollment.paymentStatus?.toLowerCase() === 'paid' && enrollment.updatedAt
                      ? formatDate(enrollment.updatedAt)
                      : 'Pending'
                  }}
                </span>
              </div>
              <div class="detail-row">
                <span class="summary-label">Admin Remark</span>
                <span class="summary-value">{{ enrollment.remark || 'None' }}</span>
              </div>
            </DetailedSummaryCard>

            <DetailedSummaryCard subtitle="Program Summary">
              <div class="detail-row">
                <span class="summary-label">Course</span>
                <span class="summary-value">{{
                  course?.title || enrollment.courseTitle || 'N/A'
                }}</span>
              </div>
              <div class="detail-row">
                <span class="summary-label">Schedule</span>
                <span class="summary-value">
                  {{ session?.schedule?.day ? `${session?.schedule?.day}, ` : '' }}
                  {{ session?.schedule?.timeslot || 'N/A' }}
                </span>
              </div>
              <div class="mt-3">
                <StatusBadge status="Start Date" />
                <p class="summary-value">
                  {{ session?.startDate ? formatDate(session.startDate) : 'N/A' }}
                </p>
              </div>
              <div class="mt-3">
                <StatusBadge status="End Date" />
                <p class="summary-value">
                  {{ session?.endDate ? formatDate(session.endDate) : 'N/A' }}
                </p>
              </div>
            </DetailedSummaryCard>
          </div>
        </div>
      </div>

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
                <div v-if="modalError" class="alert-box error">
                  <span class="icon">⚠️</span> {{ modalError }}
                </div>
              </transition>
              <transition name="toast-fade">
                <div v-if="modalSuccess" class="alert-box success">
                  <span class="icon">✅</span> {{ modalSuccess }}
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
.detail-page {
  padding: 0;
  width: 100%;
  max-width: 100%;
  margin: 0;
  min-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
}
.detail-container {
  flex: 1;
  display: flex;
  flex-direction: column;
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
  margin-bottom: 24px;
}
.header-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-left: auto;
  background: white;
  padding: 8px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}
.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 450px;
  gap: 30px;
  align-items: stretch;
  flex: 1;
}
.left-content-area {
  padding-right: 0;
}
.main-cards-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.sidebar-cards {
  background: white;
  border-radius: 20px 0 0 20px; /* Sharp right edge, rounded left */
  padding: 30px 30px;
  display: flex;
  flex-direction: column;
  gap: 25px;
  height: 100%;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.03);
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
.date-sub {
  font-size: 1.05rem;
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

/* Modal and Transitions styling */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
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

.modal-content.action-modal {
  background: #ffffff;
  width: 450px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px 25px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fdfdfd;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #1a1a1a;
}

.close-btn {
  background: #f5f5f5;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
}

.modal-body {
  padding: 25px;
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
}

.form-group input,
.form-group textarea {
  padding: 12px 14px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 0.95rem;
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

.info-block.warning {
  background: #fff9e6;
}

.info-block.danger {
  background: #fdeaea;
}

.modal-footer {
  padding: 15px 25px;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  background: #f8f9fa;
  border-top: 1px solid #eee;
}

.preset-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.preset-chip {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  padding: 8px 14px;
  cursor: pointer;
  font-size: 0.85rem;
}

.preset-chip.active {
  background: #f0f4f8;
  border-color: #9cb2c6;
  color: #3f5d7d;
}

.cancel-btn {
  background: white;
  border: 1px solid #ddd;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
}

.save-btn {
  background: #00aeef;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.save-btn.danger-btn {
  background: #e53935;
}

.danger-text {
  color: #e53935 !important;
}

.alert-box {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.alert-box.success {
  background: #e8f5e9;
  color: #2e7d32;
}

.alert-box.error {
  background: #ffebee;
  color: #c62828;
}
</style>
