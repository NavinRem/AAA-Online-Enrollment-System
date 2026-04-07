<script setup>
import { ref, onMounted, computed } from 'vue'

// UI Components
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import DataMetrics from '../components/common/data/DataMetrics.vue'
import DataTable from '../components/common/data/DataTable.vue'

import { branchService } from '../services/branchService'
import { authService } from '../services/authService'
import { userService } from '../services/userService'
import { getImageUrl } from '@/utils/assetHelper'

const branches = ref([])
const students = ref([])
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
    const [bData, sData] = await Promise.all([
      branchService.getAllBranches(),
      userService.getAllStudents(), // To count students per branch
    ])
    branches.value = Array.isArray(bData) ? bData : []
    students.value = Array.isArray(sData) ? sData : []
  } catch (error) {
    console.error('Failed to fetch branches', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

const statsCards = computed(() => {
  return [
    {
      label: 'Total Branches',
      value: branches.value.length,
      image: getImageUrl('dashboard/total-enrollment'),
      color: 'var(--accent-light)'
    },
    {
      label: 'Active Branches',
      value: branches.value.length,
      image: getImageUrl('dashboard/active-session'),
      color: 'var(--accent-light)'
    },
    {
      label: 'Avg Students/Branch',
      value: branches.value.length ? Math.round(students.value.length / branches.value.length) : 0,
      image: getImageUrl('student/total-student'),
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
