<script setup>
import { ref, onMounted } from 'vue'
import DashboardLayout from '../components/DashboardLayout.vue'
import DataPageLayout from '../components/common/DataPageLayout.vue'
import AppTable from '../components/common/AppTable/AppTable.vue'
import TableToolbar from '../components/common/TableToolbar/TableToolbar.vue'
import AppButton from '../components/common/AppButton/AppButton.vue'
import SummaryCard from '../components/SummaryCard.vue'
import StatusBadge from '../components/common/StatusBadge/StatusBadge.vue'
import ParentActionModal from '../components/parents/ParentActionModal.vue'
import NewParentModal from '../components/parents/NewParentModal.vue'
import { useSearch, parentSearchMapper } from '../composables/useSearch'
import { userService } from '../services/userService'

const parents = ref([])
const guardians = ref([])
const recentlyRegistered = ref([])
const allUsers = ref([])
const loading = ref(true)

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
      parents.value = allUsers.value.filter((u) => u.role === 'parent')
      guardians.value = allUsers.value.filter((u) => u.role === 'guardian')

      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      recentlyRegistered.value = allUsers.value.filter((u) => {
        const time = new Date(u.createdAt || u.created_at || u.updatedAt).getTime()
        return time >= oneWeekAgo.getTime()
      })
    }
  } catch (error) {
    console.error('Failed to fetch parents', error)
  } finally {
    loading.value = false
  }
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
      // Mock API call for updating user info
      // await userService.updateUser(user.uid || user.id, { name, phone, email, role })

      const idx = allUsers.value.findIndex((u) => (u.uid || u.id) === (user.uid || user.id))
      if (idx !== -1) {
        allUsers.value[idx].name = name
        allUsers.value[idx].phone = phone
        allUsers.value[idx].email = email
        allUsers.value[idx].role = role
      }
      successMessage.value = 'User updated successfully! (Mocked)'
    } else if (type === 'deactivate') {
      // Mock API call for deactivation
      // await userService.updateUser(user.uid || user.id, { status: 'Inactive' })
      const idx = allUsers.value.findIndex((u) => (u.uid || u.id) === (user.uid || user.id))
      if (idx !== -1) {
        allUsers.value[idx].status = 'Inactive'
      }
      successMessage.value = 'User deactivated successfully! (Mocked)'
    } else if (type === 'activate') {
      const idx = allUsers.value.findIndex((u) => (u.uid || u.id) === (user.uid || user.id))
      if (idx !== -1) {
        allUsers.value[idx].status = 'Active'
      }
      successMessage.value = 'User reactivated successfully! (Mocked)'
    } else if (type === 'delete') {
      if (deleteConfirm !== 'DELETE') {
        throw new Error('You must type DELETE specifically to confirm.')
      }
      // Mock API call for deletion
      // await userService.deleteUser(user.uid || user.id)
      allUsers.value = allUsers.value.filter((u) => (u.uid || u.id) !== (user.uid || user.id))
      successMessage.value = 'User deleted successfully! (Mocked)'
    }

    setTimeout(() => {
      closeActionModal()
    }, 1500)
  } catch (err) {
    console.error(`Failed to handle ${type} parent`, err)
    errorMessage.value = err.message || `Failed to ${type} parent. Please try again.`
const submitNewParent = async (data) => {
  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    // Real dynamic registration logic
    // const result = await userService.registerParentAccount(data)

    // Mock for now
    const newId = 'MOCK_' + Math.random().toString(36).substr(2, 9)
    const newUser = {
      uid: newId,
      ...data,
      status: 'Active',
      createdAt: new Date().toISOString(),
      studentProfiles: []
    }
    allUsers.value.unshift(newUser)

    // Update parents/guardians lists
    if (data.role === 'parent') parents.value.unshift(newUser)
    else guardians.value.unshift(newUser)

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
          title="Recently Registered"
          :value="recentlyRegistered.length"
          image="register.png"
          color="#e1f5fe"
        />
        <SummaryCard
          title="Active Now"
          :value="
            allUsers.filter((u) => u.status !== 'inactive' && u.status !== 'deactivated').length
          "
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

          <tr v-for="(item, index) in filteredParents" :key="item.uid || item.id">
            <td>{{ index + 1 }}</td>
            <td class="bold">{{ item.name || 'Anonymous' }}</td>
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
            <td>
              <div class="actions-wrapper">
                <button
                  class="btn-icon edit"
                  title="Edit Parent"
                  @click.stop="openActionModal('edit', item)"
                >
                  ✏️
                </button>
                <button
                  v-if="item.status === 'Inactive'"
                  class="btn-icon check active-btn"
                  title="Reactivate Account"
                  @click.stop="openActionModal('activate', item)"
                >
                  ✅
                </button>
                <button
                  v-else
                  class="btn-icon check"
                  title="Deactivate Account"
                  @click.stop="openActionModal('deactivate', item)"
                >
                  🚫
                </button>
                <button
                  class="btn-icon delete"
                  title="Delete Account"
                  @click.stop="openActionModal('delete', item)"
                >
                  🗑️
                </button>
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

.actions-wrapper {
  display: flex;
  gap: 6px;
}
.btn-icon.active-btn:hover {
  border-color: #4caf50;
  color: #4caf50;
}
</style>
