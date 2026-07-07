<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DetailPageLayout from '@/components/layout/DetailPageLayout.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { parentService } from '@/services/parentService'
import { studentService } from '@/services/studentService'
import { authService } from '@/services/authService'
import { enrollmentService } from '@/services/enrollmentService'
import DataTable from '@/components/common/data/DataTable.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import { formatDate, formatPrice, formatDateOnly, parseDate } from '@/utils/formatUtils'
import { enrichEnrollments } from '@/utils/enrollmentHelper'
import { enrichStudents } from '@/utils/studentHelper'
import { termService } from '@/services/termService'
import { programService } from '@/services/programService'
import { classService } from '@/services/classService'
import { processParentProfileImage, prepareParentPayload } from '../utils/parentHelper'
import { processStudentProfileImage, prepareStudentPayload } from '../utils/studentHelper'
import { getActionIcon, getImageUrl } from '@/utils/assetHelper'
import ParentActionModal from '../components/parents/ParentActionModal.vue'
import EntityProfileCard from '@/components/common/detail/EntityProfileCard.vue'
import EntityInfoCard from '@/components/common/detail/EntityInfoCard.vue'
import RelationshipsCard from '@/components/common/detail/RelationshipsCard.vue'
import TimestampCard from '@/components/common/detail/TimestampCard.vue'
import { useDataStore } from '@/stores/dataStore'
import { useModalState } from '@/composables/useModalState'
import { useDropdowns } from '@/composables/useDropdowns'
import { useDetailFetch } from '@/composables/useDetailFetch'

const dataStore = useDataStore()

const router = useRouter()

const parent = ref(null)
const students = ref([])
const enrollments = ref([])
const activeTab = ref('history')
const terms = ref([])
const selectedTermId = ref('all')
const { dropdowns, filterMenuStyles, toggleDropdown, closeAllDropdowns } = useDropdowns(
  ['term'],
  ['#term-filter-btn'],
)

const selectFilter = (type, value) => {
  if (type === 'term') selectedTermId.value = value
  closeAllDropdowns()
}

const getActiveLabel = (type) => {
  if (type === 'term') {
    if (selectedTermId.value === 'all') return { label: 'All Terms', color: 'purple' }
    const opt = terms.value.find((o) => String(o.id) === String(selectedTermId.value))
    return {
      label: opt ? opt.name : 'Select Term',
      color: 'purple',
    }
  }
  return { label: '' }
}

const loading = ref(true)
const errorMessage = ref('')

const enrollmentHistory = computed(() => {
  let list = enrollments.value
  if (selectedTermId.value && selectedTermId.value !== 'all') {
    list = list.filter((e) => String(e.termId) === String(selectedTermId.value))
  }
  return list
})

const paymentHistory = computed(() => {
  let list = [...enrollments.value]
  if (selectedTermId.value && selectedTermId.value !== 'all') {
    list = list.filter((e) => String(e.termId) === String(selectedTermId.value))
  }
  return list.sort((a, b) => {
    const dateB = parseDate(b.paidAt || b.enrollAt || 0).getTime()
    const dateA = parseDate(a.paidAt || a.enrollAt || 0).getTime()
    return dateB - dateA
  })
})

const historyCurrentPage = ref(1)
const historyPageSize = 10
const paginatedEnrollmentHistory = computed(() => {
  const start = (historyCurrentPage.value - 1) * historyPageSize
  return enrollmentHistory.value.slice(start, start + historyPageSize)
})

const paymentCurrentPage = ref(1)
const paymentPageSize = 10
const paginatedPaymentHistory = computed(() => {
  const start = (paymentCurrentPage.value - 1) * paymentPageSize
  return paymentHistory.value.slice(start, start + paymentPageSize)
})

watch([selectedTermId, activeTab], () => {
  historyCurrentPage.value = 1
  paymentCurrentPage.value = 1
})

const isInactive = computed(() => {
  return (parent.value?.status || 'Active').toLowerCase() === 'inactive'
})

const parentInfoFields = computed(() => [
  { label: 'Full Name', value: parent.value?.name },
  { label: 'Phone', value: parent.value?.phone },
  { label: 'Email', value: parent.value?.email },
  { label: 'Status', value: parent.value?.status, isBadge: true },
])

