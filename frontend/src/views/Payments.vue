<script setup>
import { ref, computed, onMounted } from 'vue'
import { formatDate, formatPrice } from '@/utils/formatUtils'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DataPageLayout from '@/components/layout/DataPageLayout.vue'
import DataTable from '@/components/common/data/DataTable.vue'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { enrollmentService } from '@/services/enrollmentService'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { useSearch, enrollmentSearchMapper } from '../composables/useSearch'

const enrollments = ref([])
const loading = ref(true)
const currentFilter = ref('all')

const fetchData = async () => {
  try {
    loading.value = true
    const data = await enrollmentService.getAllEnrollments()
    enrollments.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch payments data', error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

const paymentsData = computed(() => {
  return enrollments.value.map(e => ({
    id: e.id,
    parent: e.parent?.name || 'Unknown Parent',
    amount: e.amount || 0,
    method: e.paymentMethod || 'Pending',
    status: e.paymentStatus || e.status || 'unpaid',
    date: e.paidAt || e.enrollAt || e.createdAt,
    student: e.student?.name || 'Unknown Student',
    program: e.program?.name || 'Standard Program'
  }))
})

const statusFilteredPayments = computed(() => {
  if (currentFilter.value === 'all') return paymentsData.value
  return paymentsData.value.filter(p => {
    const s = String(p.status).toLowerCase()
    if (currentFilter.value === 'paid') return ['paid', 'confirmed', 'active', 'success'].includes(s)
    if (currentFilter.value === 'pending') return s === 'unpaid' || s === 'pending'
    return true
  })
})

const { searchQuery, searchResults: filteredPayments } = useSearch(
  statusFilteredPayments,
  (item) => ({
    ...item,
    // Custom mapper for payment search
    searchString: `${item.parent} ${item.student} ${item.program} ${item.method}`.toLowerCase()
  })
)

const paymentStats = computed(() => {
  const all = paymentsData.value
  const paid = all.filter(p => ['paid', 'confirmed', 'active', 'success'].includes(String(p.status).toLowerCase()))
  const pending = all.filter(p => String(p.status).toLowerCase() === 'unpaid' || String(p.status).toLowerCase() === 'pending')

  const totalRevenue = paid.reduce((sum, p) => sum + (p.amount || 0), 0)
  const pendingRevenue = pending.reduce((sum, p) => sum + (p.amount || 0), 0)

  return [
    {
      label: 'Financial Pipeline',
      value: all.length,
      image: getImageUrl('payment/total-transaction'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Net Yield',
      value: '$' + formatPrice(totalRevenue),
      image: getImageUrl('payment/total-revenue'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Accounts Receivable',
      value: '$' + formatPrice(pendingRevenue),
      image: getImageUrl('payment/unpaid-payment'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Settled Ratio',
      value: all.length > 0 ? Math.round((paid.length / all.length) * 100) + '%' : '0%',
      image: getImageUrl('dashboard/card-available-program'),
      color: 'var(--color-primary-light)',
    },
  ]
})

const paymentHeaders = [
  { label: 'NO', width: '100px', align: 'center', class: 'hidden md:table-cell' },
  { label: 'CLIENT IDENTITY' },
  { label: 'AMOUNT', align: 'center', width: '120px' },
  { label: 'METHOD', class: 'hidden sm:table-cell' },
  { label: 'STATUS', align: 'center', width: '120px' },
  { label: 'DATE', class: 'hidden lg:table-cell', width: '150px' },
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
        <DataTable title="Payment Lists" :headers="paymentHeaders" :items="filteredPayments" :loading="loading"
          searchPlaceholder="Search by parent, student, or program model..." :hasFilter="true"
          v-model:searchQuery="searchQuery" v-model:currentFilter="currentFilter" :filterOptions="[
            { label: 'All Transactions', value: 'all' },
            { label: 'Settled Only', value: 'paid' },
            { label: 'Outstanding Only', value: 'pending' },
          ]">
          <template #row="{ item, index, headers }">
            <td class="ui-cell text-center font-bold text-content-muted/20 hidden md:table-cell"
              :style="{ width: headers[0].width }">
              #{{ String(item.id).slice(-6).toUpperCase() }}
            </td>

            <td class="ui-cell min-w-[240px]" :style="{ flex: '1 1 0%' }">
              <div class="ui-identity-cell">
                <div class="ui-avatar bg-surface-subtle border border-outline-std flex items-center justify-center">
                  <span class="text-lg font-bold text-primary opacity-40">{{ item.parent.charAt(0) }}</span>
                </div>
                <div class="ui-identity-info">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-semibold text-content-dark truncate block">{{ item.parent }}</span>
                    <div class="w-1 h-1 rounded-full bg-content-muted/30"></div>
                    <span class="text-[10px] font-semibold text-content-muted">{{ item.student }}</span>
                  </div>
                  <div class="flex items-center gap-1.5 opacity-60">
                    <img :src="getActionIcon('enrollment')" class="w-3 h-3 grayscale" />
                    <span class="text-[9px] font-semibold text-content-muted uppercase tracking-widest leading-none">{{
                      item.program }}</span>
                  </div>
                </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[2].width }">
              <div
                class="inline-flex flex-col items-center px-4 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100/50">
                <span class="text-sm font-semibold text-emerald-700 tabular-nums tracking-tighter">${{
                  formatPrice(item.amount) }}</span>
                <span class="text-[8px] font-bold text-emerald-600/60 uppercase tracking-widest">Amount</span>
              </div>
            </td>

            <td class="ui-cell hidden sm:table-cell" :style="{ flex: '1 1 0%' }">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full" :class="item.method === 'Cash' ? 'bg-orange-400' : 'bg-blue-400'">
                </div>
                <span class="text-xs font-semibold text-content-dark uppercase tracking-tight">{{ item.method }}</span>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[4].width }">
              <AppBadge :status="item.status" />
            </td>

            <td class="ui-cell text-center hidden lg:table-cell" :style="{ width: headers[5].width }">
              <div class="flex flex-col items-center">
                <span class="text-[11px] font-semibold text-content-dark tabular-nums tracking-tight">{{
                  formatDate(item.date) }}</span>
                <span class="text-[8px] font-bold text-content-muted uppercase tracking-widest mt-1">Settlement</span>
              </div>
            </td>
          </template>
        </DataTable>
      </template>
    </DataPageLayout>
  </DashboardLayout>
</template>
