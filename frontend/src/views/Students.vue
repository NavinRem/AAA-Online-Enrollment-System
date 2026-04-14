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
import { getProgramProfileURL, getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { calculateTotalStudent, enrichStudents } from '@/utils/studentHelper'
import { getEnrollmentDisplayStatus } from '@/utils/statusUtils'

const router = useRouter()
const students = ref([])
const loading = ref(true)
const newlyCreatedId = ref(null)

const getRowClass = (item) => {
  return newlyCreatedId.value === (item.id || item.uid) ? 'ui-row-new' : ''
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
  { label: 'Medical Note', class: 'hidden lg:table-cell' },
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
    const allUsers = await userService.getAllUsers()
    parentsList.value = allUsers.filter(
      (u) => u.role === 'parent' && (u.status || 'Active').toLowerCase() === 'active',
    )
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
      const sanitizedName = (name || 'child')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
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
      parentInfo: chosenParent
        ? {
            id: parentId,
            name: chosenParent.name || chosenParent.email,
            profileURL: chosenParent.profileURL,
          }
        : null,
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
      const allUsers = await userService.getAllUsers()
      parentsList.value = allUsers.filter(
        (u) => u.role === 'parent' && (u.status || 'Active').toLowerCase() === 'active',
      )
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
            profileURL: chosenParent.profileURL,
          }
        }

        if (parentId) {
          try {
            const parentData = await userService.getProfile(parentId)
            const updatedProfiles = (parentData.studentInfo || []).map((p) => {
              if (p.id === (student.id || student.uid)) {
                return {
                  ...p,
                  name: name,
                  dob,
                  profileURL,
                  medicalNote,
                  status,
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
          const updatedProfiles = (parentData.studentInfo || []).filter((p) => p.id !== studentId)
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
        <DataTable
          title="Student List"
          :headers="studentHeaders"
          :items="filteredStudents"
          :loading="loading"
          entityName="student"
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
          :rowClass="getRowClass"
          @row-click="navigateToDetail"
          @action="({ type, item }) => openActionModal(type, item)"
        >
          <template #toolbar-actions>
            <AppButton variant="primary" size="md" class="!rounded-std shadow-sm" @click="handleOpenAddStudent">
              <img :src="getActionIcon('plus')" class="w-3.5 h-3.5 brightness-0 invert mt-px" />
              <span class="font-bold">New Student</span>
            </AppButton>
          </template>

          <template
            #row="{
              item,
              index,
              toggleMenu,
              activeMenuId,
              isMenuAbove,
              menuStyles,
              handleAction,
              closeMenu,
              headers,
            }"
          >
            <td
              :style="{ width: headers[0].width }"
              class="ui-cell text-center font-bold text-content-muted/50 hidden md:table-cell"
            >
              {{ index + 1 }}
            </td>
            <td
              :style="{ width: headers[1].width }"
              class="ui-cell text-center hidden md:table-cell"
            >
              <StatusBadge :status="calculateAge(item.dob)" type="blue" />
            </td>
            <td
              :style="{ flex: '1 1 0%', minWidth: 0 }"
              class="ui-cell"
              @click="navigateToDetail(item)"
            >
              <div class="ui-identity-cell">
                <div class="ui-avatar ring-primary/10 transition-shadow group-hover:ring-4">
                  <img :src="item.profileURL" alt="avatar" />
                </div>
                <div class="ui-identity-info">
                  <span
                    class="font-bold text-content-dark group-hover:text-primary transition-colors"
                    >{{ item.name }}</span
                  >
                  <span
                    v-if="item.archived"
                    class="text-2xs font-black uppercase text-error tracking-widest mt-0.5"
                    >Archived</span
                  >
                  <span
                    v-else
                    class="text-3xs text-content-muted uppercase tracking-wider font-semibold"
                    >Student</span
                  >
                </div>
              </div>
            </td>
            <td :style="{ flex: '1 1 0%', minWidth: 0 }" class="ui-cell hidden md:table-cell">
              <div class="ui-identity-cell opacity-80 group-hover:opacity-100 transition-opacity">
                <div class="ui-avatar-sm ring-1 ring-border">
                  <img :src="item.parentInfo?.profileURL" alt="parent avatar" />
                </div>
                <div class="ui-identity-info">
                  <span class="font-semibold text-xs text-content-dark">{{
                    item.parentInfo?.name
                  }}</span>
                  <span class="text-3xs text-content-muted uppercase font-bold tracking-tight"
                    >Parent</span
                  >
                </div>
              </div>
            </td>
            <td class="ui-cell hidden lg:table-cell" :style="{ width: headers[4].width }">
              <div class="ui-avatar-stack">
                <template
                  v-if="
                    item.enrollments &&
                    item.enrollments.some((r) => getEnrollmentDisplayStatus(r) === 'Paid')
                  "
                >
                  <div
                    v-for="(reg, rIdx) in item.enrollments.filter(
                      (r) => getEnrollmentDisplayStatus(r) === 'Paid',
                    )"
                    :key="rIdx"
                    class="ui-stack-item border-primary/20"
                    :title="reg.programTitle || 'Program'"
                    :style="{ zIndex: item.enrollments.length - rIdx }"
                  >
                    <img
                      :src="getProgramProfileURL(reg.programProfileURL || reg.program?.profileURL)"
                      alt="program"
                    />
                  </div>
                </template>
                <div v-else class="text-content-muted text-xs italic opacity-40">—</div>
              </div>
            </td>
            <td class="ui-cell hidden lg:table-cell" :style="{ flex: '1 1 0%', minWidth: 0 }">
              <div class="max-w-[200px]" :title="item.medicalNote">
                <span
                  v-if="item.medicalNote"
                  class="text-xs text-content-muted font-medium truncate block"
                >
                  {{ item.medicalNote }}
                </span>
                <span v-else class="text-content-muted italic opacity-40 text-xs">—</span>
              </div>
            </td>
            <td :style="{ width: headers[6].width }" class="ui-cell text-center">
              <StatusBadge :status="item.status || 'Inactive'" />
            </td>
            <td
              :style="{ width: headers[7].width }"
              class="ui-cell text-center hidden lg:table-cell"
            >
              <span class="text-xs font-bold text-content-muted/70 tracking-tight">{{
                formatDate(item.createdAt || new Date().toISOString())
              }}</span>
            </td>
            <td :style="{ width: headers[8].width }" class="ui-cell text-center">
              <div class="ui-action-menu">
                <button class="ui-btn-dots" @click.stop="toggleMenu($event, item.id)">
                  <span class="font-bold">⋮</span>
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
                        class="ui-dropdown-item ui-dropdown-item-info group"
                        @click="
                          () => {
                            handleAction('edit', item)
                            closeMenu()
                          }
                        "
                        :disabled="item.archived"
                        :class="{ 'opacity-50 cursor-not-allowed': item.archived }"
                      >
                        <img
                          :src="getActionIcon('edit')"
                          class="w-4 h-4 transition-opacity" :style="{ filter: getStatusFilter('blue') }"
                        />
                        Edit Profile
                      </button>
                      <button
                        class="ui-dropdown-item ui-dropdown-item-info group"
                        @click="
                          () => {
                            handleAction('override', item)
                            closeMenu()
                          }
                        "
                        :disabled="item.archived"
                        :class="{ 'opacity-50 cursor-not-allowed': item.archived }"
                      >
                        <img
                          :src="getActionIcon('view')"
                          class="w-4 h-4 transition-opacity" :style="{ filter: getStatusFilter('blue') }"
                        />
                        Override Status
                      </button>
                      <div class="h-px bg-surface-light mx-1 my-1"></div>
                      <button
                        class="ui-dropdown-item ui-dropdown-item-danger group font-bold"
                        @click="handleAction('delete', item)"
                      >
                        <img
                          :src="getActionIcon('delete')"
                          class="w-4 h-4 transition-opacity" :style="{ filter: getStatusFilter('red') }"
                        />
                        Delete Record
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
    <StudentActionModal
      :isOpen="actionModal.isOpen"
      :type="actionModal.type"
      :student="actionModal.student"
      :selectableParents="parentsList"
      :loading="modalLoading"
      :error="modalError"
      :success="modalSuccess"
      @close="
        () => {
          actionModal.isOpen = false
          modalError = ''
          modalSuccess = ''
        }
      "
      @submit="submitActionModal"
    />

    <ParentActionModal
      :isOpen="parentActionModal.isOpen"
      :type="parentActionModal.type"
      :selectableParents="parentsList"
      :loading="modalLoading"
      v-model:error="modalError"
      v-model:success="modalSuccess"
      @close="
        () => {
          parentActionModal.isOpen = false
          modalError = ''
          modalSuccess = ''
        }
      "
      @submit="handleRegisterStudent"
    />
  </DashboardLayout>
</template>
