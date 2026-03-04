<script setup>
defineProps({
  registrations: {
    type: Array,
    default: () => [],
  },
})

import StatusBadge from './common/StatusBadge/StatusBadge.vue'
import AppTable from './common/AppTable/AppTable.vue'
import TableToolbar from './common/TableToolbar/TableToolbar.vue'

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  // Handle Firestore Timestamp objects if they leaked through
  if (dateString && typeof dateString === 'object' && dateString.seconds) {
    dateString = dateString.toDate().toISOString()
  }
  try {
    const date = new Date(dateString)
    const formattedDate = date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const formattedTime = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    return `${formattedDate} at ${formattedTime}`
  } catch {
    return dateString
  }
}
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
