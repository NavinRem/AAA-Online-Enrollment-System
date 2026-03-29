<script setup>
import { ref, onMounted, computed } from 'vue'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import AppAlert from '@/components/common/ui/AppAlert.vue'
import DataMetrics from '../components/common/data/DataMetrics.vue'
import DataTable from '../components/common/data/DataTable.vue'
import StatusBadge from '../components/common/ui/StatusBadge.vue'
import EnrollmentModal from '../components/enrollments/EnrollmentModal.vue'
import { enrollmentService } from '@/services/enrollmentService'
import { userService } from '../services/userService'
import { programService } from '../services/programService'
import { useSearch, enrollmentSearchMapper } from '../composables/useSearch'
import {
  calculateTotalEnrollment,
  enrichEnrollments,
  cleanSessionSchedule,
  getEnrollmentDisplayStatus,
  getEnrollmentDisplayMode
} from '../utils/enrollmentHelper'
import { formatDate } from '../utils/dateFormatter'
import { getSessionDay, getSessionTime } from '@/utils/sessionHelper'
import { getImageUrl, getParentProfileURL, getStudentProfileURL, getProgramProfileURL } from '@/utils/assetHelper'
import { isPaid, isUnpaid, isCancelled } from '@/utils/statusHelper'
import AppModal from '@/components/common/ui/AppModal.vue'

const enrollments = ref([])
const parents = ref([])
const students = ref([])
const programs = ref([])
const sessions = ref([])
const loading = ref(true)
const showModal = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const validationHint = ref('')
const newlyCreatedId = ref(null)
const selectedEnrollment = ref(null) // Enrollment currently being edited

const getRowClass = (item) => {
  return newlyCreatedId.value === item.id ? 'new-row-highlight' : ''
}

onMounted(async () => {
  await fetchEnrollments()
  await loadFormData()
})

const fetchEnrollments = async () => {
  try {
    loading.value = true
    const data = await enrollmentService.getAllEnrollments()
    enrollments.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch enrollments', error)
  } finally {
    loading.value = false
  }
}

