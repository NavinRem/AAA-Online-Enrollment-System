<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

import { getImageUrl, getActionIcon } from '@/utils/assetHelper'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import DataMetrics from '../components/common/data/DataMetrics.vue'
import DataTable from '../components/common/data/DataTable.vue'
import AppBadge from '../components/common/ui/AppBadge.vue'
import ParentActionModal from '../components/parents/ParentActionModal.vue'
import ParentFormModal from '../components/parents/ParentFormModal.vue'
import { useSearch, parentSearchMapper } from '../composables/useSearch'
import { parentService } from '../services/parentService'
import { studentService } from '../services/studentService'
import { userService } from '../services/userService'
import { enrollmentService } from '../services/enrollmentService'
import branchService from '../services/branchService'
import {
  enrichParents,
  calculateParentStats,
  filterParents,
  processParentProfileImage,
  prepareParentPayload,
} from '@/utils/parentHelper'
import { processStudentProfileImage, prepareStudentPayload } from '@/utils/studentHelper'
import { formatDate } from '@/utils/formatUtils'
import { authService } from '@/services/authService'

const router = useRouter()
const parents = ref([])
const enrollments = ref([])
const loading = ref(true)
const newlyCreatedId = ref(null)
const branches = ref([])

const getRowClass = (item) => {
  return newlyCreatedId.value === item.id ? 'ui-row-new' : ''
}

const statsCards = computed(() => {
  const s = calculateParentStats(parents.value, enrollments.value)
  return [
    {
      label: 'Total Parents',
      value: s.parentCount,
      image: getImageUrl('parent/total-parent'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Registered Today',
      value: s.todayCount,
      image: getImageUrl('parent/recently-register'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Paid Today',
      value: s.paidTodayCount,
      image: getImageUrl('parent/paid-today'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Active Now',
      value: s.activeCount,
      image: getImageUrl('parent/active-now'),
      color: 'var(--accent-light)',
    },
  ]
})

const parentHeaders = [
  { label: 'No', width: '60px', class: 'hidden md:table-cell', align: 'center' },
  { label: 'Fullname' },
  { label: 'Child', class: 'hidden lg:table-cell', width: '150px' },
  { label: 'Phone Number', class: 'hidden md:table-cell' },
  { label: 'Email', class: 'hidden lg:table-cell' },
  { label: 'Joined Date', class: 'hidden lg:table-cell', align: 'center' },
  { label: 'Status', align: 'center' },
  { label: 'Action', width: '90px', align: 'center' },
]

onMounted(async () => {
  try {
    const [allParents, allStudents, allEnrollments] = await Promise.all([
      parentService.getAllParents(),
      studentService.getAllStudents(),
      enrollmentService.getAllEnrollments(),
    ])

    enrollments.value = allEnrollments || []

    if (Array.isArray(allParents)) {
      const enriched = enrichParents(allParents, allStudents || [])
      parents.value = enriched.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      )
    }
  } catch (error) {
    console.error('Failed to fetch initial data', error)
  } finally {
    loading.value = false
  }
})

const currentFilter = ref('all')

const statusFilteredParents = computed(() => {
  return filterParents(parents.value, enrollments.value, currentFilter.value)
})

const { searchQuery, searchResults: filteredParents } = useSearch(
  statusFilteredParents,
  parentSearchMapper,
)

const currentPage = ref(1)
const pageSize = 10
const totalItems = computed(() => filteredParents.value.length)

const paginatedParents = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredParents.value.slice(start, end)
})

watch([currentFilter, searchQuery], () => {
  currentPage.value = 1
})

const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const isActionModalOpen = ref(false)
const actionModalType = ref('edit')
const actionModalParent = ref(null)

const showNewParentModal = ref(false)

const openActionModal = (type, parent = null) => {
  errorMessage.value = ''
  successMessage.value = ''
  actionModalType.value = type
  actionModalParent.value = parent
  isActionModalOpen.value = true
}

const closeActionModal = () => {
  isActionModalOpen.value = false
  errorMessage.value = ''
  successMessage.value = ''
}

const updateLocalParent = (id, updates) => {
  const idx = parents.value.findIndex((p) => p.id === id)
  if (idx !== -1) {
    parents.value[idx] = { ...parents.value[idx], ...updates }
  }
}

