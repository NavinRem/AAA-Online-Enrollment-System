<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '../stores/dataStore'

import { getImageUrl, getActionIcon } from '@/utils/assetHelper'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import DataTable from '../components/common/data/DataTable.vue'
import AppBadge from '../components/common/ui/AppBadge.vue'
import ParentActionModal from '../components/parents/ParentActionModal.vue'

import { useSearch, parentSearchMapper } from '../composables/useSearch'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'
import { parentService } from '../services/parentService'
import { studentService } from '../services/studentService'
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
import { useModalState } from '@/composables/useModalState'

const router = useRouter()
const dataStore = useDataStore()
const newlyCreatedId = ref(null)

// UI State
// Dropdowns were removed

const parents = computed(() => {
  const allParents = dataStore.parents
  const allStudents = dataStore.students
  return enrichParents(allParents, allStudents)
})

const enrollments = computed(() => dataStore.enrollments)
const loading = computed(() => dataStore.loading.parents)

const getRowClass = (item) => {
  return newlyCreatedId.value === item.id ? 'ui-row-new' : ''
}

const statsCards = computed(() => {
  const { parentCount, todayCount, paidTodayCount, inactiveCount } = calculateParentStats(parents.value, enrollments.value)
  
  return [
    {
      label: 'Total Parents',
      value: parentCount,
      image: getImageUrl('parent/total-parent'),
    },
    {
      label: 'Registered Today',
      value: todayCount,
      image: getImageUrl('parent/recently-register'),
    },
    {
      label: 'Paid Today',
      value: paidTodayCount,
      image: getImageUrl('parent/paid-today'),
    },
    {
      label: 'Inactive Account',
      value: inactiveCount,
      image: getImageUrl('parent/total-guardian'),
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
    await dataStore.fetchAllCommonData()
  } catch (error) {
    console.error('Failed to fetch initial data', error)
  }
})

// Component setup complete

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
  const list = [...filteredParents.value].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  )
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return list.slice(start, end)
})

watch([currentFilter, searchQuery], () => {
  currentPage.value = 1
})

const { actionModal, openActionModal: baseOpenModal, closeActionModal, setModalLoading, setModalError, setModalSuccess } = useModalState('edit')
const actionModalParent = ref(null)

const openActionModal = (type, parent = null) => {
  actionModalParent.value = parent
  baseOpenModal(type)
}

const reloadData = async () => {
  await dataStore.fetchAllCommonData(true, ['parents', 'students'])
}

const submitActionModal = async (formData) => {
  const type = actionModal.value.type
  if (type === 'add') {
    return submitNewParent(formData)
  }
  
  const id = actionModalParent.value?.id
  setModalLoading(true)
  setModalError('')

  try {
    if (type === 'edit') {
      const profileURL = await processParentProfileImage(formData.profileURL, formData.name)
      const payload = prepareParentPayload({ ...formData, profileURL })
      delete payload.updatedAt
      delete payload.createdAt
      await parentService.updateParent(id, payload)
      await reloadData()
      setModalSuccess('Profile updated successfully!')
    }

    if (type === 'deactivate' || type === 'activate') {
      const status = type === 'activate' ? 'Active' : 'Inactive'
      await parentService.updateParent(id, { status })
      await reloadData()
      setModalSuccess(`Account ${type === 'activate' ? 'reactivated' : 'deactivated'} successfully!`)
    }

    if (type === 'delete') {
      await parentService.deleteParent(id)
      await reloadData()
      setModalSuccess('Account deleted successfully!')
    }

    if (type === 'plus') {
      const profileURL = await processStudentProfileImage(formData.profileURL, formData.name)
      const payload = prepareStudentPayload({ ...formData, profileURL, parentId: id })
      const result = await studentService.createStudent(payload)

      const parent = parents.value.find((p) => p.id === id)
      const childrenInfo = [...(parent?.childrenInfo || []), { id: result.id, ...payload }]

      await parentService.updateParent(id, { childrenInfo })
      await reloadData()
      setModalSuccess('Child registered successfully!')
    }

    if (type === 'reset-password') {
      const result = await authService.adminResetPassword(id)
      setModalSuccess(`Password reset successfully! New Temporary Password: ${result.tempPassword}`)
    }

    const delay = actionModal.value.success.includes('Password') ? 5000 : 1500
    setTimeout(closeActionModal, delay)
  } catch (error) {
    console.error(`Failed ${type}:`, error)
    setModalError(error.response?.data?.message || error.message || `Action failed. Please try again.`)
  } finally {
    setModalLoading(false)
  }
}

