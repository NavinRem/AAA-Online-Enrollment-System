<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useDataStore } from '../stores/dataStore'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import DataTable from '../components/common/data/DataTable.vue'
import DataMetricCard from '../components/common/data/DataMetricCard.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import AppBadge from '../components/common/ui/AppBadge.vue'
import BranchActionModal from '../components/branches/BranchActionModal.vue'
import { branchService } from '../services/branchService'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { formatPrice } from '@/utils/formatUtils'
import { useSearch, branchSearchMapper } from '../composables/useSearch'
import { isPaid, isPending } from '@/constants/status'

const dataStore = useDataStore()
const loading = ref(true)
const submitting = ref(false)
const showModal = ref(false)
const modalType = ref('add') // 'add', 'edit', 'delete'
const selectedBranch = ref(null)
const newlyCreatedId = ref(null)

const getRowClass = (item) => {
  return newlyCreatedId.value === item.id ? 'ui-row-new' : ''
}

const branchStatsMap = ref({})

const calculateAllBranchStats = () => {
  const branches = dataStore.branches
  const stats = {}
  branches.forEach((b) => {
    stats[b.id] = getBranchStats(b.id)
  })
  branchStatsMap.value = stats
}

const fetchData = async () => {
  loading.value = true
  try {
    await dataStore.fetchAllCommonData(true)
    calculateAllBranchStats()
  } catch (error) {
    console.error('Failed to fetch branches data', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

const statsCards = computed(() => {
  if (loading.value || !Object.keys(branchStatsMap.value).length) return []

  const branches = dataStore.branches
  const enrollments = dataStore.enrollments

  // 1. Top Enrolled Branch (All-time)
  let topBranchNames = []
  let maxStudents = 0
  branches.forEach((branch) => {
    const stats = branchStatsMap.value[branch.id]
    if (!stats) return
    const count = stats.lifetime.studying
    if (count > maxStudents) {
      maxStudents = count
      topBranchNames = [branch.name]
    } else if (count === maxStudents && count > 0) {
      topBranchNames.push(branch.name)
    }
  })

  // 2. Highest Earner Today
  const today = new Date().toISOString().split('T')[0]
  const todayEnrollments = enrollments.filter((e) => {
    const eDate = (e.enrollAt || e.createdAt || '').split('T')[0]
    return eDate === today
  })

  let bestEarnerNames = []
  let maxRevenue = 0
  const revByBranch = {}

  todayEnrollments
    .filter((e) => isPaid(e.paymentStatus))
    .forEach((e) => {
      const bid = e.branchId || e.class?.branch?.id || e.class?.branchId
      if (bid) revByBranch[bid] = (revByBranch[bid] || 0) + (e.amount || 0)
    })

  Object.entries(revByBranch).forEach(([bid, rev]) => {
    if (rev > maxRevenue) {
      maxRevenue = rev
      const b = branches.find((x) => x.id === bid)
      if (b) bestEarnerNames = [b.name]
    } else if (rev === maxRevenue && rev > 0) {
      const b = branches.find((x) => x.id === bid)
      if (b) bestEarnerNames.push(b.name)
    }
  })

  // 3. Activity metrics
  const activeBranchIds = new Set(
    todayEnrollments
      .map((e) => e.branchId || e.class?.branch?.id || e.class?.branchId)
      .filter(Boolean),
  )
  const enrolledValue = activeBranchIds.size
  const enrolledSubtitle = `${enrolledValue} Active Campus${enrolledValue !== 1 ? 'es' : ''}`

  const idleValue = branches.length - enrolledValue
  const idleSubtitle = idleValue > 0 ? `${idleValue} Branches inactive` : 'All Branches active'

  return [
    {
      label: 'Top Enrolled Branch',
      value: topBranchNames.length > 0 ? topBranchNames.join(', ') : '—',
      subtitle: maxStudents > 0 ? `${maxStudents} Studying Students` : 'No students enrolled',
      image: getImageUrl('dashboard/branch'),
    },
    {
      label: 'Highest Earner Today',
      value: bestEarnerNames.length > 0 ? bestEarnerNames.join(', ') : '—',
      subtitle: maxRevenue > 0 ? `Revenue: $${formatPrice(maxRevenue)}` : 'No revenue today',
      image: getImageUrl('dashboard/high-payment'),
    },
    {
      label: 'Enrolled Today',
      value: enrolledValue,
      subtitle: enrolledSubtitle,
      image: getImageUrl('dashboard/card-available-program'),
    },
    {
      label: 'No Enrollment Today',
      value: idleValue,
      subtitle: idleSubtitle,
      image: getImageUrl('dashboard/card-nearlyfull-program'),
    },
  ]
})

const branchHeaders = [
  { label: 'No', width: '45px', align: 'center' },
  { label: 'Branch Name', width: '150px' },
  { label: 'Abbr', width: '70px', align: 'center' },
  { label: 'Location', width: '200px' },
  { label: 'Contact', width: '120px' },
  { label: 'New (T)', width: '70px', align: 'center' },
  { label: 'Trial (T)', width: '70px', align: 'center' },
  { label: 'Rev (T)', width: '90px', align: 'center' },
  { label: 'New (W)', width: '70px', align: 'center' },
  { label: 'Trial (W)', width: '70px', align: 'center' },
  { label: 'Rev (W)', width: '90px', align: 'center' },
  { label: 'Class', width: '60px', align: 'center' },
  { label: 'Progs', width: '60px', align: 'center' },
  { label: 'Studying', width: '80px', align: 'center' },
  { label: 'Total Rev', width: '100px', align: 'center' },
  { label: 'Pending', width: '100px', align: 'center' },
  { label: 'Action', width: '60px', align: 'center' },
]

const { searchQuery, searchResults } = useSearch(
  computed(() => dataStore.branches),
  branchSearchMapper,
)

const filteredBranches = computed(() => {
  return [...searchResults.value].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
  )
})

const currentPage = ref(1)
const pageSize = 10
const totalItems = computed(() => filteredBranches.value.length)

const paginatedBranches = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredBranches.value.slice(start, end)
})

