<script setup>
import { ref } from 'vue'
import { formatDate } from '../utils/dateFormatter'
import DashboardLayout from '../components/DashboardLayout.vue'
import DataPageLayout from '../components/common/DataPageLayout.vue'
import AppTable from '../components/common/AppTable/AppTable.vue'
import TableToolbar from '../components/common/TableToolbar/TableToolbar.vue'
import StatusBadge from '../components/common/StatusBadge/StatusBadge.vue'

const payments = ref([
  {
    id: 1,
    parent: 'Diana Holmes',
    amount: 180,
    method: 'Credit Card',
    status: 'Paid',
    date: '2026-02-15',
  },
  {
    id: 2,
    parent: 'Johnny Depp',
    amount: 180,
    method: 'Bank Transfer',
    status: 'Pending',
    date: '2026-02-15',
  },
])
</script>

<template>
  <DashboardLayout>
    <DataPageLayout listTitle="Payment Lists">
      <template #actions>
        <TableToolbar
          :hasSearch="true"
          searchPlaceholder="Search payments..."
          :hasFilter="true"
          :filterOptions="[
            { label: 'All', value: 'all' },
            { label: 'Paid', value: 'paid' },
            { label: 'Pending', value: 'pending' },
          ]"
        />
      </template>

      <template #table>
        <AppTable :headers="['ID', 'Parent', 'Amount', 'Method', 'Status', 'Date']">
          <tr v-for="item in payments" :key="item.id">
            <td>#{{ item.id }}</td>
            <td class="bold">{{ item.parent }}</td>
            <td class="amount">${{ item.amount }}</td>
            <td>{{ item.method }}</td>
            <td>
              <StatusBadge :status="item.status" />
            </td>
            <td>{{ formatDate(item.date) }}</td>
          </tr>
        </AppTable>
      </template>
    </DataPageLayout>
  </DashboardLayout>
</template>

<style scoped>
.bold {
  font-weight: 600;
}
.amount {
  font-weight: 700;
  color: #00aeef;
}
</style>
