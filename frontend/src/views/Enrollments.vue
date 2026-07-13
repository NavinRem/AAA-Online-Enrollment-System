<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import DataMetricCard from '../components/common/data/DataMetricCard.vue'
import DataTable from '../components/common/data/DataTable.vue'
import AppBadge from '../components/common/ui/AppBadge.vue'
import EnrollmentActionModal from '../components/enrollments/EnrollmentActionModal.vue'
import ParentActionModal from '../components/parents/ParentActionModal.vue'

import { enrollmentService } from '@/services/enrollmentService'
import { studentService } from '../services/studentService'
import { storageService } from '@/services/storageService'

import { useSearch, enrollmentSearchMapper } from '../composables/useSearch'
import { calculateTotalEnrollment, enrichEnrollments } from '../utils/enrollmentHelper'
import { getSessionDay, getSessionTime } from '@/utils/sessionHelper'
import { getImageUrl, getActionIcon, getProgramProfileURL } from '@/utils/assetHelper'
import { formatPrice, formatDate } from '@/utils/formatUtils'
import { useDataStore } from '../stores/dataStore'
import AuditBadge from '@/components/common/ui/AuditBadge.vue'

const dataStore = useDataStore()

const enrollments = ref([])
const totalItems = ref(0)
const newlyCreatedId = ref(null)
const loading = ref(true)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const currentFilter = ref('all')
const timelineFilter = ref('all') // 'all' | 'today' | 'week' | 'month'
const branchFilter = ref('all')
const enrollmentActionModalRef = ref(null)
const currentPage = ref(1)
const pageSize = 10

// Filter dropdown state
const dropdowns = ref({ timeline: false, branch: false })
const filterMenuStyles = ref({})

const toggleDropdown = (type, event) => {
  event.stopPropagation()
  const isOpening = !dropdowns.value[type]
  Object.keys(dropdowns.value).forEach((k) => (dropdowns.value[k] = false))
  dropdowns.value[type] = isOpening
  if (isOpening) {
    const rect = event.currentTarget.getBoundingClientRect()
    filterMenuStyles.value = {
      top: `${rect.bottom + window.scrollY + 8}px`,
      left: `${Math.min(rect.left + window.scrollX, window.innerWidth - 250)}px`,
      minWidth: '210px',
    }
  }
}

const selectFilter = (type, value) => {
  if (type === 'timeline') timelineFilter.value = value
  if (type === 'branch') branchFilter.value = value
  dropdowns.value[type] = false
}

const handleFilterClickOutside = (e) => {
  const ids = ['enroll-timeline-btn', 'enroll-branch-btn']
  if (ids.every((id) => !document.getElementById(id)?.contains(e.target))) {
    dropdowns.value.timeline = false
    dropdowns.value.branch = false
  }
}

const parents = computed(() => dataStore.parents)
const students = computed(() => dataStore.students)
const programs = computed(() => dataStore.getProgramWithCategory)
const classes = computed(() => dataStore.classes)
const terms = computed(() => dataStore.terms)

const branchOptions = computed(() =>
  dataStore.branches
    .filter((b) => !b.isDeleted)
    .map((b) => ({ label: b.name, value: b.id, color: b.color, abbr: b.abbr }))
    .sort((a, b) => a.label.localeCompare(b.label)),
)

const timelineOptions = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
]

const getTimelineLabel = () =>
  timelineOptions.find((o) => o.value === timelineFilter.value)?.label ?? 'All Time'
const getBranchLabel = () => {
  if (branchFilter.value === 'all') return { label: 'All Branches', color: 'purple' }
  const opt = branchOptions.value.find((o) => String(o.value) === String(branchFilter.value))
  return { label: opt?.label ?? 'Branch', color: opt?.color ?? 'purple' }
}

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
  window.addEventListener('mousedown', handleFilterClickOutside)
  try {
    loading.value = true
    await Promise.all([fetchEnrollments(), loadFormData()])
  } catch (error) {
    console.error('Initial data load failed', error)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  window.removeEventListener('mousedown', handleFilterClickOutside)
})

