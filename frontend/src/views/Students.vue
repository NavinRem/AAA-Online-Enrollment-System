<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import DataMetrics from '../components/common/data/DataMetrics.vue'
import DataTable from '../components/common/data/DataTable.vue'
import AppBadge from '../components/common/ui/AppBadge.vue'
import ParentActionModal from '../components/parents/ParentActionModal.vue'
import StudentActionModal from '../components/students/StudentActionModal.vue'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'
import { useAuthStore } from '@/stores/auth'
import { studentService } from '../services/studentService'
import { parentService } from '../services/parentService'
import { enrollmentService } from '../services/enrollmentService'
import { storageService } from '../services/storageService'
import { useSearch, studentSearchMapper } from '@/composables/useSearch'
import { formatDate, calculateAge } from '@/utils/formatUtils'
import { getProgramProfileURL } from '@/utils/assetHelper'
import { programService } from '../services/programService'
import { termService } from '../services/termService'
import {
  calculateTotalStudent,
  enrichStudents,
  processStudentProfileImage,
  prepareStudentPayload,
} from '@/utils/studentHelper'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'

const router = useRouter()
const authStore = useAuthStore()
const students = ref([])
const loading = ref(true)
const newlyCreatedId = ref(null)

const getRowClass = (item) => {
  return newlyCreatedId.value === item.id ? 'ui-row-new' : ''
}

const fetchStudents = async () => {
  loading.value = true

  if (!authStore.isAuthenticated) {
    loading.value = false
    return
  }

  try {
    const allTerms = await termService.getAllTerms().catch(() => [])

    const activeTerm =
      allTerms.find((t) => t.status === 'active') ||
      [...allTerms].sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0]
    const activeTermId = activeTerm?.id || null

    if (authStore.isAdmin) {
      const [sData, rData, pData] = await Promise.all([
        studentService.getAllStudents(),
        enrollmentService.getAllEnrollments(),
        parentService.getAllParents(),
      ])
      students.value = enrichStudents(sData, rData || [], pData || [], activeTermId)
    } else {
      const sData = await studentService.getStudentsByParent(authStore.user.uid)
      students.value = enrichStudents(sData, [], [], activeTermId)
    }
  } catch (error) {
    console.error('Failed to fetch students', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStudents()
})

const { searchQuery, searchResults } = useSearch(students, studentSearchMapper)

const currentFilter = ref('all')

