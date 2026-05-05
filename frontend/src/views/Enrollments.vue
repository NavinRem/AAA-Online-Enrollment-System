<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import DataMetricCard from '../components/common/data/DataMetricCard.vue'
import DataTable from '../components/common/data/DataTable.vue'
import AppBadge from '../components/common/ui/AppBadge.vue'
import EnrollmentFormModal from '../components/enrollments/EnrollmentFormModal.vue'
import EnrollmentActionModal from '../components/enrollments/EnrollmentActionModal.vue'
import ParentActionModal from '../components/parents/ParentActionModal.vue'

import { enrollmentService } from '@/services/enrollmentService'
import { studentService } from '../services/studentService'
import { storageService } from '@/services/storageService'

import { useSearch, enrollmentSearchMapper } from '../composables/useSearch'
import { calculateTotalEnrollment, enrichEnrollments } from '../utils/enrollmentHelper'
import { getSessionDay, getSessionTime } from '@/utils/sessionHelper'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { formatPrice, formatDate } from '@/utils/formatUtils'
import { useDataStore } from '../stores/dataStore'

const dataStore = useDataStore()
const router = useRouter()

const enrollments = ref([])
const totalItems = ref(0)
const newlyCreatedId = ref(null)
const loading = ref(true)
const showModal = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const selectedEnrollment = ref(null)
const enrollmentForm = ref(null)
const currentFilter = ref('all')
const currentPage = ref(1)
const pageSize = 10

const parents = computed(() => dataStore.parents)
const students = computed(() => dataStore.students)
const programs = computed(() => dataStore.getProgramWithCategory)
const classes = computed(() => dataStore.classes)

const childRegistrationModal = ref({
  isOpen: false,
  parent: null,
  loading: false,
  error: '',
  success: '',
})

const getRowClass = (item) => {
  return newlyCreatedId.value === item.id ? 'ui-row-new' : ''
}

onMounted(async () => {
  try {
    loading.value = true
    await Promise.all([fetchEnrollments(), loadFormData()])
  } catch (error) {
    console.error('Initial data load failed', error)
  } finally {
    loading.value = false
  }
})

const fetchEnrollments = async () => {
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize,
      status: currentFilter.value === 'all' ? undefined : (['paid', 'unpaid', 'cancelled', 'confirmed', 'success', 'active', 'pending'].includes(currentFilter.value) ? currentFilter.value : undefined)
    }
    const response = await enrollmentService.getAllEnrollments(params, { skipCache: true })

    if (response && response.data) {
      enrollments.value = response.data
      totalItems.value = response.total
    } else {
      enrollments.value = Array.isArray(response) ? response : []
      totalItems.value = enrollments.value.length
    }
  } catch (error) {
    console.error('Failed to fetch enrollments', error)
  }
}

const loadFormData = async () => {
  try {
    await dataStore.fetchAllCommonData()
  } catch (err) {
    console.error('Failed to load form data', err)
  }
}

