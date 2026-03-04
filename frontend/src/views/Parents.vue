<script setup>
import { ref, onMounted } from 'vue'
import DashboardLayout from '../components/DashboardLayout.vue'
import DataPageLayout from '../components/common/DataPageLayout.vue'
import AppTable from '../components/common/AppTable/AppTable.vue'
import TableToolbar from '../components/common/TableToolbar/TableToolbar.vue'
import AppButton from '../components/common/AppButton/AppButton.vue'
import SummaryCard from '../components/SummaryCard.vue'
import StatusBadge from '../components/common/StatusBadge/StatusBadge.vue'
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

const submitActionModal = async () => {
  const { type, user, name, phone, email, role, deleteConfirm } = actionModal.value
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
            <AppButton variant="primary">+ New Parent</AppButton>
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

    <!-- Unified Action Modal -->
    <transition name="modal">
      <div v-if="actionModal.isOpen" class="modal-overlay" @click.self="closeActionModal">
        <div class="modal-container action-modal">
          <div class="modal-header">
            <h3>
              {{ actionModal.type === 'edit' ? 'Edit User' : '' }}
              {{ actionModal.type === 'deactivate' ? 'Deactivate User' : '' }}
              {{ actionModal.type === 'delete' ? 'Delete User' : '' }}
            </h3>
            <button class="close-btn" @click="closeActionModal">&times;</button>
          </div>

          <div class="modal-body">
            <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>
            <div v-if="successMessage" class="success-banner">{{ successMessage }}</div>

            <div class="target-summary" v-if="actionModal.user">
              Executing action on:
              <strong>{{ actionModal.user.name || actionModal.user.email }}</strong>
            </div>

            <!-- Edit Form -->
            <div v-if="actionModal.type === 'edit'" class="form-group full-width">
              <label>Full Name</label>
              <input type="text" v-model="actionModal.name" placeholder="Enter full name" />

              <label style="margin-top: 15px">Email Address</label>
              <input type="email" v-model="actionModal.email" placeholder="Enter email" />

              <label style="margin-top: 15px">Phone Number</label>
              <input type="tel" v-model="actionModal.phone" placeholder="Enter phone number" />

              <label style="margin-top: 15px">Role</label>
              <select v-model="actionModal.role" class="form-select">
                <option value="parent">Parent</option>
                <option value="guardian">Guardian</option>
              </select>
            </div>

            <!-- Deactivate Form -->
            <div v-if="actionModal.type === 'deactivate'" class="form-group full-width">
              <div class="info-block warning">
                <span class="icon">⚠️</span>
                <p>
                  <strong>Deactivation:</strong> Deactivating an account will prevent the user from
                  logging in and accessing their child's records. You can reactivate them later.
                </p>
              </div>
            </div>

            <!-- Delete Form -->
            <div v-if="actionModal.type === 'delete'" class="form-group full-width">
              <div class="info-block danger">
                <span class="icon">🛑</span>
                <p>
                  <strong>Critical Warning:</strong> Deleting an account removes the record
                  entirely, along with associated child records. It can never be recovered.
                </p>
              </div>
              <label>Confirm Deletion <span class="required">*</span></label>
              <p style="margin-bottom: 15px; color: #555; font-size: 0.95rem">
                Please type <strong class="danger-text">DELETE</strong> below to confirm.
              </p>
              <input type="text" v-model="actionModal.deleteConfirm" placeholder="Type DELETE" />
            </div>
          </div>

          <div class="modal-footer">
            <AppButton variant="cancel" @click="closeActionModal">Nevermind</AppButton>
            <AppButton
              :variant="
                actionModal.type === 'delete' || actionModal.type === 'deactivate'
                  ? 'danger'
                  : 'primary'
              "
              @click="submitActionModal"
              :loading="submitting"
              :disabled="submitting"
            >
              Confirm Action
            </AppButton>
          </div>
        </div>
      </div>
    </transition>
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
.btn-icon {
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.btn-icon:hover {
  background: #f5f5f5;
  transform: translateY(-2px);
}

.btn-icon.edit:hover {
  border-color: #2196f3;
  color: #2196f3;
}
</style>
