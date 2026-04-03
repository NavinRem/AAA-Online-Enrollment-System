<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

import { getImageUrl, getActionIcon, getParentProfileURL, getStudentProfileURL } from '@/utils/assetHelper'
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
import { storageService } from '@/services/storageService'
import { useTableActions } from '../composables/useTableActions'
import { enrichParents, calculateParentStats } from '../utils/parentHelper'
import { formatDate } from '../utils/dateFormatter'

const router = useRouter()
const allUsers = ref([])
const loading = ref(true)
const newlyCreatedId = ref(null)
const getRowClass = (item) => {
  return newlyCreatedId.value === (item.uid || item.id) ? 'new-row-highlight' : ''
}
const {
  closeMenu,
} = useTableActions()

const statsCards = computed(() => {
  const s = calculateParentStats(allUsers.value)
  return [
    { label: 'Total Users', value: s.totalUsers, image: getImageUrl('parent/total-users'), color: '#e1f5fe' },
    { label: 'Total Parents', value: s.parentCount, image: getImageUrl('parent/total-parent'), color: '#e1f5fe' },
    { label: 'Total Guardians', value: s.guardianCount, image: getImageUrl('parent/total-guardian'), color: '#e1f5fe' },
    { label: 'Registered Today', value: s.todayCount, image: getImageUrl('parent/recently-register'), color: '#e1f5fe' },
    { label: 'Active Now', value: s.activeCount, image: getImageUrl('parent/active-now'), color: '#e1f5fe' }
  ]
})

const parentHeaders = [
  { label: 'No', width: '60px', class: 'hide-on-mobile', align: 'center' },
  { label: 'Fullname', width: '250px' },
  { label: 'Child', class: 'hide-on-tablet', width: '150px' },
  { label: 'Phone Number', class: 'hide-on-mobile', width: '200px' },
  { label: 'Email', class: 'hide-on-tablet', width: '200px' },
  { label: 'Joined Date', class: 'hide-on-tablet', width: '150px', align: 'center' },
  { label: 'Role', class: 'hide-on-mobile', align: 'center', width: '100px' },
  { label: 'Status', align: 'center', width: '80px' },
  { label: 'Action', width: '70px', align: 'center' }
]

onMounted(async () => {
  try {
    const [data, allStudents] = await Promise.all([
      userService.getAllUsers(),
      userService.getAllStudents(),
    ])

    if (Array.isArray(data)) {
      const enriched = enrichParents(data, allStudents || [])
      allUsers.value = enriched.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    }
  } catch (error) {
    console.error('Failed to fetch parents', error)
  } finally {
    loading.value = false
  }
})

const currentFilter = ref('all')

const statusFilteredParents = computed(() => {
  let filtered = allUsers.value

  if (currentFilter.value !== 'all') {
    filtered = allUsers.value.filter(u => {
      if (currentFilter.value === 'active') return (u.status || 'Active').toLowerCase() === 'active'
      if (currentFilter.value === 'inactive') return (u.status || 'Active').toLowerCase() === 'inactive'
      if (currentFilter.value === 'parent') return (u.role || 'parent').toLowerCase() === 'parent'
      if (currentFilter.value === 'guardian') return (u.role || 'parent').toLowerCase() === 'guardian'
      return true
    })
  }

  return filtered
})

const { searchQuery, searchResults: filteredParents } = useSearch(statusFilteredParents, parentSearchMapper)

const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Unified Action Modal State
const isActionModalOpen = ref(false)
const actionModalType = ref('edit')
const actionModalUser = ref(null)