watch(searchQuery, () => {
  currentPage.value = 1
})

const getBranchStats = (branchId) => {
  const now = new Date()
  const localTodayStr = now.toLocaleDateString('en-CA') // YYYY-MM-DD local
  const weekAgoTimestamp = now.getTime() - 7 * 86400000

  const enrollments = dataStore.enrollments.filter(
    (e) =>
      e.branchId === branchId || e.class?.branch?.id === branchId || e.class?.branchId === branchId,
  )
  const trials = dataStore.trials.filter((t) => t.branchId === branchId)

  // TODAY
  const todayEnroll = enrollments.filter((e) => {
    const enrollDate = e.enrollAt || e.createdAt || ''
    return enrollDate.split('T')[0] === localTodayStr
  })
  const todayTrials = trials.filter((t) => {
    const trialDate = t.trialDate || t.createdAt || ''
    return trialDate.split('T')[0] === localTodayStr
  })
  const todayRev = todayEnroll
    .filter((e) => isPaid(e.paymentStatus))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

  // WEEK
  const weekEnroll = enrollments.filter((e) => {
    const timestamp = new Date(e.enrollAt || e.createdAt || 0).getTime()
    return timestamp >= weekAgoTimestamp
  })
  const weekTrials = trials.filter((tr) => {
    const timestamp = new Date(tr.trialDate || tr.createdAt || 0).getTime()
    return timestamp >= weekAgoTimestamp
  })
  const weekRev = weekEnroll
    .filter((e) => isPaid(e.paymentStatus))
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)

  // LIFETIME
  const classes = dataStore.classes.filter(
    (c) => c.branchId === branchId || c.branch?.id === branchId,
  )
  const programs = new Set(classes.map((c) => c.programId || c.program?.id)).size
  const studying = new Set(
    enrollments
      .filter((e) => isPaid(e.paymentStatus) && !['cancelled', 'deleted'].includes(e.status))
      .map((e) => e.studentId),
  ).size
  const totalRev = enrollments
    .filter((e) => isPaid(e.paymentStatus))
    .reduce((sum, e) => sum + (e.amount || 0), 0)
  const totalPending = enrollments
    .filter((e) => isPending(e.paymentStatus))
    .reduce((sum, e) => sum + (e.amount || 0), 0)

  return {
    today: { enroll: todayEnroll.length, trial: todayTrials.length, rev: todayRev },
    week: { enroll: weekEnroll.length, trial: weekTrials.length, rev: weekRev },
    lifetime: { classes: classes.length, programs, studying, totalRev, totalPending },
  }
}

