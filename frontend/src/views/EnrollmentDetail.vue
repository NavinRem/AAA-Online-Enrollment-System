<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import StatusBadge from '@/components/common/ui/StatusBadge.vue'
import DetailCard from '../components/common/cards/DetailCard.vue'
import DetailedSummaryCard from '../components/common/cards/DetailedSummaryCard.vue'
import EnrollmentActionModal from '@/components/enrollments/EnrollmentActionModal.vue'
import EnrollmentFormModal from '@/components/enrollments/EnrollmentFormModal.vue'
import { enrollmentService } from '@/services/enrollmentService'
import { userService } from '@/services/userService'
import { programService } from '@/services/programService'
import { formatDate, formatDateOnly, calculateAge } from '@/utils/dateFormatter'
import { getSessionDay, getSessionTime } from '@/utils/sessionHelper'

import {
  getProgramProfileURL,
  getParentProfileURL,
  getStudentProfileURL,
  getTeacherProfileURL,
  getActionIcon
} from '@/utils/assetHelper'
import { isPaid, isCancelled } from '@/utils/statusHelper'
import { formatPrice } from '@/utils/currencyFormatter'

const route = useRoute()
const router = useRouter()

const enrollment = ref(null)
const parent = ref(null)
const student = ref(null)
const program = ref(null)
const session = ref(null)
const teacher = ref(null)

// For EnrollmentFormModal
const parents = ref([])
const students = ref([])
const programs = ref([])
const sessions = ref([])
const enrollments = ref([]) // To avoid duplicate enrollments check in form
const formLoading = ref(false)
const loading = ref(true)
const errorMessage = ref('')

const submitting = ref(false)
const modalError = ref('')
const modalSuccess = ref('')

const actionModal = ref({
  isOpen: false,
  type: '',
  enrollment: null,
})

const showFormModal = ref(false)
const validationHint = ref('')

// Status checkers imported from statusHelper

const openActionModal = (type) => {
  modalError.value = ''
  modalSuccess.value = ''

  if (type === 'edit') {
    showFormModal.value = true
    return
  }

  actionModal.value = {
    isOpen: true,
    type,
    enrollment: enrollment.value,
  }
}

const closeActionModal = () => {
  actionModal.value.isOpen = false
}

