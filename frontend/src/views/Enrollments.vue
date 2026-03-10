<script setup>
import { ref, onMounted, computed } from 'vue'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton/AppButton.vue'
import DataMetrics from '../components/common/data/DataMetrics/DataMetrics.vue'
import DataTable from '../components/common/data/DataTable/DataTable.vue'
import StatusBadge from '../components/common/ui/StatusBadge/StatusBadge.vue'
import EnrollmentForm from '../components/enrollments/EnrollmentForm.vue'
import { registrationService } from '@/services/registrationService'
import { userService } from '../services/userService'
import { courseService } from '../services/courseService'
import { useSearch, enrollmentSearchMapper } from '../composables/useSearch'
import { getCourseIcon } from '../utils/courseHelper'
import { formatDate } from '@/utils/dateFormatter'

import { getImageUrl, getIconUrl } from '@/utils/assetHelper'

const registrations = ref([])
const parents = ref([])
const students = ref([])
const courses = ref([])
const sessions = ref([])
const loading = ref(true)
const showModal = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

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

    await registrationService.createEnrollment(payload)
    successMessage.value = 'Successfully created enrollment!'
    await fetchRegistrations()

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

const isPaid = (status) => status?.toLowerCase() === 'paid' || status?.toLowerCase() === 'confirmed'
const isCancelled = (status) =>
  status?.toLowerCase() === 'canceled' || status?.toLowerCase() === 'cancelled'
const isUnpaid = (status) => status && !isPaid(status) && !isCancelled(status)

const enrollmentStats = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  const todayRegistrations = registrations.value.filter(r => (r.enrollAt || r.createdAt)?.split('T')[0] === today);
  const pendingRegistrations = registrations.value.filter(r => r.status === 'pending' || r.paymentStatus === 'pending');
  const todayRevenue = todayRegistrations
    .filter(r => isPaid(r.status || r.paymentStatus))
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  return [
    { label: 'Total Enrollments', value: registrations.value.length, image: getIconUrl('enrollment'), color: '#e1f5fe' },
    { label: 'New Today', value: todayRegistrations.length, image: getIconUrl('register'), color: '#e1f5fe' },
    { label: 'Pending Approval', value: pendingRegistrations.length, image: getIconUrl('dashboard', 'pending1.png'), color: '#e1f5fe' },
    { label: 'Revenue Today', value: `$${todayRevenue}`, image: getIconUrl('pay'), color: '#e1f5fe' }
  ];
});

const enrollmentHeaders = [
  { label: 'No', width: '60px', class: 'hide-on-mobile' },
  { label: 'Parent / Guardian', class: 'hide-on-tablet' },
  { label: 'Student' },
  { label: 'Program' },
  { label: 'Regist. Date', class: 'hide-on-tablet' },
  { label: 'Amount', class: 'hide-on-mobile' },
  { label: 'Status' },
  { label: 'Action', width: '60px' }
]

const currentFilter = ref('all')

const statusFilteredRegistrations = computed(() => {
  let list = registrations.value.map((r) => {
    const parent = parents.value.find((p) => (p.uid || p.id) === (r.parentId))
    const student = students.value.find((s) => (s.uid || s.id) === (r.studentId))

    return {
      ...r,
      parentProfileURL: parent?.profileURL || null,
      studentProfileURL: student?.profileURL || null,
      courseIcon: getCourseIcon(r.courseTitle || r.course_title),
    }
  })

  if (currentFilter.value !== 'all') {
    if (currentFilter.value === 'paid') list = list.filter((r) => isPaid(r.status || r.paymentStatus))
    else if (currentFilter.value === 'unpaid') list = list.filter((r) => isUnpaid(r.status || r.paymentStatus))
    else if (currentFilter.value === 'cancelled') list = list.filter((r) => isCancelled(r.status || r.paymentStatus))
  }

  return list.sort((a, b) => new Date(b.enrollAt || b.createdAt).getTime() - new Date(a.enrollAt || a.createdAt).getTime())
})

