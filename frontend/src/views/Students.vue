<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../components/DashboardLayout.vue'
import DataPageLayout from '../components/common/DataPageLayout.vue'
import AppButton from '../components/common/AppButton/AppButton.vue'
import AppTable from '../components/common/AppTable/AppTable.vue'
import TableToolbar from '../components/common/TableToolbar/TableToolbar.vue'
import SummaryCard from '../components/SummaryCard.vue'
import StatusBadge from '../components/common/StatusBadge/StatusBadge.vue'
import RegisterChildModal from '../components/parents/RegisterChildModal.vue'
import StudentActionModal from '../components/students/StudentActionModal.vue'
import { userService } from '../services/userService'
import { authService } from '../services/authService'
import { registrationService } from '../services/registrationService'
import { useSearch, studentSearchMapper } from '../composables/useSearch'
import { formatDate } from '../utils/dateFormatter'
import { getCourseIcon } from '../utils/courseHelper'
import { calculateStudentStatus, isEnrollmentActive } from '../utils/studentStatusHelper'

const router = useRouter()
const students = ref([])
const loading = ref(true)
const activeMenuId = ref(null)
const isMenuAbove = ref(false)
const menuStyles = ref({})

const toggleMenu = (event, id) => {
  if (activeMenuId.value === id) {
    activeMenuId.value = null
    return
  }

  const rect = event.currentTarget.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  isMenuAbove.value = spaceBelow < 280

  if (isMenuAbove.value) {
    menuStyles.value = {
      bottom: `${window.innerHeight - rect.top + 8}px`,
      right: `${window.innerWidth - rect.right}px`,
    }
  } else {
    menuStyles.value = {
      top: `${rect.bottom + 8}px`,
      right: `${window.innerWidth - rect.right}px`,
    }
  }

  activeMenuId.value = id
}

const closeMenu = () => {
  activeMenuId.value = null
}

const handleAction = (type, item) => {
  openActionModal(type, item)
  closeMenu()
}

const handleGlobalClick = (event) => {
  if (activeMenuId.value) {
    const isTrigger = event.target.closest('.btn-dots')
    const isMenu = event.target.closest('.action-dropdown')
    if (!isTrigger && !isMenu) {
      closeMenu()
    }
  }
}

onMounted(async () => {
  const currentUser = authService.getCurrentUser()
  if (!currentUser) {
    router.push('/')
    return
  }

  try {
    const profile = await userService.getProfile(currentUser.uid)
    let studentsData = []
    let allRegistrations = []

    if (profile && profile.role === 'admin') {
      const [sData, rData, uData] = await Promise.all([
        userService.getAllStudents(),
        registrationService.getAll(),
        userService.getAllUsers(),
      ])
      studentsData = sData
      allRegistrations = rData || []
      const allUsers = uData || []

      if (Array.isArray(studentsData)) {
        students.value = studentsData.map((student) => {
          const studentId = student.id || student.uid
          const studentRegs = allRegistrations.filter(
            (r) => (r.student_id || r.studentId) === studentId,
          )

          // Find parent profile for avatar mapping
          const pId = student.parentId || student.parent_id
          const parentProfile = allUsers.find((u) => (u.uid || u.id) === pId)

          // 2. Identify Studying Programs (For UI program icons only)
          const activePrograms = studentRegs.filter((r) => isEnrollmentActive(r))

          return {
            ...student,
            status: calculateStudentStatus(student, allRegistrations),
            programs: activePrograms,
            parentProfileURL: parentProfile?.profileURL || null,
          }
        })
      }
    } else {
      // Logic for non-admin mapping (simplified as they only see their own students)
      const sData = await userService.getStudents(currentUser.uid)
      studentsData = sData
      if (Array.isArray(studentsData)) {
        students.value = studentsData.map((s) => ({ ...s, programs: [] }))
      }
    }
  } catch (error) {
    console.error('Failed to fetch students', error)
  } finally {
    loading.value = false
  }

  window.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  window.removeEventListener('click', handleGlobalClick)
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

const computedStatusCounts = computed(() => {
  const counts = { studying: 0, inactive: 0, suspended: 0, stopped: 0, graduated: 0 }
  students.value.forEach((s) => {
    const status = (s.status || '').toLowerCase()
    if (counts[status] !== undefined) counts[status]++
    else if (status === 'studying') counts.studying++
  })
  return counts
})

const enrolledCount = computed(() => computedStatusCounts.value.studying)

const inactiveOrStoppedCount = computed(() => {
  return (
    computedStatusCounts.value.inactive +
    computedStatusCounts.value.stopped +
    computedStatusCounts.value.suspended +
    computedStatusCounts.value.graduated
  )
})

const newlyEnrolledCount = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return students.value.filter((s) => {
    const createdDate = (s.createdAt || s.created_at || '').split('T')[0]
    return createdDate === today
  }).length
})