const fetchEnrollments = async () => {
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize,
      status: currentFilter.value === 'all' ? undefined : currentFilter.value,
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
      termId: formData.termId,
      termOfferingId: formData.termOfferingId,
      scheduleId: formData.scheduleId || '',
      branchId: formData.branchId || '',
      amount: formData.amount,
      discountAmount: formData.discountAmount || 0,
      isSponsorship: formData.isSponsorship || false,
      sponsorName: formData.sponsorName || '',
      isProrated: formData.isProrated,
      enrollmentType: formData.enrollmentType || '',
      remark: formData.remark || '',
      enrolledSessions: formData.enrolledSessions || 0,
      receiptId: formData.receiptId || '',
      transactionId: formData.transactionId || '',
      paymentMethod: formData.paymentMethod || 'cash',
      ...(!formData.id
        ? {
            status: 'unpaid',
            paymentStatus: 'unpaid',
            enrollAt: formData.enrollAt || new Date().toISOString(),
          }
        : {}),
    }

    const targetId = formData.id || actionState.value.enrollment?.id
    if (targetId) {
      const currentEnrollment = actionState.value.enrollment
      const isTransfer =
        actionState.value.type === 'transfer' &&
        currentEnrollment &&
        formData.termOfferingId &&
        currentEnrollment.termOfferingId &&
        String(formData.termOfferingId) !== String(currentEnrollment.termOfferingId)

      if (isTransfer) {
        await enrollmentService.transferEnrollment(targetId, payload)
        successMessage.value = 'Successfully transferred enrollment!'
      } else {
        await enrollmentService.updateEnrollment(targetId, payload)
        successMessage.value = 'Successfully updated enrollment!'
      }
    } else {
      const result = await enrollmentService.createEnrollment(payload)
      successMessage.value = 'Successfully created enrollment!'
      newlyCreatedId.value = result.id
    }

    await Promise.all([fetchEnrollments(), dataStore.fetchAllCommonData(true)])

    setTimeout(() => {
      closeActionModal()
    }, 1500)
  } catch (err) {
    errorMessage.value = err.message || 'Failed to save enrollment.'
  } finally {
    submitting.value = false
  }
}

const enrollmentStats = computed(() => {
  const { total, paidCount, unpaidCount, cancelledCount } = calculateTotalEnrollment(
    enrollments.value,
  )

  return [
    {
      label: 'Total Enrollment',
      value: total,
      image: getImageUrl('enrollment/total-enrollment'),
    },
    {
      label: 'Total Paid Enrollment',
      value: paidCount,
      image: getImageUrl('enrollment/total-paid-enrollment'),
    },
    {
      label: 'Total Unpaid Enrollment',
      value: unpaidCount,
      image: getImageUrl('enrollment/total-unpaid-enrollment'),
    },
    {
      label: 'Total Cancelled Enrollment',
      value: cancelledCount,
      image: getImageUrl('enrollment/total-canceled-enrollment'),
    },
  ]
})

const enrollmentHeaders = [
  { label: 'No', width: '50px' },
  { label: 'Parent', width: '250px' },
  { label: 'Child', width: '250px' },
  { label: 'Term', width: '120px' },
  { label: 'Program', width: '250px' },
  { label: 'Session', width: '250px' },
  { label: 'Status', width: '100px' },
  { label: 'Amount', width: '100px' },
  { label: 'Date', width: '120px' },
  { label: 'Modified By', width: '140px' },
  { label: 'Action', width: '50px', align: 'center' },
]

const enrichedEnrollments = computed(() => {
  const list = enrichEnrollments(
    enrollments.value,
    parents.value,
    students.value,
    programs.value,
    classes.value,
  )
  // Resolve a single authoritative branchId per enrollment, same fallback chain used elsewhere
  return list.map((e) => ({
    ...e,
    resolvedBranchId:
      e.branchId ||
      e.branch?.id ||
      e.branchInfo?.id ||
      e.class?.branchId ||
      e.class?.branch?.id ||
      '',
  }))
})

