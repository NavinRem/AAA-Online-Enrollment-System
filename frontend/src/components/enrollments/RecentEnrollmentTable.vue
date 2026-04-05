<script setup>
import { useRouter } from 'vue-router'
import StatusBadge from '@/components/common/ui/StatusBadge.vue'
import AppTable from '@/components/common/data/AppTable.vue'
import { formatDate, formatPrice } from '@/utils/formatUtils'
import {
  getProgramProfileURL,
  getParentProfileURL,
  getStudentProfileURL
} from '@/utils/assetHelper'

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
  { label: 'Parent / Guardian', width: '120px' },
  { label: 'Child', width: '120px' },
  { label: 'Program', width: '120px' },
  { label: 'Mode', width: '60px', align: 'center' },
  { label: 'Status', width: '60px', align: 'center' },
  { label: 'Amount', width: '60px', align: 'center' },
  { label: 'Enrolled Date', width: '70px', align: 'center' }
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
    </div>

    <AppTable :headers="enrollmentHeaders" :empty="enrollments.length === 0">
      <tr v-for="item in enrollments" :key="item.id || item.no" style="cursor: pointer;">
        <td class="text-center" :style="{ width: enrollmentHeaders[0].width }">{{ item.no }}</td>
        <td class="bold" :style="{ width: enrollmentHeaders[1].width }">
          <div class="info-cell clickable" @click="navigateToDetail(item)">
            <div class="avatar-mini">
              <img :src="getParentProfileURL(item.parent?.profile || item.parentProfileURL)" alt="parent" />
            </div>
            <div class="user-info">
              <span class="user-name">{{ item.parent?.name || item.parentName }}</span>
            </div>
          </div>
        </td>
        <td class="bold" :style="{ width: enrollmentHeaders[2].width }">
          <div class="info-cell clickable" @click="navigateToDetail(item)">
            <div class="avatar-mini">
              <img :src="getStudentProfileURL(item.student?.profile || item.studentProfileURL)" alt="child" />
            </div>
            <div class="user-info">
              <span class="user-name">{{ item.student?.name || item.studentName }}</span>
            </div>
          </div>
        </td>
        <td class="bold" :style="{ width: enrollmentHeaders[3].width }">
          <div class="info-cell clickable" @click="navigateToDetail(item)">
            <div class="avatar-mini">
              <img :src="getProgramProfileURL(item.program?.profile || item.programProfileURL)" :alt="item.program?.title || item.programTitle" />
            </div>
            <span class="program-name text-truncate">{{ item.program?.title || item.programTitle }}</span>
          </div>
        </td>
        <td class="text-center" :style="{ width: enrollmentHeaders[4].width }">
          <StatusBadge :status="item.mode || 'Full'" />
        </td>
        <td class="text-center" :style="{ width: enrollmentHeaders[5].width }">
          <StatusBadge :status="item.status" />
        </td>
        <td class="bold text-center" :style="{ width: enrollmentHeaders[6].width }">
          <StatusBadge :status="'$' + formatPrice(item.amount)" />
        </td>
        <td class="date-cell text-center bold" :style="{ width: enrollmentHeaders[7].width }">{{ formatDate(item.date)
          }}</td>
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

.program-name {
  flex: 1;
  min-width: 0;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
