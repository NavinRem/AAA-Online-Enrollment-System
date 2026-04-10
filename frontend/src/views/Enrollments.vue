<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import DataMetrics from '../components/common/data/DataMetrics.vue'
import DataTable from '../components/common/data/DataTable.vue'
import StatusBadge from '../components/common/ui/StatusBadge.vue'
import EnrollmentFormModal from '../components/enrollments/EnrollmentFormModal.vue'
import EnrollmentActionModal from '../components/enrollments/EnrollmentActionModal.vue'
import { enrollmentService } from '@/services/enrollmentService'
import { userService } from '../services/userService'
import { programService } from '../services/programService'
import ParentActionModal from '../components/parents/ParentActionModal.vue'
import { storageService } from '@/services/storageService'
import { useSearch, enrollmentSearchMapper } from '../composables/useSearch'
import {
  calculateTotalEnrollment,
  enrichEnrollments,
} from '../utils/enrollmentHelper'
import { getSessionDay, getSessionTime } from '@/utils/sessionHelper'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { isPaid, isUnpaid, isCancelled } from '@/utils/statusUtils'
import { formatPrice, formatDate } from '@/utils/formatUtils'

const enrollments = ref([])
const parents = ref([])
const students = ref([])
const programs = ref([])
const classes = ref([])

const loading = ref(true)
const showModal = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const validationHint = ref('')
const newlyCreatedId = ref(null)
const selectedEnrollment = ref(null)
const enrollmentForm = ref(null)
const childRegistrationModal = ref({
  isOpen: false,
  parent: null,
  loading: false,
  error: '',
  success: '',
})

const getRowClass = (item) => {
  return newlyCreatedId.value === item.id ? 'new-row-highlight' : ''
}

onMounted(async () => {
  try {
    loading.value = true
    await Promise.all([
      fetchEnrollments(),
      loadFormData()
    ])
    console.log('Enrollments loaded:', enrollments.value.length)
  } catch (error) {
    console.error('Initial data load failed', error)
  } finally {
    loading.value = false
  }
})

const fetchEnrollments = async () => {
  try {
    loading.value = true
    const data = await enrollmentService.getAllEnrollments()
    enrollments.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch enrollments', error)
  } finally {
    loading.value = false
  }
}

const loadFormData = async () => {
  try {
    const [usersRes, programsRes, studentsRes, classesRes] = await Promise.all([
      userService.getAllUsers(),
      programService.getAllPrograms(),
      userService.getAllStudents(),
      programService.getAllClasses(),
    ])
    parents.value = Array.isArray(usersRes)
      ? usersRes.filter((u) => u.role === 'parent' && (u.status || 'Active').toLowerCase() === 'active')
      : []
    programs.value = Array.isArray(programsRes) ? programsRes : []
    students.value = Array.isArray(studentsRes) ? studentsRes : []
    classes.value = Array.isArray(classesRes) ? classesRes : []
  } catch (err) {
    console.error('Failed to load form data', err)
  }
}

const handleProgramChange = async (programId) => {
  if (!programId) {
    classes.value = []
    return
  }
  try {
    const data = await programService.getClasses(programId)
    classes.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Failed to load classes', err)
  }
}


let hintTimeout = null
const setValidationHint = (msg) => {
  validationHint.value = msg
  if (hintTimeout) clearTimeout(hintTimeout)
  hintTimeout = setTimeout(() => {
    validationHint.value = ''
  }, 4000)
}

const handleSaveEnrollment = async (formData) => {
  submitting.value = true
  errorMessage.value = ''
  try {
    const parent = parents.value.find((p) => (p.uid || p.id) === formData.parentId)
    const student = students.value.find((s) => s.id === formData.studentId)
    const program = programs.value.find((c) => c.id === formData.programId || c.id === formData.courseId)
    const classInstance = classes.value.find((c) => c.id === formData.classId)


    const payload = {
      parentId: parent.uid || parent.id,
      studentId: student.id,
      programId: program.id,
      classId: classInstance.id,

      parent: {
        id: parent.uid || parent.id,
        name: parent.name || parent.email || 'Parent',
        profile: parent.profile || null
      },
      student: {
        id: student.id,
        name: student.name || student.fullName || student.fullname || 'Student',
        profile: student.profile || student.profileURL || student.childProfileURL || null
      },
      program: {
        id: program.id,
        title: program.title || program.name || 'Program',
        profile: program.profile || null
      },
      class: {
        id: classInstance.id,
        schedule: classInstance.day + ' ' + classInstance.timeslot
      },
      classSchedule: classInstance.day + ' ' + classInstance.timeslot,

      amount: formData.amount,
      discountAmount: formData.discountAmount || 0,
      isSponsorship: formData.isSponsorship || false,
      sponsorName: formData.sponsorName || '',
      isProrated: formData.isProrated,
      enrollmentType: formData.enrollmentType || 'Full',
      remark: formData.remark || '',
      basePrice: formData.basePrice || 0,
      totalSessions: formData.totalSessions || 0,
      remainingSessions: formData.remainingSessions || 0,
      passedSessions: formData.passedSessions || 0,
      prorateSavings: formData.prorateSavings || 0,
      ...(!formData.id ? {
        status: 'unpaid',
        paymentStatus: 'unpaid',
        enrollAt: new Date().toISOString(),
      } : {})
    }

    if (formData.id) {
      await enrollmentService.updateEnrollment(formData.id, payload)
      successMessage.value = 'Successfully updated enrollment!'
    } else {
      const result = await enrollmentService.createEnrollment(payload)
      successMessage.value = 'Successfully created enrollment!'
      newlyCreatedId.value = result.id || result.UID
    }

    await fetchEnrollments()

    setTimeout(() => {
      showModal.value = false
      selectedEnrollment.value = null
      successMessage.value = ''
    }, 1500)
  } catch (err) {
    errorMessage.value = err.message || 'Failed to save enrollment.'
  } finally {
    submitting.value = false
  }
}

