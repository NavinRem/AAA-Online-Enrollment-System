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
import RegisterChildModal from '../components/parents/RegisterChildModal.vue'
import { userService } from '@/services/userService'
import { enrollmentService } from '@/services/enrollmentService'
import { formatDate } from '@/utils/dateFormatter'
import { filterDetailEnrollments } from '@/utils/enrollmentHelper'
import { enrichStudents } from '@/utils/studentHelper'

import { getImageUrl } from '@/utils/assetHelper'

const route = useRoute()
const router = useRouter()

const parent = ref(null)
const students = ref([])
const enrollments = ref([])
const selectedChildUid = ref('all') // Default to 'all'
const activeTab = ref('children') // 'children', 'payments', 'history'
const currentFilter = ref('all')

// Reset filter when navigating tabs
watch(activeTab, () => {
  currentFilter.value = 'all'
})

// Dynamic filter options based on tab
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

    // Fetch Parent
    const parentData = await userService.getProfile(id)
    if (!parentData) throw new Error('Parent not found')

    parent.value = parentData

    // Fetch Students and Enrollments in parallel
    const [studentsData, allEnrollments] = await Promise.all([
      userService.getStudentsByParentID(id),
      enrollmentService.getAllEnrollments(),
    ])

    students.value = enrichStudents(studentsData || [], [], [])

    // Pre-select the first child by default if children exist
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
  type: '', // 'edit', 'deactivate', 'delete'
  user: null,
})

