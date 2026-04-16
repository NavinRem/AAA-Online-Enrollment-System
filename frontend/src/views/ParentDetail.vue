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
import { formatDate, formatPrice } from '@/utils/formatUtils'
import { filterDetailEnrollments, enrichEnrollments } from '@/utils/enrollmentHelper'
import { enrichStudents } from '@/utils/studentHelper'
import { programService } from '@/services/programService'
import { branchService } from '@/services/branchService'
import {
  processUserProfileImage,
  processStudentProfileImage,
  prepareUserPayload,
  prepareStudentPayload,
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

const studentEnrollments = computed(() => {
  return filterDetailEnrollments(enrollments.value, {
    studentId: selectedChildUid.value,
    academicStatus: 'studying',
  })
})

const filteredPayments = computed(() =>
  filterDetailEnrollments(enrollments.value, {
    paymentStatus: currentFilter.value,
  }),
)

const filteredHistory = computed(() =>
  filterDetailEnrollments(enrollments.value, {
    academicStatus: currentFilter.value,
  }),
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
    const [studentsData, allEnrollments, allPrograms, allClasses] = await Promise.all([
      userService.getStudentsByParentID(id),
      enrollmentService.getAllEnrollments(),
      programService.getAllPrograms(),
      programService.getAllClasses(),
    ])

    students.value = enrichStudents(studentsData || [], [], [])

    if (
      students.value.length > 0 &&
      (selectedChildUid.value === 'all' || !selectedChildUid.value)
    ) {
      selectedChildUid.value = students.value[0].id || students.value[0].uid
    }

    const pId = parent.value.uid || parent.value.id
    const rawEnrollments = (allEnrollments || []).filter((r) => String(r.parentId) === String(pId))

    enrollments.value = enrichEnrollments(
      rawEnrollments,
      [parent.value],
      students.value,
      allPrograms,
      allClasses,
    )
  } catch (error) {
    console.error('Failed to load parent details', error)
    errorMessage.value = error.message || 'Failed to load details'
  } finally {
    loading.value = false
  }
}

const submitting = ref(false)
const globalSuccess = ref('')
const globalError = ref('')

