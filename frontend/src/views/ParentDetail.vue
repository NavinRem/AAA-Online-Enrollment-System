<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import StatusBadge from '@/components/common/ui/StatusBadge.vue'
import TableToolbar from '@/components/common/data/TableToolbar.vue'
import DetailedSummaryCard from '@/components/common/cards/DetailedSummaryCard.vue'
import ParentActionModal from '../components/parents/ParentActionModal.vue'
import { userService } from '@/services/userService'
import { enrollmentService } from '@/services/enrollmentService'
import { formatDate, formatPrice } from '@/utils/formatUtils'
import { filterDetailEnrollments } from '@/utils/enrollmentHelper'
import { enrichStudents } from '@/utils/studentHelper'
import {
  processUserProfileImage,
  processStudentProfileImage,
  prepareUserPayload,
  prepareStudentPayload
} from '../utils/userHelper'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'

const route = useRoute()
const router = useRouter()

const parent = ref(null)
const students = ref([])
const enrollments = ref([])
const selectedChildUid = ref('all')
const activeTab = ref('children')
const currentFilter = ref('all')

watch(activeTab, () => {
  currentFilter.value = 'all'
})

const filterOptions = computed(() => {
  if (activeTab.value === 'children') {
    return [
      { label: 'All Status', value: 'all' },
      { label: 'Studying', value: 'studying' },
      { label: 'Completed', value: 'completed' },
      { label: 'Cancelled', value: 'cancelled' },
      { label: 'Registration: Newest First', value: 'date-desc' },
      { label: 'Registration: Oldest First', value: 'date-asc' },
    ]
  } else if (activeTab.value === 'payments') {
    return [
      { label: 'All Payments', value: 'all' },
      { label: 'Paid', value: 'paid' },
      { label: 'Pending', value: 'pending' },
      { label: 'Cancelled', value: 'cancelled' },
    ]
  }
  return [
    { label: 'All History', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Paid', value: 'paid' },
    { label: 'Cancelled', value: 'cancelled' },
  ]
})

const loading = ref(true)
const errorMessage = ref('')

const studentEnrollments = computed(() => {
  return filterDetailEnrollments(enrollments.value, {
    studentId: selectedChildUid.value,
    academicStatus: 'studying'
  })
})

const filteredPayments = computed(() =>
  filterDetailEnrollments(enrollments.value, {
    paymentStatus: currentFilter.value
  })
)

const filteredHistory = computed(() =>
  filterDetailEnrollments(enrollments.value, {
    academicStatus: currentFilter.value
  })
)

const isInactive = computed(() => {
  return (parent.value?.status || 'Active').toLowerCase() === 'inactive'
})

const fetchData = async (id) => {
  try {
    loading.value = true
    errorMessage.value = ''

    const parentData = await userService.getProfile(id)
    if (!parentData) throw new Error('Parent not found')

    parent.value = parentData
    const [studentsData, allEnrollments] = await Promise.all([
      userService.getStudentsByParentID(id),
      enrollmentService.getAllEnrollments(),
    ])

    students.value = enrichStudents(studentsData || [], [], [])

    if (
      students.value.length > 0 &&
      (selectedChildUid.value === 'all' || !selectedChildUid.value)
    ) {
      selectedChildUid.value = students.value[0].id || students.value[0].uid
    }

    // Filter enrollments for this parent
    const pId = parent.value.uid || parent.value.id
    enrollments.value = (allEnrollments || []).filter((r) => {
      const parentRef = r.parentId
      return String(parentRef) === String(pId)
    })
  } catch (error) {
    console.error('Failed to load parent details', error)
    errorMessage.value = error.message || 'Failed to load details'
  } finally {
    loading.value = false
  }
}

// Action Modals State
const submitting = ref(false)
const globalSuccess = ref('')
const globalError = ref('')

const actionModal = ref({
  isOpen: false,
  type: '', // 'edit', 'deactivate', 'delete', 'register-child'
  user: null,
})

const openActionModal = (type) => {
  globalError.value = ''
  globalSuccess.value = ''
  actionModal.value = {
    isOpen: true,
    type,
    user: parent.value,
  }
}

const openAddChildModal = () => {
  globalError.value = ''
  globalSuccess.value = ''
  actionModal.value = {
    isOpen: true,
    type: 'plus',
    user: parent.value,
  }
}

const submitActionModal = async (formData) => {
  const { type, user } = actionModal.value
  const uid = user.uid || user.id
  submitting.value = true
  globalError.value = ''

  try {
    if (type === 'edit') {
      const finalProfile = await processUserProfileImage(
        formData.profile,
        formData.name,
        formData.role,
        user.profile
      )
      const payload = prepareUserPayload({ ...formData, profile: finalProfile })
      await userService.updateUser(uid, payload)
      globalSuccess.value = 'Profile updated successfully!'
    } else if (type === 'deactivate') {
      await userService.updateUser(uid, { status: 'Inactive' })
      globalSuccess.value = 'Account deactivated successfully!'
    } else if (type === 'activate') {
      await userService.updateUser(uid, { status: 'Active' })
      globalSuccess.value = 'Account reactivated successfully!'
    } else if (type === 'delete') {
      await userService.deleteUser(uid)
      router.push('/parents')
      return
    } else if (type === 'register-child') {
      const finalProfile = await processStudentProfileImage(formData.profile, formData.name)
      const payload = prepareStudentPayload({ ...formData, profile: finalProfile })

      const result = await userService.registerStudentProfile(uid, payload)

      // Sync parent's studentInfo array
      const currentStudentInfo = parent.value.studentInfo || []
      const newChild = { id: result.id || result.UID, ...payload, parentId: uid }

      await userService.updateUser(uid, {
        studentInfo: [...currentStudentInfo, newChild]
      })

      globalSuccess.value = 'Child registered successfully!'
    }

    // 1. Set Success Message and Close Modal (UI Priority)
    setTimeout(() => {
      actionModal.value.isOpen = false
      globalSuccess.value = ''
    }, 1500)

    // 2. Background Refresh (Data Priority)
    try {
      await fetchData(uid)
    } catch (fetchErr) {
      console.warn('Data refreshed partially after modal save:', fetchErr)
    }
  } catch (err) {
    console.error('Action failed:', err)
    globalError.value = err.message || 'Action failed'
  } finally {
    submitting.value = false
  }
}


const navigateToStudent = (student) => {
  const sId = student.id || student.uid
  if (sId) {
    router.push(`/students/${sId}`)
  }
}

onMounted(() => {
  if (route.params.id) fetchData(route.params.id)
})

// React to route parameter changes (important for navigation between records)
watch(
  () => route.params.id,
  (newId) => {
    if (newId) fetchData(newId)
  },
)
</script>

<template>
  <DashboardLayout>
    <DetailPageLayout :loading="loading" :errorMessage="errorMessage" backRoute="/parents" title="Parent Details"
      :scrollable="true" :rightScrollable="true">
      <template #header-actions v-if="parent">
        <div class="actions-wrapper">
          <button class="btn-icon-modern btn-pay" title="Register Child" @click="openAddChildModal">
            <img :src="getActionIcon('plus')" />
          </button>
          <button class="btn-icon-modern btn-edit" title="Edit Parent" @click="openActionModal('edit')">
            <img :src="getActionIcon('edit')" />
          </button>
          <button v-if="!isInactive" class="btn-icon-modern btn-cancel" title="Deactivate Account"
            @click="openActionModal('deactivate')">
            <img :src="getActionIcon('cancel')" />
          </button>
          <button v-else class="btn-icon-modern btn-pay" title="Activate Account" @click="openActionModal('activate')">
            <img :src="getActionIcon('pay')" />
          </button>
          <button class="btn-icon-modern btn-delete" title="Delete Account" @click="openActionModal('delete')">
            <img :src="getActionIcon('delete')" />
          </button>
        </div>
      </template>

      <template #left-content>
        <div class="tab-content-container">
          <div class="modern-tabs-nav">
            <button class="nav-tab-chip" :class="{ active: activeTab === 'children' }" @click="activeTab = 'children'">
              Children & Programs
            </button>
            <button class="nav-tab-chip" :class="{ active: activeTab === 'payments' }" @click="activeTab = 'payments'">
              Payment History
            </button>
            <button class="nav-tab-chip" :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">
              Enrollment Logs
            </button>
          </div>
          <div v-if="activeTab === 'children'" class="detail-section-card full-width">
            <div class="section-header-compact">
              <h3>Children's Programs</h3>
            </div>

            <!-- Child Selector Chips -->
            <div class="child-selector spaced-below" v-if="students.length > 0">
              <button v-for="s in students" :key="s.id || s.uid" class="child-chip"
                :class="{ active: selectedChildUid === (s.id || s.uid) }" @click="selectedChildUid = (s.id || s.uid)"
                @dblclick="navigateToStudent(s)">
                <div class="chip-avatar-wrapper">
                  <img :src="s.profileURL" class="chip-avatar"
                    @error="e => e.target.src = getImageUrl('profiles/avatar-student')" />
                </div>
                <span class="chip-label">{{ s.name }}</span>
              </button>
            </div>

            <div class="table-container">
              <table class="detail-table">
                <thead>
                  <tr>
                    <th style="width: 50px;" class="text-center">No</th>
                    <th>Program</th>
                    <th style="width: 160px;">Session</th>
                    <th style="width: 120px;" class="text-center">Amount</th>
                    <th style="width: 120px;" class="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="students.length === 0">
                    <td colspan="5" class="text-center text-muted p-4">
                      No children linked to this parent account.
                    </td>
                  </tr>
                  <tr v-else-if="studentEnrollments.length === 0">
                    <td colspan="5" class="text-center text-muted p-4">
                      This child is not currently registered in any active programs.
                    </td>
                  </tr>
                  <tr v-for="(reg, idx) in studentEnrollments" :key="reg.id">
                    <td class="text-center">{{ idx + 1 }}</td>
                    <td class="bold">{{ reg.programTitle || reg.program?.title || 'N/A' }}</td>
                    <td>
                      <div class="session-cell">
                        <strong>{{ reg.sessionSchedule?.split(' ')[0] || 'N/A' }}</strong>
                        <span>{{ reg.sessionSchedule?.split(' ').slice(1).join(' ') || '' }}</span>
                      </div>
                    </td>
                    <td class="text-center">
                      <StatusBadge :status="'$' + formatPrice(reg.amount || 0)" />
                    </td>
                    <td class="text-center">
                      <StatusBadge :status="reg.displayStatus || reg.status || 'Unpaid'" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="activeTab === 'payments'" class="detail-section-card full-width">
            <div class="section-header-compact">
              <h3>Payment History</h3>
              <div class="tab-actions">
                <TableToolbar :hasSearch="false" :hasFilter="true" :currentFilter="currentFilter"
                  @update:currentFilter="currentFilter = $event" :filterOptions="filterOptions" />
              </div>
            </div>
            <div class="table-container">
              <table class="detail-table">
                <thead>
                  <tr>
                    <th style="width: 50px;" class="text-center">No</th>
                    <th style="width: 140px;">Transaction ID</th>
                    <th>Ref ID</th>
                    <th style="width: 120px;" class="text-center">Amount</th>
                    <th style="width: 160px;" class="text-center">Paid Date</th>
                    <th style="width: 120px;" class="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="filteredPayments.length === 0">
                    <td colspan="6" class="text-center text-muted p-4">No payment history found for this parent.</td>
                  </tr>
                  <tr v-for="(reg, idx) in filteredPayments" :key="'pay-' + reg.id">
                    <td class="text-center">{{ idx + 1 }}</td>
                    <td class="mono">{{ reg.paymentProof || 'N/A' }}</td>
                    <td class="mono">{{ reg.id.substring(0, 8) + '...' }}</td>
                    <td class="text-center bold text-emerald-600">
                      <StatusBadge :status="'$' + formatPrice(reg.amount || 0)"></StatusBadge>
                    </td>
                    <td class="text-center date-text">{{ formatDate(reg.updatedAt || reg.createdAt) }}</td>
                    <td class="text-center">
                      <StatusBadge :status="reg.paymentStatus || 'Pending'" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="activeTab === 'history'" class="detail-section-card full-width">
            <div class="section-header-compact">
              <h3>Enrollment History</h3>
              <div class="tab-actions">
                <TableToolbar :hasSearch="false" :hasFilter="true" :currentFilter="currentFilter"
                  @update:currentFilter="currentFilter = $event" :filterOptions="filterOptions" />
              </div>
            </div>
            <div class="table-container">
              <table class="detail-table">
                <thead>
                  <tr>
                    <th style="width: 50px;" class="text-center">No</th>
                    <th style="width: 200px;">Enrollment ID</th>
                    <th>Program</th>
                    <th style="width: 160px;">Child</th>
                    <th style="width: 160px;" class="text-center">Enrolled Date</th>
                    <th style="width: 120px;" class="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="filteredHistory.length === 0">
                    <td colspan="6" class="text-center text-muted p-4">
                      No enrollment history records found.
                    </td>
                  </tr>
                  <tr v-for="(reg, idx) in filteredHistory" :key="reg.id">
                    <td class="text-center">{{ idx + 1 }}</td>
                    <td class="mono">{{ reg.id }}</td>
                    <td class="bold">{{ reg.programTitle }}</td>
                    <td class="bold">{{ reg.studentName }}</td>
                    <td class="text-center date-text">{{ formatDate(reg.createdAt) }}</td>
                    <td class="text-center">
                      <StatusBadge :status="reg.status?.toLowerCase() === 'confirmed' ? 'Paid' : reg.status" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>

      <template #right-content v-if="parent">
        <DetailedSummaryCard title="Basic Information" subtitle="Parent Information">
          <template #outside>
            <div class="profile-header flex-stack flex-center">
              <div class="profile-preview-wrapper shadow-premium">
                <img :src="parent?.profileURL" alt="Profile"
                  @error="e => e.target.src = getImageUrl('profiles/avatar-admin')" class="profile-avatar" />
              </div>
            </div>
          </template>

          <div class="scrollable-info-body">
            <div class="detail-info-group">
              <div class="info-item horizontal">
                <span class="info-label">Status:</span>
                <StatusBadge :status="parent?.status" />
              </div>
              <div class="info-item vertical">
                <span class="info-label">Fullname:</span>
                <strong>{{ parent?.name }}</strong>
              </div>
              <div class="info-item vertical">
                <span class="info-label">Phone Number:</span>
                <strong>{{ parent?.phone }}</strong>
              </div>
              <div class="info-item vertical">
                <span class="info-label">Email:</span>
                <strong class="email medium">{{ parent?.email }}</strong>
              </div>
              <div class="info-item vertical">
                <StatusBadge status="Created At" />
                <strong class="small">{{ formatDate(parent?.createdAt) }}</strong>
              </div>
              <div class="info-item vertical">
                <StatusBadge status="Updated At" />
                <strong class="small">{{ formatDate(parent?.updatedAt || parent?.createdAt) }}</strong>
              </div>
            </div>
          </div>
        </DetailedSummaryCard>

        <DetailedSummaryCard subtitle="Child Profiles">
          <div class="relationships-list">
            <div v-for="s in students" :key="s.id || s.uid" class="relationship-item clickable"
              @click="navigateToStudent(s)">
              <img :src="s.profileURL || getImageUrl('profiles/avatar-student')" alt="child" class="small-avatar" />
              <div class="child-info">
                <strong>{{ s.name }}</strong>
              </div>
            </div>
            <div v-if="students.length === 0" class="text-muted text-center">
              No children linked.
            </div>
          </div>
        </DetailedSummaryCard>
      </template>
    </DetailPageLayout>

    <!-- Admin Action Modals -->
    <ParentActionModal :isOpen="actionModal.isOpen" :type="actionModal.type" :user="actionModal.user"
      :loading="submitting" v-model:error="globalError" v-model:success="globalSuccess"
      @close="actionModal.isOpen = false" @submit="submitActionModal" />
  </DashboardLayout>
</template>

<style scoped>
@import '@/assets/styles/detail-view.css';

/* Parent-specific tweaks */
.child-selector {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.child-chip {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--primary-light);
  background: var(--white);
  font-size: var(--text-sm);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-muted);
}

