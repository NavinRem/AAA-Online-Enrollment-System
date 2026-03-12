<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

// UI Components
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import DataMetrics from '../components/common/data/DataMetrics.vue'
import DataTable from '../components/common/data/DataTable.vue'
import StatusBadge from '../components/common/ui/StatusBadge.vue'
import RegisterChildModal from '../components/parents/RegisterChildModal.vue'
import StudentActionModal from '../components/students/StudentActionModal.vue'
import { userService } from '../services/userService'
import { authService } from '../services/authService'
import { enrollmentService } from '../services/enrollmentService'
import { useSearch, studentSearchMapper } from '../composables/useSearch'
import { formatDate } from '../utils/dateFormatter'
import { getCourseIcon } from '../utils/courseHelper'
import { enrichStudents, calculateStudentStats } from '../utils/studentHelper'

import { getImageUrl, getIconUrl } from '@/utils/assetHelper'

const router = useRouter()
const students = ref([])
const loading = ref(true)

onMounted(async () => {
  const currentUser = authService.getCurrentUser()
  if (!currentUser) return router.push('/')

  try {
    const profile = await userService.getProfile(currentUser.uid)
    if (profile?.role === 'admin') {
      const [sData, rData, uData] = await Promise.all([
        userService.getAllStudents(),
        enrollmentService.getAllEnrollments(),
        userService.getAllUsers(),
      ])
      students.value = enrichStudents(sData, rData || [], uData || [])
    } else {
      const sData = await userService.getStudents(currentUser.uid)
      students.value = (sData || []).map(s => ({ ...s, programs: [] }))
    }
  } catch (error) {
    console.error('Failed to fetch students', error)
  } finally {
    loading.value = false
  }
})

const { searchQuery, searchResults } = useSearch(students, studentSearchMapper)

const currentFilter = ref('all')

const filteredStudents = computed(() => {
  let list = searchResults.value
  if (currentFilter.value !== 'all') {
    list = list.filter((s) => (s.status || 'studying').toLowerCase() === currentFilter.value)
  }
  return list
})

const studentStats = computed(() => {
  const s = calculateStudentStats(students.value)
  return [
    { label: 'Total Students', value: s.total, image: getImageUrl('student'), color: '#e1f5fe' },
    { label: 'Active Today', value: s.activeCount, image: getIconUrl('on-time'), color: '#e1f5fe' },
    { label: 'New This Week', value: s.newThisWeekCount, image: getIconUrl('register'), color: '#e1f5fe' },
    { label: 'Pending Payment', value: s.pendingPaymentCount, image: getIconUrl('pending-payment'), color: '#e1f5fe' }
  ]
})

const studentHeaders = [
  { label: 'No', width: '60px', class: 'hide-on-mobile' },
  { label: 'Fullname' },
  { label: 'Parent / Guardian', class: 'hide-on-mobile' },
  { label: 'Current Course', class: 'hide-on-tablet' },
  { label: 'Joined Date', class: 'hide-on-tablet' },
  { label: 'Status' },
  { label: 'Medical Notes', class: 'hide-on-mobile' },
  { label: 'Action', width: '60px' }
]

const showRegisterChildModal = ref(false)
const modalLoading = ref(false)
const modalError = ref('')
const modalSuccess = ref('')
const parentsList = ref([])
const selectedParentForModal = ref(null)

const handleOpenAddStudent = async () => {
  modalError.value = ''
  modalSuccess.value = ''
  selectedParentForModal.value = null
  showRegisterChildModal.value = true

  try {
    const allUsers = await userService.getAllUsers()
    parentsList.value = allUsers.filter((u) => u.role === 'parent' || u.role === 'guardian')
  } catch (err) {
    console.error('Failed to load parents list', err)
    modalError.value = 'Could not load parent options.'
  }
}

const handleRegisterStudent = async (childData) => {
  modalLoading.value = true
  modalError.value = ''
  modalSuccess.value = ''

  try {
    const parentId =
      childData.parentId ||
      (selectedParentForModal.value &&
        (selectedParentForModal.value.uid || selectedParentForModal.value.id))
    if (!parentId) throw new Error('No parent selected')

    const result = await userService.registerStudentProfile(parentId, childData)

    const chosenParent = parentsList.value.find((p) => (p.uid || p.id) === parentId)

    const newStudent = {
      id: result.id,
      ...childData,
      parentId: parentId,
      parentName: chosenParent ? chosenParent.name || chosenParent.email : 'Parent',
      status: 'Studying',
      createdAt: new Date().toISOString(),
      programs: [],
    }

    students.value.unshift(newStudent)

    modalSuccess.value = 'Student registered successfully!'
    setTimeout(() => {
      showRegisterChildModal.value = false
    }, 1500)
  } catch (err) {
    console.error('Failed to register child', err)
    modalError.value = err.message || 'Error creating student account.'
  } finally {
    modalLoading.value = false
  }
}

const navigateToDetail = (item) => {
  const studentId = item?.id || item?.uid
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
      const allUsers = await userService.getAllUsers()
      parentsList.value = allUsers.filter((u) => u.role === 'parent' || u.role === 'guardian')
    } catch (err) {
      console.warn('Could not load parent options for edit form', err)
    }
  }
}