const submitActionModal = async (formData) => {
  const type = actionModalType.value
  const id = actionModalParent.value?.id
  submitting.value = true
  errorMessage.value = ''

  try {
    if (type === 'edit') {
      const profileURL = await processParentProfileImage(formData.profileURL, formData.name)
      const payload = prepareParentPayload({ ...formData, profileURL })
      await parentService.updateParent(id, payload)
      updateLocalParent(id, payload)
      successMessage.value = 'Profile updated successfully!'
    }

    if (type === 'deactivate' || type === 'activate') {
      const status = type === 'activate' ? 'active' : 'inactive'
      await parentService.updateParent(id, { status })
      updateLocalParent(id, { status })
      successMessage.value = `Account ${type === 'activate' ? 'reactivated' : 'deactivated'} successfully!`
    }

    if (type === 'delete') {
      await parentService.deleteParent(id)
      parents.value = parents.value.filter((p) => p.id !== id)
      successMessage.value = 'Account deleted successfully!'
    }

    if (type === 'register-child') {
      const profileURL = await processStudentProfileImage(formData.profileURL, formData.name)
      const payload = prepareStudentPayload({ ...formData, profileURL })
      const result = await studentService.registerStudent(id, payload)

      const parent = parents.value.find(p => p.id === id)
      const studentInfo = [...(parent?.studentInfo), { id: result.id, ...payload, parentId: id }]

      await parentService.updateParent(id, { studentInfo })
      updateLocalParent(id, { studentInfo })
      successMessage.value = 'Child registered successfully!'
    }

    if (type === 'reset-password') {
      const result = await authService.manualPasswordReset(id)
      successMessage.value = `Password reset successfully! New Temporary Password: ${result.tempPassword}`
    }

    const delay = successMessage.value.includes('Password') ? 5000 : 1500
    setTimeout(closeActionModal, delay)
  } catch (error) {
    console.error(`Failed ${type}:`, error)
    errorMessage.value = `Action failed. Please try again.`
  } finally {
    submitting.value = false
  }
}

const submitNewParent = async (data) => {
  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const profileURL = await processParentProfileImage(data.profileURL, data.name)
    const payload = prepareParentPayload({ ...data, profileURL })
    if (data.password) payload.password = data.password

    const result = await parentService.registerParent(payload)
    const newUser = {
      id: result.id,
      ...payload,
      createdAt: new Date().toISOString(),
      studentInfo: [],
    }

    parents.value.unshift(newUser)
    newlyCreatedId.value = result.id
    successMessage.value = `Account created successfully! ${result.tempPassword ? 'Temp Password: ' + result.tempPassword : ''}`

    setTimeout(() => {
      showNewParentModal.value = false
      errorMessage.value = successMessage.value = ''
    }, 2000)
  } catch (error) {
    console.error('Failed creation:', error)
    errorMessage.value = 'Failed to create parent account.'
  } finally {
    submitting.value = false
  }
}

const openAddChildModal = (parent) => {
  errorMessage.value = ''
  successMessage.value = ''
  actionModalType.value = ''
  actionModalParent.value = parent
  isActionModalOpen.value = true
}

