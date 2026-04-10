<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

import { getImageUrl, getActionIcon } from '@/utils/assetHelper'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import DataMetrics from '../components/common/data/DataMetrics.vue'
import DataTable from '../components/common/data/DataTable.vue'
import StatusBadge from '../components/common/ui/StatusBadge.vue'
import ParentActionModal from '../components/parents/ParentActionModal.vue'
import ParentFormModal from '../components/parents/ParentFormModal.vue'
import { useSearch, parentSearchMapper } from '../composables/useSearch'
import { userService } from '../services/userService'
import { enrollmentService } from '../services/enrollmentService'
import branchService from '../services/branchService'
import { useTableActions } from '../composables/useTableActions'
import {
  enrichParents,
  calculateParentStats,
  filterParents
} from '@/utils/parentHelper'
import {
  processUserProfileImage,
  processStudentProfileImage,
  prepareUserPayload,
  prepareStudentPayload
} from '@/utils/userHelper'
import { formatDate } from '@/utils/formatUtils'

const router = useRouter()
const allUsers = ref([])
const enrollments = ref([])
const loading = ref(true)
const newlyCreatedId = ref(null)
const branches = ref([])

const getRowClass = (item) => {
  return newlyCreatedId.value === (item.uid || item.id) ? 'new-row-highlight' : ''
}

const statsCards = computed(() => {
  const s = calculateParentStats(allUsers.value, enrollments.value)
  return [
    { label: 'Total Parents', value: s.parentCount, image: getImageUrl('parent/total-parent'), color: 'var(--accent-light)' },
    { label: 'Registered Today', value: s.todayCount, image: getImageUrl('parent/recently-register'), color: 'var(--accent-light)' },
    { label: 'Paid Today', value: s.paidTodayCount, image: getImageUrl('parent/paid-today'), color: 'var(--accent-light)' },
    { label: 'Active Now', value: s.activeCount, image: getImageUrl('parent/active-now'), color: 'var(--accent-light)' }
  ]
})

const parentHeaders = [
  { label: 'No', width: '60px', class: 'hide-on-mobile', align: 'center' },
  { label: 'Fullname', width: '250px' },
  { label: 'Child', class: 'hide-on-tablet', width: '100px' },
  { label: 'Phone Number', class: 'hide-on-mobile', width: '150px' },
  { label: 'Email', class: 'hide-on-tablet', width: '200px' },
  { label: 'Joined Date', class: 'hide-on-tablet', width: '200px', align: 'center' },
  { label: 'Status', align: 'center', width: '80px' },
  { label: 'Action', width: '70px', align: 'center' }
]

onMounted(async () => {
  try {
    const [data, allStudents, fetchedBranches, fetchedEnrollments] = await Promise.all([
      userService.getAllUsers(),
      userService.getAllStudents(),
      branchService.getAllBranches(),
      enrollmentService.getAllEnrollments()
    ])

    branches.value = fetchedBranches
    enrollments.value = fetchedEnrollments || []

    if (Array.isArray(data)) {
      const enriched = enrichParents(data, allStudents || [])
      allUsers.value = enriched.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    }
  } catch (error) {
    console.error('Failed to fetch initial data', error)
  } finally {
    loading.value = false
  }
})

const currentFilter = ref('all')

const statusFilteredParents = computed(() => {
  return filterParents(allUsers.value, enrollments.value, currentFilter.value)
})

const { searchQuery, searchResults: filteredParents } = useSearch(statusFilteredParents, parentSearchMapper)

const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const isActionModalOpen = ref(false)
const actionModalType = ref('edit')
const actionModalUser = ref(null)

const showNewParentModal = ref(false)
const openActionModal = (type, user = null) => {
  console.log(`Opening Action Modal: ${type}`)
  errorMessage.value = ''
  successMessage.value = ''
  actionModalType.value = type
  actionModalUser.value = user
  isActionModalOpen.value = true
}

const closeActionModal = () => {
  console.log('Closing Parent Action Modal...')
  isActionModalOpen.value = false
  errorMessage.value = ''
  successMessage.value = ''
}

