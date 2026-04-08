<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import StatusBadge from '@/components/common/ui/StatusBadge.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import TableToolbar from '@/components/common/data/TableToolbar.vue'
import DetailedSummaryCard from '@/components/common/cards/DetailedSummaryCard.vue'
import ParentActionModal from '../components/parents/ParentActionModal.vue'
import { userService } from '@/services/userService'
import { enrollmentService } from '@/services/enrollmentService'
import { formatDate } from '@/utils/formatUtils'
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

const studentEnrollments = computed(() =>
  filterDetailEnrollments(enrollments.value, {
    studentId: selectedChildUid.value,
    academicStatus: currentFilter.value
  })
)

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
    type: 'register-child',
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
        <!-- Custom Tab Navigation -->
        <div class="tabs-navigation-wrapper">
          <div class="tabs-navigation">
            <AppButton variant="ghost" :class="{ active: activeTab === 'children' }" @click="activeTab = 'children'">
              Children & Programs
            </AppButton>
            <AppButton variant="ghost" :class="{ active: activeTab === 'payments' }" @click="activeTab = 'payments'">
              Payment History
            </AppButton>
            <AppButton variant="ghost" :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">
              Enrollment Logs
            </AppButton>
          </div>

          <div class="global-filter">
            <TableToolbar :hasSearch="false" :hasFilter="true" :currentFilter="currentFilter"
              @update:currentFilter="currentFilter = $event" :filterOptions="filterOptions" />
          </div>
        </div>

        <!-- Tab Content -->
        <div class="tab-content-container">
          <!-- Children List Tab -->
          <div v-if="activeTab === 'children'" class="detail-section-card full-width">
            <div class="section-header">
              <h3>Children's Programs</h3>
            </div>

            <!-- Child Selector Chips -->
            <div class="child-selector" v-if="students.length > 0">
              <button v-for="s in students" :key="s.id || s.uid" class="child-chip"
                :class="{ active: selectedChildUid === (s.id || s.uid) }" @click="selectedChildUid = (s.id || s.uid)"
                @dblclick="navigateToStudent(s)">
                <div class="chip-avatar-wrapper">
                  <img :src="s.profile || s.profileURL" class="chip-avatar"
                    @error="e => e.target.src = getImageUrl('profiles/avatar-student')" />
                </div>
                <span class="chip-label">{{ s.name || 'Student' }}</span>
              </button>
            </div>

            <!-- Programs Table -->
            <div class="table-container mt-3">
              <table class="detail-table">
                <thead>
                  <tr>
                    <th style="width: 50px;">No</th>
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
                      <StatusBadge :status="'$' + (reg.amount || 0)" />
                    </td>
                    <td class="text-center">
                      <StatusBadge :status="reg.displayStatus || reg.status || 'Unpaid'" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Payment History Tab -->
          <div v-if="activeTab === 'payments'" class="detail-section-card full-width">
            <div class="section-header">
              <h3>Payment Records</h3>
            </div>
            <div class="table-container">
              <table class="detail-table">
                <thead>
                  <tr>
                    <th style="width: 50px;">No</th>
                    <th style="width: 140px;">Transaction ID</th>
                    <th>Ref ID</th>
                    <th style="width: 100px;" class="text-center">Amount</th>
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
                      <StatusBadge :status="'$' + (reg.amount || 0)"></StatusBadge>
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

          <!-- History/Logs Tab -->
          <div v-if="activeTab === 'history'" class="detail-section-card full-width">
            <div class="section-header">
              <h3>Full Enrollment History</h3>
            </div>
            <div class="table-container">
              <table class="detail-table">
                <thead>
                  <tr>
                    <th style="width: 50px;">No</th>
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
            <div class="profile-header" style="flex-direction: column; align-items: center;">
              <div class="profile-preview">
                <img :src="parent?.profileURL || parent?.profile" alt="Profile"
                  @error="e => e.target.src = getImageUrl('profiles/avatar-admin')" />
              </div>
              <h3 class="profile-name">{{ parent?.name || 'Anonymous' }}</h3>
              <div class="badge-stack">
                <StatusBadge :status="parent?.role || 'parent'" />
                <StatusBadge :status="parent?.status || 'Active'" />
              </div>
            </div>
          </template>

          <div class="scrollable-info-body">
            <div class="detail-info-group">
              <div class="info-item vertical">
                <span class="info-label">Fullname:</span>
                <strong>{{ parent?.name || parent?.fullname }}</strong>
              </div>
              <div class="info-item vertical">
                <span class="info-label">Phone Number:</span>
                <strong>{{ parent?.phone || 'N/A' }}</strong>
              </div>
              <div class="info-item vertical">
                <span class="info-label">Email:</span>
                <strong class="email">{{ parent?.email || 'N/A' }}</strong>
              </div>
              <div class="info-item vertical">
                <StatusBadge status="Created At" />
                <strong>{{ formatDate(parent?.createdAt) }}</strong>
              </div>
              <div class="info-item vertical">
                <StatusBadge status="Updated At" />
                <strong>{{ formatDate(parent?.updatedAt || parent?.createdAt) }}</strong>
              </div>
            </div>
          </div>
        </DetailedSummaryCard>

        <DetailedSummaryCard subtitle="Child Profiles">
          <div class="relationships-list">
            <div v-for="s in students" :key="s.id || s.uid" class="relationship-item clickable"
              @click="navigateToStudent(s)">
              <img :src="s.profile || getImageUrl('profiles/avatar-student')" alt="child" class="small-avatar" />
              <div class="child-info">
                <strong>{{ s.name || 'Student' }}</strong>
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
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.child-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-radius: 24px;
  border: 2px solid #e2e8f0;
  background: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  color: #64748b;
}