// Status helpers imported from @/utils/statusHelper

const enrollmentStats = computed(() => {
  const s = calculateTotalEnrollment(enrollments.value)
  return [
    { label: 'Total Enrollments', value: s.total, image: getImageUrl('enrollment/total-enrollment'), color: 'var(--accent-light)' },
    { label: 'Total Paid Enrollment', value: s.paidCount, image: getImageUrl('enrollment/total-paid-enrollment'), color: 'var(--accent-light)' },
    { label: 'Total Unpaid Enrollment', value: s.unpaidCount, image: getImageUrl('enrollment/total-unpaid-enrollment'), color: 'var(--accent-light)' },
    { label: 'Total Cancelled Enrollment', value: s.cancelledCount, image: getImageUrl('enrollment/total-canceled-enrollment'), color: 'var(--accent-light)' },
    { label: 'Today Enrollments', value: s.todayCount, image: getImageUrl('enrollment/today-enrollment'), color: 'var(--accent-light)' }
  ]
})

const enrollmentHeaders = [
  { label: 'No', width: '40px', align: 'center' },
  { label: 'Parent', width: '160px' },
  { label: 'Student', width: '160px' },
  { label: 'Program', width: '200px' },
  { label: 'Schedule', width: '160px' },
  { label: 'Branch', width: '70px', align: 'center' },
  { label: 'Method', width: '100px', align: 'center', sortable: true, key: 'paymentMethod' },
  { label: 'Amount', width: '100px', align: 'center', sortable: true, key: 'amount' },
  { label: 'Status', width: '90px', align: 'center' },
  { label: 'Enrolled Date', width: '120px', align: 'center' },
  { label: 'Action', width: '70px', align: 'center' }
]

const currentFilter = ref('all')

const statusFilteredEnrollments = computed(() => {
  const enriched = enrichEnrollments(enrollments.value, parents.value, students.value, programs.value, classes.value)


  let filtered = enriched
  if (currentFilter.value !== 'all') {
    filtered = enriched.filter(r => {
      if (currentFilter.value === 'paid') return isPaid(r.paymentStatus) && !isCancelled(r.status)
      if (currentFilter.value === 'unpaid') return isUnpaid(r.paymentStatus) && !isCancelled(r.status)
      if (currentFilter.value === 'cancelled') return isCancelled(r.status)
      if (currentFilter.value === 'full') return (r.enrollmentType || 'Full').toLowerCase() === 'full'
      if (currentFilter.value === 'partial') return (r.enrollmentType || 'Full').toLowerCase() === 'partial'
      return true
    })
  }

  return filtered.sort((a, b) => new Date(b.enrollAt || 0) - new Date(a.enrollAt || 0))
})

const { searchQuery, searchResults: filteredEnrollments } = useSearch(
  statusFilteredEnrollments,
  enrollmentSearchMapper,
)

const currentPage = ref(1)
const pageSize = 10
const totalItems = computed(() => filteredEnrollments.value.length)

const paginatedEnrollments = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredEnrollments.value.slice(start, end)
})

watch([currentFilter, searchQuery], () => {
  currentPage.value = 1
})

const actionState = ref({
  isOpen: false,
  type: '',
  enrollment: null,
})



const handleTableAction = ({ type, item }) => {
  errorMessage.value = ''
  successMessage.value = ''

  if (type === 'edit') {
    selectedEnrollment.value = item
    showModal.value = true
    return
  }

  actionState.value = {
    isOpen: true,
    type,
    enrollment: item,
  }
}