const submitNewParent = async (data) => {
  setModalLoading(true)
  setModalError('')
  setModalSuccess('')

  try {
    const profileURL = await processParentProfileImage(data.profileURL, data.name)
    const payload = prepareParentPayload({ ...data, profileURL })
    if (data.password) payload.password = data.password
    delete payload.updatedAt
    delete payload.createdAt

    const result = await parentService.createParent(payload)
    newlyCreatedId.value = result.id
    await reloadData()
    setModalSuccess(`Account created successfully! ${result.tempPassword ? 'Temp Password: ' + result.tempPassword : ''}`)

    setTimeout(() => {
      closeActionModal()
    }, 2000)
  } catch (error) {
    console.error('Failed creation:', error)
    setModalError(error.response?.data?.message || error.message || 'Failed to create parent account.')
  } finally {
    setModalLoading(false)
  }
}

const openAddChildModal = (parent) => {
  actionModalParent.value = parent
  baseOpenModal('plus')
}

const navigateToDetail = (item) => {
  if (item.id === newlyCreatedId.value) {
    newlyCreatedId.value = null
  }
  router.push(`/parents/${item.id}`)
}

const handleRowAction = (type, item, closeMenu) => {
  if (type === 'plus') {
    openAddChildModal(item)
  } else if (type === 'activate' || type === 'deactivate') {
    const actionType = type === 'activate' ? 'activate' : 'deactivate'
    openActionModal(actionType, item)
  } else {
    openActionModal(type, item)
  }
  if (closeMenu) closeMenu()
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Parent Overview">
      <template #overview>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DataMetricCard v-for="stat in statsCards" :key="stat.label" v-bind="stat" />
        </div>
      </template>

      <template #table>
        <DataTable
          title="Parent Lists"
          :headers="parentHeaders"
          :items="paginatedParents"
          :loading="loading"
          entityName="parent"
          :flexible="true"
          v-model:searchQuery="searchQuery"
          searchPlaceholder="Search something..."
          :hasFilter="true"
          v-model:currentFilter="currentFilter"
          :filterOptions="[
            { label: 'All Parents', value: 'all' },
            { label: 'Registered Today', value: 'registered-today' },
            { label: 'Paid Today', value: 'paid-today' },
            { label: 'Inactive Account', value: 'inactive' },
          ]"
          :rowClass="getRowClass"
          :hasPagination="true"
          :totalItems="totalItems"
          :pageSize="pageSize"
          v-model:currentPage="currentPage"
          @row-click="navigateToDetail"
          @action="({ type, item }) => openActionModal(type, item)"
        >
          <template #toolbar-actions>
            <div class="flex items-center gap-3">              <AppButton variant="primary" @click="openActionModal('add')">
                <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
                <span class="font-bold tracking-tight">New Parent</span>
              </AppButton>
            </div>
          </template>

          <template
            #row="{ item, index, toggleMenu, activeMenuId, isMenuAbove, menuStyles, closeMenu }"
          >
            <!-- No -->
            <td class="ui-cell text-center hidden md:table-cell">
              <span class="font-bold text-content-dark text-sm">{{
                (currentPage - 1) * pageSize + index + 1
              }}</span>
            </td>

            <!-- Identity -->
            <td class="ui-cell min-w-52" @click="navigateToDetail(item)">
              <div class="flex items-center gap-4 group cursor-pointer">
                <div
                  class="w-8 h-8 rounded-2xl overflow-hidden ring-2 ring-primary/5 group-hover:ring-primary/20 transition-all duration-500 shadow-sm"
                >
                  <img :src="item.profileURL" alt="avatar" class="w-full h-full object-cover" />
                </div>
                <div class="flex flex-col">
                  <span
                    class="font-bold text-content-dark text-sm group-hover:text-primary transition-colors tracking-tight leading-tight"
                    >{{ item.name }}</span
                  >
                </div>
              </div>
            </td>

            <!-- Children -->
            <td class="ui-cell hidden lg:table-cell">
              <div class="flex -space-x-2">
                <template v-if="item.childrenInfo?.length">
                  <div
                    v-for="(child, i) in item.childrenInfo"
                    :key="child.id || i"
                    class="w-8 h-8 rounded-full border-2 border-white bg-surface-subtle overflow-hidden shadow-sm hover:z-10 transition-transform hover:scale-110"
                    :title="child.name"
                  >
                    <img :src="child.profileURL" alt="child" class="w-full h-full object-cover" />
                  </div>
                  <div
                    v-if="item.childrenInfo.length > 3"
                    class="w-8 h-8 rounded-full border-2 border-white bg-surface-subtle flex items-center justify-center text-3xs font-black"
                  >
                    +{{ item.childrenInfo.length - 3 }}
                  </div>
                </template>
              </div>
            </td>

            <!-- Contact Details -->
            <td class="ui-cell hidden md:table-cell">
              <div class="flex flex-col">
                <span class="text-xs font-bold text-content-dark tabular-nums tracking-tighter">{{
                  item.phone
                }}</span>
              </div>
            </td>

            <td class="ui-cell hidden lg:table-cell">
              <div class="flex flex-col max-w-40">
                <span class="truncate ui-cell-muted">{{ item.email }}</span>
              </div>
            </td>

            <!-- Joined -->
            <td class="ui-cell hidden lg:table-cell text-center">
              <span class="ui-cell-muted">
                {{ formatDate(item.createdAt) }}
              </span>
            </td>

            <!-- Status -->
            <td class="ui-cell text-center">
              <AppBadge :status="item.status" />
            </td>

            <!-- Actions -->
            <td class="ui-cell text-center">
              <div class="ui-action-menu">
                <button
                  class="w-8 h-8 flex items-center justify-center hover:bg-surface-subtle rounded-lg transition-all text-content-muted hover:text-content-dark"
                  @click.stop="toggleMenu($event, item.id)"
                >
                  <span class="font-bold text-lg leading-none mb-1">⋮</span>
                </button>
                <Teleport to="body">
                  <transition
                    enter-active-class="transition duration-200 ease-out"
                    enter-from-class="transform scale-95 opacity-0"
                    enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-150 ease-in"
                    leave-from-class="opacity-100"
                    leave-to-class="opacity-0"
                  >
                    <div
                      v-if="activeMenuId === item.id"
                      class="ui-dropdown-menu"
                      :class="{ 'origin-bottom': isMenuAbove, 'origin-top': !isMenuAbove }"
                      :style="menuStyles"
                      @click.stop
                    >
                      <button
                        v-if="(item.status || 'Active').toLowerCase() !== 'inactive'"
                        class="ui-dropdown-item ui-dropdown-item-info group"
                        @click="handleRowAction('plus', item, closeMenu)"
                      >
                        <img
                          :src="getActionIcon('plus')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity"
                        />
                        <span class="font-semibold text-sm">Register Child</span>
                      </button>
                      <button
                        v-if="(item.status || 'Active').toLowerCase() !== 'inactive'"
                        class="ui-dropdown-item ui-dropdown-item-info group"
                        @click="handleRowAction('edit', item, closeMenu)"
                      >
                        <img
                          :src="getActionIcon('edit')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity"
                        />
                        <span class="font-semibold text-sm">Edit</span>
                      </button>
                      <button
                        v-if="(item.status || 'Active').toLowerCase() === 'inactive'"
                        class="ui-dropdown-item ui-dropdown-item-success group"
                        @click="handleRowAction('activate', item, closeMenu)"
                      >
                        <img
                          :src="getActionIcon('reactivate')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity"
                        />
                        <span class="font-semibold text-sm">Reactivate</span>
                      </button>
                      <button
                        v-else
                        class="ui-dropdown-item ui-dropdown-item-danger group"
                        @click="handleRowAction('deactivate', item, closeMenu)"
                      >
                        <img
                          :src="getActionIcon('cancel')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity"
                        />
                        <span class="font-semibold text-sm">Deactivate</span>
                      </button>

                      <button
                        v-if="(item.status || 'Active').toLowerCase() !== 'inactive'"
                        class="ui-dropdown-item ui-dropdown-item-info group"
                        @click="handleRowAction('reset-password', item, closeMenu)"
                      >
                        <img
                          :src="getActionIcon('reset-password')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity"
                        />
                        <span class="font-semibold text-sm">Security Reset</span>
                      </button>

                      <div
                        class="h-px bg-surface-light mx-1 my-1"
                        v-if="(item.status || 'Active').toLowerCase() !== 'inactive'"
                      ></div>

                      <button
                        v-if="(item.status || 'Active').toLowerCase() !== 'inactive'"
                        class="ui-dropdown-item ui-dropdown-item-danger group font-bold tracking-tighter"
                        @click="handleRowAction('delete', item, closeMenu)"
                      >
                        <img
                          :src="getActionIcon('delete')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity"
                        />
                        Delete
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

    <ParentActionModal
      :isOpen="actionModal.isOpen"
      :type="actionModal.type"
      :user="actionModalParent"
      :loading="actionModal.loading"
      :error="actionModal.error"
      :success="actionModal.success"
      @close="closeActionModal"
      @submit="submitActionModal"
    />

    <!-- Teleported Dropdowns -->
    <!-- Teleported Dropdowns -->
    <Teleport to="body">
    </Teleport>


  </DashboardLayout>
</template>

<style scoped>
.toolbar-filter-menu {
  @apply fixed bg-white rounded-md shadow-2xl border border-outline-std z-dropdown p-xs min-w-60 max-h-80 overflow-y-auto;
}

.toolbar-filter-option {
  @apply px-md py-sm text-sm font-semibold cursor-pointer transition-all rounded-sm select-none flex items-center gap-2;
}

.toolbar-filter-option:hover {
  @apply bg-surface-subtle text-primary;
}

.active-filter-item {
  @apply bg-primary text-white hover:bg-primary hover:text-white !important;
}
</style>
