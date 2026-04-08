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
import { getImageUrl } from '@/utils/assetHelper'
import StatusBadge from '../components/common/ui/StatusBadge.vue'
import { formatPrice } from '@/utils/statusUtils'
import { useSearch, branchSearchMapper } from '../composables/useSearch'

const branches = ref([])
const students = ref([])
const enrollments = ref([])
const programs = ref([])
const sessions = ref([])
const loading = ref(true)
const newlyCreatedId = ref(null)



const getRowClass = (item) => {
  return newlyCreatedId.value === item.id ? 'new-row-highlight' : ''
}

const fetchData = async () => {
  loading.value = true
  const currentUser = authService.getCurrentUser()
  if (!currentUser) {
    loading.value = false
    return
  }

  try {
    const [bData, sData, eData, pData, sesData] = await Promise.all([
      branchService.getAllBranches(),
      userService.getAllStudents(),
      enrollmentService.getAllEnrollments(),
      programService.getAllPrograms(),
      programService.getAllClasses()
    ])
    branches.value = Array.isArray(bData) ? bData : []
    students.value = Array.isArray(sData) ? sData : []
    enrollments.value = Array.isArray(eData) ? eData : []
    programs.value = Array.isArray(pData) ? pData : []
    sessions.value = Array.isArray(sesData) ? sesData : []
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
    branches.value.forEach(branch => {
      const count = getStudentCount(branch.id)
      if (count > maxStudents) {
        maxStudents = count
        topBranchName = branch.name
      }
    })
  }

  const today = new Date().toISOString().split('T')[0]
  const todayEnrollments = (enrollments.value || []).filter(e => {
    const eDate = e.createdAt?.toDate ? e.createdAt.toDate().toISOString().split('T')[0] : (e.createdAt || '').split('T')[0]
    return eDate === today
  })

  let bestEarnerName = 'None'
  let maxRevenue = 0
  const revByBranch = {}
  todayEnrollments.filter(e => e.paymentStatus === 'paid').forEach(e => {
    revByBranch[e.branchId] = (revByBranch[e.branchId] || 0) + (e.amount || 0)
  })

  Object.entries(revByBranch).forEach(([bid, rev]) => {
    if (rev > maxRevenue) {
      maxRevenue = rev
      const b = branches.value.find(x => x.id === bid)
      if (b) bestEarnerName = b.name
    }
  })

  const enrolledTodayList = branches.value.filter(b =>
    todayEnrollments.some(e => e.branchId === b.id)
  )
  const enrolledValue = enrolledTodayList.length === 1 ? enrolledTodayList[0].name : enrolledTodayList.length

  const idleTodayList = branches.value.filter(b =>
    !todayEnrollments.some(e => e.branchId === b.id)
  )
  const idleValue = idleTodayList.length === 1 ? idleTodayList[0].name : idleTodayList.length

  return [
    {
      label: 'Top Enrolled Branch',
      value: topBranchName,
      image: getImageUrl('dashboard/branch'),
      color: 'var(--accent-light)'
    },
    {
      label: 'Highest Earner Today',
      value: bestEarnerName,
      image: getImageUrl('dashboard/high-payment'),
      color: 'var(--accent-light)'
    },
    {
      label: 'Enrolled Today',
      value: enrolledValue,
      image: getImageUrl('dashboard/card-available-program'),
      color: 'var(--accent-light)'
    },
    {
      label: 'No Enrollment Today',
      value: idleValue,
      image: getImageUrl('dashboard/card-nearlyfull-program'),
      color: 'var(--accent-light)'
    }
  ]
})

const branchHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Branch Name', width: '180px' },
  { label: 'Abbr', width: '85px', align: 'center' },
  { label: 'Location' },
  { label: 'Sessions', width: '100px', align: 'center' },
  { label: 'Programs', width: '100px', align: 'center' },
  { label: 'Students', width: '100px', align: 'center' },
  { label: 'New Today', width: '100px', align: 'center' },
  { label: 'Revenue', width: '120px', align: 'center' },
  { label: 'Pending', width: '120px', align: 'center' },
  { label: 'Capacity', width: '100px', align: 'center' },
  { label: 'Growth', width: '100px', align: 'center' }
]

const { searchQuery, searchResults } = useSearch(branches, branchSearchMapper)

const filteredBranches = computed(() => {
  return searchResults.value
})

const getProgramCount = (branchId) => {
  const branch = branches.value.find(b => b.id === branchId)
  if (branch && branch.programCount !== undefined) return branch.programCount
  const branchSessions = sessions.value.filter(s => s.branchId === branchId)
  const uniqueProgramIds = new Set(branchSessions.map(s => s.programId))
  return uniqueProgramIds.size
}