const submitActionModal = async (payload) => {
  const { type, enrollment } = actionState.value
  const { reason } = payload
  submitting.value = true
  try {
    if (type === 'pay') {
      const { bankName, paymentMethod: methodType, proof, proofURL, remark } = payload

      // Construct payment info
      const updateData = {
        paymentStatus: 'paid',
        status: 'confirmed', // Auto-confirm when paid
        paymentMethod: methodType === 'cash' ? 'Cash' : (bankName || 'Online'),
        transactionId: proof,
        paymentProofURL: proofURL || '',
        paidAt: new Date().toISOString(),
        remark: remark?.trim() || ''
      }

      await enrollmentService.updateEnrollment(enrollment.id, updateData)
    } else if (type === 'cancel') {
      await enrollmentService.updateEnrollment(enrollment.id, { status: 'cancelled', cancelReason: reason })
    } else if (type === 'delete') {
      await enrollmentService.deleteEnrollment(enrollment.id)
    }
    const messages = {
      pay: 'Payment confirmed successfully!',
      cancel: 'Enrollment has been cancelled.',
      delete: 'Enrollment record deleted permanently.'
    }
    successMessage.value = messages[type] || 'Action completed successfully.'
    await fetchEnrollments()
    setTimeout(() => {
      closeActionModal()
    }, 2000)
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    submitting.value = false
  }
}

const closeActionModal = () => {
  actionState.value.isOpen = false
  errorMessage.value = ''
  successMessage.value = ''
}

const handleOpenRegisterStudent = (parentId) => {
  const parent = parents.value.find(p => (p.uid || p.id) === parentId)
  if (!parent) return

  childRegistrationModal.value = {
    isOpen: true,
    parent: parent,
    loading: false,
    error: '',
    success: '',
  }
}

const handleRegisterStudent = async (formData) => {
  childRegistrationModal.value.loading = true
  childRegistrationModal.value.error = ''
  childRegistrationModal.value.success = ''

  try {
    const { parentId, name, dob, profile, medicalNote } = formData

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

    childRegistrationModal.value.success = 'Student registered successfully!'

    // Refresh student list
    const studentsRes = await userService.getAllStudents()
    students.value = Array.isArray(studentsRes) ? studentsRes : []

    // Map new student if possible
    if (result && result.id && enrollmentForm.value) {
      enrollmentForm.value.setStudent(result.id)
    }

    setTimeout(() => {
      childRegistrationModal.value.isOpen = false
    }, 1500)
  } catch (err) {
    console.error('Failed to register student', err)
    childRegistrationModal.value.error = err.message || 'Error registering student.'
  } finally {
    childRegistrationModal.value.loading = false
  }
}