const submitActionModal = async (formData) => {
  const type = actionModalType.value
  const user = actionModalUser.value
  const uid = user?.uid || user?.id
  submitting.value = true
  errorMessage.value = ''

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

      const userIdx = allUsers.value.findIndex((u) => (u.uid || u.id) === uid)
      if (userIdx !== -1) {
        allUsers.value[userIdx] = { ...allUsers.value[userIdx], ...payload }
      }
      successMessage.value = 'Profile updated successfully!'
    } else if (type === 'deactivate' || type === 'activate') {
      const newStatus = type === 'activate' ? 'Active' : 'Inactive'
      await userService.updateUser(uid, { status: newStatus })
      const idx = allUsers.value.findIndex((u) => (u.uid || u.id) === uid)
      if (idx !== -1) {
        allUsers.value[idx].status = newStatus
      }
      successMessage.value = `Account ${type === 'activate' ? 'reactivated' : 'deactivated'} successfully!`
    } else if (type === 'delete') {
      await userService.deleteUser(uid)
      allUsers.value = allUsers.value.filter((u) => (u.uid || u.id) !== uid)
      successMessage.value = 'Account deleted successfully!'
    } else if (type === 'register-child') {
      const finalProfile = await processStudentProfileImage(formData.profile, formData.name)
      const payload = prepareStudentPayload({ ...formData, profile: finalProfile })

      const result = await userService.registerStudentProfile(uid, payload)

      const userIdx = allUsers.value.findIndex((u) => (u.uid || u.id) === uid)
      if (userIdx !== -1) {
        if (!allUsers.value[userIdx].studentInfo) allUsers.value[userIdx].studentInfo = []

        const newChild = {
          id: result.id || result.UID,
          ...payload,
          parentId: uid
        }
        allUsers.value[userIdx].studentInfo.push(newChild)

        await userService.updateUser(uid, {
          studentInfo: allUsers.value[userIdx].studentInfo
        })
      }
      successMessage.value = 'Child registered successfully!'
    } else if (type === 'reset-password') {
      const result = await userService.resetPassword(uid)
      successMessage.value = `Password reset successfully! New Temporary Password: ${result.tempPassword}`
    }

    const delay = (type === 'reset-password' || type === 'edit' && successMessage.value.includes('Password')) ? 5000 : 1500

    setTimeout(() => {
      closeActionModal()
    }, delay)
  } catch (err) {
    console.error(`Failed to handle ${type} action:`, err)
    errorMessage.value = err.message || `Failed to ${type} action. Please try again.`
  } finally {
    submitting.value = false
  }
}

const submitNewParent = async (data) => {
  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const finalProfile = await processUserProfileImage(data.profile, data.name, data.role)
    const payload = prepareUserPayload({ ...data, profile: finalProfile })

    if (data.password) payload.password = data.password

    const result = await userService.registerParentAccount(payload)
    const actualUid = result.uid || result.id || result.UID

    const newUser = {
      uid: actualUid,
      ...payload,
      createdAt: new Date().toISOString(),
      studentInfo: [],
    }
    allUsers.value.unshift(newUser)
    newlyCreatedId.value = actualUid

    let msg = 'New account created successfully!'
    if (result.tempPassword) {
      msg += ` Temporary Password: ${result.tempPassword}`
    }
    successMessage.value = msg

    setTimeout(() => {
      showNewParentModal.value = false
      errorMessage.value = ''
      successMessage.value = ''
    }, 1500)
  } catch (err) {
    console.error('Failed to create parent account:', err)
    errorMessage.value = err.message || 'Failed to create parent account.'
  } finally {
    submitting.value = false
  }
}

const openAddChildModal = (parent) => {
  errorMessage.value = ''
  successMessage.value = ''
  actionModalType.value = 'plus'
  actionModalUser.value = parent
  isActionModalOpen.value = true
}