const filteredStudents = computed(() => {
  let list = searchResults.value
  if (currentFilter.value !== 'all') {
    list = list.filter((s) => (s.status || 'studying').toLowerCase() === currentFilter.value)
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

watch([currentFilter, searchQuery], () => {
  currentPage.value = 1
})

const statsCards = computed(() => {
  const s = calculateTotalStudent(students.value)
  return [
    { label: 'Total Students', value: s.total, image: getImageUrl('student/total-student') },
    {
      label: 'Currently Studying',
      value: s.studying,
      image: getImageUrl('student/currently-enrolled'),
    },
    {
      label: 'Not Enrolled',
      value: s.inactive,
      image: getImageUrl('student/currently-not-enrolled'),
    },
    { label: 'Graduated', value: s.graduated, image: getImageUrl('student/graduated') },
  ]
})

const studentHeaders = [
  { label: 'No', width: '60px', class: 'hidden md:table-cell', align: 'center' },
  { label: 'Age', class: 'hidden md:table-cell', width: '80px', align: 'center' },
  { label: 'Fullname' },
  { label: 'Parent', class: 'hidden md:table-cell' },
  { label: 'Program', class: 'hidden lg:table-cell', width: '150px' },
  { label: 'Status', align: 'center', width: '120px' },
  { label: 'Joined Date', class: 'hidden lg:table-cell', width: '150px', align: 'center' },
  { label: 'Action', width: '80px', align: 'center' },
]

const parentActionModal = ref({
  isOpen: false,
  type: 'register-child',
})
const modalLoading = ref(false)
const modalError = ref('')
const modalSuccess = ref('')
const parentsList = ref([])

const handleOpenAddStudent = async () => {
  modalError.value = ''
  modalSuccess.value = ''
  parentActionModal.value.isOpen = true
  parentActionModal.value.type = 'plus'

  try {
    parentsList.value = await parentService.getAllParents()
  } catch (err) {
    console.error('Failed to load parents list', err)
    modalError.value = 'Could not load parent options.'
  }
}

const handleRegisterStudent = async (formData) => {
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

  if (parentsList.value.length === 0) {
    try {
      parentsList.value = await parentService.getAllParents()
    } catch (err) {
      console.warn('Could not load parent options for edit form', err)
    }
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
      const studentId = student.id
      const parentId = student.parentId

      await studentService.deleteStudent(studentId)
      students.value = students.value.filter((s) => s.id !== studentId)
      modalSuccess.value = 'Student record permanently deleted.'
    } else if (type === 'override') {
      const { overrideReason, overrideRemark } = formData
      const isStopping = status === 'Stopped'

      await studentService.updateStudent(student.id, {
        status,
        overrideReason,
        overrideRemark,
        manualStatus: true,
        archived: isStopping,
      })

      if (isStopping && student.parentId) {
        try {
          await parentService.updateParent(student.parentId, { status: 'Inactive' })
        } catch (autoErr) {
          console.warn('Auto-deactivation of parent failed', autoErr)
        }
      }

      const idx = students.value.findIndex((s) => s.id === student.id)
      if (idx !== -1) {
        students.value[idx].status = status
        students.value[idx].overrideReason = overrideReason
        students.value[idx].overrideRemark = overrideRemark
        if (isStopping) students.value[idx].archived = true
      }
      modalSuccess.value = `Student manually set to ${status} status.${isStopping ? ' Parent account deactivated.' : ''}`
    }

    setTimeout(() => {
      actionModal.value.isOpen = false
      fetchStudents()
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
    <DataPageLayout overviewTitle="Student Repository">
      <template #overview>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DataMetricCard v-for="stat in statsCards" :key="stat.label" v-bind="stat" />
        </div>
      </template>

      <template #table>
        <DataTable title="Active Students" :headers="studentHeaders" :items="paginatedStudents" :loading="loading"
          entityName="student" :flexible="true" v-model:searchQuery="searchQuery"
          searchPlaceholder="Search by name or ID..." :hasFilter="true" v-model:currentFilter="currentFilter"
          :filterOptions="[
            { label: 'All Students', value: 'all' },
            { label: 'Studying', value: 'studying' },
            { label: 'Inactive', value: 'inactive' },
            { label: 'Graduated', value: 'graduated' },
            { label: 'Suspended', value: 'suspended' },
            { label: 'Stopped', value: 'stopped' },
          ]" :rowClass="getRowClass" :hasPagination="true" :totalItems="totalItems" :pageSize="pageSize"
          v-model:currentPage="currentPage" @row-click="navigateToDetail"
          @action="({ type, item }) => openActionModal(type, item)">
          <template #toolbar-actions>
            <AppButton variant="primary" size="md" class="rounded-xl shadow-lg shadow-primary/20"
              @click="handleOpenAddStudent">
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
              <span class="font-black">Enroll New Student</span>
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
            <!-- No -->
            <td class="ui-cell text-center font-bold text-content-muted/30 hidden md:table-cell">
              {{ (currentPage - 1) * pageSize + index + 1 }}
            </td>

            <!-- Age -->
            <td class="ui-cell text-center hidden md:table-cell">
              <span
                class="px-2.5 py-1 rounded-full bg-surface-subtle border border-outline-std text-[10px] font-black text-content-muted uppercase">
                {{ calculateAge(item.dob) }} YRS
              </span>
            </td>

            <!-- Identity -->
            <td class="ui-cell min-w-[200px]" @click="navigateToDetail(item)">
              <div class="flex items-center gap-4 group cursor-pointer">
                <div class="relative">
                  <div
                    class="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-primary/5 group-hover:ring-primary/20 transition-all duration-300 shadow-sm">
                    <img :src="item.profileURL" alt="avatar" class="w-full h-full object-cover" />
                  </div>
                  <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
                    :class="item.status === 'Studying' ? 'bg-success' : 'bg-content-muted'"></div>
                </div>
                <div class="flex flex-col">
                  <span
                    class="font-black text-content-dark group-hover:text-primary transition-colors tracking-tight text-base">{{
                      item.name }}</span>
                  <span class="text-[10px] font-black text-content-muted uppercase tracking-widest">{{ item.id.slice(-6)
                    }}</span>
                </div>
              </div>
            </td>

            <!-- Parent -->
            <td class="ui-cell hidden md:table-cell">
              <div class="flex items-center gap-3 opacity-70 group-hover:opacity-100 transition-opacity">
                <div class="w-8 h-8 rounded-lg overflow-hidden border border-outline-std">
                  <img :src="item.parentInfo?.profileURL" alt="parent" class="w-full h-full object-cover" />
                </div>
                <div class="flex flex-col">
                  <span class="text-xs font-bold text-content-dark">{{ item.parentInfo?.name || 'Unlinked' }}</span>
                  <span class="text-[9px] font-black text-content-muted uppercase tracking-tighter">Primary
                    Contact</span>
                </div>
              </div>
            </td>

            <!-- Programs -->
            <td class="ui-cell hidden lg:table-cell">
              <div class="flex -space-x-2">
                <template v-if="item.enrollments?.length">
                  <div v-for="(reg, rIdx) in item.enrollments.slice(0, 3)" :key="rIdx"
                    class="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-sm hover:z-10 transition-transform hover:scale-110"
                    :title="reg.programName">
                    <img :src="getProgramProfileURL(reg.program?.profileURL)" class="w-full h-full object-cover" />
                  </div>
                  <div v-if="item.enrollments.length > 3"
                    class="w-8 h-8 rounded-full border-2 border-white bg-surface-subtle flex items-center justify-center text-[10px] font-black text-content-muted">
                    +{{ item.enrollments.length - 3 }}
                  </div>
                </template>
                <span v-else class="text-[10px] font-bold text-content-muted/40 uppercase italic tracking-widest">— No
                  Programs —</span>
              </div>
            </td>

            <!-- Status -->
            <td class="ui-cell text-center">
              <AppBadge :status="item.status || 'Inactive'" />
            </td>

            <!-- Joined -->
            <td class="ui-cell text-center hidden lg:table-cell">
              <span class="text-[11px] font-bold text-content-muted/60 tabular-nums">
                {{ formatDate(item.createdAt || new Date().toISOString()) }}
              </span>
            </td>

            <!-- Action -->
            <td class="ui-cell text-center">
              <div class="relative">
                <button @click.stop="toggleMenu($event, item.id)"
                  class="p-2 hover:bg-surface-subtle rounded-lg transition-colors group">
                  <span class="font-black text-content-muted group-hover:text-primary">⋮</span>
                </button>
                <Teleport to="body">
                  <transition enter-active-class="transition duration-200 ease-out"
                    enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100"
                    leave-to-class="opacity-0">
                    <div v-if="activeMenuId === item.id" class="ui-dropdown-menu"
                      :class="{ 'origin-bottom': isMenuAbove, 'origin-top': !isMenuAbove }" :style="menuStyles"
                      @click.stop>
                      <button class="ui-dropdown-item group" @click="handleAction('edit', item); closeMenu()">
                        <img :src="getActionIcon('edit')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                        <span class="font-bold text-sm">Edit Student</span>
                      </button>
                      <button class="ui-dropdown-item group" @click="handleAction('override', item); closeMenu()">
                        <img :src="getActionIcon('view')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                        <span class="font-bold text-sm">Status Override</span>
                      </button>
                      <div class="h-px bg-surface-subtle mx-2 my-1"></div>
                      <button class="ui-dropdown-item group text-error"
                        @click="handleAction('delete', item); closeMenu()">
                        <img :src="getActionIcon('delete')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity invert" />
                        <span class="font-black text-sm">Purge Record</span>
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