const error = ref('')
const success = ref('')

const handleTableAction = ({ type, item }) => {
  selectedBranch.value = item
  modalType.value = type
  error.value = ''
  success.value = ''
  showModal.value = true
}

const openAddModal = () => {
  selectedBranch.value = null
  modalType.value = 'add'
  error.value = ''
  success.value = ''
  showModal.value = true
}

const handleActionSubmit = async (payload) => {
  submitting.value = true
  error.value = ''
  success.value = ''
  try {
    if (modalType.value === 'delete') {
      await branchService.deleteBranch(payload.id)
      success.value = 'Branch deleted successfully'
    } else if (modalType.value === 'edit') {
      await branchService.updateBranch(selectedBranch.value.id, payload)
      success.value = 'Branch updated successfully'
    } else {
      const res = await branchService.createBranch(payload)
      newlyCreatedId.value = res.id || res.UID
      success.value = 'Branch established successfully'
    }

    fetchData()
    // Auto close after 1.5s on success
    setTimeout(() => {
      if (showModal.value) {
        showModal.value = false
        selectedBranch.value = null
      }
    }, 1500)
  } catch (err) {
    error.value = err.message || 'Branch action failed'
    console.error('Branch action failed:', err)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Branch Overview">
      <template #overview>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DataMetricCard v-for="stat in statsCards" :key="stat.label" v-bind="stat" />
        </div>
      </template>

      <template #table>
        <DataTable
          title="Branch Lists"
          :headers="branchHeaders"
          :items="paginatedBranches"
          :loading="loading"
          entityName="branch"
          :flexible="true"
          :rowClass="getRowClass"
          :hasSearch="true"
          v-model:searchQuery="searchQuery"
          searchPlaceholder="Search branches..."
          :hasPagination="true"
          :totalItems="totalItems"
          :pageSize="pageSize"
          v-model:currentPage="currentPage"
          @action="handleTableAction"
        >
          <template #toolbar-actions>
            <AppButton
              variant="primary"
              size="md"
             
              @click="openAddModal"
            >
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
              <span class="font-bold tracking-tight">Add Branch</span>
            </AppButton>
          </template>

          <template #empty>
            <div class="py-20 text-center flex flex-col items-center gap-4 opacity-30 grayscale">
              <img :src="getImageUrl('dashboard/card-nearlyfull-program')" class="w-24" />
              <span class="text-sm font-bold text-black">No Branch Found</span>
            </div>
          </template>

          <template
            #row="{
              item,
              index,
              toggleMenu,
              activeMenuId,
              isMenuAbove,
              menuStyles,
              handleAction,
              closeMenu,
              headers,
            }"
          >
            <td class="ui-cell text-center" :style="{ width: headers[0].width }">
              {{ (currentPage - 1) * pageSize + index + 1 }}
            </td>

            <td class="ui-cell" :style="{ width: headers[1].width }">
              <span class="truncate block">{{ item.name }}</span>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[2].width }">
              <AppBadge :status="item.abbr" :type="item.color || 'blue'" />
            </td>

            <td class="ui-cell" :style="{ width: headers[3].width }">
              <span class="line-clamp-2 text-content-light" :title="item.location">
                {{ item.location || 'N/A' }}
              </span>
            </td>

            <td class="ui-cell" :style="{ width: headers[4].width }">
              <span>{{ item.phone || 'N/A' }}</span>
            </td>

            <!-- Today Section -->
            <td class="ui-cell text-center" :style="{ width: headers[5].width }">
              <AppBadge
                :status="
                  branchStatsMap[item.id]?.today.enroll > 0
                    ? '+' + branchStatsMap[item.id].today.enroll
                    : '0'
                "
                type="green"
              />
            </td>
            <td class="ui-cell text-center" :style="{ width: headers[6].width }">
              <AppBadge
                :status="
                  branchStatsMap[item.id]?.today.trial > 0
                    ? '+' + branchStatsMap[item.id].today.trial
                    : '0'
                "
                type="blue"
              />
            </td>
            <td class="ui-cell text-center" :style="{ width: headers[7].width }">
              <AppBadge
                :status="'$' + formatPrice(branchStatsMap[item.id]?.today.rev || 0)"
                type="magenta"
              />
            </td>

            <!-- Week Section -->
            <td class="ui-cell text-center" :style="{ width: headers[8].width }">
              <span class="tabular-nums">{{ branchStatsMap[item.id]?.week.enroll || 0 }}</span>
            </td>
            <td class="ui-cell text-center" :style="{ width: headers[9].width }">
              <span class="tabular-nums">{{ branchStatsMap[item.id]?.week.trial || 0 }}</span>
            </td>
            <td class="ui-cell text-center" :style="{ width: headers[10].width }">
              <AppBadge
                :status="'$' + formatPrice(branchStatsMap[item.id]?.week.rev || 0)"
                type="purple"
              />
            </td>

            <!-- Lifetime Section -->
            <td class="ui-cell text-center" :style="{ width: headers[11].width }">
              <span class="tabular-nums">{{ branchStatsMap[item.id]?.lifetime.classes || 0 }}</span>
            </td>
            <td class="ui-cell text-center" :style="{ width: headers[12].width }">
              <span class="tabular-nums">{{
                branchStatsMap[item.id]?.lifetime.programs || 0
              }}</span>
            </td>
            <td class="ui-cell text-center" :style="{ width: headers[13].width }">
              <span class="tabular-nums">{{
                branchStatsMap[item.id]?.lifetime.studying || 0
              }}</span>
            </td>
            <td class="ui-cell text-center" :style="{ width: headers[14].width }">
              <AppBadge
                :status="'$' + formatPrice(branchStatsMap[item.id]?.lifetime.totalRev || 0)"
                type="green"
              />
            </td>
            <td class="ui-cell text-center" :style="{ width: headers[15].width }">
              <AppBadge
                :status="'$' + formatPrice(branchStatsMap[item.id]?.lifetime.totalPending || 0)"
                type="orange"
              />
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[16].width }">
              <div class="ui-action-menu">
                <button
                  class="w-8 h-8 flex items-center justify-center hover:bg-surface-subtle rounded-lg transition-all text-content-muted hover:text-content-dark"
                  @click.stop="toggleMenu($event, item.id)"
                >
                  <span class="font-bold text-lg leading-none mb-1">⋮</span>
                </button>
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
                      v-if="activeMenuId === item.id"
                      class="ui-dropdown-menu"
                      :class="{ 'origin-bottom': isMenuAbove, 'origin-top': !isMenuAbove }"
                      :style="menuStyles"
                      @click.stop
                    >
                      <button
                        class="ui-dropdown-item ui-dropdown-item-info group"
                        @click="
                          () => {
                            handleAction('edit', item)
                            closeMenu()
                          }
                        "
                      >
                        <img
                          :src="getActionIcon('edit')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100"
                        />
                        <span>Edit</span>
                      </button>
                      <div class="h-px bg-surface-light mx-1 my-1"></div>
                      <button
                        class="ui-dropdown-item ui-dropdown-item-danger group font-bold tracking-tighter"
                        @click="
                          () => {
                            handleAction('delete', item)
                            closeMenu()
                          }
                        "
                      >
                        <img
                          :src="getActionIcon('delete')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100"
                        />
                        Delete
                      </button>
                    </div>
                  </transition>
                </Teleport>
              </div>
            </td>
          </template>
        </DataTable>
      </template>
    </DataPageLayout>

    <BranchActionModal
      :isOpen="showModal"
      :type="modalType"
      :loading="submitting"
      :branch="selectedBranch"
      :error="error"
      :success="success"
      @close="
        () => {
          showModal = false
          selectedBranch = null
        }
      "
      @submit="handleActionSubmit"
    />
  </DashboardLayout>
</template>