const loadFormData = async () => {
  try {
    const [usersRes, programsRes, studentsRes] = await Promise.all([
      userService.getAllUsers(),
      programService.getAllPrograms(),
      userService.getAllStudents(),
    ])
    parents.value = Array.isArray(usersRes)
      ? usersRes.filter((u) => u.role === 'parent' || u.role === 'guardian')
      : []
    programs.value = Array.isArray(programsRes) ? programsRes : []
    students.value = Array.isArray(studentsRes) ? studentsRes : []
  } catch (err) {
    console.error('Failed to load form data', err)
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

const isAlreadyEnrolled = (studentId, programId) => {
  if (!studentId || !programId) return false
  return enrollments.value.some(
    (e) => e.studentId === studentId && e.programId === programId && e.status !== 'cancelled'
  )
}

let hintTimeout = null
const setValidationHint = (msg) => {
  validationHint.value = msg
  if (hintTimeout) clearTimeout(hintTimeout)
  hintTimeout = setTimeout(() => {
    validationHint.value = ''
  }, 4000)
}

const handleSaveEnrollment = async (formData) => {
  submitting.value = true
  errorMessage.value = ''
  try {
    const parent = parents.value.find((p) => (p.uid || p.id) === formData.parentId)
    const student = students.value.find((s) => s.id === formData.studentId)
    const program = programs.value.find((c) => c.id === formData.programId || c.id === formData.courseId)
    const session = sessions.value.find((s) => s.id === formData.sessionId)

    const payload = {
      parentId: parent.uid || parent.id,
      parentName: parent.name || parent.email || 'Parent',
      studentId: student.id,
      studentName: student.fullname || student.fullName || student.name || 'Student',
      programId: program.id,
      programTitle: program.title || program.name || 'Program',
      sessionId: session.id,
      sessionSchedule: session.schedule?.day + ' ' + session.schedule?.timeslot,
      amount: formData.amount,
      discountAmount: formData.discountAmount || 0,
      isSponsorship: formData.isSponsorship || false,
      sponsorName: formData.sponsorName || '',
      isProrated: formData.isProrated,
      enrollmentType: formData.enrollmentType || 'Full',
      remark: formData.remark || '',
      // Only set these for new enrollments
      ...(!formData.id ? {
        status: 'unpaid',
        paymentStatus: 'unpaid',
        enrollAt: new Date().toISOString(),
      } : {})
    }

    if (formData.id) {
      await enrollmentService.updateEnrollment(formData.id, payload)
      successMessage.value = 'Successfully updated enrollment!'
    } else {
      const result = await enrollmentService.createEnrollment(payload)
      successMessage.value = 'Successfully created enrollment!'
      newlyCreatedId.value = result.id || result.UID
    }

    await fetchEnrollments()

    setTimeout(() => {
      showModal.value = false
      selectedEnrollment.value = null
      successMessage.value = ''
    }, 1500)
  } catch (err) {
    errorMessage.value = err.message || 'Failed to save enrollment.'
  } finally {
    submitting.value = false
  }
}

// Status helpers imported from @/utils/statusHelper

const enrollmentStats = computed(() => {
  const s = calculateTotalEnrollment(enrollments.value)
  return [
    { label: 'Total Enrollments', value: s.total, image: getImageUrl('enrollment/total-enrollment'), color: '#e1f5fe' },
    { label: 'Total Paid Enrollment', value: s.paidCount, image: getImageUrl('enrollment/total-paid-enrollment'), color: '#e1f5fe' },
    { label: 'Total Unpaid Enrollment', value: s.unpaidCount, image: getImageUrl('enrollment/total-unpaid-enrollment'), color: '#e1f5fe' },
    { label: 'Total Cancelled Enrollment', value: s.cancelledCount, image: getImageUrl('enrollment/total-canceled-enrollment'), color: '#e1f5fe' },
    { label: 'Today Enrollments', value: s.todayCount, image: getImageUrl('enrollment/today-enrollment'), color: '#e1f5fe' }
  ]
})

const enrollmentHeaders = [
  { label: 'No', width: '30px', class: 'hide-on-mobile', align: 'center' },
  { label: 'Parent / Guardian', class: 'hide-on-tablet', width: '30%' },
  { label: 'Student', width: '30%' },
  { label: 'Program', width: '50%' },
  { label: 'Session' },
  { label: 'Enrolled Date', align: 'center' },
  { label: 'Mode', align: 'center' },
  { label: 'Amount', class: 'hide-on-mobile', align: 'center' },
  { label: 'Status', align: 'center' },
  { label: 'Action', align: 'center' }
]

const currentFilter = ref('all')

const statusFilteredEnrollments = computed(() => {
  const enriched = enrichEnrollments(enrollments.value, parents.value, students.value, programs.value, sessions.value)

  if (currentFilter.value === 'all') return enriched

  return enriched.filter(r => {
    if (currentFilter.value === 'paid') return isPaid(r.status || r.paymentStatus)
    if (currentFilter.value === 'unpaid') return isUnpaid(r.status || r.paymentStatus)
    if (currentFilter.value === 'cancelled') return isCancelled(r.status || r.paymentStatus)
    return true
  }).sort((a, b) => new Date(b.enrollAt || 0) - new Date(a.enrollAt || 0))
})

const { searchQuery, searchResults: filteredEnrollments } = useSearch(
  statusFilteredEnrollments,
  enrollmentSearchMapper,
)

// --- Action Modal State ---
const actionModal = ref({
  isOpen: false,
  type: '',
  enrollment: null,
  amount: 0,
  proof: '',
  reason: '',
  remark: '',
  deleteConfirm: '',
  paymentMethod: 'online', // 'cash' or 'online'
})

const showActionHint = ref(false)
let actionHintTimeout = null

const handleTableAction = ({ type, item }) => {
  errorMessage.value = ''
  successMessage.value = ''

  if (type === 'edit') {
    selectedEnrollment.value = item
    showModal.value = true
    return
  }

  actionModal.value = {
    isOpen: true,
    type,
    enrollment: item,
    amount: item.amount || 0,
    proof: '',
    reason: '',
    remark: item.remark || '',
    deleteConfirm: '',
    paymentMethod: 'online',
  }
}

const submitActionModal = async () => {
  const { type, enrollment, amount, proof, reason, remark, deleteConfirm, paymentMethod } = actionModal.value
  submitting.value = true
  try {
    if (type === 'pay') {
      const proofStr = paymentMethod === 'cash' ? 'CASH' : proof
      await enrollmentService.updateEnrollment(enrollment.id, {
        paymentStatus: 'paid',
        paymentProof: proofStr
      })
    } else if (type === 'cancel') {
      await enrollmentService.updateEnrollment(enrollment.id, { status: 'cancelled', cancelReason: reason })
    } else if (type === 'delete') {
      if (deleteConfirm !== 'DELETE') throw new Error('Type DELETE to confirm')
      await enrollmentService.deleteEnrollment(enrollment.id)
    }
    successMessage.value = 'Action completed successfully.'
    await fetchEnrollments()
    setTimeout(() => {
      closeActionModal()
    }, 1500)
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    submitting.value = false
  }
}

const handleActionSubmitTrigger = () => {
  if (!!actionModalValidationHint.value) {
    showActionHint.value = true
    if (actionHintTimeout) clearTimeout(actionHintTimeout)
    actionHintTimeout = setTimeout(() => {
      showActionHint.value = false
    }, 3000)
  } else {
    submitActionModal()
  }
}

const closeActionModal = () => {
  actionModal.value.isOpen = false
  showActionHint.value = false
  errorMessage.value = ''
  successMessage.value = ''
}

const enrollmentSummary = computed(() => {
  const e = actionModal.value.enrollment
  if (!e) return null

  return {
    ...e,
    parentAvatar: getParentProfileURL(e.parentProfileURL),
    studentAvatar: getStudentProfileURL(e.studentProfileURL),
    programAvatar: getProgramProfileURL(e.programProfileURL, e.category),
    sessionDay: getSessionDay(e.sessionSchedule),
    sessionTime: getSessionTime(e.sessionSchedule),
    status: getEnrollmentDisplayStatus(e),
    mode: getEnrollmentDisplayMode(e),
    hasDiscount: e.discountAmount > 0,
    discountText: `($${formatPrice(e.discountAmount)} Disc.)`
  }
})

const actionModalValidationHint = computed(() => {
  const { type, paymentMethod, proof, reason, deleteConfirm } = actionModal.value
  if (type === 'delete' && deleteConfirm !== 'DELETE') return 'Type DELETE to confirm.'
  if (type === 'cancel' && !reason?.trim()) return 'Reason for cancellation is required.'
  if (type === 'pay' && paymentMethod === 'online' && !proof?.trim()) return 'Transaction reference is required for online payments.'
  return ''
})

const formatPrice = (val) => {
  if (val === undefined || val === null) return '0'
  return Number.isInteger(val) ? val.toString() : val.toFixed(2)
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Enrollment Overview">
      <template #overview>
        <DataMetrics :stats="enrollmentStats" />
      </template>

      <template #table>
        <DataTable title="Enrollment Lists" :headers="enrollmentHeaders" :items="filteredEnrollments" :loading="loading"
          v-model:searchQuery="searchQuery" searchPlaceholder="Search Enrollments" :hasFilter="true"
          v-model:currentFilter="currentFilter" :filterOptions="[
            { label: 'All Enrollments', value: 'all' },
            { label: 'Paid Only', value: 'paid' },
            { label: 'Unpaid Only', value: 'unpaid' },
            { label: 'Cancelled Only', value: 'cancelled' },
          ]" :rowClass="getRowClass" @action="handleTableAction" @row-click="item => {
            if (item.id === newlyCreatedId) newlyCreatedId = null;
            $router.push(`/enrollments/${item.id}`);
          }">
          <template #toolbar-actions>
            <AppButton variant="primary" @click="showModal = true">+ New Enrollment</AppButton>
          </template>

          <template #row="{ item, index, toggleMenu, activeMenuId, isMenuAbove, menuStyles, handleAction }">
            <td class="hide-on-mobile text-center">
              {{ index + 1 }}
            </td>
            <td class="hide-on-tablet bold">
              <div class="info-cell">
                <div class="avatar-mini">
                  <img :src="getParentProfileURL(item.parentProfileURL)" alt="parent" />
                </div>
                <span>{{ item.parentName }}</span>
              </div>
            </td>
            <td class="bold">
              <div class="info-cell">
                <div class="avatar-mini">
                  <img :src="getStudentProfileURL(item.studentProfileURL)" alt="student" />
                </div>
                <span>{{ item.studentName }}</span>
              </div>
            </td>
            <td>
              <div class="info-cell">
                <div class="program-icon-mini">
                  <img :src="getProgramProfileURL(item.programProfileURL)" alt="program" />
                </div>
                <div class="program-cell">
                  <div class="program-title">{{ item.programTitle || 'Program' }}</div>
                </div>
              </div>
            </td>
            <td>
              <div class="session-cell">
                <div class="session-day"><strong>{{ getSessionDay(item.sessionSchedule) }}</strong></div>
                <div class="session-time">{{ getSessionTime(item.sessionSchedule) }}</div>
              </div>
            </td>
            <td class="text-center">
              <span class="date-text">{{ formatDate(item.enrollAt) }}</span>
            </td>
            <td class="text-center">
              <StatusBadge :status="item.enrollmentType || 'Full'" />
            </td>
            <td class="bold hide-on-mobile text-center">
              <div class="amount-cell">
                <StatusBadge :status="'$' + formatPrice(item.amount || 0)"></StatusBadge>
                <div v-if="item.isProrated" class="prorate-note">PRORATED</div>
              </div>
            </td>
            <td class="text-center">
              <StatusBadge :status="item.displayStatus || 'Unpaid'" />
            </td>
            <td class="action-cell text-center">
              <div class="menu-container">
                <button class="btn-dots" @click.stop="toggleMenu($event, item.id)">
                  <span class="dots-icon">⋮</span>
                </button>
                <Teleport to="body">
                  <transition name="fade">
                    <div v-if="activeMenuId === item.id" class="action-dropdown" :class="{ 'open-up': isMenuAbove }"
                      :style="menuStyles" @click.stop>
                      <button @click="handleAction('edit', item)">✏️ Edit</button>
                      <button v-if="isUnpaid(item.status || item.paymentStatus)" @click="handleAction('pay', item)">💰
                        Pay</button>
                      <button v-if="!isCancelled(item.status || item.paymentStatus)"
                        @click="handleAction('cancel', item)">🚫 Cancel</button>
                      <div class="menu-divider"></div>
                      <button class="delete-btn" @click="handleAction('delete', item)">🗑️ Delete</button>
                    </div>
                  </transition>
                </Teleport>
              </div>
            </td>
          </template>
        </DataTable>
      </template>
    </DataPageLayout>

    <EnrollmentModal :isOpen="showModal" :loading="submitting" :parents="parents" :students="students"
      :programs="programs" :sessions="sessions" :enrollments="enrollments" :enrollment="selectedEnrollment"
      :error="errorMessage" :success="successMessage" :hint="validationHint"
      @close="() => { showModal = false; selectedEnrollment = null; errorMessage = ''; successMessage = ''; validationHint = ''; }"
      @program-change="handleProgramChange" @submit="handleSaveEnrollment" @hint="setValidationHint" />

    <AppModal :show="actionModal.isOpen"
      :title="(actionModal.type ? actionModal.type.charAt(0).toUpperCase() + actionModal.type.slice(1) : '') + ' Enrollment'"
      variant="action" @close="closeActionModal">
      <AppAlert :show="!!errorMessage" type="error" @close="errorMessage = ''" closable>
        {{ errorMessage }}
      </AppAlert>
      <AppAlert :show="!!successMessage" type="success" @close="successMessage = ''" closable>
        {{ successMessage }}
      </AppAlert>

      <div v-if="actionModal.type === 'pay'" class="action-pay-container">
        <!-- Enrollment Summary Card -->
        <div class="enrollment-brief-card" v-if="enrollmentSummary">
          <div class="brief-grid">
            <!-- Row 1: Parent & Student -->
            <div class="brief-column">
              <span class="brief-label">Parent / Guardian</span>
              <div class="brief-user">
                <img :src="enrollmentSummary.parentAvatar" class="avatar-mini-enrollment" />
                <span class="brief-value">{{ enrollmentSummary.parentName }}</span>
              </div>
            </div>
            <div class="brief-column">
              <span class="brief-label">Student</span>
              <div class="brief-user">
                <img :src="enrollmentSummary.studentAvatar" class="avatar-mini-enrollment" />
                <span class="brief-value">{{ enrollmentSummary.studentName }}</span>
              </div>
            </div>
            <!-- Row 2: Program & Session -->
            <div class="brief-column">
              <span class="brief-label">Program</span>
              <div class="brief-user">
                <img :src="enrollmentSummary.programAvatar" class="avatar-mini-enrollment" />
                <span class="brief-value">{{ enrollmentSummary.programTitle }}</span>
              </div>
            </div>
            <div class="brief-column">
              <span class="brief-label">Session</span>
              <div class="brief-session">
                <div class="session-display-row">
                  <div class="session-day-text"><strong>{{ enrollmentSummary.sessionDay }}</strong></div>
                  <div class="session-time-text">{{ enrollmentSummary.sessionTime }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tuition Info -->
          <div class="tuition-panel-modern">
            <div class="price-info-enrollment">
              <div class="price-header-row">
                <span class="price-label-enrollment">Tuition Amount</span>
                <span class="badge-mode">{{ enrollmentSummary.mode }}</span>
              </div>
              <div class="price-status-row">
                <StatusBadge :status="enrollmentSummary.status" />
                <span v-if="enrollmentSummary.hasDiscount" class="discount-note-mini">{{ enrollmentSummary.discountText }}</span>
              </div>
            </div>
            <div class="price-amount-large">${{ formatPrice(enrollmentSummary.amount) }}</div>
          </div>
        </div>

        <div class="form-group" style="margin-top: 20px;">
          <label>Payment Method</label>
          <div class="method-selector">
            <button type="button" class="method-btn" :class="{ active: actionModal.paymentMethod === 'online' }"
              @click="actionModal.paymentMethod = 'online'">
              <span class="icon">💳</span>
              <span>Online / Transfer</span>
            </button>
            <button type="button" class="method-btn" :class="{ active: actionModal.paymentMethod === 'cash' }"
              @click="actionModal.paymentMethod = 'cash'">
              <span class="icon">💵</span>
              <span>Cash Payment</span>
            </button>
          </div>
        </div>

        <div v-if="actionModal.paymentMethod === 'online'" class="form-group" style="margin-top: 16px;">
          <label>Transaction Reference / Proof</label>
          <input type="text" v-model="actionModal.proof" placeholder="e.g. ABA Transaction ID or Receipt #"
            class="standard-input" />
        </div>
        <div v-else class="cash-notice">
          <span class="icon">ℹ️</span>
          <p>This will mark the enrollment as paid by cash. No reference ID is required.</p>
        </div>
      </div>

      <div v-if="actionModal.type === 'cancel'" class="action-cancel-container">
        <!-- Enrollment Summary Card -->
        <div class="enrollment-brief-card" v-if="enrollmentSummary">
          <div class="brief-grid">
            <!-- Row 1: Parent & Student -->
            <div class="brief-column">
              <span class="brief-label">Parent / Guardian</span>
              <div class="brief-user">
                <img :src="enrollmentSummary.parentAvatar" class="avatar-mini-enrollment" />
                <span class="brief-value">{{ enrollmentSummary.parentName }}</span>
              </div>
            </div>
            <div class="brief-column">
              <span class="brief-label">Student</span>
              <div class="brief-user">
                <img :src="enrollmentSummary.studentAvatar" class="avatar-mini-enrollment" />
                <span class="brief-value">{{ enrollmentSummary.studentName }}</span>
              </div>
            </div>
            <!-- Row 2: Program & Session -->
            <div class="brief-column">
              <span class="brief-label">Program</span>
              <div class="brief-user">
                <img :src="enrollmentSummary.programAvatar" class="avatar-mini-enrollment" />
                <span class="brief-value">{{ enrollmentSummary.programTitle }}</span>
              </div>
            </div>
            <div class="brief-column">
              <span class="brief-label">Session Slot</span>
              <div class="brief-session">
                <div class="session-display-row">
                  <div class="session-day-text"><strong>{{ enrollmentSummary.sessionDay }}</strong></div>
                  <div class="session-time-text">{{ enrollmentSummary.sessionTime }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AppAlert type="warning" :customStyle="{ marginTop: '20px', marginBottom: '0px' }">
          <div style="display: flex; flex-direction: column; gap: 4px;">
            <strong style="font-size: 0.95rem;">Security Notice</strong>
            <span style="font-size: 0.85rem; opacity: 0.9; line-height: 1.2;">
              This will permanently remove the student and release their session slot.
            </span>
          </div>
        </AppAlert>

        <div class="form-group" style="margin-top: 20px;">
          <label>Reason for Cancellation</label>
          <div class="preset-chips" style="margin: 8px 0 12px 0;">
            <span v-for="preset in ['Schedule Conflict', 'Medical Reason', 'Moved Away', 'Refund Issued', 'Duplicate']"
              :key="preset" class="chip" @click="actionModal.reason = preset"
              :class="{ active: actionModal.reason === preset }">
              {{ preset }}
            </span>
          </div>
          <textarea v-model="actionModal.reason" class="standard-input"
            placeholder="Provide more details about why this is being cancelled..."
            style="min-height: 100px;"></textarea>
        </div>
      </div>

      <div v-if="actionModal.type === 'delete'" class="form-group">
        <div class="info-block danger"
          style="background: #fef2f2; padding: 12px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #fecaca;">
          <p style="color: #991b1b; font-size: 0.9rem;"><strong>Warning:</strong> This action is permanent and cannot be
            undone.</p>
        </div>
        <label>Type <strong class="danger-text">DELETE</strong> to confirm</label>
        <input type="text" v-model="actionModal.deleteConfirm" placeholder="DELETE" />
      </div>

      <template #footer>
        <div style="display: flex; flex-direction: column; align-items: flex-end; width: 100%; gap: 12px;">
          <!-- Validation Hint Bubble -->
          <transition name="toast-fade">
            <div v-if="showActionHint && actionModalValidationHint"
              style="font-size: 0.8rem; color: #ef4444; background: #fef2f2; padding: 6px 12px; border-radius: 6px; border: 1px solid #fee2e2; max-width: fit-content;">
              ⚠️ {{ actionModalValidationHint }}
            </div>
          </transition>
          <div style="display: flex; gap: 12px; justify-content: flex-end; width: 100%;">
            <AppButton variant="cancel" @click="closeActionModal">Cancel</AppButton>
            <AppButton :variant="actionModal.type === 'delete' ? 'danger' : 'primary'"
              @click="handleActionSubmitTrigger" :loading="submitting"
              :class="{ 'button-disabled-visual': !!actionModalValidationHint }">
              {{ actionModal.type === 'pay' ? 'Confirm Payment' : (actionModal.type === 'cancel' ?
                'Confirm Cancellation' : 'Confirm Action') }}
            </AppButton>
          </div>
        </div>
      </template>
    </AppModal>
  </DashboardLayout>
</template>

<style scoped>
.action-modal {
  padding: 24px;
}

.user-info {
  cursor: pointer;
}

.session-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date-text {
  font-size: 0.9rem;
  color: #475569;
}

/* Payment Action Modal Styles */
.action-pay-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.badge-mode {
  background: #f1f5f9;
  color: #475569;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  border: 1px solid #e2e8f0;
}

.price-status-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.discount-note-mini {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
  font-style: italic;
}

.method-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
}

.method-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.method-btn .icon {
  font-size: 1.5rem;
}

.method-btn span:last-child {
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
}

.method-btn:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.method-btn.active {
  border-color: #0ea5e9;
  background: #f0f9ff;
}

.method-btn.active span:last-child {
  color: #0369a1;
}

.cash-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #f1f5f9;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.cash-notice .icon {
  font-size: 1.1rem;
}

.cash-notice p {
  font-size: 0.85rem;
  color: #475569;
  margin: 0;
  line-height: 1.4;
}

.amount-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.prorate-note {
  font-size: 0.65rem;
  font-weight: 800;
  color: #00aeef;
  letter-spacing: 0.05em;
}
</style>
