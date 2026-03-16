<script setup>
import { ref, onMounted, computed } from 'vue'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import DataMetrics from '../components/common/data/DataMetrics.vue'
import DataTable from '../components/common/data/DataTable.vue'
import StatusBadge from '../components/common/ui/StatusBadge.vue'
import EnrollmentForm from '../components/enrollments/EnrollmentForm.vue'
import { enrollmentService } from '@/services/enrollmentService'
import { userService } from '../services/userService'
import { courseService } from '../services/courseService'
import { useSearch, enrollmentSearchMapper } from '../composables/useSearch'
import { calculateTotalEnrollment, enrichEnrollments } from '../utils/enrollmentHelper'
import { getImageUrl } from '@/utils/assetHelper'
import { formatDate, formatDateOnly } from '../utils/dateFormatter'
import AppModal from '@/components/common/ui/AppModal.vue'

const enrollments = ref([])
const parents = ref([]) 
const students = ref([])
const courses = ref([])
const sessions = ref([])
const loading = ref(true)
const showModal = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const newlyCreatedId = ref(null)

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

const handleCourseChange = async (courseId) => {
  if (!courseId) {
    sessions.value = []
    return
  }
  try {
    const data = await courseService.getSessions(courseId)
    sessions.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Failed to load sessions', err)
  }
}

const handleCreateEnrollment = async (formData) => {
  submitting.value = true
  errorMessage.value = ''
  try {
    const parent = parents.value.find((p) => (p.uid || p.id) === formData.parentId)
    const student = students.value.find((s) => s.id === formData.studentId)
    const course = courses.value.find((c) => c.id === formData.courseId)
    const session = sessions.value.find((s) => s.id === formData.sessionId)

    const payload = {
      parentId: parent.uid || parent.id,
      parentName: parent.name || parent.email || 'Parent',
      studentId: student.id,
      studentName: student.fullname || student.fullName || student.name || 'Student',
      courseId: course.id,
      courseTitle: course.title || course.name || 'Course',
      sessionId: session.id,
      sessionSchedule: session.schedule?.day + ' ' + session.schedule?.timeslot,
      amount: formData.amount,
      status: 'pending',
      paymentStatus: 'unpaid',
      enrollAt: new Date().toISOString(),
    }

    const result = await enrollmentService.createEnrollment(payload)
    successMessage.value = 'Successfully created enrollment!'
    newlyCreatedId.value = result.id || result.UID
    await fetchEnrollments()

    setTimeout(() => {
      showModal.value = false
      successMessage.value = ''
    }, 1500)
  } catch (err) {
    errorMessage.value = err.message || 'Failed to create enrollment.'
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
    { label: 'Total Cancelled Enrollment', value: s.cancelledCount, image: getImageUrl('enrollment/total-canceled-enrollment'), color: '#e1f5fe' }
  ]
})

const enrollmentHeaders = [
  { label: 'No', width: '80px', class: 'hide-on-mobile', align: 'center' },
  { label: 'Parent / Guardian', class: 'hide-on-tablet', width: '220px' },
  { label: 'Student', width: '220px' },
  { label: 'Program' },
  { label: 'Regist. Date', class: 'hide-on-tablet', width: '150px' },
  { label: 'Amount', class: 'hide-on-mobile', align: 'center', width: '100px' },
  { label: 'Status', align: 'center', width: '120px' },
  { label: 'Action', width: '80px', align: 'center' }
]

const currentFilter = ref('all')

