<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import DataTable from '../components/common/data/DataTable.vue'
import DataMetricCard from '../components/common/data/DataMetricCard.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import AppBadge from '../components/common/ui/AppBadge.vue'
import BranchFormModal from '../components/branches/BranchFormModal.vue'

import { branchService } from '../services/branchService'
import { programService } from '../services/programService'
import { classService } from '../services/classService'
import { authService } from '../services/authService'
import { studentService } from '../services/studentService'
import { enrollmentService } from '../services/enrollmentService'
import { trialService } from '../services/trialService'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { formatPrice } from '@/utils/formatUtils'
import { useSearch, branchSearchMapper } from '../composables/useSearch'

const branches = ref([])
const students = ref([])
const enrollments = ref([])
const programs = ref([])
const classes = ref([])
const trials = ref([])

const loading = ref(true)
const submitting = ref(false)
const showModal = ref(false)
const selectedBranch = ref(null)
const errorMessage = ref('')
const successMessage = ref('')
const newlyCreatedId = ref(null)

const getRowClass = (item) => {
  return newlyCreatedId.value === item.id ? 'ui-row-new' : ''
}

const fetchData = async () => {
  loading.value = true
  const currentUser = authService.getCurrentUser()
  if (!currentUser) {
    loading.value = false
    return
  }

  try {
    const [bData, sData, eData, pData, cData, tData] = await Promise.all([
      branchService.getAllBranches(),
      studentService.getAllStudents(),
      enrollmentService.getAllEnrollments(),
      programService.getAllPrograms(),
      classService.getAllClasses(),
      trialService.getAllTrials(),
    ])
    branches.value = Array.isArray(bData) ? bData : []
    students.value = Array.isArray(sData) ? sData : []
    enrollments.value = Array.isArray(eData) ? eData : []
    programs.value = Array.isArray(pData) ? pData : []
    classes.value = Array.isArray(cData) ? cData : []
    trials.value = Array.isArray(tData) ? tData : []
  } catch (error) {
    console.error('Failed to fetch branches data', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

const statsCards = computed(() => {
  if (loading.value) return []

  let topBranchName = 'No Branches'
  let maxStudents = 0
  if (branches.value.length > 0) {
    branches.value.forEach((branch) => {
      const count = getStudentCount(branch.id)
      if (count > maxStudents) {
        maxStudents = count
        topBranchName = branch.name
      }
    })
  }

  let mostTrialBranchName = 'None'
  let maxTrials = 0
  if (branches.value.length > 0) {
    branches.value.forEach((branch) => {
      const count = trials.value.filter((t) => t.branchId === branch.id).length
      if (count > maxTrials) {
        maxTrials = count
        mostTrialBranchName = branch.name
      }
    })
  }

  const today = new Date().toISOString().split('T')[0]
  const todayEnrollments = (enrollments.value || []).filter((e) => {
    const eDate = e.createdAt?.toDate
      ? e.createdAt.toDate().toISOString().split('T')[0]
      : (e.createdAt || '').split('T')[0]
    return eDate === today
  })

  let bestEarnerName = 'None'
  let maxRevenue = 0
  const revByBranch = {}
  todayEnrollments
    .filter((e) => ['paid', 'confirmed'].includes(String(e.paymentStatus || '').toLowerCase()))
    .forEach((e) => {
      revByBranch[e.branchId] = (revByBranch[e.branchId] || 0) + (e.amount || 0)
    })

  Object.entries(revByBranch).forEach(([bid, rev]) => {
    if (rev > maxRevenue) {
      maxRevenue = rev
      const b = branches.value.find((x) => x.id === bid)
      if (b) bestEarnerName = b.name
    }
  })

  const activeBranchIds = new Set(todayEnrollments.map((e) => e.branchId))
  const enrolledValue = activeBranchIds.size
  const enrolledSubtitle = `${enrolledValue} Active Campus${enrolledValue !== 1 ? 'es' : ''}`

  const idleValue = branches.value.length - enrolledValue
  const idleSubtitle = idleValue > 0 ? `${idleValue} Branches inactive` : 'All Branches active'

  return [
    {
      label: 'Top Enrolled Branch',
      value: topBranchName,
      subtitle: `${maxStudents} Total Students`,
      image: getImageUrl('dashboard/branch'),
      color: 'var(--color-primary-light)'
    },
    {
      label: 'Highest Earner Today',
      value: bestEarnerName,
      subtitle: maxRevenue > 0 ? `Revenue: $${formatPrice(maxRevenue)}` : 'No payments yet',
      image: getImageUrl('dashboard/high-payment'),
      color: 'var(--color-primary-light)'
    },
    {
      label: 'Enrolled Today',
      value: enrolledValue,
      subtitle: enrolledSubtitle,
      image: getImageUrl('dashboard/card-available-program'),
      color: 'var(--color-primary-light)'
    },
    {
      label: 'No Enrollment Today',
      value: idleValue,
      subtitle: idleSubtitle,
      image: getImageUrl('dashboard/card-nearlyfull-program'),
      color: 'var(--color-primary-light)'
    }
  ]
})

const branchHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Branch Name' },
  { label: 'Abbr' },
  { label: 'Location' },
  { label: 'Contact' },
  { label: 'Sessions' },
  { label: 'Programs' },
  { label: 'Students' },
  { label: 'New Today' },
  { label: 'Revenue' },
  { label: 'Pending' },
  { label: 'Action', width: '60px', align: 'center' }
]

const { searchQuery, searchResults } = useSearch(branches, branchSearchMapper)

const filteredBranches = computed(() => {
  return searchResults.value
})

const currentPage = ref(1)
const pageSize = 10
const totalItems = computed(() => filteredBranches.value.length)

const paginatedBranches = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredBranches.value.slice(start, end)
})