const submitActionModal = async (formData) => {
  const { type, student } = actionModal.value
  const { fullName, name, medicalNote, medical_note, status, parentId, dob } = formData
  modalLoading.value = true
  modalError.value = ''
  modalSuccess.value = ''

  try {
    if (type === 'edit') {
      await userService.updateMedicalInfo(student.id || student.uid, medicalNote || medical_note)
      await userService.updateStudent(student.id || student.uid, {
        name,
        status,
        dob,
        parentId: parentId,
      })

      const idx = students.value.findIndex((s) => s.id === student.id || s.uid === student.uid)
      if (idx !== -1) {
        const chosenParent = parentsList.value.find((p) => (p.uid || p.id) === parentId)

        students.value[idx].fullName = fullName || name
        students.value[idx].medicalNote = medicalNote || medical_note
        students.value[idx].status = status
        if (dob) students.value[idx].dob = dob
        if (chosenParent) {
          students.value[idx].parentId = parentId
          students.value[idx].parentName = chosenParent.name || chosenParent.email
        }
      }
      modalSuccess.value = 'Student profile updated successfully!'
    } else if (type === 'delete') {
      students.value = students.value.filter((s) => (s.id || s.uid) !== (student.id || student.uid))
      modalSuccess.value = 'Student record permanently deleted.'
    } else if (type === 'override') {
      const { overrideReason, overrideRemark } = formData
      await userService.updateStudent(student.id || student.uid, {
        status,
        overrideReason,
        overrideRemark,
        manualStatus: true,
      })

      const idx = students.value.findIndex((s) => s.id === student.id || s.uid === student.uid)
      if (idx !== -1) {
        students.value[idx].status = status
        students.value[idx].overrideReason = overrideReason
        students.value[idx].overrideRemark = overrideRemark
      }
      modalSuccess.value = `Student manually set to ${status} status.`
    }

    setTimeout(() => {
      actionModal.value.isOpen = false
    }, 1500)
  } catch (err) {
    console.error('Failed Action', err)
    modalError.value = err.message || 'Error executing action.'
  } finally {
    modalLoading.value = false
  }
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Student Overview" listTitle="Student List">
      <template #overview>
        <DataMetrics :stats="studentStats" />
      </template>

      <template #table>
        <DataTable
          :headers="studentHeaders"
          :items="filteredStudents"
          :loading="loading"
          v-model:searchQuery="searchQuery"
          searchPlaceholder="Search students..."
          :hasFilter="true"
          v-model:currentFilter="currentFilter"
          :filterOptions="[
            { label: 'All Status', value: 'all' },
            { label: 'Studying', value: 'studying' },
            { label: 'Inactive', value: 'inactive' },
            { label: 'Graduated', value: 'graduated' },
            { label: 'Suspended', value: 'suspended' },
            { label: 'Stopped', value: 'stopped' },
          ]"
          @row-click="navigateToDetail"
          @action="({ type, item }) => openActionModal(type, item)"
        >
          <template #toolbar-actions>
            <AppButton variant="primary" @click="handleOpenAddStudent">+ Add Student</AppButton>
          </template>

          <template #row="{ item, index, toggleMenu, activeMenuId, isMenuAbove, menuStyles, handleAction }">
            <td class="hide-on-mobile">{{ index + 1 }}</td>
            <td class="bold">
              <div class="user-info">
                <div class="avatar-mini">
                  <img :src="item.profileURL || getImageUrl('profiles', 'child-profile.png')" alt="avatar" />
                </div>
                {{ item.fullName || 'Student' }}
              </div>
            </td>
            <td>
              <div class="user-info">
                <div class="avatar-mini">
                  <img :src="item.parentProfileURL || getImageUrl('profiles', 'female-profile-parent.jpg')" alt="parent avatar" />
                </div>
                {{ item.parentName || 'Parent' }}
              </div>
            </td>
            <td class="hide-on-tablet">
              <div class="course-icons">
                <div v-for="(program, pIdx) in item.programs" :key="pIdx" class="program-icon-mini" :title="program.courseTitle || 'Program'">
                  <img :src="getCourseIcon(program.courseTitle)" :alt="program.courseTitle" />
                </div>
                <span v-if="!item.programs || item.programs.length === 0" class="text-muted">None</span>
              </div>
            </td>
            <td class="hide-on-tablet">{{ formatDate(item.createdAt || new Date().toISOString()) }}</td>
            <td><StatusBadge :status="item.status || 'Studying'" /></td>
            <td class="hide-on-mobile">
              <span :class="{ 'text-muted': !item.medicalNote || item.medicalNote.toLowerCase() === 'none' }">
                {{ item.medicalNote || 'None' }}
              </span>
            </td>
            <td class="action-cell">
              <div class="menu-container">
                <button class="btn-dots" @click.stop="toggleMenu($event, item.id)">
                  <span class="dots-icon">⋮</span>
                </button>
                <Teleport to="body">
                  <transition name="fade">
                    <div v-if="activeMenuId === item.id" class="action-dropdown" :class="{ 'open-up': isMenuAbove }" :style="menuStyles" @click.stop>
                      <button @click="handleAction('edit', item)">✏️ Edit</button>
                      <button @click="handleAction('override', item)">⏸️ Override</button>
                      <div class="menu-divider"></div>
                      <button class="delete-btn" @click="handleAction('delete', item)">🗑️ Delete</button>
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
    <StudentActionModal
      :isOpen="actionModal.isOpen"
      :type="actionModal.type"
      :student="actionModal.student"
      :selectableParents="parentsList"
      :loading="modalLoading"
      :error="modalError"
      :success="modalSuccess"
      @close="actionModal.isOpen = false"
      @submit="submitActionModal"
    />

    <RegisterChildModal
      :isOpen="showRegisterChildModal"
      :parent="selectedParentForModal"
      :selectableParents="parentsList"
      :loading="modalLoading"
      :error="modalError"
      :success="modalSuccess"
      @close="showRegisterChildModal = false"
      @submit="handleRegisterStudent"
    />
  </DashboardLayout>
</template>

<style scoped>
.text-muted {
  color: #888;
  font-size: 0.9rem;
}

.actions-wrapper {
  display: flex;
  gap: 6px;
}
</style>