const getSessionCount = (branchId) => {
  const branch = branches.value.find(b => b.id === branchId)
  if (branch && branch.sessionCount !== undefined) return branch.sessionCount
  return sessions.value.filter(s => s.branchId === branchId).length
}

const getPendingRevenue = (branchId) => {
  const branch = branches.value.find(b => b.id === branchId)
  if (branch && branch.pendingRevenue !== undefined) return branch.pendingRevenue
  const pendingEnrollments = enrollments.value.filter(e =>
    e.branchId === branchId &&
    !['paid', 'confirmed', 'active', 'success'].includes(String(e.paymentStatus || '').toLowerCase())
  )
  return pendingEnrollments.reduce((sum, e) => sum + (e.amount || 0), 0)
}

const getStudentCount = (branchId) => {
  const branch = branches.value.find(b => b.id === branchId)
  if (branch && branch.studentCount !== undefined) return branch.studentCount
  return students.value.filter(s => s.branch?.id === branchId || s.branchId === branchId).length
}

const getNewTodayCount = (branchId) => {
  const branch = branches.value.find(b => b.id === branchId)
  if (branch && branch.newTodayCount !== undefined) return branch.newTodayCount
  const today = new Date().toISOString().split('T')[0]
  return enrollments.value.filter(e => {
    const eId = e.branchId
    const eDate = e.createdAt?.toDate ? e.createdAt.toDate().toISOString().split('T')[0] : (e.createdAt || '').split('T')[0]
    return eId === branchId && eDate === today
  }).length
}

const getBranchRevenue = (branchId) => {
  const branch = branches.value.find(b => b.id === branchId)
  if (branch && branch.totalRevenue !== undefined) return branch.totalRevenue
  const paidEnrollments = enrollments.value.filter(e =>
    e.branchId === branchId &&
    ['paid', 'confirmed', 'active', 'success'].includes(String(e.paymentStatus || '').toLowerCase())
  )
  return paidEnrollments.reduce((sum, e) => sum + (e.amount || 0), 0)
}

const getBranchCapacity = (branchId) => {
  const branchClasses = sessions.value.filter(s => s.branchId === branchId)
  if (!branchClasses.length) return 0

  const totalCapacity = branchClasses.reduce((sum, c) => sum + (c.capacity || 0), 0)
  const totalStudents = branchClasses.reduce((sum, c) => sum + (c.numStudent || 0), 0)

  return totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0
}

const getWeeklyGrowth = (branchId) => {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  return enrollments.value.filter(e => {
    if (e.branchId !== branchId) return false
    const enrollDate = e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.createdAt)
    return enrollDate >= sevenDaysAgo
  }).length
}

const getCapacityColor = (percent) => {
  if (percent >= 90) return 'var(--error-color)'
  if (percent >= 70) return 'var(--warning-color)'
  if (percent >= 40) return 'var(--success-color)'
  return 'var(--text-muted)'
}

