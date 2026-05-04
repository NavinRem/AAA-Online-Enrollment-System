<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

import { getImageUrl, getActionIcon } from '@/utils/assetHelper'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import DataTable from '../components/common/data/DataTable.vue'
import AppBadge from '../components/common/ui/AppBadge.vue'
import ParentActionModal from '../components/parents/ParentActionModal.vue'
import ParentFormModal from '../components/parents/ParentFormModal.vue'
import { useSearch, parentSearchMapper } from '../composables/useSearch'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'
import { parentService } from '../services/parentService'
import { studentService } from '../services/studentService'
import { enrollmentService } from '../services/enrollmentService'
import { trialService } from '../services/trialService'
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
const trials = ref([])

const getRowClass = (item) => {
  return newlyCreatedId.value === item.id ? 'ui-row-new' : ''
}

const statsCards = computed(() => {
  const s = calculateParentStats(parents.value, enrollments.value, trials.value)
  return [
    {
      label: 'Total Parents',
      value: s.parentCount,
      image: getImageUrl('parent/total-parent'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Registered Today',
      value: s.todayCount,
      image: getImageUrl('parent/recently-register'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Paid Today',
      value: s.paidTodayCount,
      image: getImageUrl('parent/paid-today'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Trial Today',
      value: s.trialTodayCount,
      image: getImageUrl('parent/active-now'),
      color: 'var(--color-primary-light)',
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
    const [allParents, allStudents, allEnrollments, allTrials] = await Promise.all([
      parentService.getAllParents(),
      studentService.getAllStudents(),
      enrollmentService.getAllEnrollments(),
      trialService.getAllTrials(),
    ])

    enrollments.value = allEnrollments || []
    trials.value = allTrials || []

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
  return filterParents(parents.value, enrollments.value, trials.value, currentFilter.value)
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
      delete payload.updatedAt
      delete payload.createdAt
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

    if (type === 'plus') {
      const profileURL = await processStudentProfileImage(formData.profileURL, formData.name)
      const payload = prepareStudentPayload({ ...formData, profileURL, parentId: id })
      const result = await studentService.createStudent(payload)

      const parent = parents.value.find(p => p.id === id)
      const childrenInfo = [...(parent?.childrenInfo || []), { id: result.id, ...payload }]

      await parentService.updateParent(id, { childrenInfo })
      updateLocalParent(id, { childrenInfo })
      successMessage.value = 'Child registered successfully!'
    }

    if (type === 'reset-password') {
      const result = await authService.adminResetPassword(id)
      successMessage.value = `Password reset successfully! New Temporary Password: ${result.tempPassword}`
    }

    const delay = successMessage.value.includes('Password') ? 5000 : 1500
    setTimeout(closeActionModal, delay)
  } catch (error) {
    console.error(`Failed ${type}:`, error)
    errorMessage.value = error.response?.data?.message || error.message || `Action failed. Please try again.`
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
    delete payload.updatedAt
    delete payload.createdAt

    const result = await parentService.createParent(payload)
    const newUser = {
      id: result.id,
      ...payload,
      createdAt: new Date().toISOString(),
      childrenInfo: [],
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
    errorMessage.value = error.response?.data?.message || error.message || 'Failed to create parent account.'
  } finally {
    submitting.value = false
  }
}

const openAddChildModal = (parent) => {
  errorMessage.value = ''
  successMessage.value = ''
  actionModalType.value = 'plus'
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
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DataMetricCard v-for="stat in statsCards" :key="stat.label" v-bind="stat" />
        </div>
      </template>

      <template #table>
        <DataTable title="Parent Lists" :headers="parentHeaders" :items="paginatedParents" :loading="loading"
          entityName="parent" :flexible="true" v-model:searchQuery="searchQuery" searchPlaceholder="Search something..."
          :hasFilter="true" v-model:currentFilter="currentFilter" :filterOptions="[
            { label: 'All Parents', value: 'all' },
            { label: 'Joined Today', value: 'joined-today' },
            { label: 'Paid Today', value: 'paid-today' },
            { label: 'Trial Today', value: 'trial-today' },
          ]" :rowClass="getRowClass" :hasPagination="true" :totalItems="totalItems" :pageSize="pageSize"
          v-model:currentPage="currentPage" @row-click="navigateToDetail"
          @action="({ type, item }) => openActionModal(type, item)">
          <template #toolbar-actions>
            <AppButton variant="primary" size="md" class="rounded-xl shadow-lg shadow-primary/20"
              @click="showNewParentModal = true">
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
              <span class="font-bold tracking-tight">New Parent</span>
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
          }">
            <!-- No -->
            <td class="ui-cell text-center font-bold text-content-muted/30 hidden md:table-cell">
              {{ (currentPage - 1) * pageSize + index + 1 }}
            </td>

            <!-- Identity -->
            <td class="ui-cell min-w-[200px]" @click="navigateToDetail(item)">
              <div class="flex items-center gap-4 group cursor-pointer">
                <div
                  class="w-8 h-8 rounded-2xl overflow-hidden ring-2 ring-primary/5 group-hover:ring-primary/20 transition-all duration-500 shadow-sm">
                  <img :src="item.profileURL" alt="avatar" class="w-full h-full object-cover" />
                </div>
                <div class="flex flex-col">
                  <span
                    class="font-bold text-content-dark group-hover:text-primary transition-colors tracking-tight text-base leading-tight">{{
                      item.name }}</span>
                </div>
              </div>
            </td>

            <!-- Children -->
            <td class="ui-cell hidden lg:table-cell">
              <div class="flex -space-x-2">
                <template v-if="item.childrenInfo?.length">
                  <div v-for="(child, i) in item.childrenInfo" :key="child.id || i"
                    class="w-8 h-8 rounded-full border-2 border-white bg-surface-subtle overflow-hidden shadow-sm hover:z-10 transition-transform hover:scale-110"
                    :title="child.name">
                    <img :src="child.profileURL" alt="child" class="w-full h-full object-cover" />
                  </div>
                  <div v-if="item.childrenInfo.length > 3"
                    class="w-8 h-8 rounded-full border-2 border-white bg-surface-subtle flex items-center justify-center text-[10px] font-semibold text-content-muted">
                    +{{ item.childrenInfo.length - 3 }}
                  </div>
                </template>
              </div>
            </td>

            <!-- Contact Details -->
            <td class="ui-cell hidden md:table-cell">
              <div class="flex flex-col">
                <span class="text-sm font-semibold text-content-dark tracking-tighter">{{ item.phone }}</span>
              </div>
            </td>

            <td class="ui-cell hidden lg:table-cell">
              <div class="flex flex-col max-w-[160px]">
                <span class="text-sm font-semibold text-content-muted truncate">{{ item.email }}</span>
              </div>
            </td>

            <!-- Joined -->
            <td class="ui-cell hidden lg:table-cell text-center">
              <span class="text-sm font-semibold tabular-nums">
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
                  @click.stop="toggleMenu($event, item.id)">
                  <span class="font-bold text-lg leading-none mb-1">⋮</span>
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
                        class="ui-dropdown-item ui-dropdown-item-info group"
                        @click="openAddChildModal(item); closeMenu()">
                        <img :src="getActionIcon('plus')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                        <span class="font-semibold text-sm">Register Child</span>
                      </button>
                      <button v-if="(item.status || 'Active').toLowerCase() !== 'inactive'"
                        class="ui-dropdown-item ui-dropdown-item-info group"
                        @click="openActionModal('edit', item); closeMenu()">
                        <img :src="getActionIcon('edit')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                        <span class="font-semibold text-sm">Edit</span>
                      </button>
                      <button v-if="(item.status || 'Active').toLowerCase() === 'inactive'"
                        class="ui-dropdown-item ui-dropdown-item-success group"
                        @click="handleAction('activate', item); closeMenu()">
                        <img :src="getActionIcon('reactivate')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                        <span class="font-semibold text-sm">Reactivate</span>
                      </button>
                      <button v-else class="ui-dropdown-item ui-dropdown-item-danger group"
                        @click="handleAction('deactivate', item); closeMenu()">
                        <img :src="getActionIcon('cancel')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                        <span class="font-semibold text-sm">Deactivate</span>
                      </button>

                      <button v-if="(item.status || 'Active').toLowerCase() !== 'inactive'"
                        class="ui-dropdown-item ui-dropdown-item-info group"
                        @click="openActionModal('reset-password', item); closeMenu()">
                        <img :src="getActionIcon('reset-password')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                        <span class="font-semibold text-sm">Security Reset</span>
                      </button>

                      <div class="h-px bg-surface-light mx-1 my-1"
                        v-if="(item.status || 'Active').toLowerCase() !== 'inactive'">
                      </div>

                      <button v-if="(item.status || 'Active').toLowerCase() !== 'inactive'"
                        class="ui-dropdown-item ui-dropdown-item-danger group font-bold tracking-tighter"
                        @click="handleAction('delete', item); closeMenu()">
                        <img :src="getActionIcon('delete')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
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

    <ParentActionModal :isOpen="isActionModalOpen" :type="actionModalType" :user="actionModalParent"
      :loading="submitting" :error="errorMessage" :success="successMessage" @close="closeActionModal"
      @submit="submitActionModal" />

    <ParentFormModal :isOpen="showNewParentModal" :loading="submitting" :error="errorMessage" :success="successMessage"
      @close="showNewParentModal = false; errorMessage = ''; successMessage = ''" @submit="submitNewParent" />
  </DashboardLayout>
</template>