const childrenItems = computed(() =>
  students.value.map((s) => {
    const childEnrollments = enrollments.value.filter((e) => String(e.studentId) === String(s.id))
    const latestEnrollment = [...childEnrollments].sort(
      (a, b) => new Date(b.enrollAt || b.createdAt || 0) - new Date(a.enrollAt || a.createdAt || 0),
    )[0]

    // Get unique program profile URLs for all enrollments of this child
    const programIcons = [
      ...new Set(childEnrollments.map((e) => e.program?.profileURL).filter(Boolean)),
    ]

    return {
      id: s.id,
      name: s.name,
      profileURL: s.profileURL,
      badgeText: `${s.age} yrs`,
      branchAbbr: latestEnrollment?.branchAbbr,
      branchColor: latestEnrollment?.branchColor,
      description: s.dob ? formatDateOnly(s.dob) : 'No DOB provided',
      programIcons,
      route: `/students/${s.id}`,
    }
  }),
)

const enrollmentHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Child Identity' },
  { label: 'Program' },
  { label: 'Branch', align: 'center', width: '100px' },
  { label: 'Term', width: '150px' },
  { label: 'Date', width: '250px', align: 'center' },
  { label: 'Status', align: 'center', width: '120px' },
]

const paymentHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Transaction' },
  { label: 'Child' },
  { label: 'Program' },
  { label: 'Amount', align: 'center', width: '120px' },
  { label: 'Method', width: '100px' },
  { label: 'Date', width: '250px', align: 'center' },
  { label: 'Status', align: 'center', width: '120px' },
]

const fetchData = async (id) => {
  try {
    loading.value = true
    errorMessage.value = ''

    const parentData = await parentService.getParent(id)
    if (!parentData) throw new Error('Parent not found')

    parent.value = parentData

    const [studentsData, allEnrollments, allPrograms, allClasses, termData] = await Promise.all([
      studentService.getStudentsByParent(id),
      enrollmentService.getAllEnrollments(),
      programService.getAllPrograms(),
      classService.getAllClasses(),
      termService.getAllTerms(),
    ])

    terms.value = Array.isArray(termData) ? termData : termData?.data || []
    const activeTerm = terms.value.find((t) => t.status === 'active')
    if (activeTerm && selectedTermId.value === 'all') {
      selectedTermId.value = activeTerm.id
    }

    students.value = enrichStudents(studentsData || [], [], [])

    const pId = parent.value.id
    const enrollmentData =
      allEnrollments?.data || (Array.isArray(allEnrollments) ? allEnrollments : [])
    const rawEnrollments = enrollmentData.filter((r) => String(r.parentId) === String(pId))

    enrollments.value = enrichEnrollments(
      rawEnrollments,
      [parent.value],
      students.value,
      allPrograms,
      allClasses,
    )
  } catch (error) {
    console.error('Failed to load parent details', error)
    errorMessage.value = error.message || 'Failed to load details'
  } finally {
    loading.value = false
  }
}

const {
  actionModal,
  openActionModal: baseOpenModal,
  closeActionModal,
  setModalLoading,
  setModalError,
  setModalSuccess,
} = useModalState('edit')

const openActionModal = (type) => {
  baseOpenModal(type)
}

const openAddChildModal = () => {
  baseOpenModal('plus')
}

const submitActionModal = async (formData) => {
  const { type } = actionModal.value
  const id = parent.value.id
  setModalLoading(true)
  setModalError('')

  try {
    if (type === 'edit') {
      const finalProfile = await processParentProfileImage(
        formData.profile,
        formData.name,
        parent.value.profileURL,
      )
      const payload = prepareParentPayload({ ...formData, profileURL: finalProfile })
      await parentService.updateParent(id, payload)
      setModalSuccess('Profile updated successfully!')
    } else if (type === 'deactivate') {
      await parentService.updateParent(id, { status: 'inactive' })
      setModalSuccess('Account deactivated successfully!')
    } else if (type === 'activate') {
      await parentService.updateParent(id, { status: 'active' })
      setModalSuccess('Account reactivated successfully!')
    } else if (type === 'delete') {
      await parentService.deleteParent(id)
      router.push('/parents')
      return
    } else if (type === 'plus') {
      const finalProfile = await processStudentProfileImage(formData.profileURL, formData.name)
      const payload = prepareStudentPayload({ ...formData, profileURL: finalProfile, parentId: id })
      await studentService.createStudent(payload)
      setModalSuccess('Child registered successfully!')
    } else if (type === 'reset-password') {
      const result = await authService.adminResetPassword(id)
      setModalSuccess(`Temporary password generated: ${result.tempPassword}`)
    }

    setTimeout(
      () => {
        closeActionModal()
      },
      type === 'reset-password' ? 5000 : 1500,
    )

    await dataStore.fetchAllCommonData(true, ['parents', 'students'])
    await fetchData(id)
  } catch (err) {
    console.error('Action failed:', err)
    setModalError(err.message || 'Action failed')
  } finally {
    setModalLoading(false)
  }
}

