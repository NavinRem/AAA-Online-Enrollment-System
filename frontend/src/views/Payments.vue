<script setup>
import { ref, computed } from 'vue'
import { formatDate } from '@/utils/formatUtils'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import StatusBadge from '@/components/common/ui/StatusBadge.vue'
import DataMetrics from '@/components/common/data/DataMetrics.vue'
import DataTable from '@/components/common/data/DataTable.vue'
import DataPageLayout from '@/components/layout/DataPageLayout.vue'
import { paymentStatCard } from '@/utils/paymentHelper'
import { getImageUrl } from '@/utils/assetHelper'

const payments = ref([])

const paymentStats = computed(() => {
  const p = paymentStatCard(payments.value)
  return [
    { label: 'Total Transactions', value: p.totalTransactions, image: getImageUrl('payment/total-transaction'), color: 'var(--accent-light)' },
    { label: 'Total Revenue', value: '$' + p.totalRevenue.toLocaleString(), image: getImageUrl('payment/total-revenue'), color: 'var(--accent-light)' },
    { label: 'Unpaid Payment', value: '$' + p.pendingPayments.toLocaleString(), image: getImageUrl('payment/unpaid-payment'), color: 'var(--accent-light)' },
    { label: 'Refund Payment', value: '$' + p.refundedPayments.toLocaleString(), image: getImageUrl('payment/refund-payment'), color: 'var(--accent-light)' }
  ]
})

const paymentHeaders = [
  { label: 'ID', width: '80px', align: 'center' },
  { label: 'Parent' },
  { label: 'Amount', align: 'center' },
  { label: 'Method' },
  { label: 'Status', align: 'center' },
  { label: 'Date' }
]
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Payment Overview">
      <template #overview>
        <DataMetrics :stats="paymentStats" />
      </template>

      <template #table>
        <DataTable
          title="Payment Lists"
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
            <td class="text-center">#{{ item.id }}</td>
            <td class="bold">{{ item.parent }}</td>
            <td class="amount text-center">${{ item.amount }}</td>
            <td>{{ item.method }}</td>
            <td class="text-center"><StatusBadge :status="item.status" /></td>
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
