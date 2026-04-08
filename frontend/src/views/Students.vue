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
import ParentActionModal from '../components/parents/ParentActionModal.vue'
import StudentActionModal from '../components/students/StudentActionModal.vue'
import { userService } from '../services/userService'
import { authService } from '../services/authService'
import { enrollmentService } from '../services/enrollmentService'
import { useSearch, studentSearchMapper } from '@/composables/useSearch'
import { formatDate } from '@/utils/formatUtils'
import {
  getProgramProfileURL,
  getImageUrl,
  getActionIcon,
} from '@/utils/assetHelper'
import { calculateTotalStudent, enrichStudents } from '@/utils/studentHelper'

const router = useRouter()
const students = ref([])
const loading = ref(true)
const newlyCreatedId = ref(null)

const getRowClass = (item) => {
  return newlyCreatedId.value === (item.id || item.uid) ? 'new-row-highlight' : ''
}

const fetchStudents = async () => {
  loading.value = true
  const currentUser = authService.getCurrentUser()
  if (!currentUser) {
    loading.value = false
    return
  }

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
      const sData = await userService.getStudentsByParentID(currentUser.uid)
      students.value = enrichStudents(sData, [], [])
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

const statsCards = computed(() => {
  const s = calculateTotalStudent(students.value)
  return [
    { label: 'Total Students', value: s.total, image: getImageUrl('student/total-student'), color: 'var(--accent-light)' },
    { label: 'Currently Studying', value: s.studying, image: getImageUrl('student/currently-enrolled'), color: 'var(--accent-light)' },
    { label: 'Inactive / Pending', value: s.inactive, image: getImageUrl('student/currently-not-enrolled'), color: 'var(--accent-light)' },
    { label: 'Graduated', value: s.graduated, image: getImageUrl('student/graduated'), color: 'var(--accent-light)' }
  ]
})

const studentHeaders = [
  { label: 'No', width: '80px', class: 'hide-on-mobile', align: 'center' },
  { label: 'Fullname', width: '300px' },
  { label: 'Parent', class: 'hide-on-mobile', width: '220px' },
  { label: 'Current Program', class: 'hide-on-tablet' },
  { label: 'Joined Date', class: 'hide-on-tablet', width: '300px' },
  { label: 'Status', align: 'center', width: '120px' },
  { label: 'Medical Notes', class: 'hide-on-mobile' },
  { label: 'Action', width: '80px', align: 'center' }
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
    const allUsers = await userService.getAllUsers()
    parentsList.value = allUsers.filter((u) => u.role === 'parent')
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
    const { parentId, name, dob, profile, medicalNote } = formData
    if (!parentId) throw new Error('No parent selected')

    // Finalize Profile Image (if temp)
    let finalProfile = profile
    if (profile && profile.includes('/profiles/temp/')) {
      const extension = profile.split('?')[0].split('.').pop()
      const sanitizedName = (name || 'child').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
      const newPath = `profiles/temp_student/${sanitizedName}_student.${extension}`
      finalProfile = await storageService.moveProfileImage(profile, newPath)
    }

    const result = await userService.registerStudentProfile(parentId, {
      name,
      dob,
      profile: finalProfile,
      medicalNote,
      status: 'Inactive',
    })

    const chosenParent = parentsList.value.find((p) => (p.uid || p.id) === parentId)

    const newStudent = {
      id: result.id,
      name,
      dob,
      profile: finalProfile,
      medicalNote,
      parentId: parentId,
      parentInfo: chosenParent ? {
        id: parentId,
        name: chosenParent.name || chosenParent.email,
        profile: chosenParent.profile
      } : null,
      status: 'Inactive',
      created: new Date().toISOString(),
      programs: [],
    }

    students.value.unshift(newStudent)
    newlyCreatedId.value = result.id

    modalSuccess.value = 'Student registered successfully!'
    setTimeout(() => {
      parentActionModal.value.isOpen = false
      modalSuccess.value = ''
    }, 1500)

    // Background Refresh
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
  console.log('Navigating to student detail. Item:', item)
  const studentId = item?.id || item?.uid
  console.log('Selected studentId:', studentId)

  if (studentId === newlyCreatedId.value) {
    newlyCreatedId.value = null
  }

  if (studentId) {
    router.push(`/students/${studentId}`)
  } else {
    console.error('CRITICAL: No student ID found for item during navigation push.')
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
      parentsList.value = allUsers.filter((u) => u.role === 'parent')
    } catch (err) {
      console.warn('Could not load parent options for edit form', err)
    }
  }
}