useDetailFetch(fetchData)
</script>

<template>
  <DashboardLayout>
    <DetailPageLayout
      :loading="loading"
      :errorMessage="errorMessage"
      backRoute="/parents"
      sidebarWidth="md"
      :scrollable="false"
    >
      <template #header-actions v-if="parent">
        <div class="flex items-center gap-3">
          <button
            v-if="!isInactive"
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-primary-soft transition-all duration-300 hover:bg-primary hover:border-primary group"
            title="Edit Profile"
            @click="openActionModal('edit')"
          >
            <img :src="getActionIcon('edit')" class="w-5 h-5 brightness-0 transition-all" />
          </button>
          <button
            v-if="!isInactive"
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-warning-soft transition-all duration-300 hover:bg-warning hover:border-warning group"
            title="Deactivate Account"
            @click="openActionModal('deactivate')"
          >
            <img :src="getActionIcon('cancel')" class="w-5 h-5 brightness-0 transition-all" />
          </button>
          <button
            v-if="isInactive"
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-success-soft transition-all duration-300 hover:bg-success hover:border-success group"
            title="Activate Account"
            @click="openActionModal('activate')"
          >
            <img :src="getActionIcon('reactivate')" class="w-5 h-5 brightness-0 transition-all" />
          </button>
          <button
            class="w-11 h-11 flex items-center justify-center rounded-full border border-outline-std bg-error-soft transition-all duration-300 hover:bg-error hover:border-error group"
            title="Delete Account"
            @click="openActionModal('delete')"
          >
            <img :src="getActionIcon('delete')" class="w-5 h-5 brightness-0 transition-all" />
          </button>
        </div>
      </template>

      <template #left-content v-if="parent">
        <!-- Filters & Navigation -->
        <div class="flex flex-wrap items-center justify-between gap-4">
          <!-- Tab Navigation -->
          <div
            class="flex items-center gap-1 p-1 bg-white rounded-xl border border-outline-std w-fit"
          >
            <button
              v-for="tab in [
                { id: 'history', label: 'Academic History' },
                { id: 'payments', label: 'Financial Records' },
              ]"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="px-8 py-2.5 rounded-lg text-sm font-bold transition-all duration-300"
              :class="
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-md'
                  : 'text-content-muted hover:text-content-dark'
              "
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- enrollment History Card -->
        <section
          v-if="activeTab === 'history'"
          class="overflow-hidden animate-fade-in flex-1 border border-outline-std rounded-xl bg-white shadow-sm flex flex-col"
        >
          <DataTable
            title="Academic History"
            :headers="enrollmentHeaders"
            :items="paginatedEnrollmentHistory"
            entityName="enrollment"
            :flexible="false"
            :hasSearch="false"
            :hasFilter="false"
            emptyMessage="No enrollment history found for this family."
            :hasPagination="true"
            :totalItems="enrollmentHistory.length"
            :pageSize="historyPageSize"
            v-model:currentPage="historyCurrentPage"
          >
            <template #toolbar-actions>
              <div class="flex items-center gap-3">
                <div class="relative" id="term-filter-btn">
                  <AppButton
                    :variant="selectedTermId === 'all' ? 'secondary' : 'primary'"
                    size="md"
                    @click="toggleDropdown('term', $event)"
                  >
                    <span
                      class="font-bold tracking-tight"
                      :class="{ 'text-white': selectedTermId !== 'all' }"
                      >{{ getActiveLabel('term').label }}</span
                    >
                    <span
                      class="ml-2 text-xs opacity-60 group-hover:opacity-100"
                      :class="{ 'text-white': selectedTermId !== 'all' }"
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
                        v-if="dropdowns.term"
                        class="toolbar-filter-menu"
                        :style="filterMenuStyles"
                        @mousedown.stop
                      >
                        <div
                          class="toolbar-filter-option flex items-center justify-between gap-4"
                          :class="{ 'active-filter-item': selectedTermId === 'all' }"
                          @click="selectFilter('term', 'all')"
                        >
                          <div class="flex items-center gap-3">
                            <span>All Terms</span>
                          </div>
                        </div>
                        <div
                          v-for="opt in terms"
                          :key="opt.id"
                          class="toolbar-filter-option flex items-center justify-between gap-4"
                          :class="{
                            'active-filter-item': String(selectedTermId) === String(opt.id),
                          }"
                          @click="selectFilter('term', opt.id)"
                        >
                          <div class="flex items-center gap-3">
                            <span class="truncate">{{ opt.name }}</span>
                          </div>
                        </div>
                      </div>
                    </transition>
                  </Teleport>
                </div>
              </div>
            </template>
            <template #row="{ item, index, headers }">
              <td class="ui-cell text-center" :style="{ width: headers[0].width }">
                <span class="font-bold text-content-dark text-sm">{{ index + 1 }}</span>
              </td>
              <td class="ui-cell" :style="{ width: headers[1].width }">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full overflow-hidden bg-surface-subtle border border-outline-std"
                  >
                    <img
                      :src="item.student?.profileURL || getImageUrl('common/default-avatar')"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <span class="font-bold text-content-dark text-sm">{{ item.studentName }}</span>
                </div>
              </td>
              <td class="ui-cell" :style="{ width: headers[2].width }">
                <span class="text-sm font-bold text-content-dark">{{ item.programName }}</span>
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[3].width }">
                <AppBadge :status="item.branchAbbr" :type="item.branchColor" />
              </td>
              <td class="ui-cell" :style="{ width: headers[4].width }">
                <span class="text-sm font-bold text-content-muted tabular-nums">{{
                  item.termName
                }}</span>
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[5].width }">
                <span class="text-sm font-bold text-content-muted tabular-nums">{{
                  formatDate(item.enrollAt)
                }}</span>
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[6].width }">
                <AppBadge :status="item.enrollmentStatus" />
              </td>
            </template>
          </DataTable>
        </section>

        <!-- Payment History Card -->
        <section
          v-else-if="activeTab === 'payments'"
          class="overflow-hidden animate-fade-in flex-1 border border-outline-std rounded-xl bg-white shadow-sm flex flex-col"
        >
          <DataTable
            title="Financial Records"
            :headers="paymentHeaders"
            :items="paginatedPaymentHistory"
            entityName="payment"
            :flexible="false"
            :hasSearch="false"
            :hasFilter="false"
            emptyMessage="No payment history found for this family."
            :hasPagination="true"
            :totalItems="paymentHistory.length"
            :pageSize="paymentPageSize"
            v-model:currentPage="paymentCurrentPage"
          >
            <template #toolbar-actions>
              <div class="flex items-center gap-3">
                <div class="relative" id="term-filter-btn">
                  <AppButton
                    :variant="selectedTermId === 'all' ? 'secondary' : 'primary'"
                    size="md"
                    @click="toggleDropdown('term', $event)"
                  >
                    <span
                      class="font-bold tracking-tight"
                      :class="{ 'text-white': selectedTermId !== 'all' }"
                      >{{ getActiveLabel('term').label }}</span
                    >
                    <span
                      class="ml-2 text-xs opacity-60 group-hover:opacity-100"
                      :class="{ 'text-white': selectedTermId !== 'all' }"
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
                        v-if="dropdowns.term"
                        class="toolbar-filter-menu"
                        :style="filterMenuStyles"
                        @mousedown.stop
                      >
                        <div
                          class="toolbar-filter-option flex items-center justify-between gap-4"
                          :class="{ 'active-filter-item': selectedTermId === 'all' }"
                          @click="selectFilter('term', 'all')"
                        >
                          <div class="flex items-center gap-3">
                            <span class="w-2 h-2 rounded-full bg-purple"></span>
                            <span>All Terms</span>
                          </div>
                        </div>
                        <div
                          v-for="opt in terms"
                          :key="opt.id"
                          class="toolbar-filter-option flex items-center justify-between gap-4"
                          :class="{
                            'active-filter-item': String(selectedTermId) === String(opt.id),
                          }"
                          @click="selectFilter('term', opt.id)"
                        >
                          <div class="flex items-center gap-3">
                            <span class="w-2 h-2 rounded-full bg-purple"></span>
                            <span class="truncate">{{ opt.name }}</span>
                          </div>
                          <span v-if="String(selectedTermId) === String(opt.id)" class="text-xs"
                            >✓</span
                          >
                        </div>
                      </div>
                    </transition>
                  </Teleport>
                </div>
              </div>
            </template>
            <template #row="{ item, index, headers }">
              <td class="ui-cell text-center" :style="{ width: headers[0].width }">
                <span class="font-bold text-content-dark text-sm">{{ index + 1 }}</span>
              </td>
              <td class="ui-cell" :style="{ width: headers[1].width }">
                <span class="text-sm font-bold text-content-muted tracking-tight">
                  {{ item.transactionId || item.id.slice(0, 8) }}
                </span>
              </td>
              <td class="ui-cell" :style="{ width: headers[2].width }">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full overflow-hidden bg-surface-subtle border border-outline-std"
                  >
                    <img
                      :src="item.student?.profileURL || getImageUrl('common/default-avatar')"
                      class="w-full h-full object-cover"
                    />
                  </div>
                  <span class="font-bold text-content-dark text-sm">{{ item.studentName }}</span>
                </div>
              </td>
              <td class="ui-cell" :style="{ width: headers[3].width }">
                <span class="font-bold text-content-dark text-sm">{{ item.programName }}</span>
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[4].width }">
                <AppBadge
                  :status="'$' + formatPrice(item.amount)"
                  type="finance"
                  :colorValue="item.paymentModeType"
                />
              </td>
              <td class="ui-cell" :style="{ width: headers[5].width }">
                <AppBadge :status="item.paymentMethod || 'N/A'" type="blue" />
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[6].width }">
                <span class="text-sm font-bold text-content-muted tabular-nums">
                  {{ formatDate(item.paidAt || item.enrollAt) }}
                </span>
              </td>
              <td class="ui-cell text-center" :style="{ width: headers[7].width }">
                <AppBadge :status="item.paymentStatus" />
              </td>
            </template>
          </DataTable>
        </section>
      </template>

      <template #right-content v-if="parent">
        <div class="flex flex-col gap-8">
          <EntityProfileCard
            :profileURL="parent.profileURL"
            title="Basic Information"
            fallbackImage="profiles/avatar-man"
          />
          <EntityInfoCard title="Parent Contact" :fields="parentInfoFields" />
          <RelationshipsCard title="Children List" :items="childrenItems">
            <template #header-action>
              <button
                class="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md"
                @click="openAddChildModal"
              >
                <img :src="getActionIcon('plus')" class="w-3.5 h-3.5 brightness-0 invert" />
                Register
              </button>
            </template>
          </RelationshipsCard>
          <TimestampCard :createdAt="parent.createdAt" :updatedAt="parent.updatedAt" />
        </div>
      </template>
    </DetailPageLayout>

    <!-- Shared Filter Menu -->
    <!-- Removed Filter Teleport as per request -->

    <ParentActionModal
      :isOpen="actionModal.isOpen"
      :type="actionModal.type"
      :user="parent"
      :loading="actionModal.loading"
      :error="actionModal.error"
      :success="actionModal.success"
      @close="closeActionModal"
      @submit="submitActionModal"
    />
  </DashboardLayout>
</template>

<style scoped>
.ui-detail-card {
  @apply bg-white border border-outline-std shadow-sm p-8 rounded-md;
}

.ui-detail-card-title {
  @apply text-lg font-bold text-content-dark tracking-tight;
}

.filter-btn {
  @apply px-4 py-2 bg-primary-soft text-primary text-xs font-semibold rounded-lg transition-all hover:bg-primary-soft;
}

/* Hide scrollbar for Chrome, Safari and Opera */
.overflow-x-auto::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.overflow-x-auto {
  -ms-overflow-style: none;
  /* IE and Edge */
  scrollbar-width: none;
  /* Firefox */
}
</style>