const isBranchRecentlyActive = (branchId) => {
  const FIVE_MINUTES = 5 * 60 * 1000
  const now = new Date().getTime()

  return enrollments.value.some(e => {
    if (e.branchId !== branchId) return false
    const createdAt = e.createdAt?.toDate ? e.createdAt.toDate().getTime() : new Date(e.createdAt).getTime()
    return (now - createdAt) < FIVE_MINUTES
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
        <DataTable title="Branch List" :headers="branchHeaders" :items="filteredBranches" :loading="loading"
          :rowClass="getRowClass" :hasSearch="true" v-model:searchQuery="searchQuery"
          searchPlaceholder="Search Branches...">


          <template #empty>
            <div class="empty-state-cta">
              <img :src="getImageUrl('common/no-data')" class="empty-img" />
              <h3>No Branches Found</h3>
              <p>Start by creating your first campus or restore defaults.</p>
              <div class="cta-btns">
                <p class="info-text">New branches must be initialized via secure channels.</p>
              </div>
            </div>
          </template>

          <template #row="{ item, index, toggleMenu, activeMenuId, isMenuAbove, menuStyles, closeMenu, headers }">
            <td :style="{ width: headers[0].width }" class="text-center">{{ index + 1 }}</td>
            <td :style="{ width: headers[1].width }" class="branch-name text-left">{{ item.name }}</td>
            <td :style="{ width: headers[2].width }" class="text-center">
              <StatusBadge :status="item.abbr" />
            </td>
            <td :style="{ width: headers[3].width }" class="pl-lg">
              <div class="location-text multi-line">{{ item.location || 'No location set' }}</div>
            </td>
            <td :style="{ width: headers[4].width }" class="text-center">
              <strong class="count-value">{{ getProgramCount(item.id) }}</strong>
            </td>
            <td :style="{ width: headers[5].width }" class="text-center">
              <strong class="count-value">{{ getSessionCount(item.id) }}</strong>
            </td>
            <td :style="{ width: headers[6].width }" class="text-center">
              <strong class="count-value">{{ getStudentCount(item.id) }}</strong>
            </td>
            <td :style="{ width: headers[7].width }" class="text-center">
              <span class="new-today-badge-pro" :class="{ 'recent-activity': isBranchRecentlyActive(item.id) }">
                {{ '+' + getNewTodayCount(item.id) }}
              </span>
            </td>
            <td :style="{ width: headers[8].width }" class="text-center">
              <strong class="revenue-value">{{ '$' + formatPrice(getBranchRevenue(item.id)) }}</strong>
            </td>
            <td :style="{ width: headers[9].width }" class="text-center">
              <strong class="pending-value">{{ '$' + formatPrice(getPendingRevenue(item.id)) }}</strong>
            </td>
            <td :style="{ width: headers[10].width }" class="text-center">
              <div class="capacity-badge" :style="{ color: getCapacityColor(getBranchCapacity(item.id)) }">
                {{ getBranchCapacity(item.id) }}%
              </div>
            </td>
            <td :style="{ width: headers[11].width }" class="text-center">
              <span class="growth-velocity-badge" :class="{ 'high-growth': getWeeklyGrowth(item.id) >= 5 }">
                +{{ getWeeklyGrowth(item.id) }}
              </span>
            </td>


          </template>
        </DataTable>
      </template>
    </DataPageLayout>


  </DashboardLayout>
</template>

<style scoped>
.branch-name {
  font-weight: 600;
  color: var(--text-dark);
}

.location-text {
  font-size: var(--text-xs);
  color: var(--text-muted);
  line-height: 1.4;
}

.location-text.multi-line {
  word-break: break-word;
  white-space: normal;
}

.count-value {
  font-size: var(--text-base);
  color: var(--text-dark);
}

.new-today-badge-pro {
  background: transparent;
  color: var(--primary-color);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--border-radius-sm);
  font-size: var(--text-sm);
  font-weight: 700;
  min-width: 50px;
  display: inline-block;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1.5px solid transparent;
}

.new-today-badge-pro.recent-activity {
  background: var(--accent-light);
  border-color: var(--accent-light);
  animation: pulse-light 2s infinite;
}

@keyframes pulse-light {
  0% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.revenue-value {
  color: var(--success-color);
  font-weight: 800;
  font-size: var(--text-lg);
}

.pending-value {
  color: var(--warning-color);
  font-weight: 700;
  font-size: var(--text-sm);
}

.new-row-highlight {
  animation: highlight-pulse 2s ease-out forwards;
}

@keyframes highlight-pulse {
  0% {
    background-color: rgba(0, 174, 239, 0.1);
  }

  100% {
    background-color: transparent;
  }
}

/* Revenue & Row Actions */
.revenue-cell {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  position: relative;
  min-height: 40px;
}

.capacity-badge {
  font-weight: 800;
  font-size: var(--text-lg);
}

.growth-velocity-badge {
  background: var(--bg-light);
  color: var(--text-dark);
  padding: var(--space-2xs) var(--space-sm);
  border-radius: var(--border-radius-sm);
  font-weight: 700;
  font-size: var(--text-sm);
}

.growth-velocity-badge.high-growth {
  background: var(--success-soft);
  color: var(--success-color);
  border: 1px solid var(--success-color);
}

.info-text {
  font-size: var(--text-sm);
  color: var(--text-muted);
  font-style: italic;
}

.row-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  transition: all 0.3s ease;
}

.row-actions.visible {
  opacity: 1;
  pointer-events: auto;
}

.icon-btn {
  background: var(--bg-subtle);
  border: 1px solid var(--border-color);
  width: 32px;
  height: 32px;
  border-radius: var(--border-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: var(--text-sm);
  transition: all 0.2s ease;
}

.icon-btn:hover {
  transform: translateY(-2px);
  background: var(--white);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.icon-btn.edit:hover {
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.icon-btn.delete:hover {
  color: var(--error-color);
  border-color: var(--error-color);
}

/* Empty State CTA */
.empty-state-cta {
  padding: var(--space-5xl) var(--space-md);
  text-align: center;
}

.empty-img {
  width: 140px;
  opacity: 0.6;
  margin-bottom: var(--space-lg);
}

.empty-state-cta h3 {
  font-size: var(--text-xl);
  color: var(--text-dark);
  margin-bottom: var(--space-sm);
}

.empty-state-cta p {
  color: var(--text-muted);
  margin-bottom: var(--space-xl);
}

.cta-btns {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