.child-chip:hover {
  background: var(--primary-light);
}

.chip-avatar-wrapper {
  width: 28px;
  height: 28px;
  border-radius: var(--border-radius-round);
  overflow: hidden;
  flex-shrink: 0;
  background: var(--white);
  border: 1px solid var(--border-color);
}

.chip-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.child-chip.active {
  background: var(--accent-light);
  border-color: var(--primary-color);
  color: var(--primary-color);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.chip-label {
  white-space: nowrap;
}

.detail-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 var(--space-xs);
}

.detail-table th {
  padding: var(--space-sm) var(--space-md);
  color: var(--text-light);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: none;
}

.detail-table td {
  padding: var(--space-md);
  background: var(--white);
  border-top: 1px solid var(--bg-light);
  border-bottom: 1px solid var(--bg-light);
  color: var(--text-dark);
  font-size: var(--text-sm);
  transition: all 0.2s;
}

.detail-table td:first-child {
  border-left: 1px solid var(--bg-light);
  border-top-left-radius: var(--border-radius);
  border-bottom-left-radius: var(--border-radius);
}

.detail-table td:last-child {
  border-right: 1px solid var(--bg-light);
  border-top-right-radius: var(--border-radius);
  border-bottom-right-radius: var(--border-radius);
}

.detail-table tr:hover td {
  background: var(--bg-subtle);
  border-color: var(--border-color);
}

