<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { formatDate, formatPrice } from '@/utils/formatUtils'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DataPageLayout from '@/components/layout/DataPageLayout.vue'
import DataTable from '@/components/common/data/DataTable.vue'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { paymentService } from '@/services/paymentService'
import { enrollmentService } from '@/services/enrollmentService'
import { trialService } from '@/services/trialService'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { useSearch, paymentSearchMapper } from '@/composables/useSearch'
import { isPaid, isPending } from '@/constants/status'

const enrollments = ref([])
const stats = ref(null)
const loading = ref(true)
const currentFilter = ref('all')

const fetchData = async () => {
  try {
    loading.value = true
    const [paymentsData, financialStats] = await Promise.all([
      paymentService.getAllPayments(),
      paymentService.getFinancialStats()
    ])
    enrollments.value = Array.isArray(paymentsData) ? paymentsData : []
    stats.value = financialStats
  } catch (error) {
    console.error('Failed to fetch payments data', error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

// 1. Base formatting
const formattedPayments = computed(() => {
  return enrollments.value.map(e => ({
    id: e.id,
    receiptId: e.receiptId || (e.enrollmentId ? `#${e.enrollmentId.slice(-6)}` : 'N/A'),
    transactionId: e.transactionId || (e.paymentMethod === 'cash' ? null : 'N/A'),
    parent: e.parent?.name || 'Unknown Parent',
    parentProfile: e.parent?.profileURL,
    amount: e.amount || 0,
    method: e.paymentMethod || 'cash',
    bankName: e.bankName || e.paymentMethod,
    status: e.paymentStatus || e.status || 'unpaid',
    date: e.paidAt || e.enrollAt || e.createdAt,
    student: e.student?.name || 'Unknown Student',
    studentProfile: e.student?.profileURL,
    program: e.program?.name || 'Standard Program',
    paymentModeType: e.paymentModeType || (e.isProrated ? 'partial' : 'full'),
    termStatus: e.termStatus || 'unknown'
  }))
})

// 2. Status filtering
const statusFilteredPayments = computed(() => {
  const list = formattedPayments.value
  if (currentFilter.value === 'all') return list

  const filter = currentFilter.value.toLowerCase()
  return list.filter(p => {
    if (filter === 'paid') return isPaid(p.status)
    if (filter === 'pending') return isPending(p.status)
    if (filter === 'failed') return p.status === 'failed'
    if (filter === 'cash') return p.method === 'cash'
    if (filter === 'online') return p.method !== 'cash'
    return true
  })
})

// 3. Search filtering
const { searchQuery, searchResults: searchedPayments } = useSearch(
  statusFilteredPayments,
  paymentSearchMapper
)

// 4. Operational sorting (Active terms first)
const filteredPayments = computed(() => {
  const list = [...searchedPayments.value]
  return list.sort((a, b) => {
    // 1. Prioritize Active Term
    if (a.termStatus === 'active' && b.termStatus !== 'active') return -1
    if (a.termStatus !== 'active' && b.termStatus === 'active') return 1

    // 2. Then by date (newest first)
    return new Date(b.date) - new Date(a.date)
  })
})

const currentPage = ref(1)
const pageSize = 10

const totalItems = computed(() => filteredPayments.value.length)
const paginatedPayments = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredPayments.value.slice(start, end)
})

watch([searchQuery, currentFilter], () => {
  currentPage.value = 1
})

const paymentStats = computed(() => {
  const s = stats.value
  return [
    {
      label: 'Settled Revenue (Paid)',
      value: '$' + formatPrice(s?.totalPaidRevenue || 0),
      subtitle: `${s?.paidCount || 0} Successful Transactions`,
      image: getImageUrl('payment/total-revenue'),
    },
    {
      label: 'Cash Collection (Offline)',
      value: '$' + formatPrice(s?.cashRevenue || 0),
      subtitle: `${s?.cashCount || 0} Cash Payments`,
      image: getImageUrl('payment/total-transaction'),
    },
    {
      label: 'Bank Collection (Online)',
      value: '$' + formatPrice(s?.onlineRevenue || 0),
      subtitle: `${s?.onlineCount || 0} Online Payments`,
      image: getImageUrl('payment/total-revenue'),
    },
    {
      label: 'Outstanding (Pending)',
      value: '$' + formatPrice(s?.pendingRevenue || 0),
      subtitle: `${s?.pendingCount || 0} Unpaid Records`,
      image: getImageUrl('payment/unpaid-payment'),
    },
  ]
})

const paymentHeaders = [
  { label: 'No', width: '60px', align: 'center', class: 'hidden md:table-cell' },
  { label: 'Client Identity', width: '280px' },
  { label: 'Receipt ID', align: 'center', width: '120px' },
  { label: 'Transaction ID', align: 'center', width: '150px' },
  { label: 'Amount', align: 'center', width: '120px' },
  { label: 'Method', align: 'center', width: '120px' },
  { label: 'Status', align: 'center', width: '120px' },
  { label: 'Date', class: 'hidden lg:table-cell', width: '150px' },
]
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Payment Overview">
      <template #overview>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DataMetricCard v-for="stat in paymentStats" :key="stat.label" v-bind="stat" />
        </div>
      </template>

      <template #table>
        <DataTable title="Payment Lists" :headers="paymentHeaders" :items="paginatedPayments" :loading="loading"
          :hasPagination="true" :currentPage="currentPage" :pageSize="pageSize" :totalItems="totalItems"
          @update:currentPage="currentPage = $event"
          searchPlaceholder="Search by parent, student, or transaction IDs..." :hasFilter="true"
          v-model:searchQuery="searchQuery" v-model:currentFilter="currentFilter" :filterOptions="[
            { label: 'All Transactions', value: 'all' },
            { label: 'Paid', value: 'paid' },
            { label: 'Pending', value: 'pending' },
            { label: 'Failed', value: 'failed' },
            { label: 'Cash Only', value: 'cash' },
            { label: 'Online Only', value: 'online' },
          ]">
          <template #row="{ item, index, headers }">
            <td class="ui-cell text-center" :style="{ width: headers[0].width }">
              {{ index + 1 }}
            </td>

            <td class="ui-cell" :style="{ width: headers[1].width }">
              <div class="ui-identity-cell">
                <div class="ui-avatar">
                  <img :src="item.parentProfile" :alt="item.parent" />
                </div>
                <div class="ui-identity-info">
                  <div class="flex items-center gap-2">
                    <span class="truncate block">{{ item.parent }}</span>
                  </div>
                  <div class="flex items-center gap-1.5 opacity-60">
                    <img :src="item.studentProfile" class="w-3 h-3 rounded-full" />
                    <span class="">{{ item.student }}</span>
                  </div>
                </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[2].width }">
              <span class="tracking-tighter tabular-nums">{{ item.receiptId
                }}</span>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[3].width }">
              <span v-if="item.transactionId" class="tabular-nums">{{
                item.transactionId }}</span>
              <span v-else class="">Undefined</span>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[4].width }">
              <AppBadge :status="'$' + formatPrice(item.amount)" :colorValue="item.paymentModeType" type="finance" />
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[5].width }">
              <AppBadge :status="item.bankName" :type="item.method === 'cash' ? 'green' : 'blue'" />
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[6].width }">
              <AppBadge :status="item.status" />
            </td>

            <td class="ui-cell text-center hidden lg:table-cell" :style="{ width: headers[7].width }">
              <div class="flex flex-col items-center">
                <span class="tabular-nums tracking-tight">{{
                  formatDate(item.date) }}</span>
                <span class=" mt-1">Settlement</span>
              </div>
            </td>
          </template>
        </DataTable>
      </template>
    </DataPageLayout>
  </DashboardLayout>
</template>