const actionModal = ref({
  isOpen: false,
  type: '',
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
        user.profile,
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

      const currentStudentInfo = parent.value.studentInfo || []
      const newChild = { id: result.id || result.UID, ...payload, parentId: uid }

      await userService.updateUser(uid, {
        studentInfo: [...currentStudentInfo, newChild],
      })

      globalSuccess.value = 'Child registered successfully!'
    }

    setTimeout(() => {
      actionModal.value.isOpen = false
      globalSuccess.value = ''
    }, 1500)

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
        <div class="flex items-center gap-md">
          <AppButton v-if="!isInactive" variant="secondary" title="Register Child" @click="openAddChildModal">
            <img :src="getActionIcon('plus')" class="w-4 h-4" /> Register Child
          </AppButton>
          <AppButton v-if="!isInactive" variant="secondary" title="Edit Parent" @click="openActionModal('edit')">
            <img :src="getActionIcon('edit')" class="w-4 h-4" /> Edit
          </AppButton>
          <AppButton v-if="!isInactive" variant="secondary" title="Reset Password"
            @click="openActionModal('reset-password')">
            <img :src="getActionIcon('reset-password')" class="w-4 h-4" /> Password
          </AppButton>
          <AppButton v-if="!isInactive" variant="danger" title="Deactivate Account"
            @click="openActionModal('deactivate')">
            <img :src="getActionIcon('cancel')" class="w-4 h-4 invert" /> Deactivate
          </AppButton>
          <AppButton v-if="isInactive" variant="primary" title="Activate Account" @click="openActionModal('activate')">
            <img :src="getActionIcon('reactivate')" class="w-4 h-4 brightness-0 invert" /> Activate
            Account
          </AppButton>
          <AppButton v-if="!isInactive" variant="danger" title="Delete Account" @click="openActionModal('delete')">
            <img :src="getActionIcon('delete')" class="w-4 h-4 invert" /> Delete
          </AppButton>
        </div>
      </template>

      <template #left-content v-if="parent">
        <!-- Alerts -->
        <div v-if="isInactive" class="mb-lg">
          <div class="p-md bg-warning/10 border-l-4 border-warning rounded-sm flex flex-col gap-1">
            <strong class="text-warning text-sm">Account Standardized Inactive</strong>
            <span class="text-xs text-content-muted">This parent account is currently disabled. Access to registration
              and profile updates
              is restricted until reactivation.</span>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="ui-tabs-nav">
          <button class="ui-tab-item" :class="{ active: activeTab === 'children' }" @click="activeTab = 'children'">
            Children & Programs
          </button>
          <button class="ui-tab-item" :class="{ active: activeTab === 'payments' }" @click="activeTab = 'payments'">
            Payment History
          </button>
          <button class="ui-tab-item" :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">
            Enrollment Logs
          </button>
        </div>

        <div class="ui-detail-card min-h-[400px]">
          <!-- Children Tab -->
          <div v-if="activeTab === 'children'">
            <div class="ui-section-header">
              <h3 class="ui-section-title">Children's Academic Summary</h3>
            </div>

            <!-- Child Selector Chips -->
            <div class="flex flex-wrap gap-sm mb-xl" v-if="students.length > 0">
              <button v-for="s in students" :key="s.id || s.uid"
                class="flex items-center gap-sm px-md py-sm rounded-std border transition-all duration-200" :class="selectedChildUid === (s.id || s.uid)
                    ? 'bg-primary-soft border-primary text-primary shadow-sm'
                    : 'bg-white border-outline-std text-content-muted hover:border-text-muted'
                  " @click="selectedChildUid = s.id || s.uid" @dblclick="navigateToStudent(s)">
                <div class="w-8 h-8 rounded-full overflow-hidden border border-outline-std bg-surface-light">
                  <img :src="s.profileURL" class="w-full h-full object-cover"
                    @error="(e) => (e.target.src = getImageUrl('profiles/avatar-student'))" />
                </div>
                <span class="text-xs font-bold">{{ s.name }}</span>
              </button>
            </div>

            <table class="ui-premium-table">
              <thead>
                <tr>
                  <th class="text-center" width="50">No</th>
                  <th>Program Name</th>
                  <th>Session Schedule</th>
                  <th class="text-center">Amount</th>
                  <th class="text-center">Academic Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="students.length === 0">
                  <td colspan="5" class="py-20 text-center text-content-muted italic text-xs">
                    No children linked to this parent account.
                  </td>
                </tr>
                <tr v-else-if="studentEnrollments.length === 0">
                  <td colspan="5" class="py-20 text-center text-content-muted italic text-xs">
                    This child is not currently registered in any active programs.
                  </td>
                </tr>
                <tr v-for="(reg, idx) in studentEnrollments" :key="reg.id">
                  <td class="text-center font-bold text-content-muted/40">{{ idx + 1 }}</td>
                  <td class="font-bold text-content-dark">
                    {{ reg.program?.title || 'N/A' }}
                  </td>
                  <td>
                    <div class="flex flex-col">
                      <span class="text-xs font-black text-content-dark uppercase tracking-tighter">{{ reg.class?.day ||
                        'N/A' }}</span>
                      <span class="text-2xs text-content-muted font-bold">{{
                        reg.class?.timeslot || ''
                        }}</span>
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

          <!-- Payments Tab -->
          <div v-if="activeTab === 'payments'">
            <div class="ui-section-header">
              <h3 class="ui-section-title">Verified Payment History</h3>
              <TableToolbar :hasSearch="false" :hasFilter="true" :currentFilter="currentFilter"
                @update:currentFilter="currentFilter = $event" :filterOptions="filterOptions" />
            </div>
            <table class="ui-premium-table">
              <thead>
                <tr>
                  <th class="text-center" width="50">No</th>
                  <th>Transaction / Proof</th>
                  <th>Reference ID</th>
                  <th class="text-center">Amount</th>
                  <th class="text-center">Processed Date</th>
                  <th class="text-center">Payment Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredPayments.length === 0">
                  <td colspan="6" class="py-20 text-center text-content-muted italic text-xs">
                    No payment history found matching criteria.
                  </td>
                </tr>
                <tr v-for="(reg, idx) in filteredPayments" :key="'pay-' + reg.id">
                  <td class="text-center font-bold text-content-muted/40">{{ idx + 1 }}</td>
                  <td class="font-mono text-xs text-content-muted select-all">
                    {{ reg.paymentProof || 'N/A' }}
                  </td>
                  <td class="font-mono text-xs text-content-muted opacity-50">
                    {{ reg.id.substring(0, 8) + '...' }}
                  </td>
                  <td class="text-center font-black text-emerald-600 text-base">
                    <StatusBadge :status="'$' + formatPrice(reg.amount || 0)"></StatusBadge>
                  </td>
                  <td class="text-center text-xs font-bold text-content-muted">
                    {{ formatDate(reg.updatedAt || reg.createdAt) }}
                  </td>
                  <td class="text-center">
                    <StatusBadge :status="reg.paymentStatus || 'Pending'" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- History Tab -->
          <div v-if="activeTab === 'history'">
            <div class="ui-section-header">
              <h3 class="ui-section-title">Master Enrollment Logs</h3>
              <TableToolbar :hasSearch="false" :hasFilter="true" :currentFilter="currentFilter"
                @update:currentFilter="currentFilter = $event" :filterOptions="filterOptions" />
            </div>
            <table class="ui-premium-table">
              <thead>
                <tr>
                  <th class="text-center" width="50">No</th>
                  <th>Enrollment Reference</th>
                  <th>Program Title</th>
                  <th>Child</th>
                  <th class="text-center">Log Date</th>
                  <th class="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredHistory.length === 0">
                  <td colspan="6" class="py-20 text-center text-content-muted italic text-xs">
                    No enrollment history records found.
                  </td>
                </tr>
                <tr v-for="(reg, idx) in filteredHistory" :key="reg.id">
                  <td class="text-center font-bold text-content-muted/40">{{ idx + 1 }}</td>
                  <td class="font-mono text-xs text-content-muted opacity-50">{{ reg.id }}</td>
                  <td class="font-bold text-content-dark">{{ reg.program?.title }}</td>
                  <td class="text-xs font-bold text-primary italic">{{ reg.student?.name }}</td>
                  <td class="text-center text-xs font-bold text-content-muted">
                    {{ formatDate(reg.createdAt) }}
                  </td>
                  <td class="text-center">
                    <StatusBadge :status="reg.status?.toLowerCase() === 'confirmed' ? 'Paid' : reg.status" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

      <template #right-content v-if="parent">
        <!-- Parent Profile Card -->
        <div class="ui-detail-card flex flex-col items-center text-center p-0 overflow-hidden">
          <div class="w-full h-32 bg-gradient-to-br from-primary to-magenta opacity-10"></div>
          <div class="relative -mt-16 mb-md">
            <div class="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden group">
              <img :src="parent?.profileURL" alt="Profile"
                @error="(e) => (e.target.src = getImageUrl('profiles/avatar-admin'))"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            </div>
            <div class="absolute bottom-1 right-1">
              <StatusBadge :status="parent?.status" :showLabel="false" />
            </div>
          </div>

          <div class="px-xl pb-xl flex flex-col items-center w-full">
            <h2 class="text-2xl font-black text-content-dark tracking-tighter mb-xs">
              {{ parent?.name }}
            </h2>
            <StatusBadge :status="parent?.status" />

            <div class="w-full h-px bg-surface-light my-xl"></div>

            <div class="ui-data-list w-full grid-cols-1 gap-y-lg">
              <div class="ui-data-item">
                <span class="ui-data-label text-left">Phone Primary</span>
                <span class="ui-data-value text-left text-lg tracking-tight">{{
                  parent?.phone
                  }}</span>
              </div>
              <div class="ui-data-item">
                <span class="ui-data-label text-left">Administrative Email</span>
                <span class="ui-data-value text-left text-xs text-primary font-black lowercase truncate block w-full">{{
                  parent?.email }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Children Discovery Card -->
        <div class="ui-detail-card mt-lg">
          <div class="ui-section-header mb-lg">
            <h3 class="text-xs font-black uppercase tracking-widest text-content-muted">
              Linked Child Profiles
            </h3>
          </div>
          <div class="flex flex-col gap-sm">
            <div v-for="s in students" :key="s.id || s.uid"
              class="group flex items-center gap-md p-md rounded-sm bg-surface-light cursor-pointer transition-all hover:bg-white hover:shadow-md hover:ring-2 hover:ring-primary/20"
              @click="navigateToStudent(s)">
              <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-border">
                <img :src="s.profileURL || getImageUrl('profiles/avatar-student')" alt="child"
                  class="w-full h-full object-cover" />
              </div>
              <div class="flex flex-col">
                <span class="font-bold text-content-dark group-hover:text-primary transition-colors text-sm">{{ s.name
                  }}</span>
                <span class="text-3xs text-content-muted uppercase font-black tracking-widest">Child Account</span>
              </div>
            </div>
            <div v-if="students.length === 0"
              class="py-xl text-center border-2 border-dashed border-surface-light rounded-sm opacity-30 text-xs font-bold italic">
              No children linked.
            </div>
          </div>
        </div>

        <!-- Activity Log -->
        <div class="flex flex-col gap-sm mt-lg px-md opacity-40">
          <div class="flex items-center justify-between text-3xs font-black uppercase tracking-tighter">
            <span>Account Initialized</span>
            <span class="text-content-dark font-black">{{ formatDate(parent?.createdAt) }}</span>
          </div>
          <div class="flex items-center justify-between text-3xs font-black uppercase tracking-tighter">
            <span>System Last Sync</span>
            <span class="text-content-dark font-black">{{
              formatDate(parent?.updatedAt || parent?.createdAt)
              }}</span>
          </div>
        </div>
      </template>
    </DetailPageLayout>

    <ParentActionModal :isOpen="actionModal.isOpen" :type="actionModal.type" :user="actionModal.user"
      :loading="submitting" v-model:error="globalError" v-model:success="globalSuccess"
      @close="actionModal.isOpen = false" @submit="submitActionModal" />
  </DashboardLayout>
</template>