const handleActionSubmit = async (payload) => {
  const { type } = actionModal.value
  const { amount, remark, proof, reason, paymentMethod, deleteConfirm } = payload
  submitting.value = true
  modalError.value = ''

  try {
    if (type === 'pay') {
      const { bankName, paymentMethod: methodType, proof, proofURL, remark } = payload

      const updateData = {
        paymentStatus: 'paid',
        status: 'confirmed',
        paymentMethod: methodType === 'cash' ? 'Cash' : (bankName || 'Online'),
        transactionId: proof,
        paymentProofURL: proofURL || '',
        paidAt: new Date().toISOString(),
        remark: remark?.trim() || ''
      }

      await enrollmentService.updateEnrollment(enrollment.value.id, updateData)

      // Update local state
      enrollment.value = { ...enrollment.value, ...updateData }
    } else if (type === 'cancel') {
      await enrollmentService.cancelEnrollment(enrollment.value.id)
      await enrollmentService.updateEnrollment(enrollment.value.id, { cancelReason: reason })
      enrollment.value.status = 'cancelled'
      enrollment.value.cancelReason = reason
    } else if (type === 'delete') {
      if (deleteConfirm !== 'DELETE') throw new Error('You must type DELETE to confirm.')
      await enrollmentService.deleteEnrollment(enrollment.value.id)
      modalSuccess.value = 'Enrollment deleted. Redirecting...'
      setTimeout(() => router.push('/enrollments'), 1500)
      return
    } else if (type === 'edit') {
      await enrollmentService.updateEnrollment(enrollment.value.id, {
        amount: Number(amount),
        remark: remark?.trim(),
      })
      enrollment.value.amount = Number(amount)
      enrollment.value.remark = remark?.trim()
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

// UI Logic Handlers removed as handled by modern component

const fetchDependencyData = async () => {
  try {
    formLoading.value = true
    const [usersRes, programsRes, studentsRes, enrollmentsRes] = await Promise.all([
      userService.getAllUsers(),
      programService.getAllPrograms(),
      userService.getAllStudents(),
      enrollmentService.getAllEnrollments(),
    ])
    parents.value = Array.isArray(usersRes)
      ? usersRes.filter((u) => u.role === 'parent' || u.role === 'guardian')
      : []
    programs.value = Array.isArray(programsRes) ? programsRes : []
    students.value = Array.isArray(studentsRes) ? studentsRes : []
    enrollments.value = Array.isArray(enrollmentsRes) ? enrollmentsRes : []
  } catch (err) {
    console.error('Failed to load dependency data for form', err)
  } finally {
    formLoading.value = false
  }
}

const handleProgramChange = async (programId) => {
  if (!programId) {
    sessions.value = []
    return
  }
  try {
    const data = await programService.getSessions(programId)
    sessions.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Failed to load sessions', err)
  }
}

const handleEditSubmit = async (formData) => {
  submitting.value = true
  modalError.value = ''
  try {
    // Extract enrichment data (matching Enrollments.vue logic)
    const pRecord = parents.value.find((p) => (p.uid || p.id) === formData.parentId)
    const sRecord = students.value.find((s) => s.id === formData.studentId)
    const progRecord = programs.value.find((c) => c.id === formData.programId)
    const sessRecord = sessions.value.find((s) => s.id === formData.sessionId)

    const payload = {
      parentId: pRecord.uid || pRecord.id,
      studentId: sRecord.id,
      programId: progRecord.id,
      sessionId: sessRecord.id,
      parent: {
        id: pRecord.uid || pRecord.id,
        name: pRecord.name || pRecord.email || 'Parent',
        profile: pRecord.profile || null
      },
      student: {
        id: sRecord.id,
        name: sRecord.fullname || sRecord.fullName || sRecord.name || 'Student',
        profile: sRecord.profile || sRecord.profileURL || sRecord.childProfileURL || null
      },
      program: {
        id: progRecord.id,
        title: progRecord.title || progRecord.name || 'Program',
        profile: progRecord.profile || null
      },
      session: {
        id: sessRecord.id,
        schedule: sessRecord.schedule?.day + ' ' + sessRecord.schedule?.timeslot
      },
      sessionSchedule: sessRecord.schedule?.day + ' ' + sessRecord.schedule?.timeslot,
      amount: formData.amount,
      discountAmount: formData.discountAmount || 0,
      isSponsorship: formData.isSponsorship || false,
      sponsorName: formData.sponsorName || '',
      isProrated: formData.isProrated,
      enrollmentType: formData.enrollmentType || 'Full',
      remark: formData.remark || '',
      basePrice: formData.basePrice || 0,
      totalSessions: formData.totalSessions || 0,
      remainingSessions: formData.remainingSessions || 0,
      passedSessions: formData.passedSessions || 0,
      prorateSavings: formData.prorateSavings || 0,
      updatedAt: new Date().toISOString()
    }

    await enrollmentService.updateEnrollment(enrollment.value.id, payload)
    modalSuccess.value = 'Enrollment updated successfully!'

    // Refresh current local state from backend
    const updated = await enrollmentService.getEnrollment(enrollment.value.id)
    enrollment.value = updated
    parent.value = updated.parent
    student.value = updated.student
    program.value = updated.program
    session.value = updated.session
    teacher.value = updated.teacher

    setTimeout(() => {
      showFormModal.value = false
      modalSuccess.value = ''
    }, 1500)
  } catch (err) {
    modalError.value = err.message || 'Failed to update enrollment.'
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const id = route.params.id
    if (!id) throw new Error('No Enrollment ID provided')

    loading.value = true
    // Fetch base enrollment and dependency data in parallel
    const [data] = await Promise.all([
      enrollmentService.getEnrollment(id),
      fetchDependencyData()
    ])

    if (!data) throw new Error('Enrollment not found')

    enrollment.value = data
    parent.value = data.parent
    student.value = data.student
    program.value = data.program
    session.value = data.session
    teacher.value = data.teacher
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
    <DetailPageLayout :loading="loading" :errorMessage="errorMessage" backRoute="/enrollments" :scrollable="true"
      :rightScrollable="true">
      <template #header-actions v-if="enrollment">
        <div class="actions-wrapper">
          <button class="btn-icon-modern btn-edit" title="Edit Enrollment" @click="openActionModal('edit')">
            <img :src="getActionIcon('edit')" />
          </button>
          <button
            v-if="!isPaid(enrollment.status) && !isPaid(enrollment.paymentStatus) && !isCancelled(enrollment.status)"
            class="btn-icon-modern btn-pay" title="Pay Enrollment" @click="openActionModal('pay')">
            <img :src="getActionIcon('pay')" />
          </button>
          <button v-if="!isCancelled(enrollment.status)" class="btn-icon-modern btn-cancel" title="Cancel Enrollment"
            @click="openActionModal('cancel')">
            <img :src="getActionIcon('cancel')" />
          </button>
          <button class="btn-icon-modern btn-delete" title="Delete Enrollment" @click="openActionModal('delete')">
            <img :src="getActionIcon('delete')" />
          </button>
        </div>
      </template>

      <template #left-content v-if="enrollment">
        <div class="detail-cards-grid">
          <DetailCard title="Parent/Guardian Information" :avatarUrl="getParentProfileURL(enrollment.parent?.profile)">
            <p><strong>Fullname:</strong> {{ enrollment.parent?.name || 'N/A' }}</p>
            <p><strong>Email:</strong> {{ enrollment.parent?.email || 'N/A' }}</p>
            <p><strong>Phone Number:</strong> {{ enrollment.parent?.phone || 'N/A' }}</p>
            <p>
              <strong>Role:</strong>
              <StatusBadge :status="enrollment.parent?.roleDisplay || enrollment.parent?.role || 'Guardian'" />
            </p>
          </DetailCard>

          <DetailCard title="Student Information" :avatarUrl="getStudentProfileURL(enrollment.student?.profile)">
            <p>
              <strong>Fullname:</strong>
              {{ enrollment.student?.name || 'N/A' }}
            </p>
            <p>
              <strong>Date of birth:</strong>
              {{ formatDateOnly(enrollment.student?.dob) }}
            </p>
            <p><strong>Age:</strong> {{ calculateAge(enrollment.student?.dob) }}</p>
            <p>
              <strong>Medical Note:</strong>
              {{ enrollment.student?.medicalNote || 'None' }}
            </p>
          </DetailCard>

          <DetailCard title="Program Information"
            :avatarUrl="getProgramProfileURL(enrollment.program?.profile || enrollment.program?.profileURL, enrollment.program?.category)">
            <p>
              <strong>Program:</strong>
              {{ enrollment.program?.title }}
            </p>
            <p>
              <strong>Schedule:</strong>
              <StatusBadge :status="'purple:' + getSessionDay(enrollment.sessionSchedule)" />
              {{ getSessionTime(enrollment.sessionSchedule) }}
            </p>
            <p style="display: flex; align-items: center;">
              <strong>Number Session Enrolled:</strong>
              <template v-if="enrollment.remainingSessions !== undefined">
                {{ enrollment.remainingSessions }} Sessions of
                {{ enrollment.totalSessions || 10 }}
                <StatusBadge v-if="enrollment.passedSessions > 0" :status="enrollment.passedSessions + ' passed'"
                  type="red" />
              </template>
              <template v-else>
                {{ enrollment.numberSessions || enrollment.program?.numberSessions || '10' }} Sessions
              </template>
            </p>
            <p>
              <strong>Enrolled Date:</strong>
              {{ formatDate(enrollment.enrollAt || enrollment.createdAt) }}
            </p>
          </DetailCard>

          <DetailCard title="Session Information" :avatarUrl="getTeacherProfileURL(enrollment.teacher?.profile || enrollment.teacher?.profileURL)">
            <p><strong>Program:</strong> {{ enrollment.program?.title || 'N/A' }}</p>

            <p class="teacher-row-aligned">
              <strong>Teacher(s):</strong>
            <div v-if="enrollment.program?.teachers?.length > 0" class="teacher-content-inline">
              <span v-if="enrollment.program.teachers.length === 1" class="teacher-name-solo">
                {{ enrollment.program.teachers[0].name }}
              </span>
              <div v-else class="teacher-avatar-stack-inline">
                <img v-for="t in enrollment.program.teachers" :key="t.id" :src="getTeacherProfileURL(t.profileURL)"
                  class="teacher-avatar-stacked" :title="t.name" />
              </div>
            </div>
            <span v-else class="not-assigned-label">Not Assigned</span>
            </p>
            <p><strong>Student Enrolled:</strong> {{ enrollment.session?.numStudent || 0 }}</p>
            <p><strong>Max Capacity:</strong> {{ enrollment.session?.capacity || 20 }}</p>
          </DetailCard>
        </div>
      </template>

      <template #right-content v-if="enrollment">
        <DetailedSummaryCard title="Basic Information" subtitle="Enrollment Information">
          <div class="detail-row align-center">
            <span class="summary-label">Status</span>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
              <StatusBadge :status="enrollment.status === 'cancelled' ? 'Canceled' :
                enrollment.paymentStatus?.toLowerCase() === 'paid' ? 'Paid' : 'Unpaid'" />
            </div>
          </div>

          <div class="detail-row align-center">
            <span class="summary-label">Mode</span>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
              <StatusBadge :status="enrollment.enrollmentType" />
            </div>
          </div>

          <div v-if="enrollment.status === 'cancelled' && (enrollment.cancelReason || enrollment.reason)"
            class="detail-row">
            <span class="summary-label">Reason</span>
            <span class="summary-value" style="color: #ef4444; font-weight: 600">
              {{ enrollment.cancelReason || enrollment.reason }}
            </span>
          </div>

          <div class="detail-row">
            <span class="summary-label">Enrolled Date</span>
            <span class="summary-value">{{ formatDate(enrollment.enrollAt || enrollment.createdAt) }}</span>
          </div>

          <div class="detail-row" v-if="enrollment.updatedAt">
            <span class="summary-label">Updated Date</span>
            <span class="summary-value">{{ formatDate(enrollment.updatedAt) }}</span>
          </div>

          <div class="detail-row" v-if="enrollment.remark">
            <span class="summary-label">Admin Remark</span>
            <span class="summary-value">{{ enrollment.remark }}</span>
          </div>
        </DetailedSummaryCard>

        <DetailedSummaryCard subtitle="Payment Information">
          <div class="detail-row align-center" v-if="enrollment?.basePrice">
            <span class="summary-label">Original Price</span>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
              <StatusBadge :status="'$' + formatPrice(enrollment.basePrice)" type="green" />
            </div>
          </div>

          <div class="detail-row align-center" v-if="enrollment?.prorateSavings">
            <span class="summary-label">Prorate Discount</span>
            <StatusBadge :status="'-$' + formatPrice(enrollment.prorateSavings)" type="magenta" />
          </div>

          <div class="detail-row align-center" v-if="enrollment?.discountAmount">
            <span class="summary-label">Manual Discount</span>
            <StatusBadge :status="'-$' + formatPrice(enrollment.discountAmount)" type="magenta" />
          </div>

          <div class="detail-row align-center">
            <span class="summary-label">Total Amount</span>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
              <StatusBadge :status="'$' + formatPrice(enrollment?.amount || 0)" />
            </div>
          </div>

          <div class="detail-row align-center">
            <span class="summary-label">Status</span>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
              <StatusBadge
                :status="enrollment?.displayStatus || enrollment?.status || enrollment?.paymentStatus || 'Unpaid'" />
            </div>
          </div>

          <div class="detail-row align-center">
            <span class="summary-label">Payment Method</span>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
              <StatusBadge :status="enrollment?.paymentMethod || (isPaid(enrollment?.status || enrollment?.paymentStatus) ? 'Not Specified' : '—')" />
            </div>
          </div>

          <div class="detail-row" v-if="enrollment?.transactionId">
            <span class="summary-label">{{ enrollment?.paymentMethod === 'Cash' ? 'Receipt Number' : 'Transaction ID'
            }}</span>
            <span class="summary-value" style="font-family: monospace; font-weight: 600; color: #0284c7;">
              {{ enrollment.transactionId }}
            </span>
          </div>

          <div class="detail-row" v-if="enrollment?.paidAt">
            <span class="summary-label">Paid Date</span>
            <span class="summary-value" style="font-size: 0.85rem; opacity: 0.8;">
              {{ formatDate(enrollment.paidAt) }}
            </span>
          </div>

          <div class="detail-row" v-if="enrollment?.paymentProofURL"
            style="flex-direction: column; align-items: flex-start; gap: 8px; margin-top: 8px;">
            <span class="summary-label">Payment Proof</span>
            <a :href="enrollment.paymentProofURL" target="_blank" class="proof-preview-link">
              <img :src="enrollment.paymentProofURL" alt="Payment Proof" class="proof-thumbnail" />
              <div class="proof-overlay">
                <span>View Full Size</span>
              </div>
            </a>
          </div>

          <div class="detail-row">
            <span class="summary-label">Admin Remark</span>
            <span class="summary-value italic">
              {{ enrollment?.remark || 'None' }}
            </span>
          </div>

          <div class="detail-row" v-if="enrollment?.isSponsorship">
            <span class="summary-label">Sponsorship</span>
            <span class="summary-value mono" style="word-break: break-all; font-size: 0.8rem;">
              {{ enrollment?.sponsorName || 'Third-party' }}
            </span>
          </div>

          <div class="detail-row" v-if="enrollment?.paymentProof">
            <span class="summary-label">Transaction ID / Proof</span>
            <span class="summary-value mono" style="word-break: break-all; font-size: 0.8rem;">
              {{ enrollment?.paymentProof }}
            </span>
          </div>

          <div class="detail-row" v-if="enrollment?.paymentStatus === 'Paid'">
            <span class="summary-label">Payment Date</span>
            <span class="summary-value">{{ enrollment?.paymentDate }}</span>
          </div>
        </DetailedSummaryCard>

        <DetailedSummaryCard subtitle="Program Information">
          <div class="detail-row">
            <span class="summary-label">Program</span>
            <span class="summary-value">{{ program?.title || enrollment?.programTitle || 'N/A' }}</span>
          </div>

          <div class="detail-row">
            <span class="summary-label">Schedule</span>
            <div class="summary-value" style="display: flex; gap: 10px; align-items: center;">
              <StatusBadge class="session-day" :status="'purple:' + getSessionDay(enrollment?.sessionSchedule)" />
              <span class="session-time">{{ getSessionTime(enrollment?.sessionSchedule) }}</span>
            </div>
          </div>

          <div class="detail-row">
            <span class="summary-label">Term Dates</span>
            <div class="summary-value" style="margin-top: 5px; gap: 10px; display: flex; flex-direction: column;">
              <div style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
                <StatusBadge :status="'green:Start Date'" /> {{ enrollment?.startDate || program?.startDate ?
                  formatDateOnly(enrollment?.startDate
                    || program?.startDate) : 'N/A' }}
              </div>
              <div style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
                <StatusBadge :status="'blue:End Date'" /> {{ enrollment?.endDate || program?.endDate ?
                  formatDateOnly(enrollment?.endDate ||
                    program?.endDate) : 'N/A' }}
              </div>
            </div>
          </div>
        </DetailedSummaryCard>
      </template>
    </DetailPageLayout>

    <!-- Action Modals (Edit, Pay, Cancel, Delete) -->
    <EnrollmentFormModal :isOpen="showFormModal" :loading="submitting" :parents="parents" :students="students"
      :programs="programs" :sessions="sessions" :enrollments="enrollments" :enrollment="enrollment" :error="modalError"
      :success="modalSuccess" :hint="validationHint"
      @close="() => { showFormModal = false; modalError = ''; modalSuccess = ''; validationHint = ''; }"
      @program-change="handleProgramChange" @submit="handleEditSubmit" />

    <EnrollmentActionModal v-bind="actionModal" :loading="submitting" v-model:error="modalError"
      v-model:success="modalSuccess" @close="closeActionModal" @submit="handleActionSubmit" />
  </DashboardLayout>
</template>

<style scoped>
@import '@/assets/styles/detail-view.css';

.detail-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  width: 100%;
  gap: 24px;
  align-items: stretch;
  /* Cards in same row match height */
  margin-bottom: 30px;
}

.actions-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* btn-icon-modern styles moved to DetailPageLayout.css */

/* Custom scrollbar for webkit to keep it premium */

/* Custom scrollbar for webkit to keep it premium */
:deep(.main-cards-grid::-webkit-scrollbar) {
  width: 6px;
}

:deep(.main-cards-grid::-webkit-scrollbar-thumb) {
  background: #cbd5e1;
  border-radius: 10px;
}

.sidebar-cards {
  padding-right: 20px;
  display: flex;
  flex-direction: column;
  gap: 25px;
  height: 100%;
}

.session-info-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 12px;
}

.teacher-row-aligned {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0
}

.teacher-content-inline {
  display: flex;
  align-items: center;
}

.teacher-name-solo {
  font-weight: 500;
  font-size: 0.95rem;
  color: #1e293b;
}

.teacher-avatar-stack-inline {
  display: flex;
  align-items: center;
  margin-left: 5px;
}

.not-assigned-label {
  color: #94a3b8;
  font-style: italic;
  font-size: 0.9rem;
}

.capacity-info {
  display: flex;
  flex-direction: column;
}

.capacity-info p {
  margin: 0;
  font-size: 0.9rem;
  color: #475569;
}

.capacity-info strong {
  color: #1e293b;
}

.teacher-avatar-stack {
  display: flex;
  align-items: center;
  margin-top: 5px;
}

.teacher-avatar-stacked {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  margin-left: -8px;
  /* The overlap! */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.teacher-avatar-stacked:first-child {
  margin-left: 0;
}

.teacher-avatar-stacked:hover {
  transform: translateY(-4px) scale(1.1);
  z-index: 10;
}

.stack-label {
  margin-left: 12px;
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
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
  width: 600px;
  max-width: 90vw;
  max-height: 90vh;
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

.danger-text {
  color: #ef4444;
}

.danger-btn {
  background: #ef4444 !important;
}

/* Payment Proof Styling */
.proof-preview-link {
  position: relative;
  width: 100%;
  max-width: 240px;
  max-height: 240px;
  border-radius: 12px;
  overflow: hidden;
  display: block;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  margin-top: 8px;
}

.proof-preview-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.proof-thumbnail {
  width: 100%;
  height: 100%;
  max-height: 240px;
  object-fit: contain;
  background: #f8fafc;
}

.proof-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  backdrop-filter: blur(2px);
}

.proof-preview-link:hover .proof-overlay {
  opacity: 1;
}

.proof-overlay span {
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* Modal Transitions */
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
</style>