// Timeline + Branch filter applied after enrichment
const timelineBranchFiltered = computed(() => {
  let list = enrichedEnrollments.value

  // Timeline filter on enrollAt or createdAt
  if (timelineFilter.value !== 'all') {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    const weekStartStr = weekStart.toISOString().split('T')[0]
    const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

    list = list.filter((e) => {
      const rawDate = e.enrollAt || e.createdAt
      if (!rawDate) return false
      const dateStr = String(rawDate).split('T')[0]
      if (timelineFilter.value === 'today') return dateStr === todayStr
      if (timelineFilter.value === 'week') return dateStr >= weekStartStr && dateStr <= todayStr
      if (timelineFilter.value === 'month') return dateStr.startsWith(monthStr)
      return true
    })
  }

  // Branch filter on branchId
  if (branchFilter.value !== 'all') {
    list = list.filter((e) => String(e.resolvedBranchId) === String(branchFilter.value))
  }

  return list
})

const { searchQuery, searchResults } = useSearch(timelineBranchFiltered, enrollmentSearchMapper)

const paginatedEnrollments = computed(() => {
  const list = [...searchResults.value].sort(
    (a, b) => new Date(b.enrollAt || b.createdAt || 0) - new Date(a.enrollAt || a.createdAt || 0),
  )
  return list
})

watch([currentFilter, currentPage], () => {
  fetchEnrollments()
})

watch([timelineFilter, branchFilter, searchQuery], () => {
  currentPage.value = 1
})

const actionState = ref({
  isOpen: false,
  type: '',
  enrollment: null,
})

const handleOpenNewEnrollment = () => {
  errorMessage.value = ''
  successMessage.value = ''
  actionState.value = { isOpen: true, type: 'add', enrollment: null }
}

const closeModals = () => {
  closeActionModal()
  childRegistrationModal.value.isOpen = false
  errorMessage.value = ''
  successMessage.value = ''
  childRegistrationModal.value.error = ''
  childRegistrationModal.value.success = ''
}

const handleTableAction = ({ type, item }) => {
  errorMessage.value = ''
  successMessage.value = ''
  actionState.value = { isOpen: true, type, enrollment: item }
}