.email {
  text-transform: lowercase;
  color: var(--primary-color);
}

.price {
  color: var(--success-color);
  font-weight: 700;
}

.mono {
  font-family: var(--font-family-mono, 'JetBrains Mono', 'Fira Code', monospace);
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.badge-stack {
  display: flex;
  gap: var(--space-xs);
  justify-content: center;
}

.section-header-compact {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.profile-role-text {
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-light);
  margin-bottom: var(--space-md);
}

.profile-preview-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: var(--border-radius-round);
  background: var(--white);
  padding: 4px;
  border: 4px solid var(--primary-color);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.profile-preview-wrapper::before {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 36px;
  background: linear-gradient(135deg, var(--primary-color), var(--magenta-color));
  z-index: -1;
  opacity: 0.15;
}

.profile-avatar {
  width: 100%;
  height: 100%;
  border-radius: var(--border-radius-round);
  object-fit: cover;
}

.status-indicator {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 24px;
  height: 24px;
  background: var(--success-color);
  border: 5px solid var(--white);
  border-radius: var(--border-radius-round);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  animation: pulse-green 2s infinite;
}

.status-indicator.inactive {
  background: var(--gray-color);
  animation: none;
}

@keyframes pulse-green {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  }

  70% {
    box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

.profile-name {
  margin: var(--space-md) 0 2px;
  font-size: var(--text-2xl);
  font-weight: 900;
  color: var(--text-deep);
  letter-spacing: -0.8px;
}

.text-emerald-600 {
  color: var(--success-color);
}

.detail-section-card h3 {
  font-size: var(--text-lg);
  font-weight: 800;
  color: var(--text-deep);
  letter-spacing: -0.3px;
}

.session-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.session-cell strong {
  font-size: var(--text-sm);
  color: var(--text-dark);
}

.session-cell span {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.timestamp-item p {
  margin-top: var(--space-xs);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-dark);
}

.relationship-item.clickable {
  cursor: pointer;
  transition: all 0.2s;
  padding: var(--space-xs);
  border-radius: var(--border-radius);
}

.relationship-item.clickable:hover {
  background: var(--bg-light);
  transform: translateX(4px);
}

.relationships-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.relationship-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-subtle);
  border-radius: var(--border-radius);
  border: 1px solid var(--bg-light);
  transition: all 0.2s;
}

