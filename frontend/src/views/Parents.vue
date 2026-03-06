<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../components/DashboardLayout.vue'
import DataPageLayout from '../components/common/DataPageLayout.vue'
import AppTable from '../components/common/AppTable/AppTable.vue'
import TableToolbar from '../components/common/TableToolbar/TableToolbar.vue'
import AppButton from '../components/common/AppButton/AppButton.vue'
import SummaryCard from '../components/SummaryCard.vue'
import StatusBadge from '../components/common/StatusBadge/StatusBadge.vue'
import ParentActionModal from '../components/parents/ParentActionModal.vue'
import NewParentModal from '../components/parents/NewParentModal.vue'
import RegisterChildModal from '../components/parents/RegisterChildModal.vue'
import { useSearch, parentSearchMapper } from '../composables/useSearch'
import { userService } from '../services/userService'

const router = useRouter()

const allUsers = ref([])
const loading = ref(true)
const activeMenuId = ref(null)
const isMenuAbove = ref(false)
const menuStyles = ref({})

const toggleMenu = (event, id) => {
  if (activeMenuId.value === id) {
    activeMenuId.value = null
    return
  }

  const rect = event.currentTarget.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  isMenuAbove.value = spaceBelow < 280

  if (isMenuAbove.value) {
    menuStyles.value = {
      bottom: `${window.innerHeight - rect.top + 8}px`,
      right: `${window.innerWidth - rect.right}px`,
    }
  } else {
    menuStyles.value = {
      top: `${rect.bottom + 8}px`,
      right: `${window.innerWidth - rect.right}px`,
    }
  }

  activeMenuId.value = id
}

const closeMenu = () => {
  activeMenuId.value = null
}

const handleAction = (type, item) => {
  openActionModal(type, item)
  closeMenu()
}

const handleGlobalClick = (event) => {
  if (activeMenuId.value) {
    const isTrigger = event.target.closest('.btn-dots')
    const isMenu = event.target.closest('.action-dropdown')
    if (!isTrigger && !isMenu) {
      closeMenu()
    }
  }
}

const parents = computed(() => allUsers.value.filter((u) => u.role === 'parent'))
const guardians = computed(() => allUsers.value.filter((u) => u.role === 'guardian'))
const recentlyRegistered = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return allUsers.value.filter((u) => {
    const createdDate = (u.createdAt || u.created_at || u.updatedAt || '').split('T')[0]
    return createdDate === today
  })
})