// UI Helpers
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Enrollment Overview">
      <template #overview>
        <DataMetrics :stats="enrollmentStats" />
      </template>

      <template #table>
        <DataTable title="Enrollment Lists" :headers="enrollmentHeaders" :items="paginatedEnrollments"
          entityName="enrollment" :loading="loading" :hasPagination="true" :currentPage="currentPage" :pageSize="pageSize"
          :totalItems="totalItems" @update:currentPage="currentPage = $event" v-model:searchQuery="searchQuery"
          searchPlaceholder="Search Enrollments" :hasFilter="true" v-model:currentFilter="currentFilter" :filterOptions="[
            { label: 'All Enrollments', value: 'all' },
            { label: 'Paid Only', value: 'paid' },
            { label: 'Unpaid Only', value: 'unpaid' },
            { label: 'Cancelled Only', value: 'cancelled' },
            { label: 'Full Only', value: 'full' },
            { label: 'Partial Only', value: 'partial' },
          ]" :rowClass="getRowClass" @action="handleTableAction" @row-click="item => {
            if (item.id === newlyCreatedId) newlyCreatedId = null;
            $router.push(`/enrollments/${item.id}`);
          }">
          <template #toolbar-actions>
            <AppButton variant="primary" @click="showModal = true">
              <img :src="getActionIcon('plus')" class="btn-icon-mini reverse-icon" /> New Enrollment
            </AppButton>
          </template>

          <template #row="{ item, index, toggleMenu, activeMenuId, isMenuAbove, menuStyles, handleAction, headers }">
            <td class="hide-on-mobile text-center" :style="{ width: headers[0].width }">
              {{ index + 1 }}
            </td>
            <td class="hide-on-tablet" :style="{ width: headers[1].width }">
              <div class="info-cell">
                <div class="avatar-mini">
                  <img :src="item.parent?.profileURL" alt="parent" />
                </div>
                <span>{{ item.parent?.name }}</span>
              </div>
            </td>
            <td :style="{ width: headers[2].width }">
              <div class="info-cell">
                <div class="avatar-mini">
                  <img :src="item.student?.profileURL" alt="student" />
                </div>
                <span>{{ item.student?.name }}</span>
              </div>
            </td>
            <td :style="{ width: headers[3].width }">
              <div class="info-cell">
                <div class="program-icon-mini">
                  <img :src="item.program?.profileURL" alt="program" />
                </div>
                <div class="program-cell">
                  <div class="stext-truncate">{{ item.program?.title }}</div>
                </div>
              </div>
            </td>
            <td :style="{ width: headers[4].width }">
              <div class="session-cell">
                <div class="session-day"><strong>{{ getSessionDay(item.classSchedule) }}</strong></div>
                <div class="session-time">{{ getSessionTime(item.classSchedule) }}</div>
              </div>
            </td>
            <td class="text-center" :style="{ width: headers[5].width }">
              <StatusBadge :status="item.branchAbbr || 'N/A'" />
            </td>
            <td class="text-center" :style="{ width: headers[6].width }">
              <span v-if="!item.paymentMethod && isUnpaid(item.status || item.paymentStatus)"
                class="not-assigned-label">—</span>
              <StatusBadge v-else
                :status="item.paymentMethod || (isPaid(item.status || item.paymentStatus) ? 'NotSpecified' : '—')" />
            </td>
            <td class="bold hide-on-mobile text-center" :style="{ width: headers[7].width }">
              <div class="amount-cell">
                <StatusBadge :status="'$' + formatPrice(item.amount || 0)"
                  :type="(item.enrollmentType || 'Full').toLowerCase() === 'partial' ? 'purple' : 'magenta'">
                </StatusBadge>
              </div>
            </td>
            <td class="text-center" :style="{ width: headers[8].width }">
              <StatusBadge :status="item.displayStatus || 'Unpaid'" />
            </td>
            <td class="text-center" :style="{ width: headers[9].width }">
              <span class="date-text">{{ formatDate(item.enrollAt) }}</span>
            </td>
            <td class="action-cell text-center" :style="{ width: headers[10].width }">
              <div class="menu-container">
                <button class="btn-dots" @click.stop="toggleMenu($event, item.id)">
                  <span class="dots-icon">⋮</span>
                </button>
                <Teleport to="body">
                  <transition name="fade">
                    <div v-if="activeMenuId === item.id" class="action-dropdown" :class="{ 'open-up': isMenuAbove }"
                      :style="menuStyles" @click.stop>
                      <button v-if="!isPaid(item.status) && !isPaid(item.paymentStatus) && !isCancelled(item.status)"
                        class="btn-edit" @click="handleAction('edit', item)">
                        <img :src="getActionIcon('edit')" class="action-icon-mini" /> Edit
                      </button>
                      <button v-if="!isPaid(item.status) && !isPaid(item.paymentStatus) && !isCancelled(item.status)"
                        class="btn-pay" @click="handleAction('pay', item)">
                        <img :src="getActionIcon('pay')" class="action-icon-mini" /> Pay
                      </button>
                      <button v-if="!isCancelled(item.status || item.paymentStatus)" class="btn-cancel"
                        @click="handleAction('cancel', item)">
                        <img :src="getActionIcon('cancel')" class="action-icon-mini" /> Cancel
                      </button>
                      <div class="menu-divider"></div>
                      <button class="btn-delete" @click="handleAction('delete', item)">
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

    <EnrollmentFormModal ref="enrollmentForm" :isOpen="showModal" :loading="submitting" :parents="parents"
      :students="students" :programs="programs" :classes="classes" :enrollments="enrollments"
      :enrollment="selectedEnrollment" :error="errorMessage" :success="successMessage" :hint="validationHint"
      @close="() => { showModal = false; selectedEnrollment = null; errorMessage = ''; successMessage = ''; validationHint = ''; }"
      @program-change="handleProgramChange" @submit="handleSaveEnrollment" @hint="setValidationHint"
      @register-student="handleOpenRegisterStudent" />

    <ParentActionModal :isOpen="childRegistrationModal.isOpen" type="plus" :user="childRegistrationModal.parent"
      :selectableParents="parents" :loading="childRegistrationModal.loading" :error="childRegistrationModal.error"
      :success="childRegistrationModal.success"
      @close="() => { childRegistrationModal.isOpen = false; childRegistrationModal.error = ''; childRegistrationModal.success = ''; }"
      @submit="handleRegisterStudent" />

    <EnrollmentActionModal v-bind="actionState" :loading="submitting" v-model:error="errorMessage"
      v-model:success="successMessage" @close="closeActionModal" @submit="submitActionModal" />
  </DashboardLayout>
</template>

<style scoped>
.action-modal {
  padding: var(--space-xl);
}

.user-info {
  cursor: pointer;
}

.session-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date-text {
  font-size: var(--text-sm);
  color: var(--text-dark);
}

.prorate-note {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--primary-color);
  letter-spacing: 0.05em;
}
</style>
