<script setup>
import { ref, computed } from 'vue'
import { formatDate } from '@/utils/formatUtils'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import DataMetrics from '@/components/common/data/DataMetrics.vue'
import DataTable from '@/components/common/data/DataTable.vue'
import DataPageLayout from '@/components/layout/DataPageLayout.vue'
import { paymentStatCard } from '@/utils/paymentHelper'
import { getImageUrl } from '@/utils/assetHelper'

const payments = ref([])

const paymentStats = computed(() => {
  const p = paymentStatCard(payments.value)
  return [
    {
      label: 'Total Transactions',
      value: p.totalTransactions,
      image: getImageUrl('payment/total-transaction'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Total Revenue',
      value: '$' + p.totalRevenue.toLocaleString(),
      image: getImageUrl('payment/total-revenue'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Unpaid Payment',
      value: '$' + p.pendingPayments.toLocaleString(),
      image: getImageUrl('payment/unpaid-payment'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Refund Payment',
      value: '$' + p.refundedPayments.toLocaleString(),
      image: getImageUrl('payment/refund-payment'),
      color: 'var(--accent-light)',
    },
  ]
})

const paymentHeaders = [
  { label: 'ID', width: '80px', align: 'center', class: 'hidden md:table-cell' },
  { label: 'Parent' },
  { label: 'Amount', align: 'center', width: '100px' },
  { label: 'Method', class: 'hidden sm:table-cell' },
  { label: 'Status', align: 'center', width: '100px' },
  { label: 'Date', class: 'hidden lg:table-cell', width: '120px' },
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
          <template #row="{ item, headers }">
            <td
              class="ui-cell text-center font-bold text-content-muted/50 hidden md:table-cell"
              :style="{ width: headers[0].width }"
            >
              #{{ item.id }}
            </td>
            <td class="ui-cell" :style="{ flex: '1 1 0%', minWidth: 0 }">
              <span class="font-extrabold text-content-dark tracking-tighter">{{
                item.parent
              }}</span>
            </td>
            <td class="ui-cell text-center" :style="{ width: headers[2].width }">
              <span class="font-black text-primary tracking-tighter">${{ item.amount }}</span>
            </td>
            <td class="ui-cell hidden sm:table-cell" :style="{ flex: '1 1 0%', minWidth: 0 }">
              <span class="text-xs font-bold text-content-muted tracking-tight uppercase">{{
                item.method
              }}</span>
            </td>
            <td class="ui-cell text-center" :style="{ width: headers[4].width }">
              <AppBadge :status="item.status" />
            </td>
            <td class="ui-cell hidden lg:table-cell" :style="{ width: headers[5].width }">
              <span class="text-xs font-bold text-content-muted/70 tracking-tight">{{
                formatDate(item.date)
              }}</span>
            </td>
          </template>
        </DataTable>
      </template>
    </DataPageLayout>
  </DashboardLayout>
</template>
