<script setup>
defineProps({
  registrations: {
    type: Array,
    default: () => [],
  },
})

import StatusBadge from '@/components/common/ui/StatusBadge/StatusBadge.vue'
import AppTable from '@/components/common/data/AppTable/AppTable.vue'
import TableToolbar from '@/components/common/data/TableToolbar/TableToolbar.vue'
import { formatDate } from '@/utils/dateFormatter'
</script>

<template>
  <div class="table-container">
    <div class="table-header">
      <div class="header-left">
        <h3 class="section-title">Recent Enrollment</h3>
      </div>
      <TableToolbar
        :hasSearch="true"
        searchPlaceholder="Search something..."
        :hasFilter="true"
        :filterOptions="[{ label: 'All', value: 'all' }]"
      />
    </div>

    <AppTable
      :headers="['No', 'Parent/Guardian', 'Child', 'Course', 'Status', 'Amount', 'Enrolled Date']"
    >
      <tr v-for="item in registrations" :key="item.no">
        <td>{{ item.no }}</td>
        <td class="bold">{{ item.parent }}</td>
        <td>{{ item.child }}</td>
        <td>{{ item.course }}</td>
        <td>
          <StatusBadge :status="item.status" />
        </td>
        <td>
          <StatusBadge :status="item.amount" />
        </td>
        <td class="date-cell">{{ formatDate(item.date) }}</td>
      </tr>
    </AppTable>
  </div>
</template>

<style scoped>
.table-container {
  background: white;
  padding: 25px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
  margin-top: 25px;
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
