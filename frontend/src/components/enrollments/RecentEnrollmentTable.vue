<script setup>
import { useRouter } from 'vue-router'
import StatusBadge from '@/components/common/ui/StatusBadge.vue'
import AppTable from '@/components/common/data/AppTable.vue'
import TableToolbar from '@/components/common/data/TableToolbar.vue'
import { formatDate } from '@/utils/dateFormatter'
import { getImageUrl } from '@/utils/assetHelper'

defineProps({
  enrollments: {
    type: Array,
    default: () => [],
  },
})

const router = useRouter()

// Defining headers with widths for even alignment
const enrollmentHeaders = [
  { label: 'No', width: '30px', align: 'center' },
  { label: 'Parent / Guardian', width: '30%' },
  { label: 'Child', width: '30%' },
  { label: 'Program', width: '30%' },
  { label: 'Status', width: '100px', align: 'center' },
  { label: 'Amount', width: '100px', align: 'center' },
  { label: 'Enrolled Date', width: '10%', align: 'center' }
]

const navigateToDetail = (item) => {
  if (item.id) {
    router.push(`/enrollments/${item.id}`)
  }
}
</script>

<template>
  <div class="enrollment-table-card">
    <div class="table-header">
      <div class="header-left">
        <h3 class="section-title">Recent Enrollment</h3>
      </div>
      <TableToolbar :hasSearch="true" searchPlaceholder="Search something..." :hasFilter="true"
        :filterOptions="[{ label: 'All', value: 'all' }]" />
    </div>

    <AppTable :headers="enrollmentHeaders" :empty="enrollments.length === 0">
      <tr v-for="item in enrollments" :key="item.id || item.no">
        <td class="text-center">{{ item.no }}</td>
        <td class="bold">
          <div class="info-cell clickable" @click="navigateToDetail(item)">
            <div class="avatar-mini">
              <img :src="item.parentProfileURL || getImageUrl('profiles/avatar-parent')" alt="parent" />
            </div>
            <div class="user-info">
              <span class="user-name">{{ item.parentName || item.parent }}</span>
            </div>
          </div>
        </td>
        <td>
          <div class="info-cell clickable" @click="navigateToDetail(item)">
            <div class="avatar-mini">
              <img :src="item.studentProfileURL || getImageUrl('profiles/avatar-student')" alt="child" />
            </div>
            <div class="user-info">
              <span class="user-name">{{ item.studentName || item.child }}</span>
            </div>
          </div>
        </td>
        <td>
          <div class="info-cell clickable" @click="navigateToDetail(item)">
            <div class="avatar-mini">
              <img :src="item.programProfileURL || getImageUrl('programs/program')"
                :alt="item.programTitle || item.program" />
            </div>
            <span class="program-name">{{ item.programTitle || item.program }}</span>
          </div>
        </td>
        <td class="text-center">
          <StatusBadge :status="item.status" />
        </td>
        <td class="bold text-center">
          <StatusBadge :status="item.amount" />
        </td>
        <td class="date-cell text-center">{{ formatDate(item.date) }}</td>
      </tr>
    </AppTable>
  </div>
</template>

<style scoped>
.enrollment-table-card {
  background: white;
  padding: 25px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
  height: auto !important;
  /* Force fit content height */
  overflow: visible !important;
  /* Ensure no scrollbar */
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.header-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
  white-space: nowrap;
}

.header-left::after {
  content: '';
  flex: 1;
  margin-left: 20px;
  height: 1px;
  background-color: #eee;
  margin-right: 20px;
}

.bold {
  font-weight: 600;
  color: #1a1a1a;
}

.date-cell {
  color: #666;
  font-size: 0.8rem;
}
</style>