const { searchQuery, searchResults: filteredRegistrations } = useSearch(
  statusFilteredRegistrations,
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
      await registrationService.updateEnrollment(enrollment.id, { paymentStatus: 'paid', paymentProof: proof })
    } else if (type === 'cancel') {
      await registrationService.cancelEnrollment(enrollment.id)
      await registrationService.updateEnrollment(enrollment.id, { cancelReason: reason })
    } else if (type === 'delete') {
      if (deleteConfirm !== 'DELETE') throw new Error('Type DELETE to confirm')
      await registrationService.deleteEnrollment(enrollment.id)
    } else if (type === 'edit') {
      await registrationService.updateEnrollment(enrollment.id, { amount: Number(amount), remark: remark.trim() })
    }
    successMessage.value = 'Action completed successfully.'
    await fetchRegistrations()
    setTimeout(() => { actionModal.value.isOpen = false }, 1500)
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Enrollment Overview" listTitle="Enrollment Lists">
      <template #overview>
        <DataMetrics :stats="enrollmentStats" />
      </template>

      <template #table>
        <DataTable
          :headers="enrollmentHeaders"
          :items="filteredRegistrations"
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
          @action="handleTableAction"
          @row-click="id => $router.push(`/enrollment/${id}`)"
        >
          <template #toolbar-actions>
            <AppButton variant="primary" @click="showModal = true">+ New Enrollment</AppButton>
          </template>

          <template #row="{ item, index, toggleMenu, activeMenuId, isMenuAbove, menuStyles, handleAction }">
            <td class="hide-on-mobile">{{ index + 1 }}</td>
            <td class="hide-on-tablet">
              <div class="user-info">
                <div class="avatar-mini">
                  <img :src="item.parentProfileURL || getImageUrl('profiles', 'female-profile-parent.jpg')" alt="parent" />
                </div>
                {{ item.parentName || 'Parent' }}
              </div>
            </td>
            <td>
              <div class="user-info">
                <div class="avatar-mini">
                  <img :src="item.studentProfileURL || getImageUrl('profiles', 'child-profile.png')" alt="student" />
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
            <td class="hide-on-tablet">{{ item.enrollAt ? item.enrollAt.split('T')[0] : 'N/A' }}</td>
            <td class="bold hide-on-mobile">${{ item.amount || 0 }}</td>
            <td>
              <StatusBadge :status="isPaid(item.status || item.paymentStatus) ? 'Paid' : (isCancelled(item.status || item.paymentStatus) ? 'Cancelled' : 'Unpaid')" />
            </td>
            <td class="action-cell">
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
      @close="showModal = false"
      @course-change="handleCourseChange"
      @submit="handleCreateEnrollment"
    />

    <!-- Action Modals -->
    <transition name="modal-fade">
      <div v-if="actionModal.isOpen" class="modal-overlay" @click.self="actionModal.isOpen = false">
        <div class="modal-content action-modal">
          <div class="modal-header">
            <h3 class="capitalize">{{ actionModal.type }} Enrollment</h3>
            <button class="close-btn" @click="actionModal.isOpen = false">×</button>
          </div>
          <div class="modal-body">
            <div v-if="errorMessage" class="alert-box error">{{ errorMessage }}</div>
            <div v-if="successMessage" class="alert-box success">{{ successMessage }}</div>

            <div v-if="actionModal.type === 'edit'" class="form-group">
              <label>Amount ($)</label>
              <input type="number" v-model="actionModal.amount" />
              <label>Remark</label>
              <textarea v-model="actionModal.remark"></textarea>
            </div>
            <div v-if="actionModal.type === 'pay'" class="form-group">
              <label>Proof of Payment</label>
              <input type="text" v-model="actionModal.proof" placeholder="Receipt #" />
            </div>
            <div v-if="actionModal.type === 'cancel'" class="form-group">
              <label>Reason</label>
              <textarea v-model="actionModal.reason"></textarea>
            </div>
            <div v-if="actionModal.type === 'delete'" class="form-group">
              <p class="danger-text">This action is permanent. Type DELETE to confirm.</p>
              <input type="text" v-model="actionModal.deleteConfirm" placeholder="DELETE" />
            </div>
          </div>
          <div class="modal-footer">
            <AppButton variant="cancel" @click="actionModal.isOpen = false">Cancel</AppButton>
            <AppButton :variant="actionModal.type === 'delete' ? 'danger' : 'primary'" @click="submitActionModal" :loading="submitting">
              Confirm {{ actionModal.type }}
            </AppButton>
          </div>
        </div>
      </div>
    </transition>
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
