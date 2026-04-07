<script setup>
import { ref, onMounted, computed } from 'vue'

import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import DataMetrics from '../components/common/data/DataMetrics.vue'
import DataTable from '../components/common/data/DataTable.vue'

import { branchService } from '../services/branchService'
import { authService } from '../services/authService'
import { userService } from '../services/userService'
import { enrollmentService } from '../services/enrollmentService'
import { getImageUrl } from '@/utils/assetHelper'

const branches = ref([])
const students = ref([])
const enrollments = ref([])
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
    const [bData, sData, eData] = await Promise.all([
      branchService.getAllBranches(),
      userService.getAllStudents(),
      enrollmentService.getAllEnrollments()
    ])
    branches.value = Array.isArray(bData) ? bData : []
    students.value = Array.isArray(sData) ? sData : []
    enrollments.value = Array.isArray(eData) ? eData : []
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

  // 1. Top Enrolled Branch (Name)
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

  // Today's Context
  const today = new Date().toISOString().split('T')[0]
  const todayEnrollments = (enrollments.value || []).filter(e => {
    const eDate = e.createdAt?.toDate ? e.createdAt.toDate().toISOString().split('T')[0] : (e.createdAt || '').split('T')[0]
    return eDate === today
  })

  // 2. Highest Earner Today (Name)
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

  // 3. Branches with Enrollment Today (Smart Name/Count)
  const enrolledTodayList = branches.value.filter(b =>
    todayEnrollments.some(e => e.branchId === b.id)
  )
  const enrolledValue = enrolledTodayList.length === 1 ? enrolledTodayList[0].name : enrolledTodayList.length
  const enrolledSubtitle = enrolledTodayList.length === 1 ? '1 Active Branch' : 'Branches with activity'

  // 4. Branches with No Enrollment Today (Smart Name/Count)
  const idleTodayList = branches.value.filter(b =>
    !todayEnrollments.some(e => e.branchId === b.id)
  )
  const idleValue = idleTodayList.length === 1 ? idleTodayList[0].name : idleTodayList.length
  const idleSubtitle = idleTodayList.length === 1 ? '1 Idle Branch' : 'Zero activity today'

  return [
    {
      label: 'Top Enrolled Branch',
      value: topBranchName,
      subtitle: `${maxStudents} Total Students`,
      image: getImageUrl('dashboard/card-branch'),
      color: 'var(--accent-light)'
    },
    {
      label: 'Highest Earner Today',
      value: bestEarnerName,
      subtitle: maxRevenue > 0 ? `Revenue: $${maxRevenue}` : 'No payments yet',
      image: getImageUrl('dashboard/high-payment'),
      color: 'var(--accent-light)'
    },
    {
      label: 'Enrolled Today',
      value: enrolledValue,
      subtitle: enrolledSubtitle,
      image: getImageUrl('dashboard/card-available-program'),
      color: 'var(--accent-light)'
    },
    {
      label: 'No Enrollment Today',
      value: idleValue,
      subtitle: idleSubtitle,
      image: getImageUrl('dashboard/card-nearlyfull-program'),
      color: 'var(--accent-light)'
    }
  ]
})

const branchHeaders = [
  { label: 'No', width: '80px', align: 'center' },
  { label: 'Branch Name', width: '300px' },
  { label: 'Abbreviation', width: '150px', align: 'center' },
  { label: 'Location', class: 'hide-on-mobile' },
  { label: 'Student Count', width: '150px', align: 'center' }
]

const getStudentCount = (branchAbbr) => {
  return students.value.filter(s => s.branch?.abbr === branchAbbr || s.branch?.id === branchAbbr).length
}
</script>

<template>
  <DashboardLayout>

    <DataPageLayout title="Branches Overview" description="Manage school locations and physical campuses.">
      <template #overview>
        <DataMetrics :stats="statsCards" />
      </template>

      <template #table>
        <DataTable title="Branch List" :headers="branchHeaders" :items="branches" :loading="loading"
          :rowClass="getRowClass" :hasSearch="false">
          <template #row="{ item, index }">
            <td align="center">{{ index + 1 }}</td>
            <td>
              {{ item.name }}
            </td>
            <td align="center">
              <span class="abbr-badge">{{ item.abbr }}</span>
            </td>
            <td class="hide-on-mobile">
              <span class="location-text">{{ item.location || 'No location set' }}</span>
            </td>
            <td align="center">
              <strong class="count-value">{{ getStudentCount(item.id) }}</strong>
            </td>
          </template>
        </DataTable>
      </template>
    </DataPageLayout>
  </DashboardLayout>
</template>

<style scoped>
.abbr-badge {
  background: var(--bg-subtle);
  color: var(--text-dark);
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.85rem;
  border: 1px solid var(--border-color);
}

.location-text {
  font-size: 0.9rem;
  color: #64748b;
}

.count-value {
  font-size: 1.1rem;
  color: var(--primary-color);
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

.reverse-icon {
  filter: brightness(0) invert(1);
}
</style>
