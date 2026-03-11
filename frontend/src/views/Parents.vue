<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { formatDate } from '@/utils/dateFormatter'

import { getImageUrl, getIconUrl } from '@/utils/assetHelper'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import DataMetrics from '../components/common/data/DataMetrics.vue'
import DataTable from '../components/common/data/DataTable.vue'
import StatusBadge from '../components/common/ui/StatusBadge.vue'
import ParentActionModal from '../components/parents/ParentActionModal.vue'
import NewParentModal from '../components/parents/NewParentModal.vue'
import RegisterChildModal from '../components/parents/RegisterChildModal.vue'
import { useSearch, parentSearchMapper } from '../composables/useSearch'
import { userService } from '../services/userService'
import { useTableActions } from '../composables/useTableActions'

const router = useRouter()

const allUsers = ref([])
const loading = ref(true)
const {
  activeMenuId,
  isMenuAbove,
  menuStyles,
  toggleMenu,
  closeMenu,
  handleGlobalClick,
} = useTableActions()

const handleAction = (type, item) => {
  openActionModal(type, item)
  closeMenu()
}

const parents = computed(() => allUsers.value.filter((u) => u.role === 'parent'))
const guardians = computed(() => allUsers.value.filter((u) => u.role === 'guardian'))
const recentlyRegistered = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return allUsers.value.filter((u) => (u.createdAt || '').split('T')[0] === today)
})
const activeNow = computed(() => allUsers.value.filter((u) => (u.status || 'Active').toLowerCase() === 'active'))

const parentStats = computed(() => [
  { label: 'Total Parents', value: parents.value.length, image: getIconUrl('register'), color: '#e1f5fe' },
  { label: 'Total Guardians', value: guardians.value.length, image: getIconUrl('user-online'), color: '#e1f5fe' },
  { label: 'Registered Today', value: recentlyRegistered.value.length, image: getIconUrl('register'), color: '#e1f5fe' },
  { label: 'Active Now', value: activeNow.value.length, image: getIconUrl('on-time'), color: '#e1f5fe' }
])

const parentHeaders = [
  { label: 'No', width: '60px', class: 'hide-on-mobile' },
  { label: 'Fullname' },
  { label: 'Child', class: 'hide-on-tablet' },
  { label: 'Phone Number', class: 'hide-on-mobile' },
  { label: 'Email', class: 'hide-on-tablet' },
  { label: 'Role', class: 'hide-on-mobile' },
  { label: 'Status' },
  { label: 'Action', width: '60px' }
]

onMounted(async () => {
  try {
    const [data, allStudents] = await Promise.all([
      userService.getAllUsers(),
      userService.getAllStudents(),
    ])

    if (Array.isArray(data)) {
      // Create a map of parentId -> array of student items for fast lookup
      const studentsByParent = {}
      if (Array.isArray(allStudents)) {
        allStudents.forEach((student) => {
          const pId = student.parentId || student.parent_id
          if (pId) {
            if (!studentsByParent[pId]) studentsByParent[pId] = []
            studentsByParent[pId].push(student)
          }
        })
      }

      allUsers.value = data
        .filter((u) => u.role === 'parent' || u.role === 'guardian')
        .map((u) => ({
          ...u,
          studentProfiles: studentsByParent[u.uid || u.id] || [], // Attach actual student profiles!
        }))
    }
  } catch (error) {
    console.error('Failed to fetch parents', error)
  } finally {
    loading.value = false
  }

  window.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  window.removeEventListener('click', handleGlobalClick)
})

const { searchQuery, searchResults: filteredParents } = useSearch(allUsers, parentSearchMapper)

const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Unified Action Modal State
const actionModal = ref({
  isOpen: false,
  type: '', // 'edit', 'deactivate', 'delete'
  user: null,
  name: '',
  phone: '',
  email: '',
  role: 'parent',
  deleteConfirm: '',
})

// New Parent Modal State
const showNewParentModal = ref(false)

// Add Child Modal State
const addChildModal = ref({
  isOpen: false,
  parent: null,
})

const openActionModal = (type, item) => {
  errorMessage.value = ''
  successMessage.value = ''
  actionModal.value = {
    isOpen: true,
    type,
    user: item,
    name: item.name || '',
    phone: item.phone || '',
    email: item.email || '',
    role: item.role || 'parent',
    deleteConfirm: '',
  }
}

const closeActionModal = () => {
  actionModal.value.isOpen = false
}