const submitActionModal = async (formData) => {
  const { type, student } = actionModal.value
  const { name, medicalNote, status, parentId, dob, profileURL } = formData
  modalLoading.value = true
  modalError.value = ''
  modalSuccess.value = ''

  try {
    if (type === 'edit') {
      await userService.updateMedicalInfo(student.id || student.uid, medicalNote)
      await userService.updateStudent(student.id || student.uid, {
        name,
        status,
        dob,
        parentId: parentId,
        profile: profile,
      })

      const idx = students.value.findIndex((s) => s.id === student.id || s.uid === student.uid)
      if (idx !== -1) {
        const chosenParent = parentsList.value.find((p) => (p.uid || p.id) === parentId)

        students.value[idx].name = name
        students.value[idx].medicalNote = medicalNote
        students.value[idx].status = status
        if (dob) students.value[idx].dob = dob
        if (profile) students.value[idx].profile = profile
        if (chosenParent) {
          students.value[idx].parentId = parentId
          students.value[idx].parentInfo = {
            id: parentId,
            name: chosenParent.name || chosenParent.email,
            profile: chosenParent.profile
          }
        }

        // SYNC: Update Student Info in Parent's nested studentProfiles array
        if (parentId) {
          try {
            const parentData = await userService.getProfile(parentId)
            const updatedProfiles = (parentData.studentInfo || []).map(p => {
              if (p.id === (student.id || student.uid)) {
                return {
                  ...p,
                  name: name,
                  dob,
                  profile,
                  medicalNote,
                  status
                }
              }
              return p
            })
            await userService.updateUser(parentId, { studentInfo: updatedProfiles })
          } catch (syncErr) {
            console.warn('Sync to parent failed, but student was updated.', syncErr)
          }
        }
      }
      newlyCreatedId.value = student.id || student.uid
      modalSuccess.value = 'Student profile updated successfully!'
    } else if (type === 'delete') {
      const studentId = student.id || student.uid
      const parentId = student.parentId

      // Actual Delete in Firestore
      await userService.deleteStudent(studentId)

      // SYNC: Remove from Parent's nested list
      if (parentId) {
        try {
          const parentData = await userService.getProfile(parentId)
          const updatedProfiles = (parentData.studentInfo || []).filter(p => p.id !== studentId)
          await userService.updateUser(parentId, { studentInfo: updatedProfiles })
        } catch (syncErr) {
          console.warn('Removal from parent nested list failed.', syncErr)
        }
      }

      students.value = students.value.filter((s) => (s.id || s.uid) !== studentId)
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
      fetchStudents()
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
    <DataPageLayout overviewTitle="Student Overview">
      <template #overview>
        <DataMetrics :stats="statsCards" />
      </template>

      <template #table>
        <DataTable title="Student List" :headers="studentHeaders" :items="filteredStudents" :loading="loading"
          v-model:searchQuery="searchQuery" searchPlaceholder="Search students..." :hasFilter="true"
          v-model:currentFilter="currentFilter" :filterOptions="[
            { label: 'All Status', value: 'all' },
            { label: 'Studying', value: 'studying' },
            { label: 'Inactive', value: 'inactive' },
            { label: 'Graduated', value: 'graduated' },
            { label: 'Suspended', value: 'suspended' },
            { label: 'Stopped', value: 'stopped' },
          ]" :rowClass="getRowClass" @row-click="navigateToDetail"
          @action="({ type, item }) => openActionModal(type, item)">
          <template #toolbar-actions>
            <AppButton variant="primary" @click="handleOpenAddStudent">
              <img :src="getActionIcon('plus')" class="btn-icon-mini reverse-icon" /> Add Student
            </AppButton>
          </template>

          <template #row="{ item, index, toggleMenu, activeMenuId, isMenuAbove, menuStyles, handleAction }">
            <td class="hide-on-mobile text-center">
              {{ index + 1 }}
            </td>
            <td class="bold" @click="navigateToDetail(item)">
              <div class="info-cell">
                <div class="avatar-mini">
                  <img :src="item.profileURL || item.profile" alt="avatar" />
                </div>
                <div class="user-info" @click="navigateToDetail(item)">
                  <span class="user-name">{{ item.name }}</span>
                </div>
              </div>
            </td>
            <td>
              <div class="user-cell">
                <div class="user-avatar-small">
                  <img :src="item.parentInfo?.profileURL || item.parentInfo?.profile" alt="parent avatar" />
                </div>
                {{ item.parentInfo?.name || 'Parent' }}
              </div>
            </td>
            <td class="hide-on-tablet">
              <div class="course-icons">
                <div v-for="(program, pIdx) in item.programs" :key="pIdx" class="program-icon-mini"
                  :title="program.programTitle">
                  <img :src="getProgramProfileURL(program.programProfileURL)" :alt="program.programTitle" />
                </div>
                <span v-if="!item.programs || item.programs.length === 0" class="text-muted">None</span>
              </div>
            </td>
            <td class="hide-on-tablet">{{ formatDate(item.createdAt || new Date().toISOString()) }}</td>
            <td class="text-center">
              <StatusBadge :status="item.status || 'Studying'" />
            </td>
            <td class="hide-on-mobile text-center">
              <span :class="{ 'text-muted': !item.medicalNote || item.medicalNote.toLowerCase() === 'none' }">
                {{ item.medicalNote || 'None' }}
              </span>
            </td>
            <td class="action-cell text-center">
              <div class="menu-container">
                <button class="btn-dots" @click.stop="toggleMenu($event, item.id)">
                  <span class="dots-icon">⋮</span>
                </button>
                <Teleport to="body">
                  <transition name="fade">
                    <div v-if="activeMenuId === item.id" class="action-dropdown" :class="{ 'open-up': isMenuAbove }"
                      :style="menuStyles" @click.stop>
                      <button class="btn-edit" @click="handleAction('edit', item)">
                        <img :src="getActionIcon('edit')" class="action-icon-mini" /> Edit Profile
                      </button>
                      <button class="btn-view" @click="handleAction('override', item)">
                        <img :src="getActionIcon('view')" class="action-icon-mini" /> Override
                      </button>
                      <div class="menu-divider"></div>
                      <button class="delete-btn" @click="handleAction('delete', item)">
                        <img :src="getActionIcon('delete')" class="action-icon-mini" /> Delete
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
      @close="() => { actionModal.isOpen = false; modalError = ''; modalSuccess = ''; }" @submit="submitActionModal" />

    <ParentActionModal :isOpen="parentActionModal.isOpen" :type="parentActionModal.type"
      :selectableParents="parentsList" :loading="modalLoading" v-model:error="modalError" v-model:success="modalSuccess"
      @close="() => { parentActionModal.isOpen = false; modalError = ''; modalSuccess = ''; }"
      @submit="handleRegisterStudent" />
  </DashboardLayout>
</template>

<style scoped>
.text-muted {
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.actions-wrapper {
  display: flex;
  gap: 6px;
}

.user-info {
  cursor: pointer;
  gap: var(--space-sm);
}
</style>