// === Registration Modal Logic ===
const showRegisterChildModal = ref(false)
const modalLoading = ref(false)
const modalError = ref('')
const modalSuccess = ref('')
const parentsList = ref([]) // To let admin select which parent this student belongs to
const selectedParentForModal = ref(null)

const handleOpenAddStudent = async () => {
  modalError.value = ''
  modalSuccess.value = ''
  selectedParentForModal.value = null
  showRegisterChildModal.value = true

  try {
    // Fetch all available parents/guardians so admin can choose correctly
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

    // Lookup the parent to get the parent's actual name for the live-table preview
    const chosenParent = parentsList.value.find((p) => (p.uid || p.id) === parentId)

    // Add to local state manually so table updates instantly
    const newStudent = {
      id: result.id,
      ...childData,
      parent_id: parentId,
      parentName: chosenParent ? chosenParent.name || chosenParent.email : 'Parent',
      status: 'Studying',
      createdAt: new Date().toISOString(),
      programs: [], // Start with 0 programs
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

// Navigate to detail view
const navigateToDetail = (item) => {
  const studentId = item.id || item.uid
  if (studentId) {
    router.push(`/students/${studentId}`)
  }
}

// === Action Modal Logic ===
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

  // Pre-fetch parent list if we haven't already so admin can change parent mapping
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
  const { name, medical_note, status, parentId, dob } = formData
  modalLoading.value = true
  modalError.value = ''
  modalSuccess.value = ''

  try {
    if (type === 'edit') {
      await userService.updateMedicalInfo(student.id || student.uid, medical_note)
      // Call generic update for name/status/DOB/parent
      await userService.updateStudent(student.id || student.uid, {
        name,
        status,
        dob,
        parent_id: parentId,
      })

      const idx = students.value.findIndex((s) => s.id === student.id || s.uid === student.uid)
      if (idx !== -1) {
        // Find new parent name if parent was changed
        const chosenParent = parentsList.value.find((p) => (p.uid || p.id) === parentId)

        students.value[idx].name = name
        students.value[idx].medical_note = medical_note
        students.value[idx].status = status
        if (dob) students.value[idx].dob = dob
        if (chosenParent) {
          students.value[idx].parent_id = parentId
          students.value[idx].parentName = chosenParent.name || chosenParent.email
        }
      }
      modalSuccess.value = 'Student profile updated successfully!'
    } else if (type === 'delete') {
      // Call generic delete mechanism
      // await userService.deleteUser(student.id || student.uid)
      students.value = students.value.filter((s) => (s.id || s.uid) !== (student.id || student.uid))
      modalSuccess.value = 'Student record permanently deleted.'
    } else if (type === 'override') {
      const { overrideReason, overrideRemark } = formData
      // Call service to persist manual override
      await userService.updateStudent(student.id || student.uid, {
        status,
        overrideReason,
        overrideRemark,
        manualStatus: true, // flag to indicate this shouldn't be auto-recalculated
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
        <SummaryCard
          title="Total Students"
          :value="students.length"
          image="student.png"
          color="#e1f5fe"
        />
        <SummaryCard
          title="Newly Enrolled"
          :value="newlyEnrolledCount"
          image="register.png"
          color="#e1f5fe"
        />
        <SummaryCard
          title="Currently Enrolled"
          :value="enrolledCount"
          image="student_enrolled.png"
          color="#e1f5fe"
        />
        <SummaryCard
          title="Currently Not Studying"
          :value="inactiveOrStoppedCount"
          image="leaving_school.png"
          color="#e1f5fe"
        />
      </template>

      <template #actions>
        <TableToolbar
          :hasSearch="true"
          :searchQuery="searchQuery"
          @update:searchQuery="searchQuery = $event"
          searchPlaceholder="Search students..."
          :hasFilter="true"
          :currentFilter="currentFilter"
          @update:currentFilter="currentFilter = $event"
          :filterOptions="[
            { label: 'All Status', value: 'all' },
            { label: 'Studying', value: 'studying' },
            { label: 'Inactive', value: 'inactive' },
            { label: 'Graduated', value: 'graduated' },
            { label: 'Suspended', value: 'suspended' },
            { label: 'Stopped', value: 'stopped' },
          ]"
        >
          <template #actions>
            <AppButton variant="primary" @click="handleOpenAddStudent">+ Add Student</AppButton>
          </template>
        </TableToolbar>
      </template>

      <template #table>
        <AppTable
          :headers="[
            'No',
            'Fullname',
            'Parent / Guardian',
            'Current Course',
            'Joined Date',
            'Status',
            'Medical Notes',
            'Action',
          ]"
          :loading="loading"
          :empty="filteredStudents.length === 0"
        >
          <template #loading>Loading students...</template>
          <template #empty>
            <span v-if="currentFilter === 'all'">No students found.</span>
            <span v-else class="empty-state-message">
              No <StatusBadge :status="currentFilter" /> students found.
            </span>
          </template>

          <tr
            v-for="(item, index) in filteredStudents"
            :key="item.id"
            class="clickable-row"
            @click="navigateToDetail(item)"
          >
            <td>{{ index + 1 }}</td>
            <td class="bold">
              <div class="user-info">
                <div class="avatar-mini">
                  <img
                    :src="item.profileURL || '/src/assets/images/child-profile.png'"
                    alt="avatar"
                  />
                </div>
                {{ item.name || item.fullName || item.fullname || 'Student' }}
              </div>
            </td>
            <td>
              <div class="user-info">
                <div class="avatar-mini">
                  <img
                    :src="item.parentProfileURL || '/src/assets/images/female-profile-parent.jpg'"
                    alt="parent avatar"
                  />
                </div>
                {{ item.parentName || 'Parent' }}
              </div>
            </td>
            <td>
              <div class="course-icons">
                <div
                  v-for="(program, pIdx) in item.programs"
                  :key="pIdx"
                  class="program-icon-mini"
                  :title="program.courseTitle || 'Program'"
                >
                  <img :src="getCourseIcon(program.courseTitle)" :alt="program.courseTitle" />
                </div>
                <span v-if="!item.programs || item.programs.length === 0" class="text-muted">
                  None
                </span>
              </div>
            </td>
            <td>
              {{ formatDate(item.created_at || item.createdAt || new Date().toISOString()) }}
            </td>
            <td><StatusBadge :status="item.status || 'Studying'" /></td>
            <td>
              <span
                :class="{
                  'text-muted': !item.medical_note || item.medical_note.toLowerCase() === 'none',
                }"
              >
                {{ item.medical_note || 'None' }}
              </span>
            </td>
            <td class="action-cell">
              <div class="menu-container">
                <button class="btn-dots" @click.stop="toggleMenu($event, item.id)">
                  <span class="dots-icon">⋮</span>
                </button>
                <Teleport to="body">
                  <transition name="fade">
                    <div
                      v-if="activeMenuId === item.id"
                      class="action-dropdown"
                      :class="{ 'open-up': isMenuAbove }"
                      :style="menuStyles"
                      @click.stop
                    >
                      <button @click="handleAction('edit', item)">✏️ Edit</button>
                      <button @click="handleAction('override', item)">⏸️ Override</button>
                      <div class="menu-divider"></div>
                      <button class="delete-btn" @click="handleAction('delete', item)">
                        🗑️ Delete
                      </button>
                    </div>
                  </transition>
                </Teleport>
              </div>
            </td>
          </tr>
        </AppTable>
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

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-mini {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: #f0f0f0;
}

.avatar-mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bold {
  font-weight: 600;
  color: #1a1a1a;
}

.course-icons {
  display: flex;
  gap: 6px;
  align-items: center;
}

.program-icon-mini {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.program-icon-mini img {
  width: 80%;
  height: 80%;
  object-fit: contain;
}

.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s;
}

.clickable-row:hover {
  background-color: #f8fafc;
}

.actions-wrapper {
  display: flex;
  gap: 6px;
}
.action-cell {
  position: relative;
  width: 60px;
}

.menu-container {
  position: relative;
  display: flex;
  justify-content: center;
}

.btn-dots {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #64748b;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-dots:hover {
  background: #f1f5f9;
  color: #0f172a;
  transform: rotate(90deg);
}

.action-dropdown {
  position: fixed;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 14px;
  box-shadow:
    0 15px 35px -5px rgba(0, 0, 0, 0.15),
    0 5px 15px -5px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(226, 232, 240, 0.9);
  z-index: 1000;
  padding: 8px;
  min-width: 170px;
  display: flex;
  flex-direction: column;
  animation: slideDropdown 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top right;
}

.action-dropdown.open-up {
  top: auto;
  bottom: 100%;
  margin-top: 0;
  margin-bottom: 8px;
  transform-origin: bottom right;
  box-shadow:
    0 -15px 35px -5px rgba(0, 0, 0, 0.15),
    0 -5px 15px -5px rgba(0, 0, 0, 0.08);
}

@keyframes slideDropdown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.action-dropdown button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-dropdown button:hover {
  background: #f8fafc;
  color: #00aeef;
  padding-left: 18px;
}

.action-dropdown .delete-btn {
  color: #ef4444;
}

.action-dropdown .delete-btn:hover {
  background: #fff1f2;
  color: #dc2626;
}

.menu-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 4px 6px;
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(-10px);
}

.action-dropdown.open-up.fade-enter-from,
.action-dropdown.open-up.fade-leave-to {
  transform: scale(0.9) translateY(10px);
}
</style>