watch(searchQuery, () => {
  currentPage.value = 1
})

const getClassCount = (branchId) => {
  const branch = branches.value.find((b) => b.id === branchId)
  if (branch && branch.classCount !== undefined) return branch.classCount
  return classes.value.filter((s) => s.branchId === branchId).length
}

const getStudentCount = (branchId) => {
  const branch = branches.value.find((b) => b.id === branchId)
  if (branch && branch.studentCount !== undefined) return branch.studentCount
  return students.value.filter((s) => s.branch?.id === branchId || s.branchId === branchId).length
}

const getBranchRevenue = (branchId) => {
  const branch = branches.value.find((b) => b.id === branchId)
  if (branch && branch.totalRevenue !== undefined) return branch.totalRevenue
  const paidEnrollments = enrollments.value.filter(
    (e) =>
      e.branchId === branchId &&
      ['paid', 'confirmed', 'active', 'success'].includes(
        String(e.paymentStatus || '').toLowerCase(),
      ),
  )
  return paidEnrollments.reduce((sum, e) => sum + (e.amount || 0), 0)
}

const getProgramCount = (branchId) => {
  const branchClasses = classes.value.filter((s) => s.branchId === branchId)
  const uniqueProgramIds = new Set(branchClasses.map((s) => s.programId))
  return uniqueProgramIds.size
}

const getNewTodayCount = (branchId) => {
  const today = new Date().toISOString().split('T')[0]
  return enrollments.value.filter((e) => {
    const eDate = e.createdAt?.toDate
      ? e.createdAt.toDate().toISOString().split('T')[0]
      : (e.createdAt || '').split('T')[0]
    return e.branchId === branchId && eDate === today
  }).length
}

const getPendingRevenue = (branchId) => {
  const pendingEnrollments = enrollments.value.filter(
    (e) =>
      e.branchId === branchId &&
      !['paid', 'confirmed', 'active', 'success'].includes(
        String(e.paymentStatus || '').toLowerCase(),
      ),
  )
  return pendingEnrollments.reduce((sum, e) => sum + (e.amount || 0), 0)
}

const handleTableAction = ({ type, item }) => {
  if (type === 'edit') {
    selectedBranch.value = item
    showModal.value = true
    return
  }

  if (type === 'delete') {
    if (confirm(`Are you sure you want to decommission the ${item.name} branch? This action is irreversible.`)) {
      branchService.deleteBranch(item.id).then(() => fetchData())
    }
  }
}

