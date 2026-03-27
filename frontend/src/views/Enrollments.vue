<script setup>
import { ref, onMounted, computed } from 'vue'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import DataMetrics from '../components/common/data/DataMetrics.vue'
import DataTable from '../components/common/data/DataTable.vue'
import StatusBadge from '../components/common/ui/StatusBadge.vue'
import EnrollmentModal from '../components/enrollments/EnrollmentModal.vue'
import { enrollmentService } from '@/services/enrollmentService'
import { userService } from '../services/userService'
import { programService } from '../services/programService'
import { useSearch, enrollmentSearchMapper } from '../composables/useSearch'
import { calculateTotalEnrollment, enrichEnrollments } from '../utils/enrollmentHelper'
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
        status: 'pending',
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
  const enriched = enrichEnrollments(enrollments.value, parents.value, students.value, programs.value)

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
})

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
  }
}

const submitActionModal = async () => {
  const { type, enrollment, amount, proof, reason, remark, deleteConfirm } = actionModal.value
  submitting.value = true
  try {
    if (type === 'pay') {
      await enrollmentService.updateEnrollment(enrollment.id, { paymentStatus: 'paid', paymentProof: proof })
    } else if (type === 'cancel') {
      await enrollmentService.cancelEnrollment(enrollment.id)
      await enrollmentService.updateEnrollment(enrollment.id, { cancelReason: reason })
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

const closeActionModal = () => {
  actionModal.value.isOpen = false
  errorMessage.value = ''
  successMessage.value = ''
}

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

    <!-- Action Modals -->
    <AppModal :show="actionModal.isOpen" :title="actionModal.type + ' Enrollment'" variant="action"
      @close="closeActionModal">
      <div v-if="errorMessage" class="alert-box error">{{ errorMessage }}</div>
      <div v-if="successMessage" class="alert-box success">{{ successMessage }}</div>

      <div v-if="actionModal.type === 'edit'" class="form-group">
        <label>Amount ($)</label>
        <input type="number" v-model="actionModal.amount" />
        <label>Remark</label>
        <textarea v-model="actionModal.remark" placeholder="Enter administrative remarks..."></textarea>
      </div>
      <div v-if="actionModal.type === 'pay'" class="form-group">
        <label>Proof of Payment</label>
        <input type="text" v-model="actionModal.proof" placeholder="Receipt or Transaction ID" />
      </div>
      <div v-if="actionModal.type === 'cancel'" class="form-group">
        <label>Reason for Cancellation</label>
        <textarea v-model="actionModal.reason" placeholder="Why is this enrollment being cancelled?"></textarea>
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
        <AppButton variant="cancel" @click="closeActionModal">Cancel</AppButton>
        <AppButton :variant="actionModal.type === 'delete' ? 'danger' : 'primary'" @click="submitActionModal"
          :loading="submitting"
          :disabled="submitting || (actionModal.type === 'delete' && actionModal.deleteConfirm !== 'DELETE')">
          Confirm action
        </AppButton>
      </template>
    </AppModal>
  </DashboardLayout>
</template>

<style scoped>
.action-modal {
  padding: 24px;
}

.bold {
  font-weight: 600;
  color: #1a1a1a;
}

.user-info {
  cursor: pointer;
}

.session-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.session-day {
  font-size: 0.95rem;
  color: #1e293b;
  line-height: 1.2;
}

.session-time {
  font-size: 0.85rem;
  color: #64748b;
}

.date-text {
  font-size: 0.9rem;
  color: #475569;
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