const addChildModal = ref({
  isOpen: false,
  parent: null,
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
  addChildModal.value = {
    isOpen: true,
    parent: parent.value,
  }
}

const submitActionModal = async (formData) => {
  const { type, user } = actionModal.value
  submitting.value = true
  globalError.value = ''

  try {
    const uid = user.uid || user.id
    if (type === 'edit') {
      await userService.updateUser(uid, formData)
      globalSuccess.value = 'Profile updated successfully!'
    } else if (type === 'deactivate') {
      await userService.updateUser(uid, { status: 'Inactive' })
      globalSuccess.value = 'Account deactivated successfully!'
    } else if (type === 'activate') {
      await userService.updateUser(uid, { status: 'Active' })
      globalSuccess.value = 'Account reactivated successfully!'
    } else if (type === 'delete') {
      if (formData.deleteConfirm !== 'DELETE') throw new Error('Please type DELETE to confirm.')
      await userService.deleteUser(uid)
      router.push('/parents')
      return
    }

    await fetchData(uid)
    setTimeout(() => (actionModal.value.isOpen = false), 1500)
  } catch (err) {
    globalError.value = err.message || 'Action failed'
  } finally {
    submitting.value = false
  }
}

const submitAddChild = async (childData) => {
  submitting.value = true
  try {
    await userService.registerStudentProfile(parent.value.uid || parent.value.id, childData)
    globalSuccess.value = 'Child registered successfully!'
    await fetchData(parent.value.uid || parent.value.id)
    setTimeout(() => (addChildModal.value.isOpen = false), 1500)
  } catch (err) {
    globalError.value = err.message || 'Enrollment failed'
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
    <DetailPageLayout :loading="loading" :errorMessage="errorMessage" backRoute="/parents" title="Parent Details">
      <template #header-actions v-if="parent">
        <div class="actions-wrapper">
          <button class="btn-icon" style="background-color: #f1f8ff; color: #007aff" title="Register Child"
            @click="openAddChildModal">
            👶
          </button>
          <button class="btn-icon edit" title="Edit Parent" @click="openActionModal('edit')">
            ✏️
          </button>
          <button v-if="!isInactive" class="btn-icon cancel" title="Deactivate Account"
            @click="openActionModal('deactivate')">
            🚫
          </button>
          <button v-else class="btn-icon check" title="Activate Account" @click="openActionModal('activate')">
            ✅
          </button>
          <button class="btn-icon delete" title="Delete Account" @click="openActionModal('delete')">
            🗑️
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
            <div class="children-layout">
              <div class="child-selector" v-if="students.length > 0">
                <!-- <button
                  class="child-chip"
                  :class="{ active: selectedChildUid === 'all' }"
                  @click="selectedChildUid = 'all'"
                >
                  All Children
                </button> -->
                <button v-for="s in students" :key="s.id || s.uid" class="child-chip"
                  :class="{ active: selectedChildUid === (s.id || s.uid) }" @click="selectedChildUid = (s.id || s.uid)"
                  @dblclick="navigateToStudent(s)">
                  <img :src="s.profileURL || getImageUrl('profiles/avatar-student')" class="chip-avatar" />
                  {{ s.fullName || s.fullname || s.name }}
                </button>
              </div>
              <div class="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Category</th>
                      <th>Program</th>
                      <th>Session</th>
                      <th>Status</th>
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
                      <td>{{ idx + 1 }}</td>
                      <td>Piano</td>
                      <td>{{ reg.programTitle || 'N/A' }}</td>
                      <td>{{ reg.sessionSchedule || 'N/A' }}</td>
                      <td>
                        <StatusBadge :status="reg.status || 'Studying'" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Payment History Tab -->
          <div v-if="activeTab === 'payments'" class="detail-section-card full-width">
            <div class="section-header">
              <h3>Payment Records</h3>
            </div>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Transaction ID</th>
                    <th>Ref ID</th>
                    <th>Amount</th>
                    <th>Paid Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="filteredPayments.length === 0">
                    <td colspan="6" class="text-center">No payment history</td>
                  </tr>
                  <tr v-for="(reg, idx) in filteredPayments" :key="'pay-' + reg.id">
                    <td>{{ idx + 1 }}</td>
                    <td class="mono">{{ reg.paymentProof || 'N/A' }}</td>
                    <td class="mono">{{ reg.id.substring(0, 8) + '...' }}</td>
                    <td class="price">${{ reg.amount }}</td>
                    <td>{{ formatDate(reg.updatedAt || reg.createdAt) }}</td>
                    <td>
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
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Enrollment ID</th>
                    <th>Program</th>
                    <th>Child</th>
                    <th>Enrolled Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="filteredHistory.length === 0">
                    <td colspan="6" class="text-center">
                      No enrollment history.
                    </td>
                  </tr>
                  <tr v-for="(reg, idx) in filteredHistory" :key="reg.id">
                    <td>{{ idx + 1 }}</td>
                    <td class="mono">{{ reg.id }}</td>
                    <td>{{ reg.programTitle }}</td>
                    <td>{{ reg.studentName }}</td>
                    <td>{{ formatDate(reg.createdAt) }}</td>
                    <td>
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
                <img :src="parent.profileURL || getImageUrl('profiles/avatar-parent')" alt="Profile" />
              </div>
              <h3 class="profile-name">{{ parent.fullname || parent.name || 'Anonymous' }}</h3>
              <div class="badge-stack">
                <StatusBadge :status="parent.role || 'parent'" />
                <StatusBadge :status="parent.status || 'Active'" />
              </div>
            </div>
          </template>

          <div class="scrollable-info-body">
            <div class="detail-info-group">
              <div class="info-item vertical">
                <span class="info-label">Fullname:</span>
                <strong>{{ parent.fullname || parent.name }}</strong>
              </div>
              <div class="info-item vertical">
                <span class="info-label">Phone Number:</span>
                <strong>{{ parent.phone || 'N/A' }}</strong>
              </div>
              <div class="info-item vertical">
                <span class="info-label">Email:</span>
                <strong class="email">{{ parent.email || 'N/A' }}</strong>
              </div>
              <div class="info-item vertical">
                <StatusBadge status="Created At" />
                <strong>{{ formatDate(parent.createdAt) }}</strong>
              </div>
              <div class="info-item vertical">
                <StatusBadge status="Updated At" />
                <strong>{{ formatDate(parent.updatedAt || parent.createdAt) }}</strong>
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
                <strong>{{ s.fullName || s.fullname || s.name }}</strong>
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
      :loading="submitting" :error="globalError" :success="globalSuccess" @close="actionModal.isOpen = false"
      @submit="submitActionModal" />

    <RegisterChildModal :isOpen="addChildModal.isOpen" :parent="addChildModal.parent" :loading="submitting"
      :error="globalError" :success="globalSuccess" @close="addChildModal.isOpen = false" @submit="submitAddChild" />
  </DashboardLayout>
</template>

<style scoped>
@import '@/assets/styles/detail-view.css';

/* Parent-specific tweaks */
.children-layout {
  display: flex;
  gap: 32px;
}

.child-selector {
  width: 220px;
  border-right: 1px solid #f1f5f9;
  padding-right: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.child-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid #f1f5f9;
  background: #f8fafc;
  font-size: 0.95rem;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  color: #475569;
}

.child-chip:hover {
  background: #f1f5f9;
  transform: translateX(4px);
}

.chip-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.child-chip.active {
  background: #eff6ff;
  border-color: #00aeef;
  color: #00aeef;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 174, 239, 0.1);
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
  color: #1a1a1a;
  letter-spacing: -0.5px;
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
  background: #f8fafc;
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
