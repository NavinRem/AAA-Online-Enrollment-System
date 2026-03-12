<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import StatusBadge from '@/components/common/ui/StatusBadge.vue'
import DetailCard from '../components/cards/DetailCard.vue'
import DetailedSummaryCard from '../components/cards/DetailedSummaryCard.vue'
import { enrollmentService } from '@/services/enrollmentService'
import { userService } from '@/services/userService'
import { courseService } from '@/services/courseService'
import { formatDate, formatDateOnly, calculateAge } from '@/utils/dateFormatter'

import { getImageUrl } from '@/utils/assetHelper'

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
  originalAmount: 0,
  proof: '',
  reason: '',
  remark: '',
  originalRemark: '',
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
    originalAmount: enrollment.value.amount || enrollment.value.totalAmount || 0,
    proof: '',
    reason: '',
    remark: enrollment.value.remark || '',
    originalRemark: enrollment.value.remark || '',
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
      await enrollmentService.updateEnrollment(enrollment.value.id, {
        paymentStatus: 'paid',
        paymentProof: proof,
      })
      enrollment.value.paymentStatus = 'paid'
      enrollment.value.paymentProof = proof
    } else if (type === 'cancel') {
      if (!reason.trim()) throw new Error('A reason for cancellation must be provided.')
      await enrollmentService.cancelEnrollment(enrollment.value.id)
      await enrollmentService.updateEnrollment(enrollment.value.id, { cancelReason: reason })
      enrollment.value.status = 'cancelled'
    } else if (type === 'delete') {
      if (deleteConfirm !== 'DELETE')
        throw new Error('You must type DELETE specifically to confirm.')
      await enrollmentService.deleteEnrollment(enrollment.value.id)
      router.push('/enrollments')
      return
    } else if (type === 'edit') {
      if (amount < 0) throw new Error('Amount cannot be negative.')
      await enrollmentService.updateEnrollment(enrollment.value.id, {
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

const togglePreset = (field, chipValue) => {
  const currentText = actionModal.value[field] || ''
  let values = currentText
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

  if (values.includes(chipValue)) {
    // Remove it
    values = values.filter((v) => v !== chipValue)
  } else {
    // Add it
    values.push(chipValue)
  }
  actionModal.value[field] = values.join(', ')
}

const isPresetActive = (field, chipValue) => {
  const currentText = actionModal.value[field] || ''
  const values = currentText
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
  return values.includes(chipValue)
}

onMounted(async () => {
  try {
    const id = route.params.id
    if (!id) throw new Error('No Enrollment ID provided')

    // 1. Fetch the primary enrollment data (now enriched from backend)
    const data = await enrollmentService.get(id)
    if (!data) throw new Error('Enrollment not found')
    enrollment.value = data

    // 2. Fetch full related objects in parallel to ensure "real" data in cards
    const [userRes, studentRes, courseRes, sessionsRes] = await Promise.allSettled([
      userService.getProfile(data.parentId),
      userService.getStudent(data.studentId),
      courseService.getCourse(data.courseId),
      courseService.getSessions(data.courseId),
    ])

    if (userRes.status === 'fulfilled') parent.value = userRes.value
    if (studentRes.status === 'fulfilled') student.value = studentRes.value
    if (courseRes.status === 'fulfilled') course.value = courseRes.value
    if (sessionsRes.status === 'fulfilled') {
      session.value = (sessionsRes.value || []).find((s) => s.id === data.sessionId)
    }
  } catch (error) {
    errorMessage.value = error.message || 'Failed to load details'
  } finally {
    loading.value = false
  }
})

// Helpers
</script>

<template>
  <DashboardLayout>
    <DetailPageLayout :loading="loading" :errorMessage="errorMessage" backRoute="/enrollments">
      <template #header-actions v-if="enrollment">
        <button class="btn-icon edit" title="Edit Enrollment" @click="openActionModal('edit')">
          ✏️
        </button>
        <button
          v-if="!isPaid(enrollment.paymentStatus) && !isCancelled(enrollment.status)"
          class="btn-icon check"
          title="Mark as Paid"
          @click="openActionModal('pay')"
        >
          ✓
        </button>
        <button
          v-if="!isCancelled(enrollment.status)"
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
      </template>

      <template #left-content v-if="enrollment">
        <DetailCard title="Parent/Guardian Information" :avatarUrl="getImageUrl('profiles', 'female-profile-parent.jpg')">
          <p><strong>Fullname:</strong> {{ parent?.name || parent?.fullname || enrollment.parentName || 'N/A' }}</p>
          <p><strong>Email:</strong> {{ parent?.email || enrollment.parentEmail || 'N/A' }}</p>
          <p><strong>Phone Number:</strong> {{ parent?.phone || enrollment.parentPhone || 'N/A' }}</p>
          <p>
            <strong>Role:</strong>
            <StatusBadge :status="parent?.role
                ? parent.role === 'parent'
                ? 'Parent'
                : parent.role.charAt(0).toUpperCase() + parent.role.slice(1)
                : enrollment.parentRole">
              </StatusBadge>
          </p>
        </DetailCard>

        <DetailCard title="Student Information" :avatarUrl="getImageUrl('profiles', 'child-profile.png')">
          <p>
            <strong>Fullname:</strong>
            {{ student?.fullname || student?.name || enrollment.studentName || 'N/A' }}
          </p>
          <p>
            <strong>Date of birth:</strong>
            {{ formatDateOnly(student?.dob || student?.DoB || enrollment.studentDob) }}
          </p>
          <p><strong>Age:</strong> {{ calculateAge(student?.dob || student?.DoB || enrollment.studentDob) }}</p>
          <p>
            <strong>Medical Note:</strong>
            {{ student?.medicalNote || student?.medical_note || enrollment.medicalNote || 'None'}}
          </p>
        </DetailCard>

        <DetailCard title="Enrollment Information" :avatarUrl="getImageUrl('classes', 'robotic-class.png')">
          <p>
            <strong>Course title:</strong>
            {{ course?.title || enrollment.courseTitle || 'N/A' }}
          </p>
          <p>
            <strong>Session:</strong> {{ enrollment.sessionSchedule || 'N/A' }}
          </p>
          <p>
            <strong>Number Session Enrolled:</strong>
            {{ session?.totalSessions || session?.total_sessions || enrollment.totalSessions || '0' }} Sessions
          </p>
          <p>
            <strong>Date:</strong>
            {{ formatDate(enrollment.enrollAt || enrollment.createdAt) }}
          </p>
        </DetailCard>

        <DetailCard title="Session Information" :avatarUrl="getImageUrl('programs', 'program.png')">
          <p><strong>Course:</strong> {{ course?.title || enrollment.courseTitle || 'N/A' }}</p>
          <p>
            <strong>Instructor Name:</strong>
            {{
              session?.instructorName ||
              (session?.instructors?.length > 0 ? session.instructors[0].name : enrollment.instructorName)
              || 'N/A'
            }}
          </p>
          <p><strong>Total Student:</strong> {{ session?.capacity || enrollment.capacity || 'N/A' }}</p>
          <p>
            <strong>Session Schedule:</strong>
            {{
              session?.schedule
                ? (session.schedule.day ? session.schedule.day + ', ' : '') + (session.schedule.timeslot || session.schedule.startTime + '-' + session.schedule.endTime)
                : enrollment.sessionSchedule
                || 'N/A'
            }}
          </p>
        </DetailCard>
      </template>

      <template #right-content v-if="enrollment">
        <DetailedSummaryCard title="Basic Information" subtitle="Enrollment Status">
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
            <span class="summary-label">Last Updated</span>
            <span class="summary-value">{{
              enrollment.updatedAt ? formatDate(enrollment.updatedAt) : 'Never'
            }}</span>
          </div>
          <div
            v-if="
              enrollment.status === 'cancelled' && (enrollment.cancelReason || enrollment.reason)
            "
            class="detail-row mb-3"
          >
            <span class="summary-label">Cancel Reason</span>
            <span class="summary-value" style="color: #ef4444; font-weight: 600">
              {{ enrollment.cancelReason || enrollment.reason }}
            </span>
          </div>
          <div class="detail-row">
            <span class="summary-label">Enrollment ID</span>
            <span class="summary-value">{{ enrollment.id }}</span>
          </div>
          <div class="detail-row">
            <span class="summary-label">Enrollment Date</span>
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
            <span class="summary-label">Payment Method</span>
            <span class="summary-value">
              {{ enrollment.paymentMethod || 'Not Specified' }}
            </span>
          </div>
          <div class="detail-row">
            <span class="summary-label">Transaction ID / Proof</span>
            <span class="summary-value" style="word-break: break-all">
              {{ enrollment.paymentProof || 'N/A' }}
            </span>
          </div>
          <div class="detail-row">
            <span class="summary-label">Payment Date</span>
            <span class="summary-value">
              {{ enrollment.paymentDate ? formatDate(enrollment.paymentDate) : 'Not Paid' }}
            </span>
          </div>
          <div class="detail-row">
            <span class="summary-label">Admin Remark</span>
            <span class="summary-value">{{ enrollment.remark || 'N/A' }}</span>
          </div>
        </DetailedSummaryCard>

        <DetailedSummaryCard subtitle="Program Summary">
          <div class="detail-row">
            <span class="summary-label">Course</span>
            <span class="summary-value">{{ course?.title || enrollment.courseTitle || 'N/A' }}</span>
          </div>
          <div class="detail-row">
            <span class="summary-label">Instructor</span>
            <span class="summary-value">{{ session?.instructorName || course?.instructor?.name || enrollment.instructorName || 'N/A' }}</span>
          </div>
          <div class="detail-row">
            <span class="summary-label">Schedule</span>
            <span class="summary-value">{{ session?.schedule || enrollment.sessionSchedule || 'N/A' }}</span>
          </div>
          <div class="mt-3">
            <span class="summary-label">Term Dates</span>
            <p class="summary-value" style="font-size: 0.9rem; margin-top: 5px">
              <strong>Start:</strong> {{ enrollment.startDate || course?.startDate ? formatDate(enrollment.startDate || course?.startDate) : 'N/A' }}<br />
              <strong>End:</strong> {{ enrollment.endDate || course?.endDate ? formatDate(enrollment.endDate || course?.endDate) : 'N/A' }}
            </p>
          </div>
        </DetailedSummaryCard>
      </template>
    </DetailPageLayout>

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
              <span class="original-value" v-if="actionModal.originalAmount">Original: ${{ actionModal.originalAmount }}</span>
              <input type="number" v-model="actionModal.amount" min="0" step="0.01" />

              <label style="margin-top: 15px">Special Remark / Note (Optional)</label>
              <span class="original-value" v-if="actionModal.originalRemark">Original: {{ actionModal.originalRemark }}</span>
              <textarea
                v-model="actionModal.remark"
                placeholder="Please write your remark here..."
              ></textarea>
              <div class="preset-chips">
                <button
                  type="button"
                  class="preset-chip"
                  :class="{ active: isPresetActive('remark', 'VIP Student') }"
                  @click="togglePreset('remark', 'VIP Student')"
                >
                  VIP Student
                </button>
                <button
                  type="button"
                  class="preset-chip"
                  :class="{ active: isPresetActive('remark', 'Needs extra attention') }"
                  @click="togglePreset('remark', 'Needs extra attention')"
                >
                  Needs extra attention
                </button>
                <button
                  type="button"
                  class="preset-chip"
                  :class="{ active: isPresetActive('remark', 'Parent will pay next week') }"
                  @click="togglePreset('remark', 'Parent will pay next week')"
                >
                  Parent will pay next week
                </button>
                <button
                  type="button"
                  class="preset-chip"
                  :class="{ active: isPresetActive('remark', 'Pending partial refund') }"
                  @click="togglePreset('remark', 'Pending partial refund')"
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
                  :class="{ active: isPresetActive('proof', 'Paid in Cash') }"
                  @click="togglePreset('proof', 'Paid in Cash')"
                >
                  Paid in Cash
                </button>
                <button
                  type="button"
                  class="preset-chip"
                  :class="{ active: isPresetActive('proof', 'Paid via Check') }"
                  @click="togglePreset('proof', 'Paid via Check')"
                >
                  Paid via Check
                </button>
                <button
                  type="button"
                  class="preset-chip"
                  :class="{ active: isPresetActive('proof', 'Paid via Bank Transfer') }"
                  @click="togglePreset('proof', 'Paid via Bank Transfer')"
                >
                  Paid via Bank Transfer
                </button>
                <button
                  type="button"
                  class="preset-chip"
                  :class="{ active: isPresetActive('proof', 'Paid via Credit Card') }"
                  @click="togglePreset('proof', 'Paid via Credit Card')"
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
                  :class="{ active: isPresetActive('reason', 'Parent requested via email') }"
                  @click="togglePreset('reason', 'Parent requested via email')"
                >
                  Parent requested via email
                </button>
                <button
                  type="button"
                  class="preset-chip"
                  :class="{ active: isPresetActive('reason', 'Parent requested via phone') }"
                  @click="togglePreset('reason', 'Parent requested via phone')"
                >
                  Parent requested via phone
                </button>
                <button
                  type="button"
                  class="preset-chip"
                  :class="{ active: isPresetActive('reason', 'Did not pay on time') }"
                  @click="togglePreset('reason', 'Did not pay on time')"
                >
                  Did not pay on time
                </button>
                <button
                  type="button"
                  class="preset-chip"
                  :class="{ active: isPresetActive('reason', 'Course schedule conflict') }"
                  @click="togglePreset('reason', 'Course schedule conflict')"
                >
                  Course schedule conflict
                </button>
                <button
                  type="button"
                  class="preset-chip"
                  :class="{ active: isPresetActive('reason', 'Duplicate enrollment') }"
                  @click="togglePreset('reason', 'Duplicate enrollment')"
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
                  duplicate enrollments.
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
  </DashboardLayout>
</template>

<style scoped>
.sidebar-cards {
  padding-right: 20px;
  display: flex;
  flex-direction: column;
  gap: 25px;
  height: 100%;
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

.original-value {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: -4px;
  margin-bottom: 4px;
  font-style: italic;
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
