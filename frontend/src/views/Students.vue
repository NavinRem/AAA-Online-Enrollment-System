<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '../stores/dataStore'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import DataTable from '../components/common/data/DataTable.vue'
import AppBadge from '../components/common/ui/AppBadge.vue'
import ParentActionModal from '../components/parents/ParentActionModal.vue'
import StudentActionModal from '../components/students/StudentActionModal.vue'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'
import { useAuthStore } from '@/stores/auth'
import { studentService } from '../services/studentService'
import { parentService } from '../services/parentService'
import { useSearch, studentSearchMapper } from '@/composables/useSearch'
import { formatDate } from '@/utils/formatUtils'
import { getProgramProfileURL, getImageUrl, getActionIcon } from '@/utils/assetHelper'
import {
  calculateTotalStudent,
  enrichStudents,
  processStudentProfileImage,
  prepareStudentPayload,
} from '@/utils/studentHelper'

const router = useRouter()
const authStore = useAuthStore()
const dataStore = useDataStore()
const newlyCreatedId = ref(null)

// Filters
const branchFilter = ref('all')
const dropdowns = ref({
  branch: false
})
const filterMenuStyles = ref({})

const branchOptions = computed(() => {
  return dataStore.branches
    .filter(b => !b.isDeleted)
    .map(b => ({
      label: b.name,
      value: b.id,
      color: b.color,
      abbr: b.abbr
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
})

const toggleDropdown = (type, event) => {
  event.stopPropagation()
  const isOpening = !dropdowns.value[type]
  Object.keys(dropdowns.value).forEach(key => {
    dropdowns.value[key] = false
  })
  dropdowns.value[type] = isOpening

  if (isOpening) {
    const rect = event.currentTarget.getBoundingClientRect()
    filterMenuStyles.value = {
      top: `${rect.bottom + window.scrollY + 8}px`,
      left: `${Math.min(rect.left + window.scrollX, window.innerWidth - 250)}px`,
      minWidth: '240px'
    }
  }
}

const selectFilter = (type, value) => {
  if (type === 'branch') branchFilter.value = value
  dropdowns.value[type] = false
}

const getActiveLabel = (type) => {
  if (type === 'branch') {
    if (branchFilter.value === 'all') return { label: 'All Branches', color: 'purple' }
    const opt = branchOptions.value.find(o => String(o.value) === String(branchFilter.value))
    return {
      label: opt ? opt.label : 'Select Branch',
      color: opt?.color || 'purple'
    }
  }
  return { label: '' }
}

const handleClickOutside = (event) => {
  if (dropdowns.value.branch) {
    const btn = document.getElementById('branch-filter-btn')
    if (btn && !btn.contains(event.target)) {
      dropdowns.value.branch = false
    }
  }
}

const students = computed(() => dataStore.students)
const parentsList = computed(() => dataStore.parents)

const getRowClass = (item) => {
  return newlyCreatedId.value === item.id ? 'ui-row-new' : ''
}

const fetchStudents = async () => {
  dataStore.loading.students = true

  if (!authStore.isAuthenticated) {
    dataStore.loading.students = false
    return
  }

  try {
    await dataStore.fetchAllCommonData(true)
  } catch (error) {
    console.error('Failed to fetch students', error)
  } finally {
    dataStore.loading.students = false
  }
}

onMounted(() => {
  window.addEventListener('mousedown', handleClickOutside)
  fetchStudents()
})

onUnmounted(() => {
  window.removeEventListener('mousedown', handleClickOutside)
})

const currentActiveTerm = computed(() => {
  const allTerms = dataStore.terms || []
  return allTerms.find((t) => t.status === 'active') ||
    [...allTerms].sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0] || null
})

const studentsEnriched = computed(() => {
  const sData = dataStore.students || []
  const rData = dataStore.enrollments || []
  const pData = dataStore.parents || []
  const classes = dataStore.classes || []
  const programs = dataStore.programs || []
  const termId = currentActiveTerm.value?.id || null

  const enriched = enrichStudents(sData, rData, pData, termId, classes, programs)
  // Clean up: Ensure we only show records with names and IDs
  return (enriched || []).filter(s => s.id && s.name && s.name.trim() !== '')
})

const { searchQuery, searchResults } = useSearch(studentsEnriched, studentSearchMapper)

const currentFilter = ref('all')

const filteredStudents = computed(() => {
  let list = searchResults.value

  // 1. Status Filter
  if (currentFilter.value !== 'all') {
    list = list.filter((s) => (s.status || 'inactive').toLowerCase() === currentFilter.value)
  }

  // 2. Branch Filter
  if (branchFilter.value !== 'all') {
    list = list.filter(s => {
      // Check if student has ANY enrollment in the selected branch
      const hasBranchEnrollment = (s.enrollments || []).some(e => String(e.branchId) === String(branchFilter.value))
      return hasBranchEnrollment
    })
  }

  return [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
})

const currentPage = ref(1)
const pageSize = 10
const totalItems = computed(() => filteredStudents.value.length)

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredStudents.value.slice(start, end)
})

watch([currentFilter, branchFilter, searchQuery], () => {
  currentPage.value = 1
})

const statsCards = computed(() => {
  // Use branch-filtered list for metrics if branch filter is active
  const statsList = branchFilter.value === 'all' ? studentsEnriched.value : filteredStudents.value
  const s = calculateTotalStudent(statsList)

  return [
    {
      label: 'Total Students',
      value: s.total,
      image: getImageUrl('student/total-student'),
    },
    {
      label: 'Active (Studying)',
      value: s.active,
      image: getImageUrl('student/currently-enrolled'),
    },
    {
      label: 'Inactive (Stopped)',
      value: s.inactive,
      image: getImageUrl('student/currently-not-enrolled'),
    },
    {
      label: 'On Hold',
      value: s.hold,
      image: getImageUrl('student/stopped-enrolled'),
    },
  ]
})

const studentHeaders = [
  { label: 'No', width: '40px', class: 'hidden md:table-cell', align: 'center' },
  { label: 'Age', class: 'hidden md:table-cell', width: '60px', align: 'center' },
  { label: 'Student' },
  { label: 'Parent', class: 'hidden md:table-cell' },
  { label: 'Branch', width: '150px', align: 'center', class: 'hidden sm:table-cell' },
  { label: 'Programs', class: 'hidden lg:table-cell', width: '240px' },
  { label: 'Status', align: 'center', width: '100px' },
  { label: 'Joined', class: 'hidden xl:table-cell', width: '300px', align: 'center' },
  { label: 'Action', width: '60px', align: 'center' },
]

const parentActionModal = ref({
  isOpen: false,
  type: 'register-child',
})
const modalLoading = ref(false)
const modalError = ref('')
const modalSuccess = ref('')

const handleOpenAddStudent = async () => {
  modalError.value = ''
  modalSuccess.value = ''
  parentActionModal.value.isOpen = true
  parentActionModal.value.type = 'plus'
}

const handleRegisterStudent = async (formData) => {
  if (modalLoading.value) return // Prevent double-submit
  modalLoading.value = true
  modalError.value = ''
  modalSuccess.value = ''

  try {
    const { parentId, name, dob, profileURL } = formData
    if (!parentId) throw new Error('No parent selected')

    const finalProfile = await processStudentProfileImage(profileURL, name)

    const payload = prepareStudentPayload({
      name,
      dob,
      profileURL: finalProfile,
      status: 'Inactive',
      parentId,
    })

    const result = await studentService.createStudent(payload)

    newlyCreatedId.value = result.id
    modalSuccess.value = 'Student registered successfully!'
    setTimeout(() => {
      parentActionModal.value.isOpen = false
      modalSuccess.value = ''
    }, 1500)

    try {
      fetchStudents()
    } catch (err) {
      console.warn('Silent refresh error:', err)
    }
  } catch (err) {
    console.error('Failed to register child', err)
    modalError.value = err.message || 'Error creating student account.'
  } finally {
    modalLoading.value = false
  }
}

const navigateToDetail = (item) => {
  const studentId = item?.id || item?.uid
  if (studentId === newlyCreatedId.value) {
    newlyCreatedId.value = null
  }
  if (studentId) {
    router.push(`/students/${studentId}`)
  }
}

const actionModal = ref({
  isOpen: false,
  type: 'edit',
  student: null,
})

const openActionModal = async (type, studentItem) => {
  actionModal.value = {
    isOpen: true,
    type,
    student: studentItem,
  }
}

const submitActionModal = async (formData) => {
  const { type, student } = actionModal.value
  const { name, status, parentId, dob, profileURL } = formData
  modalLoading.value = true
  modalError.value = ''
  modalSuccess.value = ''

  try {
    if (type === 'edit') {
      const finalProfile = await processStudentProfileImage(profileURL, name, student.profileURL)
      const payload = prepareStudentPayload({
        name,
        dob,
        profileURL: finalProfile,
        status,
        parentId,
      })
      await studentService.updateStudent(student.id, payload)
      newlyCreatedId.value = student.id
      modalSuccess.value = 'Student profile updated successfully!'
    } else if (type === 'delete') {
      await studentService.deleteStudent(student.id)
      modalSuccess.value = 'Student record permanently deleted.'
    } else if (type === 'override') {
      const { overrideReason, overrideRemark } = formData
      const isInactive = status.toLowerCase() === 'inactive'

      await studentService.updateStudent(student.id, {
        status,
        overrideReason,
        overrideRemark,
        manualStatus: true,
        archived: isInactive,
      })

      if (isInactive && student.parentId) {
        try {
          await parentService.updateParent(student.parentId, { status: 'Inactive' })
        } catch (autoErr) {
          console.warn('Auto-deactivation of parent failed', autoErr)
        }
      }

      modalSuccess.value = `Student manually set to ${status} status.${isInactive ? ' Parent account deactivated.' : ''}`
    }

    await fetchStudents()

    setTimeout(() => {
      actionModal.value.isOpen = false
    }, 1500)
  } catch (err) {
    console.error('Failed Action', err)
    modalError.value = err.message
  } finally {
    modalLoading.value = false
  }
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Student Overview">
      <template #overview>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DataMetricCard v-for="stat in statsCards" :key="stat.label" v-bind="stat" />
        </div>
      </template>

      <template #table>
        <DataTable title="Student Lists" :headers="studentHeaders" :items="paginatedStudents"
          :loading="dataStore.loading.students" entityName="student" :flexible="true" v-model:searchQuery="searchQuery"
          searchPlaceholder="Search by name or ID..." :hasFilter="true" v-model:currentFilter="currentFilter"
          :filterOptions="[
            { label: 'All Students', value: 'all' },
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
            { label: 'Hold', value: 'hold' },
          ]" :rowClass="getRowClass" :hasPagination="true" :totalItems="totalItems" :pageSize="pageSize"
          v-model:currentPage="currentPage" @row-click="navigateToDetail"
          @action="({ type, item }) => openActionModal(type, item)">
          <template #toolbar-actions>
            <div class="flex items-center gap-3">
              <!-- Branch Filter -->
              <div class="relative" id="branch-filter-btn">
                <AppButton :variant="branchFilter === 'all' ? 'secondary' : 'ghost'" size="md"
                  @click="toggleDropdown('branch', $event)" class="rounded-xl transition-all duration-300 group"
                  :class="{ '!text-white shadow-md': branchFilter !== 'all', 'shadow-sm': branchFilter === 'all' }"
                  :style="branchFilter !== 'all' ? { backgroundColor: `var(--color-${getActiveLabel('branch').color})` } : {}">
                  <img :src="getActionIcon('branch')"
                    class="w-4 h-4 brightness-0 transition-all opacity-80 group-hover:opacity-100"
                    :class="{ 'invert': branchFilter !== 'all' }" />
                  <span class="font-bold tracking-tight" :class="{ 'text-white': branchFilter !== 'all' }">{{
                    getActiveLabel('branch').label }}</span>
                  <span class="ml-2 text-xs opacity-60 group-hover:opacity-100"
                    :class="{ 'text-white': branchFilter !== 'all' }">▼</span>
                </AppButton>
                <Teleport to="body">
                  <transition enter-active-class="transition duration-200 ease-out"
                    enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100"
                    leave-to-class="opacity-0">
                    <div v-if="dropdowns.branch" class="toolbar-filter-menu" :style="filterMenuStyles" @mousedown.stop>
                      <div class="toolbar-filter-option flex items-center justify-between gap-4"
                        :class="{ 'active-filter-item': branchFilter === 'all' }"
                        @click="selectFilter('branch', 'all')">
                        <div class="flex items-center gap-3">
                          <AppBadge status="ALL" type="gray" size="sm" class="w-12 text-center" />
                          <span>All Branches</span>
                        </div>
                      </div>
                      <div v-for="opt in branchOptions" :key="opt.value"
                        class="toolbar-filter-option flex items-center justify-between gap-4"
                        :class="{ 'active-filter-item': String(branchFilter) === String(opt.value) }"
                        @click="selectFilter('branch', opt.value)">
                        <div class="flex items-center gap-3">
                          <AppBadge :status="opt.abbr" :type="opt.color" size="sm" class="w-12 text-center" />
                          <span class="truncate">{{ opt.label }}</span>
                        </div>
                        <span v-if="String(branchFilter) === String(opt.value)" class="text-xs">✓</span>
                      </div>
                    </div>
                  </transition>
                </Teleport>
              </div>

              <AppButton variant="primary" size="md" class="rounded-xl shadow-lg shadow-primary/20"
                @click="handleOpenAddStudent">
                <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
                <span class="font-bold">New Student</span>
              </AppButton>
            </div>
          </template>

          <template #row="{
            item,
            index,
            toggleMenu,
            activeMenuId,
            isMenuAbove,
            menuStyles,
            handleAction,
            closeMenu
          }">
            <!-- No -->
            <td class="ui-cell text-center hidden md:table-cell">
              <span class="font-bold text-content-dark text-sm">{{ (currentPage - 1) * pageSize + index + 1 }}</span>
            </td>

            <!-- Age -->
            <td class="ui-cell text-center hidden md:table-cell">
              <AppBadge type="blue">
                {{ item.age }}
              </AppBadge>
            </td>

            <!-- Identity -->
            <td class=" ui-cell min-w-[200px]" @click="navigateToDetail(item)">
              <div class="ui-identity-cell">
                <div class="relative">
                  <div
                    class="ui-avatar ring-2 ring-primary/5 group-hover:ring-primary/20 transition-all duration-300 shadow-sm">
                    <img :src="item.profileURL" alt="avatar" class="w-full h-full object-cover" />
                  </div>
                </div>
                <div class="ui-identity-info">
                  <span class="truncate block font-bold text-content-dark text-sm tracking-tight">{{ item.name }}</span>
                </div>
              </div>
            </td>

            <!-- Parent -->
            <td class="ui-cell hidden md:table-cell">
              <div class="ui-identity-cell">
                <div class="ui-avatar !w-8 !h-8">
                  <img :src="item.parentInfo?.profileURL" alt="parent" />
                </div>
                <div class="ui-identity-info">
                  <span class="text-xs font-bold text-content-muted tracking-tight">{{ item.parentInfo?.name }}</span>
                </div>
              </div>
            </td>

            <!-- Branch -->
            <td class="ui-cell text-center hidden sm:table-cell">
              <AppBadge v-if="item.branchInfo?.abbr" :status="item.branchInfo.abbr" :type="item.branchInfo.color" />
              <span v-else class="opacity-30 text-2xs font-bold uppercase tracking-widest">—</span>
            </td>

            <!-- Programs -->
            <td class="ui-cell hidden lg:table-cell">
              <div class="flex -space-x-3 hover:space-x-1 transition-all duration-500 overflow-hidden py-1 px-2">
                <template v-if="item.enrollments?.length">
                  <!-- Group by program to show unique programs only -->
                  <div
                    v-for="(reg, rIdx) in [...new Map(item.enrollments.map(e => [e.programId || e.program?.id, e])).values()]"
                    :key="rIdx"
                    class="w-10 h-10 rounded-full border-2 border-white bg-surface-subtle overflow-hidden shadow-md hover:z-10 transition-all duration-300 hover:scale-110 ring-1 ring-black/5 flex-shrink-0"
                    :title="reg.program?.name || reg.programName">
                    <img
                      :src="getProgramProfileURL(reg.program?.profileURL || reg.programProfileURL, reg.program?.category?.name || reg.program?.category || reg.programCategory, reg.program?.categorySnapshot?.profileURL || reg.program?.category?.profileURL)"
                      class="w-full h-full object-contain p-1.5" />
                  </div>
                  <div
                    v-if="[...new Map(item.enrollments.map(e => [e.programId || e.program?.id, e])).values()].length > 3"
                    class="w-10 h-10 rounded-full border-2 border-white bg-primary text-white flex items-center justify-center text-xs font-bold shadow-md z-20">
                    +{{[...new Map(item.enrollments.map(e => [e.programId || e.program?.id, e])).values()].length - 3
                    }}
                  </div>
                </template>
                <template v-else>
                  <span class="opacity-50"> No Programs </span>
                </template>
              </div>
            </td>

            <!-- Status -->
            <td class="ui-cell text-center">
              <AppBadge :status="item.status || 'Inactive'" />
            </td>

            <!-- Joined -->
            <td class="ui-cell text-center hidden xl:table-cell opacity-50">
              <span class="text-xs font-bold text-content-muted tabular-nums">
                {{ formatDate(item.createdAt || new Date().toISOString()) }}
              </span>
            </td>

            <!-- Action -->
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
                      <button class="ui-dropdown-item ui-dropdown-item-info group"
                        @click="() => { handleAction('edit', item); closeMenu(); }">
                        <img :src="getActionIcon('edit')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                        <span class="font-semibold text-sm">Edit</span>
                      </button>
                      <button class="ui-dropdown-item ui-dropdown-item-info group"
                        @click="() => { handleAction('override', item); closeMenu(); }">
                        <img :src="getActionIcon('view')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                        <span class="font-semibold text-sm">Status Override</span>
                      </button>
                      <div class="h-px bg-surface-light mx-1 my-1"></div>
                      <button class="ui-dropdown-item ui-dropdown-item-danger group font-bold tracking-tighter"
                        @click="() => { handleAction('delete', item); closeMenu(); }">
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

    <!-- Modals -->
    <StudentActionModal :isOpen="actionModal.isOpen" :type="actionModal.type" :student="actionModal.student"
      :selectableParents="parentsList" :loading="modalLoading" :error="modalError" :success="modalSuccess"
      @close="actionModal.isOpen = false; modalError = ''; modalSuccess = ''" @submit="submitActionModal" />

    <ParentActionModal :isOpen="parentActionModal.isOpen" :type="parentActionModal.type"
      :selectableParents="parentsList" :loading="modalLoading" v-model:error="modalError" v-model:success="modalSuccess"
      @close="parentActionModal.isOpen = false; modalError = ''; modalSuccess = ''" @submit="handleRegisterStudent" />
  </DashboardLayout>
</template>

<style scoped>
.toolbar-filter-menu {
  @apply fixed bg-white rounded-md shadow-2xl border border-outline-std z-[10000] p-xs min-w-[240px] max-h-[300px] overflow-y-auto;
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