// New Parent Modal State
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
  const { name, phone, email, role, profile, deleteConfirm } = formData
  submitting.value = true
  errorMessage.value = ''
 
  try {
    if (type === 'edit') {
      const { status } = formData
      await userService.updateUser(user.uid || user.id, { name, phone, email, role, profile, status })
 
      const idx = allUsers.value.findIndex((u) => (u.uid || u.id) === (user.uid || user.id))
      if (idx !== -1) {
        allUsers.value[idx].name = name
        allUsers.value[idx].phone = phone
        allUsers.value[idx].email = email
        allUsers.value[idx].role = role
        if (profile) allUsers.value[idx].profile = profile
      }
      successMessage.value = 'User updated successfully!'
    } else if (type === 'deactivate') {
      await userService.updateUser(user.uid || user.id, { status: 'Inactive' })
      const idx = allUsers.value.findIndex((u) => (u.uid || u.id) === (user.uid || user.id))
      if (idx !== -1) {
        allUsers.value[idx].status = 'Inactive'
      }
      successMessage.value = 'User deactivated successfully!'
    } else if (type === 'activate') {
      await userService.updateUser(user.uid || user.id, { status: 'Active' })
      const idx = allUsers.value.findIndex((u) => (u.uid || u.id) === (user.uid || user.id))
      if (idx !== -1) {
        allUsers.value[idx].status = 'Active'
      }
      successMessage.value = 'User reactivated successfully!'
    } else if (type === 'delete') {
      if (deleteConfirm !== 'DELETE') {
        throw new Error('You must type DELETE specifically to confirm.')
      }
      await userService.deleteUser(user.uid || user.id)
      allUsers.value = allUsers.value.filter((u) => (u.uid || u.id) !== (user.uid || user.id))
      successMessage.value = 'User deleted successfully!'
    } else if (type === 'register-child') {
      const { name, dob, profile, medicalNote } = formData
      const parentId = user.uid || user.id
 
      // Finalize Profile Image (if temp)
      let finalProfile = profile
      if (profile && profile.includes('/profiles/temp/')) {
        const extension = profile.split('?')[0].split('.').pop()
        const sanitizedName = (name || 'child').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
        const newPath = `profiles/temp_student/${sanitizedName}_student.${extension}`
        finalProfile = await storageService.moveProfileImage(profile, newPath)
      }
 
      const result = await userService.registerStudentProfile(parentId, {
        name,
        dob,
        profile: finalProfile,
        medicalNote,
        status: 'Studying',
      })

      // Update local state to reflect the new child immediately
      const userIdx = allUsers.value.findIndex((u) => (u.uid || u.id) === parentId)
      if (userIdx !== -1) {
        if (!allUsers.value[userIdx].studentProfiles) {
          allUsers.value[userIdx].studentProfiles = []
        }
        allUsers.value[userIdx].studentProfiles.push({
          id: result.id || result.UID,
          name,
          dob,
          profile: finalProfile,
          medicalNote,
          status: 'Studying',
          parentId: parentId,
        })

        // PERMANENT SYNC: Save updated studentProfiles array directly into Parent's Firestore document
        await userService.updateUser(parentId, {
          studentProfiles: allUsers.value[userIdx].studentProfiles
        })
      }
    }
    // 1. UI Feedback and Closure
    successMessage.value = type === 'edit' ? 'Parent updated successfully!' :
      type === 'register-child' ? 'Child registered successfully!' :
        `Parent ${type}d successfully!`

    setTimeout(() => {
      closeActionModal()
    }, 1500)
  } catch (err) {
    console.error(`Failed to handle ${type} parent:`, err)
    errorMessage.value = err.message || `Failed to ${type} parent. Please try again.`
  } finally {
    submitting.value = false
  }
}

const submitNewParent = async (data) => {
  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const payload = { ...data, status: 'Active' }

    // Finalize Profile Image (if temp)
    if (payload.profile && payload.profile.includes('/profiles/temp/')) {
      const extension = payload.profile.split('?')[0].split('.').pop()
      const sanitizedName = payload.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
      const newPath = `profiles/new_parent/${sanitizedName}_${payload.role}.${extension}`
      payload.profile = await storageService.moveProfileImage(payload.profile, newPath)
    }
 
    const result = await userService.registerParentAccount(payload)

    // Use the actual UID from the backend response
    const actualUid = result.uid || result.id || result.UID
    const newUser = {
      uid: actualUid,
      ...data,
      status: 'Active',
      createdAt: new Date().toISOString(),
      studentProfiles: [],
    }
    allUsers.value.unshift(newUser)

    // Finalize Success
    successMessage.value = 'New account created successfully!'

    setTimeout(() => {
      showNewParentModal.value = false
      errorMessage.value = ''
      successMessage.value = ''
    }, 1500)
  } catch (err) {
    console.error('Failed to create parent account', err)
    errorMessage.value = err.message || 'Failed to create parent account.'
  } finally {
    submitting.value = false
  }
}