const handleSaveEnrollment = async (formData) => {
  submitting.value = true
  errorMessage.value = ''
  try {
    const payload = {
      parentId: formData.parentId,
      studentId: formData.studentId,
      programId: formData.programId,
      classId: formData.classId,
      amount: formData.amount,
      discountAmount: formData.discountAmount || 0,
      isSponsorship: formData.isSponsorship || false,
      sponsorName: formData.sponsorName || '',
      isProrated: formData.isProrated,
      enrollmentType: formData.enrollmentType || '',
      remark: formData.remark || '',
      enrolledSessions: formData.enrolledSessions || 0,
      ...(!formData.id
        ? {
          status: 'unpaid',
          paymentStatus: 'unpaid',
          enrollAt: formData.enrollAt || new Date().toISOString(),
        }
        : {}),
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
    // Refresh global store to sync class counts and student records
    await dataStore.fetchAllCommonData(true)

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

const enrollmentStats = computed(() => {
  const s = calculateTotalEnrollment(enrollments.value)
  return [
    {
      label: 'Total Enrollment',
      value: s.total,
      image: getImageUrl('enrollment/total-enrollment'),
      color: 'var(--color-primary-soft)',
    },
    {
      label: 'Total Paid Enrollment',
      value: s.paidCount,
      image: getImageUrl('enrollment/total-paid-enrollment'),
      color: 'var(--color-success-soft)',
    },
    {
      label: 'Total Unpaid Enrollment',
      value: s.unpaidCount,
      image: getImageUrl('enrollment/total-unpaid-enrollment'),
      color: 'var(--color-warning-soft)',
    },
    {
      label: 'Total Cancelled Enrollment',
      value: s.cancelledCount,
      image: getImageUrl('enrollment/total-canceled-enrollment'),
      color: 'var(--color-error-soft)',
    }
  ]
})

const enrollmentHeaders = [
  { label: 'NO', width: '50px' },
  { label: 'PARENT' },
  { label: 'CHILD' },
  { label: 'TERM', width: '150px' },
  { label: 'PROGRAM' },
  { label: 'SESSION' },
  { label: 'STATUS', width: '100px' },
  { label: 'AMOUNT', width: '100px' },
  { label: 'DATE', width: '120px' },
  { label: 'ACTION', width: '50px' },
]

const navigateToDetail = (item) => {
  if (item.id === newlyCreatedId.value) {
    newlyCreatedId.value = null
  }
  router.push(`/enrollments/${item.id}`)
}

const enrichedEnrollments = computed(() => {
  return enrichEnrollments(
    enrollments.value,
    parents.value,
    students.value,
    programs.value,
    classes.value,
  )
})

const { searchQuery, searchResults: paginatedEnrollments } = useSearch(
  enrichedEnrollments,
  enrollmentSearchMapper,
)

watch([currentFilter, currentPage], () => {
  fetchEnrollments()
})

const actionState = ref({
  isOpen: false,
  type: '',
  enrollment: null,
})

const handleOpenNewEnrollment = () => {
  errorMessage.value = ''
  successMessage.value = ''
  selectedEnrollment.value = null
  showModal.value = true
}

const handleTableAction = ({ type, item }) => {
  errorMessage.value = ''
  successMessage.value = ''

  if (type === 'edit') {
    selectedEnrollment.value = item
    showModal.value = true
    return
  }

  actionState.value = { isOpen: true, type, enrollment: item }
}

const submitActionModal = async (payload) => {
  const { type, enrollment } = actionState.value
  submitting.value = true
  try {
    if (type === 'pay') {
      const { bankName, paymentMethod: methodType, proof, remark, paymentStatus } = payload
      const paymentData = {
        paymentStatus: paymentStatus || 'paid',
        paymentMethod: methodType,
        bankName: methodType === 'online' ? bankName : null,
        transactionId: proof,
        remark: remark?.trim() || '',
        amount: enrollment.amount,
      }
      await enrollmentService.processPayment(enrollment.id, paymentData)
    } else if (type === 'cancel') {
      await enrollmentService.updateEnrollment(enrollment.id, {
        status: 'cancelled',
        cancelReason: payload.reason,
      })
    } else if (type === 'delete') {
      await enrollmentService.deleteEnrollment(enrollment.id)
    }
    successMessage.value = 'Action completed successfully.'
    await fetchEnrollments()
    // Refresh global store for class count synchronization
    await dataStore.fetchAllCommonData(true)
    setTimeout(() => closeActionModal(), 2000)
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
  const parent = parents.value.find((p) => (p.uid || p.id) === parentId)
  if (!parent) return
  childRegistrationModal.value = { isOpen: true, parent, loading: false, error: '', success: '' }
}

const handleRegisterStudent = async (formData) => {
  childRegistrationModal.value.loading = true
  try {
    const { parentId, name, dob, profile } = formData
    let finalProfile = profile
    if (profile && profile.includes('/profiles/temp/')) {
      const extension = profile.split('?')[0].split('.').pop()
      const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '_')
      const newPath = `profiles/temp_student/${sanitizedName}_student.${extension}`
      finalProfile = await storageService.moveProfileImage(profile, newPath)
    }
    const result = await studentService.registerStudent(parentId, {
      name,
      dob,
      profile: finalProfile,
      status: 'Inactive',
    })
    childRegistrationModal.value.success = 'Student registered successfully!'
    const studentsRes = await studentService.getAllStudents()
    dataStore.students = Array.isArray(studentsRes) ? studentsRes : []
    if (result && result.id && enrollmentForm.value) enrollmentForm.value.setStudent(result.id)
    setTimeout(() => { childRegistrationModal.value.isOpen = false }, 1500)
  } catch (err) {
    childRegistrationModal.value.error = err.message || 'Error registering student.'
  } finally {
    childRegistrationModal.value.loading = false
  }
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Enrollment Overview">
      <template #overview>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DataMetricCard v-for="stat in enrollmentStats" :key="stat.label" v-bind="stat" />
        </div>
      </template>
      <template #table>
        <DataTable title="Enrollment Lists" :headers="enrollmentHeaders" :items="paginatedEnrollments"
          entityName="enrollment" :loading="loading" :hasPagination="true" :flexible="true" :pageSize="pageSize"
          :totalItems="totalItems" v-model:currentPage="currentPage" v-model:searchQuery="searchQuery"
          searchPlaceholder="Search by name, program or ID..." :hasFilter="true" v-model:currentFilter="currentFilter"
          :filterOptions="[
            { label: 'All Statuses', value: 'all' },
            { label: 'Paid', value: 'paid' },
            { label: 'Unpaid', value: 'unpaid' },
            { label: 'Cancelled', value: 'cancelled' }
          ]" :rowClass="getRowClass" @action="handleTableAction" @row-click="navigateToDetail">
          <template #toolbar-actions>
            <AppButton variant="primary" size="md" class="rounded-xl shadow-lg shadow-primary/20"
              @click="handleOpenNewEnrollment">
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
              <span class="font-bold tracking-tight">New Enrollment</span>
            </AppButton>
          </template>

          <template
            #row="{ item, index, toggleMenu, activeMenuId, isMenuAbove, menuStyles, handleAction, closeMenu, headers }">
            <td class="ui-cell text-center font-semibold text-content-muted/20 hidden md:table-cell"
              :style="{ width: headers[0].width }">
              {{ (currentPage - 1) * pageSize + index + 1 }}
            </td>

            <!-- Parent Column -->
            <td class="ui-cell" :style="{ width: headers[1].width }">
              <div class="ui-identity-cell">
                <div class="ui-avatar">
                  <img :src="item.parent?.profileURL" alt="parent" />
                </div>
                <div class="ui-identity-info">
                  <span class="text-sm font-semibold text-content-dark truncate block">{{ item.parent?.name }}</span>
                </div>
              </div>
            </td>

            <!-- Child Column -->
            <td class="ui-cell" :style="{ width: headers[2].width }">
              <div class="ui-identity-cell">
                <div class="ui-avatar">
                  <img :src="item.student?.profileURL" alt="child" />
                </div>
                <div class="ui-identity-info">
                  <span class="text-sm font-semibold text-content-dark truncate block">{{ item.student?.name }}</span>
                </div>
              </div>
            </td>

            <!-- Term Column -->
            <td class="ui-cell" :style="{ width: headers[3].width }">
              <div class="flex flex-col">
                <span class="text-xs font-bold text-content-dark tracking-tighter">{{ item.termName }}</span>
                <AppBadge v-if="item.branchAbbr" :status="item.branchAbbr" class="text-xs mt-1"
                  :type="item.branchColor" />
              </div>
            </td>

            <!-- Program Column -->
            <td class="ui-cell" :style="{ width: headers[4].width }">
              <div class="ui-identity-cell">
                <div class="ui-avatar">
                  <img :src="item.program?.profileURL" :alt="item.programName" />
                </div>
                <div class="ui-identity-info">
                  <span class="text-sm font-semibold text-content-dark truncate block">{{
                    item.program?.name }}</span>
                  <span class="text-[10px] font-semibold text-primary uppercase tracking-widest">{{
                    item.program?.type || 'Standard' }}</span>
                </div>
              </div>
            </td>

            <!-- Session Column -->
            <td class="ui-cell" :style="{ width: headers[5].width }">
              <div v-if="getSessionDay(item.classSchedule) !== 'N/A'" class="flex flex-col">
                <span class="text-xs font-semibold text-content-dark uppercase tracking-tighter leading-none">{{
                  getSessionDay(item.classSchedule, true) }}</span>
                <span class="text-[9px] font-semibold text-content-muted uppercase tracking-widest mt-0.5">{{
                  getSessionTime(item.classSchedule) }}</span>
              </div>
              <span v-else
                class="text-[10px] font-semibold uppercase text-content-muted/30 tracking-widest">Pending</span>
            </td>

            <!-- Status Column -->
            <td class="ui-cell text-center" :style="{ width: headers[6].width }">
              <AppBadge :status="item.status || item.paymentStatus || 'Unpaid'" />
            </td>

            <!-- Amount Column -->
            <td class="ui-cell text-center" :style="{ width: headers[7].width }">
              <div class="flex flex-col items-center gap-1">
                <AppBadge :status="'$' + formatPrice(item.amount || 0)" :colorValue="item.paymentModeType"
                  type="finance" />
              </div>
            </td>

            <!-- Date Column -->
            <td class="ui-cell text-center hidden lg:table-cell" :style="{ width: headers[8].width }">
              <span class="text-xs font-semibold text-content-muted truncate block">{{
                formatDate(item.enrollAt) }}</span>
            </td>

            <!-- Action Column -->
            <td class="ui-cell text-center" :style="{ width: headers[8].width }">
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
                      <button
                        v-if="item.status !== 'paid' && item.paymentStatus !== 'paid' && item.status !== 'cancelled'"
                        class="ui-dropdown-item ui-dropdown-item-info group"
                        @click="() => { handleAction('edit', item); closeMenu(); }">
                        <img :src="getActionIcon('edit')" class="w-4 h-4 opacity-40 group-hover:opacity-100" />
                        <span class="font-semibold">Edit</span>
                      </button>
                      <button
                        v-if="item.status !== 'paid' && item.paymentStatus !== 'paid' && item.status !== 'cancelled'"
                        class="ui-dropdown-item ui-dropdown-item-success group"
                        @click="() => { handleAction('pay', item); closeMenu(); }">
                        <img :src="getActionIcon('pay')" class="w-4 h-4 opacity-40 group-hover:opacity-100" />
                        <span class="font-semibold">Process Payment</span>
                      </button>
                      <button v-if="item.status !== 'cancelled'" class="ui-dropdown-item ui-dropdown-item-danger group"
                        @click="() => { handleAction('cancel', item); closeMenu(); }">
                        <img :src="getActionIcon('cancel')" class="w-4 h-4 opacity-40 group-hover:opacity-100" />
                        <span class="font-semibold">Cancel</span>
                      </button>
                      <div class="h-px bg-surface-light mx-1 my-1"></div>
                      <button class="ui-dropdown-item ui-dropdown-item-danger group font-bold tracking-tighter"
                        @click="() => { handleAction('delete', item); closeMenu(); }">
                        <img :src="getActionIcon('delete')" class="w-4 h-4 opacity-40 group-hover:opacity-100" />
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

    <EnrollmentFormModal ref="enrollmentForm" :isOpen="showModal" :loading="submitting" :parents="parents"
      :students="students" :programs="programs" :classes="classes" :enrollments="enrollments"
      :enrollment="selectedEnrollment" :error="errorMessage" :success="successMessage"
      @close="() => { showModal = false; selectedEnrollment = null; errorMessage = ''; successMessage = ''; }"
      @submit="handleSaveEnrollment" @register-student="handleOpenRegisterStudent" />

    <ParentActionModal :isOpen="childRegistrationModal.isOpen" type="plus" :user="childRegistrationModal.parent"
      :selectableParents="parents" :loading="childRegistrationModal.loading" :error="childRegistrationModal.error"
      :success="childRegistrationModal.success"
      @close="() => { childRegistrationModal.isOpen = false; childRegistrationModal.error = ''; childRegistrationModal.success = ''; }"
      @submit="handleRegisterStudent" />

    <EnrollmentActionModal v-bind="actionState" :loading="submitting" v-model:error="errorMessage"
      v-model:success="successMessage" @close="closeActionModal" @submit="submitActionModal" />
  </DashboardLayout>
</template>