const activeNow = computed(() => {
  return allUsers.value.filter((u) => (u.status || 'Active').toLowerCase() === 'active')
})

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
        parent_id: parentId,
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
        <SummaryCard
          title="Total Parents"
          :value="parents.length"
          image="register.png"
          color="#e1f5fe"
        />
        <SummaryCard
          title="Total Guardians"
          :value="guardians.length"
          image="register.png"
          color="#e1f5fe"
        />
        <SummaryCard
          title="Registered Today"
          :value="recentlyRegistered.length"
          image="register.png"
          color="#e1f5fe"
        />
        <SummaryCard
          title="Active Now"
          :value="activeNow.length"
          image="register.png"
          color="#e1f5fe"
        />
      </template>

      <template #actions>
        <TableToolbar
          :hasSearch="true"
          :searchQuery="searchQuery"
          @update:searchQuery="searchQuery = $event"
          searchPlaceholder="Search parameters..."
          :hasFilter="true"
          :filterOptions="[
            { label: 'All', value: 'all' },
            { label: 'Active Only', value: 'active' },
            { label: 'Inactive Only', value: 'inactive' },
          ]"
        >
          <template #actions>
            <AppButton variant="primary" @click="showNewParentModal = true">
              + New Parent
            </AppButton>
          </template>
        </TableToolbar>
      </template>

      <template #table>
        <AppTable
          :headers="[
            'No',
            'Fullname',
            'Child',
            'Phone Number',
            'Email',
            'Role',
            'Status',
            'Action',
          ]"
          :loading="loading"
          :empty="filteredParents.length === 0"
        >
          <template #loading>Loading parents...</template>
          <template #empty>No parents or guardians found.</template>

          <tr
            v-for="(item, index) in filteredParents"
            :key="item.uid || item.id"
            class="clickable-row"
            @click="navigateToDetail(item)"
          >
            <td>{{ index + 1 }}</td>
            <td class="bold">
              <div class="user-info">
                <div class="avatar-mini">
                  <img
                    :src="item.profileURL || '/src/assets/images/female-profile-parent.jpg'"
                    alt="parent avatar"
                  />
                </div>
                {{ item.name || 'Anonymous' }}
              </div>
            </td>
            <td>
              <div class="children-stack">
                <span
                  v-if="!item.studentProfiles || item.studentProfiles.length === 0"
                  class="text-muted"
                  >None</span
                >
                <template v-else>
                  <div
                    v-for="(child, i) in item.studentProfiles"
                    :key="child.id || i"
                    class="avatar-mini child-avatar"
                    :title="child.fullname || child.name || 'Child ' + (i + 1)"
                    :style="{ zIndex: item.studentProfiles.length - i }"
                  >
                    <img
                      :src="child.profileURL || '/src/assets/images/child-profile.png'"
                      alt="child"
                    />
                  </div>
                </template>
              </div>
            </td>
            <td>{{ item.phone || 'N/A' }}</td>
            <td>{{ item.email }}</td>
            <td>
              <StatusBadge :status="item.role === 'parent' ? 'Parent' : 'Guardian'" />
            </td>
            <td>
              <StatusBadge :status="item.status || 'Active'" />
            </td>
            <td class="action-cell">
              <div class="menu-container">
                <button class="btn-dots" @click.stop="toggleMenu($event, item.uid || item.id)">
                  <span class="dots-icon">⋮</span>
                </button>
                <Teleport to="body">
                  <transition name="fade">
                    <div
                      v-if="activeMenuId === (item.uid || item.id)"
                      class="action-dropdown"
                      :class="{ 'open-up': isMenuAbove }"
                      :style="menuStyles"
                      @click.stop
                    >
                      <button
                        @click="
                          () => {
                            openAddChildModal(item)
                            closeMenu()
                          }
                        "
                      >
                        👶 Register Child
                      </button>
                      <button @click="handleAction('edit', item)">✏️ Edit Profile</button>
                      <button
                        v-if="item.status === 'Inactive'"
                        @click="handleAction('activate', item)"
                      >
                        ✅ Reactivate
                      </button>
                      <button v-else @click="handleAction('deactivate', item)">
                        🚫 Deactivate
                      </button>
                      <div class="menu-divider"></div>
                      <button class="delete-btn" @click="handleAction('delete', item)">
                        🗑️ Delete Account
                      </button>
                    </div>
                  </transition>
                </Teleport>
              </div>
            </td>
          </tr>
        </AppTable>
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

.avatar-mini {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: #f0f0f0;
  border: 2px solid white;
}

.avatar-mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.child-avatar {
  margin-left: -10px;
  width: 28px;
  height: 28px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.child-avatar:first-child {
  margin-left: 0;
}

.text-muted {
  color: #888;
}

.bold {
  font-weight: 600;
  color: #1a1a1a;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.action-cell {
  position: relative;
  width: 60px;
}

.menu-container {
  position: relative;
  display: flex;
  justify-content: center;
}

.btn-dots {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #64748b;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-dots:hover {
  background: #f1f5f9;
  color: #0f172a;
  transform: rotate(90deg);
}

.action-dropdown {
  position: fixed;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 14px;
  box-shadow:
    0 15px 35px -5px rgba(0, 0, 0, 0.15),
    0 5px 15px -5px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(226, 232, 240, 0.9);
  z-index: 1000;
  padding: 8px;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  animation: slideDropdown 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top right;
}

.action-dropdown.open-up {
  top: auto;
  bottom: 100%;
  margin-top: 0;
  margin-bottom: 8px;
  transform-origin: bottom right;
  box-shadow:
    0 -15px 35px -5px rgba(0, 0, 0, 0.15),
    0 -5px 15px -5px rgba(0, 0, 0, 0.08);
}

@keyframes slideDropdown {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.action-dropdown button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-dropdown button:hover {
  background: #f8fafc;
  color: #00aeef;
  padding-left: 18px;
}

.action-dropdown .delete-btn {
  color: #ef4444;
}

.action-dropdown .delete-btn:hover {
  background: #fff1f2;
  color: #dc2626;
}

.menu-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 4px 6px;
}

.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.clickable-row:hover {
  background-color: #f8fafc;
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(-10px);
}

.action-dropdown.open-up.fade-enter-from,
.action-dropdown.open-up.fade-leave-to {
  transform: scale(0.9) translateY(10px);
}
</style>