.child-chip:hover {
  border-color: #00aeef;
  color: #00aeef;
  background: #f0f9ff;
}

.chip-avatar-wrapper {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.chip-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.child-chip.active {
  background: #00aeef;
  border-color: #00aeef;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 174, 239, 0.3);
}

.chip-label {
  white-space: nowrap;
}

.detail-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 8px;
}

.detail-table th {
  padding: 12px 16px;
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: none;
}

.detail-table td {
  padding: 16px;
  background: #ffffff;
  border-top: 1px solid #f1f5f9;
  border-bottom: 1px solid #f1f5f9;
  color: #475569;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.detail-table td:first-child {
  border-left: 1px solid #f1f5f9;
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
}

.detail-table td:last-child {
  border-right: 1px solid #f1f5f9;
  border-top-right-radius: 12px;
  border-bottom-right-radius: 12px;
}

.detail-table tr:hover td {
  background: var(--bg-subtle);
  border-color: #e2e8f0;
}

.email {
  text-transform: lowercase !important;
  color: #00aeef !important;
}

.price {
  color: #059669;
  font-weight: 700;
}

.mono {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.85rem;
  color: #64748b;
}

.badge-stack {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.profile-name {
  margin: 12px 0 10px;
  font-size: 1.4rem;
  font-weight: 850;
  color: var(--text-deep);
  letter-spacing: -0.5px;
}

.text-emerald-600 {
  color: #059669;
}

.detail-section-card h3 {
  font-size: 1.1rem;
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
  font-size: 0.9rem;
  color: #1e293b;
}

.session-cell span {
  font-size: 0.75rem;
  color: #64748b;
}

.timestamp-item p {
  margin-top: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
}

.relationship-item.clickable {
  cursor: pointer;
  transition: all 0.2s;
  padding: 8px;
  /* This was 16px in original, 8px in instruction. Keeping 8px from instruction. */
  border-radius: 12px;
  /* This was 16px in original, 12px in instruction. Keeping 12px from instruction. */
}

.relationship-item.clickable:hover {
  background: #f1f5f9;
  /* This was #f1f8ff in instruction, #f1f5f9 in original. Keeping #f1f5f9 from instruction. */
  transform: translateX(4px);
}

.relationships-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.relationship-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-subtle);
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  transition: all 0.2s;
}

.relationship-item:hover {
  background: #f1f5f9;
  border-color: #e2e8f0;
}

.small-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.child-info {
  display: flex;
  flex-direction: column;
}

.child-info strong {
  font-size: 1rem;
  color: #0f172a;
}

.child-info span {
  font-size: 0.8rem;
  color: #94a3b8;
}

.timestamp-item p {
  margin-top: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
}

.mt-3 {
  margin-top: 20px;
}

.text-center {
  text-align: center;
}

.p-3 {
  padding: 12px;
}

.relationship-item.clickable {
  cursor: pointer;
  transition: background 0.2s;
  padding: 8px;
  border-radius: 12px;
}

.relationship-item.clickable:hover {
  background: #f1f8ff;
}
</style>