const handleSaveBranch = async (formData) => {
  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (selectedBranch.value) {
      await branchService.updateBranch(selectedBranch.value.id, formData)
      successMessage.value = 'branch details successfully updated.'
    } else {
      const res = await branchService.createBranch(formData)
      newlyCreatedId.value = res.id || res.UID
      successMessage.value = 'New branch entity successfully established.'
    }

    setTimeout(() => {
      showModal.value = false
      selectedBranch.value = null
      successMessage.value = ''
      fetchData()
    }, 1500)
  } catch (err) {
    errorMessage.value = err.message || 'Failed to save branch record.'
    console.error(err)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Branch Overview">
      <template #overview>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DataMetricCard v-for="stat in statsCards" :key="stat.label" v-bind="stat" />
        </div>
      </template>

      <template #table>
        <DataTable title="Branch Lists" :headers="branchHeaders" :items="paginatedBranches" :loading="loading"
          entityName="branch" :flexible="true" :rowClass="getRowClass" :hasSearch="true"
          v-model:searchQuery="searchQuery" searchPlaceholder="Search something..." :hasPagination="true"
          :totalItems="totalItems" :pageSize="pageSize" v-model:currentPage="currentPage" @action="handleTableAction">

          <template #toolbar-actions>
            <AppButton variant="primary" size="md" class="rounded-xl shadow-lg shadow-primary/20"
              @click="showModal = true">
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
              <span class="font-black tracking-tight">New Branch</span>
            </AppButton>
          </template>

          <template #empty>
            <div class="py-20 text-center flex flex-col items-center gap-4 opacity-30 grayscale">
              <img :src="getImageUrl('common/no-data')" class="w-24" />
              <span class="text-sm font-black uppercase tracking-widest">No Branch Found</span>
            </div>
          </template>

          <template
            #row="{ item, index, toggleMenu, activeMenuId, isMenuAbove, menuStyles, handleAction, closeMenu, headers }">
            <td class="ui-cell text-center font-bold text-content-muted/20" :style="{ width: headers[0].width }">
              {{ (currentPage - 1) * pageSize + index + 1 }}
            </td>

            <td class="ui-cell" :style="{ width: headers[1].width }">
              <div class="flex flex-col">
                <span class="text-sm font-bold text-content-dark truncate block">{{ item.name }}</span>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[2].width }">
              <AppBadge :status="item.abbr" :type="item.color || 'blue'" />
            </td>

            <td class="ui-cell" :style="{ width: headers[3].width }">
              <span
                class="text-xs font-bold line-clamp-2 leading-tight min-h-[2.5rem] flex items-center text-content-muted">{{
                  item.location }}</span>
            </td>

            <td class="ui-cell" :style="{ width: headers[4].width }">
              <span class="text-sm font-bold tabular-nums whitespace-nowrap">{{ item.phone }}</span>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[5].width }">
              <span class="text-sm font-bold text-content-dark tabular-nums">{{ getClassCount(item.id) }}</span>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[6].width }">
              <span class="text-sm font-black text-content-dark tabular-nums">{{ getProgramCount(item.id) }}</span>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[7].width }">
              <span class="text-sm font-black text-content-dark tabular-nums">{{ getStudentCount(item.id) }}</span>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[8].width }">
              <AppBadge v-if="getNewTodayCount(item.id) > 0" :status="'+' + getNewTodayCount(item.id)" type="green" />
              <span v-else class="text-xs font-bold text-content-dark">0</span>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[9].width }">
              <span class="text-sm font-black text-emerald-600 tabular-nums">${{ formatPrice(getBranchRevenue(item.id))
              }}</span>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[10].width }">
              <span class="text-sm font-black text-amber-600 tabular-nums">${{ formatPrice(getPendingRevenue(item.id))
              }}</span>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[11].width }">
              <div class="ui-action-menu">
                <button
                  class="w-8 h-8 flex items-center justify-center hover:bg-surface-subtle rounded-lg transition-all text-content-muted hover:text-content-dark"
                  @click.stop="toggleMenu($event, item.id)">
                  <span class="font-black text-lg leading-none mb-1">⋮</span>
                </button>
                <Teleport to="body">
                  <transition enter-active-class="transition duration-200 ease-out"
                    enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100"
                    leave-to-class="opacity-0">
                    <div v-if="activeMenuId === item.id" class="ui-dropdown-menu"
                      :class="{ 'origin-bottom': isMenuAbove, 'origin-top': !isMenuAbove }" :style="menuStyles"
                      @click.stop>
                      <button class="ui-dropdown-item ui-dropdown-item-info group"
                        @click="() => { handleAction('edit', item); closeMenu(); }">
                        <img :src="getActionIcon('edit')" class="w-4 h-4 opacity-40 group-hover:opacity-100" />
                        <span class="font-bold">Edit</span>
                      </button>
                      <div class="h-px bg-surface-light mx-1 my-1"></div>
                      <button class="ui-dropdown-item ui-dropdown-item-danger group font-black tracking-tighter"
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

    <BranchFormModal :isOpen="showModal" :loading="submitting" :branch="selectedBranch" :branches="branches"
      :error="errorMessage" :success="successMessage"
      @close="() => { showModal = false; selectedBranch = null; errorMessage = ''; successMessage = ''; }"
      @submit="handleSaveBranch" />
  </DashboardLayout>
</template>
