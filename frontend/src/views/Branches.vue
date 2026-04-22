<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import DataTable from '../components/common/data/DataTable.vue'
import DataMetricCard from '../components/common/data/DataMetricCard.vue'

import { branchService } from '../services/branchService'
import { programService } from '../services/programService'
import { classService } from '../services/classService'
import { authService } from '../services/authService'
import { studentService } from '../services/studentService'
import { enrollmentService } from '../services/enrollmentService'
import { trialService } from '../services/trialService'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'
import AppBadge from '../components/common/ui/AppBadge.vue'
import { formatPrice } from '@/utils/formatUtils'
import { useSearch, branchSearchMapper } from '../composables/useSearch'

const branches = ref([])
const students = ref([])
const enrollments = ref([])
const programs = ref([])
const classes = ref([])
const trials = ref([])
const loading = ref(true)
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

  return [
    {
      label: 'Premier Campus',
      value: topBranchName,
      image: getImageUrl('dashboard/branch'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Peak Revenue',
      value: bestEarnerName,
      image: getImageUrl('dashboard/high-payment'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Trial Hub',
      value: mostTrialBranchName,
      image: getImageUrl('dashboard/card-available-program'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Active Terms',
      value: programs.value.length,
      image: getImageUrl('dashboard/card-nearlyfull-program'),
      color: 'var(--accent-light)',
    },
  ]
})

const branchHeaders = [
  { label: 'No', width: '50px', align: 'center', class: 'hidden md:table-cell' },
  { label: 'Campus Entity' },
  { label: 'Abbr', width: '80px', align: 'center' },
  { label: 'Location' },
  { label: 'Metrics', align: 'center' },
  { label: 'Yield', width: '120px', align: 'center' },
  { label: 'Load', width: '80px', align: 'center', class: 'hidden lg:table-cell' },
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

const getProgramCount = (branchId) => {
  const branch = branches.value.find((b) => b.id === branchId)
  if (branch && branch.programCount !== undefined) return branch.programCount
  const branchClasses = classes.value.filter((s) => s.branchId === branchId)
  const uniqueProgramIds = new Set(branchClasses.map((s) => s.programId))
  return uniqueProgramIds.size
}

const getClassCount = (branchId) => {
  const branch = branches.value.find((b) => b.id === branchId)
  if (branch && branch.classCount !== undefined) return branch.classCount
  return classes.value.filter((s) => s.branchId === branchId).length
}

const getPendingRevenue = (branchId) => {
  const branch = branches.value.find((b) => b.id === branchId)
  if (branch && branch.pendingRevenue !== undefined) return branch.pendingRevenue
  const pendingEnrollments = enrollments.value.filter(
    (e) =>
      e.branchId === branchId &&
      !['paid', 'confirmed', 'active', 'success'].includes(
        String(e.paymentStatus || '').toLowerCase(),
      ),
  )
  return pendingEnrollments.reduce((sum, e) => sum + (e.amount || 0), 0)
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

const getBranchCapacity = (branchId) => {
  const branchClasses = classes.value.filter((s) => s.branchId === branchId)
  if (!branchClasses.length) return 0

  const totalCapacity = branchClasses.reduce((sum, c) => sum + (c.capacity || 0), 0)
  const totalStudents = branchClasses.reduce((sum, c) => sum + (c.currentCount || 0), 0)

  return totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0
}

const getCapacityColor = (percent) => {
  if (percent >= 90) return 'text-error'
  if (percent >= 70) return 'text-warning'
  if (percent >= 40) return 'text-emerald-500'
  return 'text-content-muted'
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Regional Campus Repository">
      <template #overview>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <DataMetricCard v-for="stat in statsCards" :key="stat.label" v-bind="stat" />
        </div>
      </template>

      <template #table>
        <DataTable
          title="Active Campuses"
          :headers="branchHeaders"
          :items="paginatedBranches"
          :loading="loading"
          entityName="branch"
          :flexible="true"
          :rowClass="getRowClass"
          :hasSearch="true"
          v-model:searchQuery="searchQuery"
          searchPlaceholder="Search campuses by name or location..."
          :hasPagination="true"
          :totalItems="totalItems"
          :pageSize="pageSize"
          v-model:currentPage="currentPage"
        >
          <template #empty>
            <div class="py-20 text-center flex flex-col items-center gap-4 opacity-30 grayscale">
              <img :src="getImageUrl('common/no-data')" class="w-24" />
              <span class="text-sm font-black uppercase tracking-widest">No Campuses Found</span>
            </div>
          </template>

          <template #row="{ item, index, headers }">
            <td class="ui-cell text-center font-bold text-content-muted/20 hidden md:table-cell" :style="{ width: headers[0].width }">
              {{ (currentPage - 1) * pageSize + index + 1 }}
            </td>
            
            <td class="ui-cell min-w-[200px]" :style="{ flex: '1 1 0%' }">
               <div class="flex flex-col">
                  <span class="font-black text-content-dark tracking-tighter text-base leading-tight">{{ item.name }}</span>
                  <span class="text-[9px] font-black text-content-muted uppercase tracking-widest mt-0.5">Campus Entity</span>
               </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[2].width }">
              <AppBadge :status="item.abbr" type="blue" />
            </td>

            <td class="ui-cell min-w-[200px]" :style="{ flex: '1 1 0%' }">
              <div class="flex items-center gap-2 text-content-muted">
                 <img :src="getActionIcon('location')" class="w-3.5 h-3.5 opacity-30" />
                 <span class="text-xs font-bold truncate max-w-[200px]" :title="item.location">{{ item.location || 'Central Facility' }}</span>
              </div>
            </td>

            <td class="ui-cell">
              <div class="flex items-center justify-center gap-8">
                 <div class="flex flex-col items-center">
                    <span class="text-sm font-black text-content-dark tabular-nums">{{ getStudentCount(item.id) }}</span>
                    <span class="text-[8px] font-black text-content-muted uppercase tracking-tighter">Students</span>
                 </div>
                 <div class="flex flex-col items-center">
                    <span class="text-sm font-black text-content-dark tabular-nums">{{ getClassCount(item.id) }}</span>
                    <span class="text-[8px] font-black text-content-muted uppercase tracking-tighter">Classes</span>
                 </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[5].width }">
               <div class="inline-flex flex-col items-center px-4 py-1.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <span class="text-sm font-black text-emerald-700 tabular-nums">${{ formatPrice(getBranchRevenue(item.id)) }}</span>
                  <span class="text-[8px] font-black text-emerald-600/60 uppercase tracking-widest">Total Yield</span>
               </div>
            </td>

            <td class="ui-cell text-center hidden lg:table-cell" :style="{ width: headers[6].width }">
               <div class="flex flex-col items-center">
                  <span class="text-sm font-black tabular-nums" :class="getCapacityColor(getBranchCapacity(item.id))">{{ getBranchCapacity(item.id) }}%</span>
                  <span class="text-[8px] font-black text-content-muted uppercase tracking-tighter">Utilized</span>
               </div>
            </td>
          </template>
        </DataTable>
      </template>
    </DataPageLayout>
  </DashboardLayout>
</template>
