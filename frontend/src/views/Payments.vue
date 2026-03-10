<script setup>
import { ref, computed } from 'vue'
import { formatDate } from '../utils/dateFormatter'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout/DataPageLayout.vue'
import DataMetrics from '../components/common/data/DataMetrics/DataMetrics.vue'
import DataTable from '../components/common/data/DataTable/DataTable.vue'
import StatusBadge from '../components/common/ui/StatusBadge/StatusBadge.vue'

const payments = ref([
  { id: 1, parent: 'Diana Holmes', amount: 180, method: 'Credit Card', status: 'Paid', date: '2026-02-15' },
  { id: 2, parent: 'Johnny Depp', amount: 180, method: 'Bank Transfer', status: 'Pending', date: '2026-02-15' }
])

const paymentStats = computed(() => [
  { label: 'Total Revenue', value: '$12,450', image: 'dashboard/payment.png', color: '#e1f5fe' },
  { label: 'Pending', value: '15', image: 'dashboard/pending_payment.png', color: '#e1f5fe' },
  { label: 'Today', value: '$450', image: 'dashboard/registration.png', color: '#e1f5fe' },
  { label: 'Refunded', value: '2', image: 'dashboard/refund.png', color: '#e1f5fe' }
])

const paymentHeaders = [
  { label: 'ID', width: '80px' },
  { label: 'Parent' },
  { label: 'Amount' },
  { label: 'Method' },
  { label: 'Status' },
  { label: 'Date' }
]
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Payment Overview" listTitle="Payment Lists">
      <template #overview>
        <DataMetrics :stats="paymentStats" />
      </template>

      <template #table>
        <DataTable
          :headers="paymentHeaders"
          :items="payments"
          searchPlaceholder="Search payments..."
          :hasFilter="true"
          :filterOptions="[
            { label: 'All', value: 'all' },
            { label: 'Paid', value: 'paid' },
            { label: 'Pending', value: 'pending' },
          ]"
        >
          <template #row="{ item }">
            <td>#{{ item.id }}</td>
            <td class="bold">{{ item.parent }}</td>
            <td class="amount">${{ item.amount }}</td>
            <td>{{ item.method }}</td>
            <td><StatusBadge :status="item.status" /></td>
            <td>{{ formatDate(item.date) }}</td>
          </template>
        </DataTable>
      </template>
    </DataPageLayout>
  </DashboardLayout>
</template>

<style scoped>
.amount {
  font-weight: 700;
  color: #00aeef;
}
</style>
