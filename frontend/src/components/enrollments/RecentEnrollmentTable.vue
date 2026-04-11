<script setup>
import { useRouter } from 'vue-router'
import StatusBadge from '@/components/common/ui/StatusBadge.vue'
import AppTable from '@/components/common/data/AppTable.vue'
import { formatDate, formatPrice } from '@/utils/formatUtils'
import {
  getProgramProfileURL,
  getParentProfileURL,
  getStudentProfileURL,
} from '@/utils/assetHelper'

defineProps({
  enrollments: {
    type: Array,
    default: () => [],
  },
})

const router = useRouter()

const enrollmentHeaders = [
  { label: 'No', width: '30px', align: 'center' },
  { label: 'Parent', width: '120px' },
  { label: 'Child', width: '120px' },
  { label: 'Program', width: '120px' },
  { label: 'Mode', width: '60px', align: 'center' },
  { label: 'Status', width: '60px', align: 'center' },
  { label: 'Amount', width: '60px', align: 'center' },
  { label: 'Enrolled Date', width: '90px', align: 'center' },
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
      <tr v-for="item in enrollments" :key="item.id || item.no" class="clickable-row">
        <td class="text-center" :style="{ width: enrollmentHeaders[0].width }">{{ item.no }}</td>
        <td class="font-bold" :style="{ width: enrollmentHeaders[1].width }">
          <div class="info-cell clickable" @click="navigateToDetail(item)">
            <div class="avatar-mini">
              <img :src="getParentProfileURL(item.parent?.profileURL)" alt="parent" />
            </div>
            <div class="user-info">
              <span class="user-name">{{ item.parent?.name }}</span>
            </div>
          </div>
        </td>
        <td class="font-bold" :style="{ width: enrollmentHeaders[2].width }">
          <div class="info-cell clickable" @click="navigateToDetail(item)">
            <div class="avatar-mini">
              <img :src="getStudentProfileURL(item.student?.profileURL)" alt="child" />
            </div>
            <div class="user-info">
              <span class="user-name">{{ item.student?.name }}</span>
            </div>
          </div>
        </td>
        <td class="font-bold" :style="{ width: enrollmentHeaders[3].width }">
          <div class="info-cell clickable" @click="navigateToDetail(item)">
            <div class="avatar-mini">
              <img
                :src="getProgramProfileURL(item.program?.profileURL)"
                :alt="item.program?.title"
              />
            </div>
            <span class="program-name text-truncate">{{ item.program?.title }}</span>
          </div>
        </td>
        <td class="text-center" :style="{ width: enrollmentHeaders[4].width }">
          <StatusBadge :status="item.mode" />
        </td>
        <td class="text-center" :style="{ width: enrollmentHeaders[5].width }">
          <StatusBadge :status="item.status" />
        </td>
        <td class="font-bold text-center" :style="{ width: enrollmentHeaders[6].width }">
          <StatusBadge :status="'$' + formatPrice(item.amount)" />
        </td>
        <td class="date-cell text-center font-bold" :style="{ width: enrollmentHeaders[7].width }">
          {{ formatDate(item.date) }}
        </td>
      </tr>
    </AppTable>
  </div>
</template>

<style scoped>
.enrollment-table-card {
  background: var(--white);
  padding: var(--space-xl);
  border-radius: var(--border-radius);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
  height: auto;
  overflow: visible;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xl);
}

.header-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.section-title {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text-deep);
  white-space: nowrap;
}

.header-left::after {
  content: '';
  flex: 1;
  margin-left: var(--space-lg);
  height: 1px;
  background-color: var(--bg-light);
  margin-right: var(--space-lg);
}

.bold {
  font-weight: 600;
  color: var(--text-deep);
}

.date-cell {
  color: var(--text-muted);
  font-size: var(--text-xs);
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