const submitActionModal = async (payload) => {
  const { type, enrollment } = actionState.value
  submitting.value = true
  try {
    if (type === 'add' || type === 'edit' || type === 'transfer') {
      await handleSaveEnrollment(payload)
      return // handleSaveEnrollment handles success message and closing
    } else if (type === 'pay') {
      const { paymentMethod: methodType, transactionId, receiptId, remark, paymentStatus } = payload
      const paymentData = {
        paymentStatus: paymentStatus && paymentStatus !== 'unpaid' ? paymentStatus : 'paid',
        paymentMethod: methodType,
        transactionId: methodType === 'online' ? transactionId : '',
        receiptId: receiptId || '',
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
    await Promise.all([fetchEnrollments(), dataStore.fetchAllCommonData(true)])
    setTimeout(() => closeActionModal(), 1500)
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
    await dataStore.fetchAllCommonData(true, ['students'])
    if (result && result.id && enrollmentActionModalRef.value)
      enrollmentActionModalRef.value.setStudent(result.id)
    setTimeout(() => {
      childRegistrationModal.value.isOpen = false
    }, 1500)
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
          <DataMetricCard
            v-for="stat in enrollmentStats"
            :key="stat.label"
            v-bind="stat"
            :loading="loading"
          />
        </div>
      </template>
      <template #table>
        <DataTable
          title="Enrollment Lists"
          :headers="enrollmentHeaders"
          :items="paginatedEnrollments"
          entityName="enrollment"
          :loading="loading"
          :hasPagination="true"
          :flexible="true"
          :pageSize="pageSize"
          :totalItems="totalItems"
          v-model:currentPage="currentPage"
          v-model:searchQuery="searchQuery"
          searchPlaceholder="Search by name, program or ID..."
          :hasFilter="true"
          v-model:currentFilter="currentFilter"
          :filterOptions="[
            { label: 'All Statuses', value: 'all' },
            { label: 'Paid', value: 'paid' },
            { label: 'Unpaid', value: 'unpaid' },
            { label: 'Cancelled', value: 'cancelled' },
            { label: 'Transferred', value: 'transferred' },
            { label: 'Full', value: 'full' },
            { label: 'Partial', value: 'partial' },
          ]"
          :rowClass="getRowClass"
          @action="handleTableAction"
        >
          <template #toolbar-actions>
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Timeline Filter -->
              <div class="relative" id="enroll-timeline-btn">
                <AppButton
                  :variant="timelineFilter === 'all' ? 'secondary' : 'primary'"
                  size="md"
                  @click="toggleDropdown('timeline', $event)"
                >
                  <img
                    :src="getActionIcon('time')"
                    class="w-4 h-4 brightness-0 opacity-80"
                    :class="{ invert: timelineFilter !== 'all' }"
                  />
                  <span class="font-bold tracking-tight">{{ getTimelineLabel() }}</span>
                  <span class="ml-1 text-xs opacity-60">▼</span>
                </AppButton>
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
                      v-if="dropdowns.timeline"
                      class="toolbar-filter-menu"
                      :style="filterMenuStyles"
                      @mousedown.stop
                    >
                      <div
                        v-for="opt in timelineOptions"
                        :key="opt.value"
                        class="toolbar-filter-option flex items-center justify-between gap-3"
                        :class="{ 'active-filter-item': timelineFilter === opt.value }"
                        @click="selectFilter('timeline', opt.value)"
                      >
                        <span>{{ opt.label }}</span>
                        <span v-if="timelineFilter === opt.value" class="text-xs">✓</span>
                      </div>
                    </div>
                  </transition>
                </Teleport>
              </div>

              <!-- Branch Filter -->
              <div class="relative" id="enroll-branch-btn">
                <AppButton
                  :variant="branchFilter === 'all' ? 'secondary' : 'ghost'"
                  size="md"
                  @click="toggleDropdown('branch', $event)"
                  :style="
                    branchFilter !== 'all'
                      ? { backgroundColor: `var(--color-${getBranchLabel().color})` }
                      : {}
                  "
                  :class="{
                    '!text-white shadow-md': branchFilter !== 'all',
                    'shadow-sm': branchFilter === 'all',
                  }"
                >
                  <img
                    :src="getActionIcon('branch')"
                    class="w-4 h-4 brightness-0 opacity-80"
                    :class="{ invert: branchFilter !== 'all' }"
                  />
                  <span
                    class="font-bold tracking-tight"
                    :class="{ 'text-white': branchFilter !== 'all' }"
                    >{{ getBranchLabel().label }}</span
                  >
                  <span
                    class="ml-1 text-xs opacity-60"
                    :class="{ 'text-white': branchFilter !== 'all' }"
                    >▼</span
                  >
                </AppButton>
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
                      v-if="dropdowns.branch"
                      class="toolbar-filter-menu"
                      :style="filterMenuStyles"
                      @mousedown.stop
                    >
                      <div
                        class="toolbar-filter-option flex items-center justify-between gap-4"
                        :class="{ 'active-filter-item': branchFilter === 'all' }"
                        @click="selectFilter('branch', 'all')"
                      >
                        <div class="flex items-center gap-3">
                          <AppBadge status="ALL" type="gray" size="sm" class="w-12 text-center" />
                          <span>All Branches</span>
                        </div>
                      </div>
                      <div
                        v-for="opt in branchOptions"
                        :key="opt.value"
                        class="toolbar-filter-option flex items-center justify-between gap-4"
                        :class="{
                          'active-filter-item': String(branchFilter) === String(opt.value),
                        }"
                        @click="selectFilter('branch', opt.value)"
                      >
                        <div class="flex items-center gap-3">
                          <AppBadge
                            :status="opt.abbr"
                            :type="opt.color"
                            size="sm"
                            class="w-12 text-center"
                          />
                          <span class="truncate">{{ opt.label }}</span>
                        </div>
                        <span v-if="String(branchFilter) === String(opt.value)" class="text-xs"
                          >✓</span
                        >
                      </div>
                    </div>
                  </transition>
                </Teleport>
              </div>

              <!-- New Enrollment -->
              <AppButton variant="primary" size="md" @click="handleOpenNewEnrollment">
                <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
                <span class="font-bold tracking-light">New Enrollment</span>
              </AppButton>
            </div>
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
              class="ui-cell text-center hidden md:table-cell"
              :style="{ width: headers[0].width }"
            >
              <span class="font-bold text-content-dark text-sm">{{
                (currentPage - 1) * pageSize + index + 1
              }}</span>
            </td>

            <!-- Parent Column -->
            <td class="ui-cell" :style="{ width: headers[1].width }">
              <div class="ui-identity-cell">
                <div class="ui-avatar">
                  <img :src="item.parent?.profileURL" alt="parent" />
                </div>
                <div class="ui-identity-info">
                  <span class="truncate block font-bold text-content-dark text-sm">{{
                    item.parent?.name
                  }}</span>
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
                  <span class="truncate block font-bold text-content-dark text-sm">{{
                    item.student?.name
                  }}</span>
                </div>
              </div>
            </td>

            <!-- Term Column -->
            <td class="ui-cell" :style="{ width: headers[3].width }">
              <div class="flex flex-col">
                <span class="text-sm font-bold text-content-dark">{{ item.termName }}</span>
                <AppBadge
                  v-if="item.branchAbbr"
                  :status="item.branchAbbr"
                  :type="item.branchColor"
                />
              </div>
            </td>

            <!-- Program Column -->
            <td class="ui-cell" :style="{ width: headers[4].width }">
              <div class="ui-identity-cell">
                <div class="ui-avatar">
                  <img
                    :src="
                      getProgramProfileURL(
                        item.program?.profileURL,
                        item.program?.category?.name || item.program?.category,
                        item.program?.category?.profileURL,
                      )
                    "
                    :alt="item.programName"
                  />
                </div>
                <div class="ui-identity-info">
                  <span class="truncate block font-bold text-content-dark text-sm">{{
                    item.program?.name
                  }}</span>
                  <AppBadge :status="item.program?.type" />
                </div>
              </div>
            </td>

            <!-- Session Column -->
            <td class="ui-cell" :style="{ width: headers[5].width }">
              <div v-if="getSessionDay(item.classSchedule) !== 'N/A'" class="flex flex-col">
                <span class="text-sm font-bold text-content-dark leading-none">{{
                  getSessionDay(item.classSchedule, true)
                }}</span>
                <span class="text-sm font-bold text-content-muted mt-0.5 tabular-nums">{{
                  getSessionTime(item.classSchedule)
                }}</span>
              </div>
              <span v-else class="ui-cell-empty">Pending</span>
            </td>

            <!-- Status Column -->
            <td class="ui-cell" :style="{ width: headers[6].width }">
              <AppBadge :status="item.status || item.paymentStatus || 'Unpaid'" />
            </td>

            <!-- Amount Column -->
            <td class="ui-cell text-center" :style="{ width: headers[7].width }">
              <div class="flex flex-col items-center gap-1">
                <AppBadge
                  :status="'$' + formatPrice(item.amount || 0)"
                  :colorValue="item.paymentModeType"
                  type="finance"
                />
              </div>
            </td>

            <!-- Date Column -->
            <td
              class="ui-cell text-center hidden lg:table-cell"
              :style="{ width: headers[8].width }"
            >
              <span class="truncate block ui-cell-muted">{{ formatDate(item.enrollAt) }}</span>
            </td>

            <!-- Modified By Column -->
            <td class="ui-cell text-left" :style="{ width: headers[9].width }">
              <AuditBadge :meta="item.modifiedBy || item.createdBy" :item="item" />
            </td>

            <!-- Action Column -->
            <td class="ui-cell text-center" :style="{ width: headers[10].width }">
              <div class="ui-action-menu">
                <button
                  class="w-8 h-8 flex items-center justify-center hover:bg-surface-subtle rounded-lg transition-all text-content-muted hover:text-content-dark"
                  @click.stop="toggleMenu($event, item.id)"
                >
                  <span class="font-bold text-lg leading-none mb-1">⋮</span>
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
                        v-if="
                          item.status !== 'paid' &&
                          item.paymentStatus !== 'paid' &&
                          item.status !== 'cancelled' &&
                          item.status !== 'transferred' &&
                          item.paymentStatus !== 'transferred'
                        "
                        class="ui-dropdown-item ui-dropdown-item-info group"
                        @click="handleAction('edit', item, closeMenu)"
                      >
                        <img
                          :src="getActionIcon('edit')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100"
                        />
                        <span class="font-semibold">Edit</span>
                      </button>
                      <button
                        v-if="
                          (item.status === 'paid' || item.paymentStatus === 'paid') &&
                          item.status !== 'transferred' &&
                          item.paymentStatus !== 'transferred'
                        "
                        class="ui-dropdown-item ui-dropdown-item-warning group"
                        @click="handleAction('transfer', item, closeMenu)"
                      >
                        <img
                          :src="getActionIcon('edit')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100"
                        />
                        <span class="font-semibold">Transfer Class</span>
                      </button>
                      <button
                        v-if="
                          item.status !== 'paid' &&
                          item.paymentStatus !== 'paid' &&
                          item.status !== 'cancelled' &&
                          item.status !== 'transferred' &&
                          item.paymentStatus !== 'transferred'
                        "
                        class="ui-dropdown-item ui-dropdown-item-success group"
                        @click="handleAction('pay', item, closeMenu)"
                      >
                        <img
                          :src="getActionIcon('pay')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100"
                        />
                        <span class="font-semibold">Process Payment</span>
                      </button>
                      <button
                        v-if="
                          item.status !== 'cancelled' &&
                          item.status !== 'transferred' &&
                          item.paymentStatus !== 'transferred'
                        "
                        class="ui-dropdown-item ui-dropdown-item-danger group"
                        @click="handleAction('cancel', item, closeMenu)"
                      >
                        <img
                          :src="getActionIcon('cancel')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100"
                        />
                        <span class="font-semibold">Cancel</span>
                      </button>
                      <div class="h-px bg-surface-light mx-1 my-1"></div>
                      <button
                        class="ui-dropdown-item ui-dropdown-item-danger group font-bold"
                        @click="handleAction('delete', item, closeMenu)"
                      >
                        <img
                          :src="getActionIcon('delete')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100"
                        />
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

    <ParentActionModal
      :isOpen="childRegistrationModal.isOpen"
      type="plus"
      :user="childRegistrationModal.parent"
      :selectableParents="parents"
      :loading="childRegistrationModal.loading"
      :error="childRegistrationModal.error"
      :success="childRegistrationModal.success"
      @close="closeModals"
      @submit="handleRegisterStudent"
    />

    <EnrollmentActionModal
      ref="enrollmentActionModalRef"
      :isOpen="actionState.isOpen"
      :type="actionState.type"
      :enrollment="actionState.enrollment"
      :parents="parents"
      :students="students"
      :programs="programs"
      :classes="classes"
      :terms="terms"
      :enrollments="enrollments"
      :loading="submitting"
      :error="errorMessage"
      :success="successMessage"
      @close="closeActionModal"
      @submit="submitActionModal"
      @update:error="errorMessage = $event"
      @update:success="successMessage = $event"
    />
  </DashboardLayout>
</template>