const navigateToDetail = (item) => {
  if ((item.uid || item.id) === newlyCreatedId.value) {
    newlyCreatedId.value = null
  }
  router.push(`/parents/${item.uid || item.id}`)
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Parent Overview">
      <template #overview>
        <DataMetrics :stats="statsCards" />
      </template>

      <template #table>
        <DataTable title="Parents List" :headers="parentHeaders" :items="filteredParents" :loading="loading"
          entityName="parent" v-model:searchQuery="searchQuery" searchPlaceholder="Search Parent..." :hasFilter="true"
          v-model:currentFilter="currentFilter" :filterOptions="[
            { label: 'All Parents', value: 'all' },
            { label: 'Registered Today', value: 'registered-today' },
            { label: 'Paid Today', value: 'paid-today' },
            { label: 'Active Only', value: 'active' },
            { label: 'Inactive Only', value: 'inactive' },
          ]" :rowClass="getRowClass" @row-click="navigateToDetail"
          @action="({ type, item }) => openActionModal(type, item)">
          <template #toolbar-actions>
            <AppButton variant="primary" @click="showNewParentModal = true">
              <img :src="getActionIcon('plus')" class="btn-icon-mini reverse-icon" /> New Parent
            </AppButton>
          </template>

          <template
            #row="{ item, index, toggleMenu, activeMenuId, isMenuAbove, menuStyles, handleAction, closeMenu, headers }">
            <td class="hide-on-mobile text-center" :style="{ width: headers[0].width }">
              {{ index + 1 }}
            </td>
            <td class="bold" :style="{ width: headers[1].width }">
              <div class="user-cell">
                <div class="avatar-mini">
                  <img :src="item.profileURL" alt="avatar" />
                </div>
                <span>{{ item.name }}</span>
              </div>
            </td>
            <td class="hide-on-tablet" :style="{ width: headers[2].width }">
              <div class="children-stack">
                <span v-if="!item.studentInfo || item.studentInfo.length === 0" class="text-muted">—</span>
                <template v-else>
                  <div v-for="(child, i) in item.studentInfo" :key="child.id || i" class="avatar-mini child-avatar"
                    :title="child.name || 'Child ' + (i + 1)" :style="{ zIndex: item.studentInfo.length - i }">
                    <img :src="child.profileURL" alt="child" />
                  </div>
                </template>
              </div>
            </td>
            <td class="hide-on-mobile" :style="{ width: headers[3].width }">{{ item.phone }}</td>
            <td class="hide-on-tablet" :style="{ width: headers[4].width }">
              <span class="text-truncate block-max-200">{{ item.email }}</span>
            </td>
            <td class="hide-on-tablet text-center" :style="{ width: headers[5].width }">
              <span class="date-text">{{ formatDate(item.createdAt) }}</span>
            </td>
            <td class="text-center" :style="{ width: headers[6].width }">
              <StatusBadge :status="item.status" />
            </td>
            <td class="action-cell text-center" :style="{ width: headers[7].width }">
              <div class="menu-container">
                <button class="btn-dots" @click.stop="toggleMenu($event, item.uid || item.id)">
                  <span class="dots-icon">⋮</span>
                </button>
                <Teleport to="body">
                  <transition name="fade">
                    <div v-if="activeMenuId === (item.uid || item.id)" class="action-dropdown"
                      :class="{ 'open-up': isMenuAbove }" :style="menuStyles" @click.stop>
                      <button v-if="(item.status || 'Active').toLowerCase() !== 'inactive'" class="btn-add"
                        @click="() => { openAddChildModal(item); closeMenu(); }">
                        <img :src="getActionIcon('plus')" class="action-icon-mini" /> Register Child
                      </button>
                      <button v-if="(item.status || 'Active').toLowerCase() !== 'inactive'" class="btn-edit"
                        @click="() => { openActionModal('edit', item); closeMenu(); }">
                        <img :src="getActionIcon('edit')" class="action-icon-mini" /> Edit Profile
                      </button>
                      <button v-if="(item.status || 'Active').toLowerCase() === 'inactive'" class="btn-pay"
                        @click="handleAction('activate', item)">
                        <img :src="getActionIcon('reactivate')" class="action-icon-mini" /> Reactivate
                      </button>
                      <button v-else class="btn-cancel" @click="handleAction('deactivate', item)">
                        <img :src="getActionIcon('cancel')" class="action-icon-mini" /> Deactivate
                      </button>
                      <button v-if="(item.status || 'Active').toLowerCase() !== 'inactive'" class="btn-reset"
                        @click="() => { openActionModal('reset-password', item); closeMenu(); }">
                        <img :src="getActionIcon('reset-password')" class="action-icon-mini" /> Reset Password
                      </button>
                      <div class="menu-divider" v-if="(item.status || 'Active').toLowerCase() !== 'inactive'"></div>
                      <button v-if="(item.status || 'Active').toLowerCase() !== 'inactive'" class="btn-delete"
                        @click="handleAction('delete', item)">
                        <img :src="getActionIcon('delete')" class="action-icon-mini" /> Delete Account
                      </button>
                    </div>
                  </transition>
                </Teleport>
              </div>
            </td>
          </template>
        </DataTable>
      </template>
    </DataPageLayout>

    <!-- Unified Action Modal (Reusable Page-Specific Component) -->
    <ParentActionModal :isOpen="isActionModalOpen" :type="actionModalType" :user="actionModalUser" :branches="branches"
      :loading="submitting" :error="errorMessage" :success="successMessage" @close="closeActionModal"
      @submit="submitActionModal" />

    <!-- Parent Form Modal (Create New) -->
    <ParentFormModal :isOpen="showNewParentModal" :loading="submitting" :error="errorMessage" :success="successMessage"
      @close="() => { showNewParentModal = false; errorMessage = ''; successMessage = ''; }"
      @submit="submitNewParent" />
  </DashboardLayout>
</template>

<style scoped>
.children-stack {
  display: flex;
  align-items: center;
}

.child-avatar {
  margin-left: -10px;
  width: 28px;
  height: 28px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 2px solid var(--white);
  border-radius: var(--border-radius-round);
  overflow: hidden;
}


.child-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.date-text {
  font-size: var(--text-sm);
  color: var(--text-dark);
}

.bold {
  font-weight: 600;
  color: var(--text-deep);
}
</style>
