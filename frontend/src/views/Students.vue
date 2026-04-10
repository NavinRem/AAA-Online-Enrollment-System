<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
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
import { storageService } from '../services/storageService'
import { useSearch, studentSearchMapper } from '@/composables/useSearch'
import { formatDate, calculateAge } from '@/utils/formatUtils'
import { programService } from '../services/programService'
import {
  getProgramProfileURL,
  getImageUrl,
  getActionIcon,
} from '@/utils/assetHelper'
import { calculateTotalStudent, enrichStudents } from '@/utils/studentHelper'
import { getEnrollmentDisplayStatus } from '@/utils/statusUtils'

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
    const [profile, allTerms] = await Promise.all([
      userService.getProfile(currentUser.uid),
      programService.getAllTerms().catch(() => []),
    ])

    const activeTerm =
      allTerms.find((t) => t.status === 'active') ||
      [...allTerms].sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0]
    const activeTermId = activeTerm?.id || null

    if (profile?.role === 'admin') {
      const [sData, rData, uData] = await Promise.all([
        userService.getAllStudents(),
        enrollmentService.getAllEnrollments(),
        userService.getAllUsers(),
      ])
      students.value = enrichStudents(sData, rData || [], uData || [], activeTermId)
    } else {
      const sData = await userService.getStudentsByParentID(currentUser.uid)
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

const statsCards = computed(() => {
  const s = calculateTotalStudent(students.value)
  return [
    { label: 'Total Students', value: s.total, image: getImageUrl('student/total-student') },
    { label: 'Currently Studying', value: s.studying, image: getImageUrl('student/currently-enrolled') },
    { label: 'Not Enrolled', value: s.inactive, image: getImageUrl('student/currently-not-enrolled') },
    { label: 'Graduated', value: s.graduated, image: getImageUrl('student/graduated') },
  ]
})

const studentHeaders = [
  { label: 'No', width: '60px', class: 'hide-on-mobile', align: 'center' },
  { label: 'Age', class: 'hide-on-mobile', width: '80px', align: 'center' },
  { label: 'Fullname', width: '300px' },
  { label: 'Parent', class: 'hide-on-mobile', width: '300px' },
  { label: 'Program', class: 'hide-on-tablet', width: '150px' },
  { label: 'Medical Note', class: 'hide-on-tablet' },
  { label: 'Status', align: 'center', width: '120px' },
  { label: 'Joined Date', class: 'hide-on-tablet', width: '250px', align: 'center' },
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
    parentsList.value = allUsers.filter((u) => u.role === 'parent' && (u.status || 'Active').toLowerCase() === 'active')
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
    const { parentId, name, dob, profileURL, medicalNote } = formData
    if (!parentId) throw new Error('No parent selected')

    let finalProfile = profileURL
    if (profileURL && profileURL.includes('/profiles/temp/')) {
      const extension = profileURL.split('?')[0].split('.').pop()
      const sanitizedName = (name || 'child').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
      const newPath = `profiles/temp_student/${sanitizedName}_student.${extension}`
      finalProfile = await storageService.moveProfileImage(profileURL, newPath)
    }

    const result = await userService.registerStudentProfile(parentId, {
      name,
      dob,
      profileURL: finalProfile,
      medicalNote,
      status: 'Inactive',
    })

    const chosenParent = parentsList.value.find((p) => (p.uid || p.id) === parentId)

    const newStudent = {
      id: result.id,
      name,
      dob,
      profileURL: finalProfile,
      medicalNote,
      parentId: parentId,
      parentInfo: chosenParent ? {
        id: parentId,
        name: chosenParent.name || chosenParent.email,
        profileURL: chosenParent.profileURL
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
      parentsList.value = allUsers.filter((u) => u.role === 'parent' && (u.status || 'Active').toLowerCase() === 'active')
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
        profileURL: profileURL,
      })

      const idx = students.value.findIndex((s) => s.id === student.id || s.uid === student.uid)
      if (idx !== -1) {
        const chosenParent = parentsList.value.find((p) => (p.uid || p.id) === parentId)

        students.value[idx].name = name
        students.value[idx].medicalNote = medicalNote
        students.value[idx].status = status
        if (dob) students.value[idx].dob = dob
        if (profileURL) students.value[idx].profileURL = profileURL
        if (chosenParent) {
          students.value[idx].parentId = parentId
          students.value[idx].parentInfo = {
            id: parentId,
            name: chosenParent.name || chosenParent.email,
            profileURL: chosenParent.profileURL
          }
        }

        if (parentId) {
          try {
            const parentData = await userService.getProfile(parentId)
            const updatedProfiles = (parentData.studentInfo || []).map(p => {
              if (p.id === (student.id || student.uid)) {
                return {
                  ...p,
                  name: name,
                  dob,
                  profileURL,
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

      await userService.deleteStudent(studentId)

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
      const isStopping = status === 'Stopped'

      await userService.updateStudent(student.id || student.uid, {
        status,
        overrideReason,
        overrideRemark,
        manualStatus: true,
        archived: isStopping,
      })

      if (isStopping && student.parentId) {
        try {
          await userService.updateUser(student.parentId, { status: 'Inactive' })
        } catch (autoErr) {
          console.warn('Auto-deactivation of parent failed', autoErr)
        }
      }

      const idx = students.value.findIndex((s) => s.id === student.id || s.uid === student.uid)
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
    <DataPageLayout overviewTitle="Student Overview">
      <template #overview>
        <DataMetrics :stats="statsCards" />
      </template>

      <template #table>
        <DataTable title="Student List" :headers="studentHeaders" :items="filteredStudents" :loading="loading"
          entityName="student" v-model:searchQuery="searchQuery" searchPlaceholder="Search students..."
          :hasFilter="true" v-model:currentFilter="currentFilter" :filterOptions="[
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

          <template #row="{ item, index, toggleMenu, activeMenuId, isMenuAbove, menuStyles, handleAction, headers }">
            <td :style="{ width: headers[0].width }" :class="headers[0].class" class="text-center">
              {{ index + 1 }}
            </td>
            <td :style="{ width: headers[1].width }" :class="headers[1].class" class="text-center">
              <StatusBadge :status="calculateAge(item.dob)" type="blue" />
            </td>
            <td :style="{ width: headers[2].width }" class="bold" @click="navigateToDetail(item)">
              <div class="identity-cell">
                <div class="avatar-wrapper-mini">
                  <img :src="item.profileURL" alt="avatar" />
                </div>
                <div class="identity-info">
                  <span class="primary-text">{{ item.name }}</span>
                  <span v-if="item.archived" class="archived-tag">Archived</span>
                </div>
              </div>
            </td>
            <td :style="{ width: headers[3].width }" :class="headers[3].class">
              <div class="identity-cell secondary">
                <div class="avatar-wrapper-mini-xs">
                  <img :src="item.parentInfo?.profileURL" alt="parent avatar" />
                </div>
                <div class="identity-info">
                  <span class="primary-text">{{ item.parentInfo?.name }}</span>
                </div>
              </div>
            </td>
            <td :class="headers[4].class" :style="{ width: headers[4].width }">
              <div class="program-icons-stack">
                <template
                  v-if="item.enrollments && item.enrollments.some(r => getEnrollmentDisplayStatus(r) === 'Paid')">
                  <div v-for="(reg, rIdx) in item.enrollments.filter(r => getEnrollmentDisplayStatus(r) === 'Paid')"
                    :key="rIdx" class="program-avatar-mini" :title="reg.programTitle || 'Program'"
                    :style="{ zIndex: item.enrollments.length - rIdx }">
                    <img :src="getProgramProfileURL(reg.programProfileURL || reg.program?.profileURL)" alt="program" />
                  </div>
                </template>
                <div v-else class="text-muted text-xs italic opacity-50">
                  —
                </div>
              </div>
            </td>
            <td :class="headers[5].class">
              <div class="medical-note-cell" :title="item.medicalNote">
                <span v-if="item.medicalNote" class="text-sm text-truncate block-max-200">
                  {{ item.medicalNote }}
                </span>
                <span v-else class="text-muted italic opacity-50">—</span>
              </div>
            </td>
            <td :style="{ width: headers[6].width }" class="text-center">
              <StatusBadge :status="item.status || 'Inactive'" />
            </td>
            <td :style="{ width: headers[7].width }" :class="headers[7].class" class="text-center">
              <span class="text-sm text-muted">{{ formatDate(item.createdAt || new Date().toISOString()) }}</span>
            </td>
            <td :style="{ width: headers[8].width }" class="action-cell text-center">
              <div class="menu-container">
                <button class="btn-dots" @click.stop="toggleMenu($event, item.id)">
                  <span class="dots-icon">⋮</span>
                </button>
                <Teleport to="body">
                  <transition name="fade">
                    <div v-if="activeMenuId === item.id" class="action-dropdown" :class="{ 'open-up': isMenuAbove }"
                      :style="menuStyles" @click.stop>
                      <button class="btn-edit" @click="handleAction('edit', item)" :disabled="item.archived"
                        :class="{ disabled: item.archived }">
                        <img :src="getActionIcon('edit')" class="action-icon-mini" /> Edit Profile
                      </button>
                      <button class="btn-view" @click="handleAction('override', item)" :disabled="item.archived"
                        :class="{ disabled: item.archived }">
                        <img :src="getActionIcon('view')" class="action-icon-mini" /> Override Status
                      </button>
                      <div class="menu-divider"></div>
                      <button class="delete-btn" @click="handleAction('delete', item)">
                        <img :src="getActionIcon('delete')" class="action-icon-mini" /> Delete Record
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
.identity-cell {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.avatar-wrapper-mini {
  width: 40px;
  height: 40px;
  border-radius: var(--border-radius-round);
  overflow: hidden;
  border: 2px solid var(--white);
  box-shadow: var(--shadow-sm);
  background: var(--bg-light);
}

.avatar-wrapper-mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-wrapper-mini-xs {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  border: 1.5px solid var(--white);
  background: var(--bg-light);
  flex-shrink: 0;
}

.avatar-wrapper-mini-xs img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.identity-info {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.primary-text {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--text-dark);
}

.primary-text-sm {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-dark);
}

.secondary-text {
  font-size: var(--text-3xs);
  color: var(--text-muted);
  font-weight: 500;
}

.program-icons-stack {
  display: flex;
  align-items: center;
}

.program-avatar-mini {
  margin-left: -10px;
  width: 28px;
  height: 28px;
  border-radius: var(--border-radius-round);
  overflow: hidden;
  border: 2px solid var(--white);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  background: var(--bg-light);
  transition: transform 0.2s ease;
}

.program-avatar-mini:first-child {
  margin-left: 0;
}

.program-avatar-mini:hover {
  transform: translateY(-2px) scale(1.1);
  z-index: 50 !important;
}

.medical-note-cell {
  max-width: 250px;
}

.text-truncate {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.block-max-200 {
  max-width: 200px;
}

.program-avatar-mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.archived-tag {
  font-size: 10px;
  font-weight: 850;
  text-transform: uppercase;
  color: var(--white);
  background: var(--text-muted);
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  margin-top: 2px;
}

button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(1);
}
</style>