const navigateToDetail = (item) => {
  if (item.id === newlyCreatedId.value) {
    newlyCreatedId.value = null
  }
  router.push(`/parents/${item.id}`)
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Parent Overview">
      <template #overview>
        <DataMetrics :stats="statsCards" />
      </template>

      <template #table>
        <DataTable title="Parents List" :headers="parentHeaders" :items="paginatedParents" :loading="loading"
          entityName="parent" :flexible="true" v-model:searchQuery="searchQuery" searchPlaceholder="Search Parent..."
          :hasFilter="true" v-model:currentFilter="currentFilter" :filterOptions="[
            { label: 'All Parents', value: 'all' },
            { label: 'Registered Today', value: 'registered-today' },
            { label: 'Paid Today', value: 'paid-today' },
            { label: 'Active Only', value: 'active' },
            { label: 'Inactive Only', value: 'inactive' },
          ]" :rowClass="getRowClass" :hasPagination="true" :totalItems="totalItems" :pageSize="pageSize"
          v-model:currentPage="currentPage" @row-click="navigateToDetail"
          @action="({ type, item }) => openActionModal(type, item)">
          <template #toolbar-actions>
            <AppButton variant="primary" size="md" class="!rounded-std shadow-sm" @click="showNewParentModal = true">
              <img :src="getActionIcon('plus')" class="w-3.5 h-3.5 brightness-0 invert mt-px" />
              <span class="font-bold">Add Parent</span>
            </AppButton>
          </template>

          <template #row="{
            item,
            index,
            toggleMenu,
            activeMenuId,
            isMenuAbove,
            menuStyles,
            handleAction,
            closeMenu,
            headers,
          }">
            <td class="ui-cell text-center font-bold text-content-muted/50 hidden md:table-cell"
              :style="{ width: headers[0].width }">
              {{ index + 1 }}
            </td>
            <td class="ui-cell" :style="{ flex: '1 1 0%', minWidth: 0 }">
              <div class="ui-identity-cell">
                <div class="ui-avatar">
                  <img :src="item.profileURL" alt="avatar" />
                </div>
                <div class="ui-identity-info">
                  <span class="font-bold text-content-dark">{{ item.name }}</span>
                </div>
              </div>
            </td>
            <td class="ui-cell hidden lg:table-cell" :style="{ width: headers[2].width }">
              <div class="ui-avatar-stack">
                <span v-if="!item.studentInfo || item.studentInfo.length === 0"
                  class="text-content-muted italic opacity-40">—</span>
                <template v-else>
                  <div v-for="(child, i) in item.studentInfo" :key="child.id || i"
                    class="ui-stack-item border-primary/20" :title="child.name || 'Child ' + (i + 1)"
                    :style="{ zIndex: item.studentInfo.length - i }">
                    <img :src="child.profileURL" alt="child" />
                  </div>
                </template>
              </div>
            </td>
            <td class="ui-cell hidden md:table-cell font-semibold" :style="{ width: headers[3].width }">
              {{ item.phone }}
            </td>
            <td class="ui-cell hidden lg:table-cell" :style="{ flex: '1 1 0%', minWidth: 0 }">
              <span class="text-xs text-content-muted font-medium truncate block max-w-[180px]">{{
                item.email
                }}</span>
            </td>
            <td class="ui-cell hidden lg:table-cell text-center" :style="{ width: headers[5].width }">
              <span class="text-xs font-bold text-content-muted/70 tracking-tight">{{
                formatDate(item.createdAt)
                }}</span>
            </td>
            <td class="ui-cell text-center" :style="{ width: headers[6].width }">
              <AppBadge :status="item.status" />
            </td>
            <td class="ui-cell text-center" :style="{ width: headers[7].width }">
              <div class="ui-action-menu">
                <button class="ui-btn-dots" @click.stop="toggleMenu($event, item.id)">
                  <span class="font-bold">⋮</span>
                </button>
                <Teleport to="body">
                  <transition enter-active-class="transition duration-200 ease-out"
                    enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100"
                    leave-to-class="opacity-0">
                    <div v-if="activeMenuId === item.id" class="ui-dropdown-menu"
                      :class="{ 'origin-bottom': isMenuAbove, 'origin-top': !isMenuAbove }" :style="menuStyles"
                      @click.stop>
                      <button v-if="(item.status || 'Active').toLowerCase() !== 'inactive'"
                        class="ui-dropdown-item ui-dropdown-item-info group" @click="
                          () => {
                            openAddChildModal(item)
                            closeMenu()
                          }
                        ">
                        <img :src="getActionIcon('plus')" class="w-4 h-4 transition-opacity"
                          :style="{ filter: getStatusFilter('blue') }" />
                        Register Child
                      </button>
                      <button v-if="(item.status || 'Active').toLowerCase() !== 'inactive'"
                        class="ui-dropdown-item ui-dropdown-item-info group" @click="
                          () => {
                            openActionModal('edit', item)
                            closeMenu()
                          }
                        ">
                        <img :src="getActionIcon('edit')" class="w-4 h-4 transition-opacity"
                          :style="{ filter: getStatusFilter('blue') }" />
                        Edit Profile
                      </button>
                      <button v-if="(item.status || 'Active').toLowerCase() === 'inactive'"
                        class="ui-dropdown-item ui-dropdown-item-success group" @click="handleAction('activate', item)">
                        <img :src="getActionIcon('reactivate')" class="w-4 h-4 transition-opacity"
                          :style="{ filter: getStatusFilter('green') }" />
                        Reactivate
                      </button>
                      <button v-else class="ui-dropdown-item ui-dropdown-item-danger group"
                        @click="handleAction('deactivate', item)">
                        <img :src="getActionIcon('cancel')" class="w-4 h-4 transition-opacity"
                          :style="{ filter: getStatusFilter('red') }" />
                        Deactivate
                      </button>
                      <button v-if="(item.status || 'Active').toLowerCase() !== 'inactive'"
                        class="ui-dropdown-item ui-dropdown-item-info group" @click="
                          () => {
                            openActionModal('reset-password', item)
                            closeMenu()
                          }
                        ">
                        <img :src="getActionIcon('reset-password')" class="w-4 h-4 transition-opacity"
                          :style="{ filter: getStatusFilter('purple') }" />
                        Reset Password
                      </button>
                      <div class="h-px bg-surface-light mx-1 my-1"
                        v-if="(item.status || 'Active').toLowerCase() !== 'inactive'">
                      </div>
                      <button v-if="(item.status || 'Active').toLowerCase() !== 'inactive'"
                        class="ui-dropdown-item ui-dropdown-item-danger group font-bold"
                        @click="handleAction('delete', item)">
                        <img :src="getActionIcon('delete')" class="w-4 h-4 transition-opacity"
                          :style="{ filter: getStatusFilter('red') }" />
                        Delete Account
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

    <ParentActionModal :isOpen="isActionModalOpen" :type="actionModalType" :user="actionModalParent"
      :branches="branches" :loading="submitting" :error="errorMessage" :success="successMessage"
      @close="closeActionModal" @submit="submitActionModal" />

    <ParentFormModal :isOpen="showNewParentModal" :loading="submitting" :error="errorMessage" :success="successMessage"
      @close="
        () => {
          showNewParentModal = false
          errorMessage = ''
          successMessage = ''
        }
      " @submit="submitNewParent" />
  </DashboardLayout>
</template>
