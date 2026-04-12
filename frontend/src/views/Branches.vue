<script setup>
import { ref, onMounted, computed } from 'vue'

import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import DataMetrics from '../components/common/data/DataMetrics.vue'
import DataTable from '../components/common/data/DataTable.vue'

import { branchService } from '../services/branchService'
import { programService } from '../services/programService'
import { authService } from '../services/authService'
import { userService } from '../services/userService'
import { enrollmentService } from '../services/enrollmentService'
import { trialService } from '../services/trialService'
import { getImageUrl } from '@/utils/assetHelper'
import StatusBadge from '../components/common/ui/StatusBadge.vue'
import { formatPrice } from '@/utils/statusUtils'
import { useSearch, branchSearchMapper } from '../composables/useSearch'

const branches = ref([])
const students = ref([])
const enrollments = ref([])
const programs = ref([])
const sessions = ref([])
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
    const [bData, sData, eData, pData, sesData, tData] = await Promise.all([
      branchService.getAllBranches(),
      userService.getAllStudents(),
      enrollmentService.getAllEnrollments(),
      programService.getAllPrograms(),
      programService.getAllClasses(),
      trialService.getAllTrials(),
    ])
    branches.value = Array.isArray(bData) ? bData : []
    students.value = Array.isArray(sData) ? sData : []
    enrollments.value = Array.isArray(eData) ? eData : []
    programs.value = Array.isArray(pData) ? pData : []
    sessions.value = Array.isArray(sesData) ? sesData : []
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
    .filter((e) => e.paymentStatus === 'paid')
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

  const enrolledTodayList = branches.value.filter((b) =>
    todayEnrollments.some((e) => e.branchId === b.id),
  )
  const enrolledValue =
    enrolledTodayList.length === 1 ? enrolledTodayList[0].name : enrolledTodayList.length

  const idleTodayList = branches.value.filter(
    (b) => !todayEnrollments.some((e) => e.branchId === b.id),
  )
  const idleValue = idleTodayList.length === 1 ? idleTodayList[0].name : idleTodayList.length

  return [
    {
      label: 'Top Enrolled Branch',
      value: topBranchName,
      image: getImageUrl('dashboard/branch'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Highest Earner Today',
      value: bestEarnerName,
      image: getImageUrl('dashboard/high-payment'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Most Trials Branch',
      value: mostTrialBranchName,
      image: getImageUrl('dashboard/card-available-program'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Enrolled Today',
      value: enrolledValue,
      image: getImageUrl('dashboard/card-available-program'),
      color: 'var(--accent-light)',
    },
    {
      label: 'No Enrollment Today',
      value: idleValue,
      image: getImageUrl('dashboard/card-nearlyfull-program'),
      color: 'var(--accent-light)',
    },
  ]
})

const branchHeaders = [
  { label: 'No', width: '50px', align: 'center', class: 'hidden md:table-cell' },
  { label: 'Branch Name', width: '180px' },
  { label: 'Abbr', width: '85px', align: 'center' },
  { label: 'Location' },
  { label: 'Classes', width: '100px', align: 'center', class: 'hidden lg:table-cell' },
  { label: 'Programs', width: '100px', align: 'center', class: 'hidden lg:table-cell' },
  { label: 'Students', width: '100px', align: 'center' },
  { label: 'Today', width: '80px', align: 'center', class: 'hidden sm:table-cell' },
  { label: 'Trial Today', width: '80px', align: 'center', class: 'hidden md:table-cell' },
  { label: 'Trial Wk', width: '80px', align: 'center', class: 'hidden lg:table-cell' },
  { label: 'Revenue', width: '120px', align: 'center', class: 'hidden md:table-cell' },
  { label: 'Pending', width: '120px', align: 'center', class: 'hidden lg:table-cell' },
  { label: 'Cap %', width: '80px', align: 'center', class: 'hidden md:table-cell' },
  { label: 'Wk Growth', width: '100px', align: 'center', class: 'hidden lg:table-cell' },
]

const { searchQuery, searchResults } = useSearch(branches, branchSearchMapper)

const filteredBranches = computed(() => {
  return searchResults.value
})

const getProgramCount = (branchId) => {
  const branch = branches.value.find((b) => b.id === branchId)
  if (branch && branch.programCount !== undefined) return branch.programCount
  const branchSessions = sessions.value.filter((s) => s.branchId === branchId)
  const uniqueProgramIds = new Set(branchSessions.map((s) => s.programId))
  return uniqueProgramIds.size
}

const getSessionCount = (branchId) => {
  const branch = branches.value.find((b) => b.id === branchId)
  if (branch && branch.sessionCount !== undefined) return branch.sessionCount
  return sessions.value.filter((s) => s.branchId === branchId).length
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

const getNewTodayCount = (branchId) => {
  const branch = branches.value.find((b) => b.id === branchId)
  if (branch && branch.newTodayCount !== undefined) return branch.newTodayCount
  const today = new Date().toISOString().split('T')[0]
  return enrollments.value.filter((e) => {
    const eId = e.branchId
    const eDate = e.createdAt?.toDate
      ? e.createdAt.toDate().toISOString().split('T')[0]
      : (e.createdAt || '').split('T')[0]
    return eId === branchId && eDate === today
  }).length
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
  const branchClasses = sessions.value.filter((s) => s.branchId === branchId)
  if (!branchClasses.length) return 0

  const totalCapacity = branchClasses.reduce((sum, c) => sum + (c.capacity || 0), 0)
  const totalStudents = branchClasses.reduce((sum, c) => sum + (c.numStudent || 0), 0)

  return totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0
}

const getWeeklyGrowth = (branchId) => {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  return enrollments.value.filter((e) => {
    if (e.branchId !== branchId) return false
    const enrollDate = e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.createdAt)
    return enrollDate >= sevenDaysAgo
  }).length
}

const getCapacityColor = (percent) => {
  if (percent >= 90) return 'text-error'
  if (percent >= 70) return 'text-warning'
  if (percent >= 40) return 'text-success'
  return 'text-content-muted'
}

const isBranchRecentlyActive = (branchId) => {
  const FIVE_MINUTES = 5 * 60 * 1000
  const now = new Date().getTime()

  return enrollments.value.some((e) => {
    if (e.branchId !== branchId) return false
    const createdAt = e.createdAt?.toDate
      ? e.createdAt.toDate().getTime()
      : new Date(e.createdAt).getTime()
    return now - createdAt < FIVE_MINUTES
  })
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Branch Overview">
      <template #overview>
        <DataMetrics :stats="statsCards" />
      </template>

      <template #table>
        <DataTable
          title="Branch List"
          :headers="branchHeaders"
          :items="filteredBranches"
          :loading="loading"
          entityName="branch"
          :rowClass="getRowClass"
          :hasSearch="true"
          v-model:searchQuery="searchQuery"
          searchPlaceholder="Search Branches..."
        >
          <template #empty>
            <div class="p-20 text-center flex flex-col items-center gap-4">
              <img :src="getImageUrl('common/no-data')" class="w-24 opacity-40" />
              <h3 class="text-xl font-bold text-content-dark">No Branches Found</h3>
              <p class="text-content-muted text-sm max-w-sm">
                New campuses must be initialized via secure channels or the administrative
                dashboard.
              </p>
            </div>
          </template>

          <template #row="{ item, index, headers }">
            <td
              :style="{ width: headers[0].width }"
              class="ui-cell text-center font-bold text-content-muted/50 hidden md:table-cell"
            >
              {{ index + 1 }}
            </td>
            <td :style="{ width: headers[1].width }" class="ui-cell">
              <span class="font-bold text-content-dark tracking-tighter">{{ item.name }}</span>
            </td>
            <td :style="{ width: headers[2].width }" class="ui-cell text-center">
              <StatusBadge :status="item.abbr" type="blue" />
            </td>
            <td :style="{ width: headers[3].width }" class="ui-cell pl-6">
              <div
                class="text-xs text-content-muted leading-relaxed truncate max-w-[250px]"
                :title="item.location"
              >
                {{ item.location || 'No location set' }}
              </div>
            </td>
            <td
              :style="{ width: headers[4].width }"
              class="ui-cell text-center hidden lg:table-cell"
            >
              <span class="font-black text-content-dark text-lg">{{
                getSessionCount(item.id)
              }}</span>
            </td>
            <td
              :style="{ width: headers[5].width }"
              class="ui-cell text-center hidden lg:table-cell"
            >
              <span class="font-black text-content-dark text-lg">{{
                getProgramCount(item.id)
              }}</span>
            </td>
            <td :style="{ width: headers[6].width }" class="ui-cell text-center">
              <span class="font-black text-content-dark text-lg">{{
                getStudentCount(item.id)
              }}</span>
            </td>
            <td
              :style="{ width: headers[7].width }"
              class="ui-cell text-center hidden sm:table-cell"
            >
              <span
                class="inline-block px-3 py-1 rounded-sm text-sm font-black transition-all duration-500"
                :class="
                  isBranchRecentlyActive(item.id)
                    ? 'bg-primary-soft text-primary animate-pulse'
                    : 'text-primary/70'
                "
              >
                +{{ getNewTodayCount(item.id) }}
              </span>
            </td>
            <td
              :style="{ width: headers[8].width }"
              class="ui-cell text-center hidden md:table-cell"
            >
              <span class="font-black text-purple text-lg">+{{ getTrialTodayCount(item.id) }}</span>
            </td>
            <td
              :style="{ width: headers[9].width }"
              class="ui-cell text-center hidden lg:table-cell"
            >
              <span class="font-black text-purple text-lg">+{{ getTrialWeekCount(item.id) }}</span>
            </td>
            <td
              :style="{ width: headers[10].width }"
              class="ui-cell text-center hidden md:table-cell"
            >
              <span class="font-black text-success text-lg tracking-tighter"
                >${{ formatPrice(getBranchRevenue(item.id)) }}</span
              >
            </td>
            <td
              :style="{ width: headers[11].width }"
              class="ui-cell text-center hidden lg:table-cell"
            >
              <span class="font-bold text-warning text-sm tracking-tighter"
                >${{ formatPrice(getPendingRevenue(item.id)) }}</span
              >
            </td>
            <td
              :style="{ width: headers[12].width }"
              class="ui-cell text-center hidden md:table-cell"
            >
              <span
                class="font-black text-lg"
                :class="getCapacityColor(getBranchCapacity(item.id))"
              >
                {{ getBranchCapacity(item.id) }}%
              </span>
            </td>
            <td
              :style="{ width: headers[13].width }"
              class="ui-cell text-center hidden lg:table-cell"
            >
              <span
                class="px-2 py-0.5 rounded-sm font-bold text-xs"
                :class="
                  getWeeklyGrowth(item.id) >= 5
                    ? 'bg-success/10 text-success border border-success/20'
                    : 'bg-surface-light text-content-muted'
                "
              >
                +{{ getWeeklyGrowth(item.id) }}
              </span>
            </td>
          </template>
        </DataTable>
      </template>
    </DataPageLayout>
  </DashboardLayout>
</template>