const submitActionModal = async (formData) => {
  const { type, user } = actionModal.value
  const { name, phone, email, role, deleteConfirm } = formData
  submitting.value = true
  errorMessage.value = ''

  try {
    if (type === 'edit') {
      await userService.updateUser(user.uid || user.id, { name, phone, email, role })

      const idx = allUsers.value.findIndex((u) => (u.uid || u.id) === (user.uid || user.id))
      if (idx !== -1) {
        allUsers.value[idx].name = name
        allUsers.value[idx].phone = phone
        allUsers.value[idx].email = email
        allUsers.value[idx].role = role
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
    }

    setTimeout(() => {
      closeActionModal()
    }, 1500)
  } catch (err) {
    console.error(`Failed to handle ${type} parent`, err)
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

    successMessage.value = 'New account created successfully!'
    setTimeout(() => {
      showNewParentModal.value = false
    }, 1500)
  } catch (err) {
    console.error('Failed to create parent account', err)
    errorMessage.value = err.message || 'Error occurred while creating the account'
  } finally {
    submitting.value = false
  }
}

const openAddChildModal = (parent) => {
  errorMessage.value = ''
  successMessage.value = ''
  addChildModal.value = {
    isOpen: true,
    parent,
  }
}

const submitAddChild = async (childData) => {
  const { parent } = addChildModal.value
  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const parentId = parent.uid || parent.id
    const result = await userService.registerStudentProfile(parentId, {
      ...childData,
      status: 'Studying', // Explicitly set status for new student
    })

    // Update local state to reflect the new child immediately
    const userIdx = allUsers.value.findIndex((u) => (u.uid || u.id) === parentId)
    if (userIdx !== -1) {
      if (!allUsers.value[userIdx].studentProfiles) {
        allUsers.value[userIdx].studentProfiles = []
      }
      allUsers.value[userIdx].studentProfiles.push({
        id: result.id || result.UID,
        ...childData,
        status: 'Studying',
        parentId: parentId,
      })
    }

    successMessage.value = 'Child registered successfully!'
    setTimeout(() => {
      addChildModal.value.isOpen = false
    }, 1500)
  } catch (err) {
    console.error('Failed to register child', err)
    errorMessage.value = err.message || 'Error occurred while registering the child'
  } finally {
    submitting.value = false
  }
}

const navigateToDetail = (item) => {
  router.push(`/parents/${item.uid || item.id}`)
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Parent / Guardian Overview" listTitle="Parents/Guardians List">
      <template #overview>
        <DataMetrics :stats="parentStats" />
      </template>

      <template #table>
        <DataTable
          :headers="parentHeaders"
          :items="filteredParents"
          :loading="loading"
          v-model:searchQuery="searchQuery"
          searchPlaceholder="Search parameters..."
          :hasFilter="true"
          :filterOptions="[
            { label: 'All', value: 'all' },
            { label: 'Active Only', value: 'active' },
            { label: 'Inactive Only', value: 'inactive' },
          ]"
          @row-click="navigateToDetail"
          @action="({ type, item }) => openActionModal(type, item)"
        >
          <template #toolbar-actions>
            <AppButton variant="primary" @click="showNewParentModal = true">+ New Parent</AppButton>
          </template>

          <template #row="{ item, index, toggleMenu, activeMenuId, isMenuAbove, menuStyles, handleAction }">
            <td class="hide-on-mobile">{{ index + 1 }}</td>
            <td class="bold">
              <div class="user-info">
                <div class="avatar-mini">
                  <img :src="item.profileURL || getImageUrl('profiles', 'female-profile-parent.jpg')" alt="parent avatar" />
                </div>
                {{ item.name || 'Parent' }}
              </div>
            </td>
            <td class="hide-on-tablet">
              <div class="children-stack">
                <span v-if="!item.studentProfiles || item.studentProfiles.length === 0" class="text-muted">None</span>
                <template v-else>
                  <div
                    v-for="(child, i) in item.studentProfiles"
                    :key="child.id || i"
                    class="avatar-mini child-avatar"
                    :title="child.fullName || child.name || 'Child ' + (i + 1)"
                    :style="{ zIndex: item.studentProfiles.length - i }"
                  >
                    <img :src="child.profileURL || getImageUrl('profiles', 'child-profile.png')" alt="child" />
                  </div>
                </template>
              </div>
            </td>
            <td class="hide-on-mobile">{{ item.phone || 'N/A' }}</td>
            <td class="hide-on-tablet">{{ item.email }}</td>
            <td class="hide-on-mobile"><StatusBadge :status="item.role === 'parent' ? 'Parent' : 'Guardian'" /></td>
            <td><StatusBadge :status="item.status || 'Active'" /></td>
            <td class="action-cell">
              <div class="menu-container">
                <button class="btn-dots" @click.stop="toggleMenu($event, item.uid || item.id)">
                  <span class="dots-icon">⋮</span>
                </button>
                <Teleport to="body">
                  <transition name="fade">
                    <div v-if="activeMenuId === (item.uid || item.id)" class="action-dropdown" :class="{ 'open-up': isMenuAbove }" :style="menuStyles" @click.stop>
                      <button @click="() => { openAddChildModal(item); closeMenu(); }">👶 Register Child</button>
                      <button @click="handleAction('edit', item)">✏️ Edit Profile</button>
                      <button v-if="item.status === 'Inactive'" @click="handleAction('activate', item)">✅ Reactivate</button>
                      <button v-else @click="handleAction('deactivate', item)">🚫 Deactivate</button>
                      <div class="menu-divider"></div>
                      <button class="delete-btn" @click="handleAction('delete', item)">🗑️ Delete Account</button>
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
      :isOpen="actionModal.isOpen"
      :type="actionModal.type"
      :user="actionModal.user"
      :loading="submitting"
      :error="errorMessage"
      :success="successMessage"
      @close="closeActionModal"
      @submit="submitActionModal"
    />

    <!-- Create New Parent Modal -->
    <NewParentModal
      :isOpen="showNewParentModal"
      :loading="submitting"
      :error="errorMessage"
      :success="successMessage"
      @close="showNewParentModal = false"
      @submit="submitNewParent"
    />

    <RegisterChildModal
      :isOpen="addChildModal.isOpen"
      :parent="addChildModal.parent"
      :loading="submitting"
      :error="errorMessage"
      :success="successMessage"
      @close="addChildModal.isOpen = false"
      @submit="submitAddChild"
    />
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
</style>