const openAddChildModal = (parent) => {
  errorMessage.value = ''
  successMessage.value = ''
  actionModal.value = {
    isOpen: true,
    type: 'register-child',
    user: parent,
  }
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
    <DataPageLayout overviewTitle="Parent / Guardian Overview">
      <template #overview>
        <DataMetrics :stats="statsCards" />
      </template>

      <template #table>
        <DataTable title="Parents/Guardians List" :headers="parentHeaders" :items="filteredParents" :loading="loading"
          v-model:searchQuery="searchQuery" searchPlaceholder="Search Parent/Guardian..." :hasFilter="true"
          v-model:currentFilter="currentFilter" :filterOptions="[
            { label: 'All Users', value: 'all' },
            { label: 'Active Only', value: 'active' },
            { label: 'Inactive Only', value: 'inactive' },
            { label: 'Parents Only', value: 'parent' },
            { label: 'Guardians Only', value: 'guardian' },
          ]" :rowClass="getRowClass" @row-click="navigateToDetail"
          @action="({ type, item }) => openActionModal(type, item)">
          <template #toolbar-actions>
            <AppButton variant="primary" @click="showNewParentModal = true">
              <img :src="getActionIcon('plus')" class="btn-icon-mini reverse-icon" /> New User
            </AppButton>
          </template>

          <template
            #row="{ item, index, toggleMenu, activeMenuId, isMenuAbove, menuStyles, handleAction, closeMenu, headers }">
            <td class="hide-on-mobile text-center" :style="{ width: headers[0].width }">
              {{ index + 1 }}
            </td>
            <td class="bold" :style="{ width: headers[1].width }">
              <div class="user-cell">
                <div class="user-avatar-small">
                  <img :src="getParentProfileURL(item.profile)" alt="parent avatar" />
                </div>
                <span>{{ item.name || 'Parent' }}</span>
              </div>
            </td>
            <td class="hide-on-tablet" :style="{ width: headers[2].width }">
              <div class="children-stack">
                <span v-if="!item.studentProfiles || item.studentProfiles.length === 0" class="text-muted">—</span>
                <template v-else>
                  <div v-for="(child, i) in item.studentProfiles" :key="child.id || i" class="avatar-mini child-avatar"
                    :title="child.name || 'Child ' + (i + 1)"
                    :style="{ zIndex: item.studentProfiles.length - i }">
                    <img :src="getStudentProfileURL(child.profile)" alt="child" />
                  </div>
                </template>
              </div>
            </td>
            <td class="hide-on-mobile" :style="{ width: headers[3].width }">{{ item.phone || 'N/A' }}</td>
            <td class="hide-on-tablet" :style="{ width: headers[4].width }">
              <span class="text-truncate" style="display: block; max-width: 200px;">{{ item.email || 'N/A' }}</span>
            </td>
            <td class="hide-on-tablet text-center" :style="{ width: headers[5].width }">
              <span class="date-text">{{ formatDate(item.createdAt) }}</span>
            </td>
            <td class="hide-on-mobile text-center" :style="{ width: headers[6].width }">
              <StatusBadge :status="item.role === 'parent' ? 'Parent' : 'Guardian'" />
            </td>
            <td class="text-center" :style="{ width: headers[7].width }">
              <StatusBadge :status="item.status || 'Active'" />
            </td>
            <td class="action-cell text-center" :style="{ width: headers[8].width }">
              <div class="menu-container">
                <button class="btn-dots" @click.stop="toggleMenu($event, item.uid || item.id)">
                  <span class="dots-icon">⋮</span>
                </button>
                <Teleport to="body">
                  <transition name="fade">
                    <div v-if="activeMenuId === (item.uid || item.id)" class="action-dropdown"
                      :class="{ 'open-up': isMenuAbove }" :style="menuStyles" @click.stop>
                      <button class="btn-add" @click="() => { openAddChildModal(item); closeMenu(); }">
                        <img :src="getActionIcon('plus')" class="action-icon-mini" /> Register Child
                      </button>
                      <button class="btn-edit" @click="() => { openActionModal('edit', item); closeMenu(); }">
                        <img :src="getActionIcon('edit')" class="action-icon-mini" /> Edit Profile
                      </button>
                      <button v-if="(item.status || 'Active').toLowerCase() === 'inactive'" class="btn-pay"
                        @click="handleAction('activate', item)">
                        <img :src="getActionIcon('reactivate')" class="action-icon-mini" /> Reactivate
                      </button>
                      <button v-else class="btn-cancel" @click="handleAction('deactivate', item)">
                        <img :src="getActionIcon('cancel')" class="action-icon-mini" /> Deactivate
                      </button>
                      <div class="menu-divider"></div>
                      <button class="btn-delete" @click="handleAction('delete', item)">
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
    <ParentActionModal 
      :isOpen="isActionModalOpen" 
      :type="actionModalType" 
      :user="actionModalUser"
      :loading="submitting" 
      :error="errorMessage" 
      :success="successMessage" 
      @close="closeActionModal"
      @submit="submitActionModal" 
    />

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
  border: 2px solid white;
  border-radius: 50%;
  overflow: hidden;
}


.child-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.date-text {
  font-size: 0.85rem;
  color: #475569;
}

.bold {
  font-weight: 600;
  color: #1a1a1a;
}
</style>