const statusFilteredEnrollments = computed(() => {
  const enriched = enrichEnrollments(enrollments.value, parents.value, students.value)
  
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
    } else if (type === 'edit') {
      await enrollmentService.updateEnrollment(enrollment.id, { amount: Number(amount), remark: remark.trim() })
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
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Enrollment Overview">
      <template #overview>
        <DataMetrics :stats="enrollmentStats" />
      </template>

      <template #table>
        <DataTable
          title="Enrollment Lists"
          :headers="enrollmentHeaders"
          :items="filteredEnrollments"
          :loading="loading"
          v-model:searchQuery="searchQuery"
          searchPlaceholder="Search Enrollments"
          :hasFilter="true"
          v-model:currentFilter="currentFilter"
          :filterOptions="[
            { label: 'All Enrollments', value: 'all' },
            { label: 'Paid Only', value: 'paid' },
            { label: 'Unpaid Only', value: 'unpaid' },
            { label: 'Cancelled Only', value: 'cancelled' },
          ]"
          :rowClass="getRowClass"
          @action="handleTableAction"
          @row-click="item => { 
            if (item.id === newlyCreatedId) newlyCreatedId = null;
            $router.push(`/enrollment/${item.id}`);
          }"
        >
          <template #toolbar-actions>
            <AppButton variant="primary" @click="showModal = true">+ New Enrollment</AppButton>
          </template>

          <template #row="{ item, index, toggleMenu, activeMenuId, isMenuAbove, menuStyles, handleAction }">
            <td class="hide-on-mobile text-center">
              {{ index + 1 }}
            </td>
            <td class="hide-on-tablet">
              <div class="user-info">
                <div class="avatar-mini">
                  <img :src="item.parentProfileURL || getImageUrl('profiles/avatar-parent')" alt="parent" />
                </div>
                <span>{{ item.parentName }}</span>
              </div>
            </td>
            <td>
              <div class="user-cell">
                <div class="user-avatar-small">
                  <img :src="item.studentProfileURL || getImageUrl('profiles/avatar-student')" alt="student" />
                </div>
                {{ item.studentName || 'Student' }}
              </div>
            </td>
            <td>
              <div class="user-info">
                <div class="program-icon-mini">
                  <img :src="item.courseIcon" alt="program" />
                </div>
                {{ item.courseTitle || 'Course' }}
              </div>
            </td>
            <td class="hide-on-tablet">{{ formatDate(item.enrollAt) }}</td>
            <td class="bold hide-on-mobile text-center">${{ item.amount || 0 }}</td>
            <td class="text-center">
              <StatusBadge :status="isPaid(item.status || item.paymentStatus) ? 'Paid' : (isCancelled(item.status || item.paymentStatus) ? 'Cancelled' : 'Unpaid')" />
            </td>
            <td class="action-cell text-center">
              <div class="menu-container">
                <button class="btn-dots" @click.stop="toggleMenu($event, item.id)">
                  <span class="dots-icon">⋮</span>
                </button>
                <Teleport to="body">
                  <transition name="fade">
                    <div v-if="activeMenuId === item.id" class="action-dropdown" :class="{ 'open-up': isMenuAbove }" :style="menuStyles" @click.stop>
                      <button @click="handleAction('edit', item)">✏️ Edit</button>
                      <button v-if="isUnpaid(item.status || item.paymentStatus)" @click="handleAction('pay', item)">💰 Pay</button>
                      <button v-if="!isCancelled(item.status || item.paymentStatus)" @click="handleAction('cancel', item)">🚫 Cancel</button>
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

    <EnrollmentForm
      :isOpen="showModal"
      :loading="submitting"
      :parents="parents"
      :students="students"
      :courses="courses"
      :sessions="sessions"
      :error="errorMessage"
      :success="successMessage"
      @close="() => { showModal = false; errorMessage = ''; successMessage = ''; }"
      @course-change="handleCourseChange"
      @submit="handleCreateEnrollment"
    />

    <!-- Action Modals -->
    <AppModal 
      :show="actionModal.isOpen" 
      :title="actionModal.type + ' Enrollment'" 
      variant="action" 
      @close="closeActionModal"
    >
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
        <div class="info-block danger" style="background: #fef2f2; padding: 12px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #fecaca;">
          <p style="color: #991b1b; font-size: 0.9rem;"><strong>Warning:</strong> This action is permanent and cannot be undone.</p>
        </div>
        <label>Type <strong class="danger-text">DELETE</strong> to confirm</label>
        <input type="text" v-model="actionModal.deleteConfirm" placeholder="DELETE" />
      </div>

      <template #footer>
        <AppButton variant="cancel" @click="closeActionModal">Cancel</AppButton>
        <AppButton 
          :variant="actionModal.type === 'delete' ? 'danger' : 'primary'" 
          @click="submitActionModal" 
          :loading="submitting"
          :disabled="submitting || (actionModal.type === 'delete' && actionModal.deleteConfirm !== 'DELETE')"
        >
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
</style>
