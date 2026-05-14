<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { formatDate, formatPrice } from '@/utils/formatUtils'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DataPageLayout from '@/components/layout/DataPageLayout.vue'
import DataTable from '@/components/common/data/DataTable.vue'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import { paymentService } from '@/services/paymentService'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { useSearch, paymentSearchMapper } from '@/composables/useSearch'
import AppButton from '@/components/common/ui/AppButton.vue'
import { isPaid, isPending } from '@/constants/status'
import { useDataStore } from '@/stores/dataStore'

const dataStore = useDataStore()
const enrollments = ref([])
const stats = ref(null)
const loading = ref(true)
const currentFilter = ref('all')

// Filters
const branchFilter = ref('all')
const dropdowns = ref({
  branch: false,
})
const filterMenuStyles = ref({})

const branchOptions = computed(() => {
  return dataStore.branches
    .filter((b) => !b.isDeleted)
    .map((b) => ({
      label: b.name,
      value: b.id,
      color: b.color,
      abbr: b.abbr,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
})

const toggleDropdown = (type, event) => {
  event.stopPropagation()
  const isOpening = !dropdowns.value[type]
  Object.keys(dropdowns.value).forEach((key) => {
    dropdowns.value[key] = false
  })
  dropdowns.value[type] = isOpening

  if (isOpening) {
    const rect = event.currentTarget.getBoundingClientRect()
    filterMenuStyles.value = {
      top: `${rect.bottom + window.scrollY + 8}px`,
      left: `${Math.min(rect.left + window.scrollX, window.innerWidth - 250)}px`,
      minWidth: '240px',
    }
  }
}

const selectFilter = (type, value) => {
  if (type === 'branch') branchFilter.value = value
  dropdowns.value[type] = false
}

const getActiveLabel = (type) => {
  if (type === 'branch') {
    if (branchFilter.value === 'all') return { label: 'All Branches', color: 'purple' }
    const opt = branchOptions.value.find((o) => String(o.value) === String(branchFilter.value))
    return {
      label: opt ? opt.label : 'Select Branch',
      color: opt?.color || 'purple',
    }
  }
  return { label: '' }
}

const handleClickOutside = (event) => {
  if (dropdowns.value.branch) {
    const btn = document.getElementById('branch-filter-btn')
    if (btn && !btn.contains(event.target)) {
      dropdowns.value.branch = false
    }
  }
}

const fetchData = async () => {
  try {
    loading.value = true
    const [paymentsData, financialStats] = await Promise.all([
      paymentService.getAllPayments(),
      paymentService.getFinancialStats(),
      dataStore.fetchBranches(),
    ])
    enrollments.value = Array.isArray(paymentsData) ? paymentsData : []
    stats.value = financialStats
  } catch (error) {
    console.error('Failed to fetch payments data', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  window.addEventListener('mousedown', handleClickOutside)
  fetchData()
})

onUnmounted(() => {
  window.removeEventListener('mousedown', handleClickOutside)
})

// 1. Base formatting
const formattedPayments = computed(() => {
  return enrollments.value.map((e) => ({
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
    termStatus: e.termStatus || 'unknown',
    branchId:
      e.branchId ||
      e.enrollment?.branchId ||
      e.class?.branchId ||
      e.branch?.id ||
      e.enrollment?.branch?.id,
  }))
})

// 2. Status filtering
const statusFilteredPayments = computed(() => {
  let list = formattedPayments.value

  // 1. Status Filter
  if (currentFilter.value !== 'all') {
    const filter = currentFilter.value.toLowerCase()
    list = list.filter((p) => {
      if (filter === 'paid') return isPaid(p.status)
      if (filter === 'pending') return isPending(p.status)
      if (filter === 'failed') return p.status === 'failed'
      if (filter === 'cash') return p.method === 'cash'
      if (filter === 'online') return p.method !== 'cash'
      return true
    })
  }

  // 2. Branch Filter
  if (branchFilter.value !== 'all') {
    list = list.filter((p) => String(p.branchId) === String(branchFilter.value))
  }

  return list
})

// 3. Search filtering
const { searchQuery, searchResults: searchedPayments } = useSearch(
  statusFilteredPayments,
  paymentSearchMapper,
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

watch([searchQuery, currentFilter, branchFilter], () => {
  currentPage.value = 1
})

const paymentStats = computed(() => {
  const pList =
    branchFilter.value === 'all'
      ? formattedPayments.value
      : formattedPayments.value.filter((p) => String(p.branchId) === String(branchFilter.value))

  // 1. Monthly Revenue (Current Month, Paid)
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const monthlyPaid = pList.filter((p) => {
    const d = new Date(p.date)
    return isPaid(p.status) && d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })
  const monthlyRevenue = monthlyPaid.reduce((sum, p) => sum + (p.amount || 0), 0)

  // 2. Pending Payments (Total Outstanding)
  const pendingPaid = pList.filter((p) => isPending(p.status))
  const pendingRevenue = pendingPaid.reduce((sum, p) => sum + (p.amount || 0), 0)

  // 3. Collection Overview (Cash vs Online)
  const paidList = pList.filter((p) => isPaid(p.status))
  const cashPaid = paidList
    .filter((p) => p.method === 'cash')
    .reduce((sum, p) => sum + (p.amount || 0), 0)
  const onlinePaid = paidList.reduce((sum, p) => sum + (p.amount || 0), 0) - cashPaid

  return [
    {
      label: 'Monthly Revenue',
      value: '$' + formatPrice(monthlyRevenue),
      subtitle: `${monthlyPaid.length} Settlements This Month`,
      image: getImageUrl('payment/total-revenue'),
    },
    {
      label: 'Pending Payments',
      value: '$' + formatPrice(pendingRevenue),
      subtitle: `${pendingPaid.length} Outstanding Records`,
      image: getImageUrl('payment/unpaid-payment'),
    },
    {
      label: 'Cash Collection',
      value: '$' + formatPrice(cashPaid),
      subtitle: 'Physical Currency',
      image: getImageUrl('payment/total-transaction'),
    },
    {
      label: 'Online Collection',
      value: '$' + formatPrice(onlinePaid),
      subtitle: 'Bank & Transfers',
      image: getImageUrl('payment/total-revenue'),
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
  { label: 'Date', align: 'center', class: 'hidden lg:table-cell', width: '150px' },
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
        <DataTable
          title="Payment Lists"
          :headers="paymentHeaders"
          :items="paginatedPayments"
          :loading="loading"
          :hasPagination="true"
          :currentPage="currentPage"
          :pageSize="pageSize"
          :totalItems="totalItems"
          @update:currentPage="currentPage = $event"
          searchPlaceholder="Search by parent, student, or transaction IDs..."
          :hasFilter="true"
          v-model:searchQuery="searchQuery"
          v-model:currentFilter="currentFilter"
          :filterOptions="[
            { label: 'All Transactions', value: 'all' },
            { label: 'Paid', value: 'paid' },
            { label: 'Pending', value: 'pending' },
            { label: 'Failed', value: 'failed' },
            { label: 'Cash Only', value: 'cash' },
            { label: 'Online Only', value: 'online' },
          ]"
        >
          <template #toolbar-actions>
            <div class="flex items-center gap-3">
              <!-- Branch Filter -->
              <div class="relative" id="branch-filter-btn">
                <AppButton
                  :variant="branchFilter === 'all' ? 'secondary' : 'ghost'"
                  size="md"
                  @click="toggleDropdown('branch', $event)"
                  class="rounded-xl transition-all duration-300 group"
                  :class="{
                    '!text-white shadow-md': branchFilter !== 'all',
                    'shadow-sm': branchFilter === 'all',
                  }"
                  :style="
                    branchFilter !== 'all'
                      ? { backgroundColor: `var(--color-${getActiveLabel('branch').color})` }
                      : {}
                  "
                >
                  <img
                    :src="getActionIcon('branch')"
                    class="w-4 h-4 brightness-0 transition-all opacity-80 group-hover:opacity-100"
                    :class="{ invert: branchFilter !== 'all' }"
                  />
                  <span
                    class="font-bold tracking-tight"
                    :class="{ 'text-white': branchFilter !== 'all' }"
                    >{{ getActiveLabel('branch').label }}</span
                  >
                  <span
                    class="ml-2 text-xs opacity-60 group-hover:opacity-100"
                    :class="{ 'text-white': branchFilter !== 'all' }"
                    >▼</span
                  >
                </AppButton>
                <Teleport to="body">
                  <transition
                    enter-active-class="transition duration-200 ease-out"
                    enter-from-class="transform scale-95 opacity-0"
                    enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-150 ease-in"
                    leave-from-class="opacity-100"
                    leave-to-class="opacity-0"
                  >
                    <div
                      v-if="dropdowns.branch"
                      class="toolbar-filter-menu"
                      :style="filterMenuStyles"
                      @mousedown.stop
                    >
                      <div
                        class="toolbar-filter-option flex items-center justify-between gap-4"
                        :class="{ 'active-filter-item': branchFilter === 'all' }"
                        @click="selectFilter('branch', 'all')"
                      >
                        <div class="flex items-center gap-3">
                          <AppBadge status="ALL" type="gray" size="sm" class="w-12 text-center" />
                          <span>All Branches</span>
                        </div>
                      </div>
                      <div
                        v-for="opt in branchOptions"
                        :key="opt.value"
                        class="toolbar-filter-option flex items-center justify-between gap-4"
                        :class="{
                          'active-filter-item': String(branchFilter) === String(opt.value),
                        }"
                        @click="selectFilter('branch', opt.value)"
                      >
                        <div class="flex items-center gap-3">
                          <AppBadge
                            :status="opt.abbr"
                            :type="opt.color"
                            size="sm"
                            class="w-12 text-center"
                          />
                          <span class="truncate">{{ opt.label }}</span>
                        </div>
                        <span v-if="String(branchFilter) === String(opt.value)" class="text-xs"
                          >✓</span
                        >
                      </div>
                    </div>
                  </transition>
                </Teleport>
              </div>
            </div>
          </template>
          <template #row="{ item, index, headers }">
            <td class="ui-cell text-center" :style="{ width: headers[0].width }">
              <span class="font-bold text-content-dark text-sm">{{ index + 1 }}</span>
            </td>

            <td class="ui-cell" :style="{ width: headers[1].width }">
              <div class="ui-identity-cell">
                <div class="ui-avatar">
                  <img :src="item.parentProfile" :alt="item.parent" />
                </div>
                <div class="ui-identity-info">
                  <div class="flex items-center gap-2">
                    <span class="truncate block font-bold text-content-dark text-sm">{{
                      item.parent
                    }}</span>
                  </div>
                  <div class="flex items-center gap-1.5 opacity-60">
                    <img :src="item.studentProfile" class="w-3 h-3 rounded-full" />
                    <span class="text-3xs font-bold text-content-muted">{{ item.student }}</span>
                  </div>
                </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[2].width }">
              <span class="text-xs font-bold text-content-dark tracking-tighter tabular-nums">{{
                item.receiptId
              }}</span>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[3].width }">
              <span
                v-if="item.transactionId"
                class="text-xs font-bold text-content-muted tabular-nums"
                >{{ item.transactionId }}</span
              >
              <span v-else class="opacity-30">—</span>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[4].width }">
              <AppBadge :status="'$' + formatPrice(item.amount)" type="green" />
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[5].width }">
              <AppBadge :status="item.method" type="blue" />
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[6].width }">
              <AppBadge :status="item.status" />
            </td>

            <td
              class="ui-cell text-center hidden lg:table-cell"
              :style="{ width: headers[7].width }"
            >
              <div class="flex flex-col items-center">
                <span class="text-xs font-bold text-content-dark tabular-nums tracking-tight">{{
                  formatDate(item.date)
                }}</span>
                <span class="text-3xs font-bold text-content-muted mt-1 uppercase tracking-tighter"
                  >Settlement</span
                >
              </div>
            </td>
          </template>
        </DataTable>
      </template>
    </DataPageLayout>
  </DashboardLayout>
</template>

<style scoped>
.toolbar-filter-menu {
  @apply fixed bg-white rounded-md shadow-2xl border border-outline-std z-[10000] p-xs min-w-[240px] max-h-[300px] overflow-y-auto;
}

.toolbar-filter-option {
  @apply px-md py-sm text-sm font-semibold cursor-pointer transition-all rounded-sm select-none flex items-center gap-2;
}

.toolbar-filter-option:hover {
  @apply bg-surface-subtle text-primary;
}

.active-filter-item {
  @apply bg-primary text-white hover:bg-primary hover:text-white !important;
}
</style>