.relationship-item:hover {
  background: var(--bg-light);
  border-color: var(--border-color);
}

.child-info {
  display: flex;
  flex-direction: column;
}

.child-info strong {
  font-size: var(--text-base);
  color: var(--text-dark);
}

.child-info span {
  font-size: var(--text-xs);
  color: var(--text-light);
}

.timestamp-item p {
  margin-top: var(--space-xs);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-dark);
}

.mt-3 {
  margin-top: var(--space-lg);
}

.text-center {
  text-align: center;
}

.p-3 {
  padding: var(--space-sm);
}

.modern-tabs-nav {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm);
  margin-bottom: var(--space-sm);
  background: var(--bg-subtle);
  border-radius: var(--border-radius-2xl);
  border: 1.5px solid var(--bg-light);
  width: fit-content;
}

.nav-tab-chip {
  background: transparent;
  border: 1px solid transparent;
  padding: var(--space-sm) var(--space-xl);
  cursor: pointer;
  border-radius: var(--border-radius-lg);
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--text-muted);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-tab-chip:hover {
  background: var(--bg-light);
  color: var(--text-dark);
}

.nav-tab-chip.active {
  background: var(--accent-light);
  color: var(--primary-color);
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}



.relationship-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: var(--primary-soft);
  border-radius: 16px;
  border: 1.5px solid var(--bg-light);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.relationship-item.clickable {
  cursor: pointer;
}

.relationship-item.clickable:hover {
  background: var(--primary-soft);
  border-color: var(--primary-light);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.small-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-round);
  border: 2px solid var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  object-fit: cover;
  background-color: var(--white);
}
</style>
