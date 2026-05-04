<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DataPageLayout from '@/components/layout/DataPageLayout.vue'
import DataTable from '@/components/common/data/DataTable.vue'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import TermActionModal from '@/components/terms/TermActionModal.vue'

import { termService } from '@/services/termService'
import { getActionIcon, getImageUrl } from '@/utils/assetHelper'
import { formatDateOnly, calculateClassProgress } from '@/utils/formatUtils'
import { useSearch } from '@/composables/useSearch'

const loading = ref(false)
const items = ref([])
const branches = ref([])

const headers = [
  { label: 'NO', width: '50px', align: 'center' },
  { label: 'TERM NAME', width: '220px' },
  { label: 'BRANCH', width: '120px', align: 'center' },
  { label: 'START DATE', width: '140px', align: 'center' },
  { label: 'END DATE', width: '140px', align: 'center' },
  { label: 'SESSIONS', width: '100px', align: 'center' },
  { label: 'DURATION', width: '120px', align: 'center' },
  { label: 'STATUS', width: '120px', align: 'center' },
  { label: 'ACTION', width: '80px', align: 'center' },
]

const fetchData = async () => {
  loading.value = true
  try {
    const [termData, branchData] = await Promise.all([
      termService.getAllTerms(),
      import('@/services/branchService').then(m => m.branchService.getAllBranches())
    ])

    const terms = Array.isArray(termData) ? termData : []
    branches.value = Array.isArray(branchData) ? branchData : []

    // Status Synchronization: Ensure stored status matches date-based logic
    const syncTasks = []
    terms.forEach(term => {
      const prog = calculateClassProgress(term.startDate, term.endDate)
      const calculatedStatus = prog.status.toLowerCase()

      if (term.status !== calculatedStatus) {
        syncTasks.push(termService.updateTerm(term.id, { status: calculatedStatus }))
        term.status = calculatedStatus // Update local state for immediate feedback
      }
    })

    if (syncTasks.length > 0) {
      console.log(`[TermSync] Updating ${syncTasks.length} term statuses to maintain data integrity.`)
      await Promise.all(syncTasks)
    }

    items.value = terms.map(t => ({
      ...t,
      branchIds: t.branchIds || (t.branchId ? [t.branchId] : []),
      totalSessions: t.totalSessions || 11
    }))
  } catch (err) {
    console.error('Failed to fetch terms', err)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

// Search Logic
const { searchQuery, searchResults } = useSearch(items, (item) => {
  const branchText = (item.branchIds || []).join(' ')
  return `${item.name} ${item.status} ${branchText}`
})

// Metrics logic
const statsCards = computed(() => {
  const stats = items.value.map(item => calculateClassProgress(item.startDate, item.endDate))
  return [
    {
      label: 'Total Terms',
      value: items.value.length,
      image: getImageUrl('enrollment/total-enrollment'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Active Terms',
      value: stats.filter(s => s.status === 'Active' || s.status === 'Ongoing').length,
      image: getImageUrl('dashboard/card-active-program'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Upcoming Terms',
      value: stats.filter(s => s.status === 'Upcoming').length,
      image: getImageUrl('dashboard/card-upcoming-program'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Archived Terms',
      value: stats.filter(s => s.isArchived).length,
      image: getImageUrl('programs/archived-program'),
      color: 'var(--color-primary-light)',
    },
  ]
})

const newlyCreatedId = ref(null)

const getRowClass = (item) => {
  return newlyCreatedId.value === item.id ? 'ui-row-new' : ''
}

const modal = ref({
  isOpen: false,
  type: 'add',
  submitting: false,
  selectedTerm: null,
  error: '',
  success: '',
})

const openModal = (type = 'add', item = null) => {
  modal.value.selectedTerm = item
  modal.value.type = type
  modal.value.error = ''
  modal.value.success = ''
  modal.value.isOpen = true
}

const handleTableAction = ({ type, item }) => {
  openModal(type, item)
}

const handleActionSubmit = async (payload) => {
  modal.value.submitting = true
  modal.value.error = ''
  modal.value.success = ''

  try {
    if (modal.value.type === 'delete') {
      await termService.deleteTerm(payload.id)
      modal.value.success = 'Term deleted successfully'
    } else if (modal.value.type === 'edit') {
      await termService.updateTerm(modal.value.selectedTerm.id, payload)
      modal.value.success = 'Term updated successfully'
    } else {
      const res = await termService.createTerm(payload)
      newlyCreatedId.value = res.id || res.UID
      modal.value.success = 'Term created successfully'
    }

    fetchData()
    // Auto close after 1.5s on success
    setTimeout(() => {
      if (modal.value.isOpen) {
        modal.value.isOpen = false
        modal.value.selectedTerm = null
      }
    }, 1500)
  } catch (err) {
    modal.value.error = err.message || 'Term action failed'
    console.error('Term action failed:', err)
  } finally {
    modal.value.submitting = false
  }
}

const statusFilter = ref('all')

const sortedItems = computed(() => {
  return [...searchResults.value].sort((a, b) => {
    const progA = calculateClassProgress(a.startDate, a.endDate)
    const progB = calculateClassProgress(b.startDate, b.endDate)

    const getPriority = (p) => {
      if (p.isOngoing) return 3
      if (p.isArchived) return 0
      if (p.status === 'Active') return 2
      if (p.status === 'Upcoming') return 1
      return -1
    }

    const prioA = getPriority(progA)
    const prioB = getPriority(progB)

    if (prioA !== prioB) return prioB - prioA
    return new Date(b.startDate) - new Date(a.startDate)
  })
})

const displayItems = computed(() => {
  if (statusFilter.value === 'all') return sortedItems.value
  return sortedItems.value.filter(item => {
    const prog = calculateClassProgress(item.startDate, item.endDate)
    if (statusFilter.value === 'upcoming') return prog.status === 'Upcoming'
    if (statusFilter.value === 'active') return prog.status === 'Active' || prog.status === 'Ongoing'
    if (statusFilter.value === 'archived') return prog.isArchived
    return true
  })
})

const filterOptions = [
  { label: 'All Terms', value: 'all' },
  { label: 'Upcoming', value: 'upcoming', color: 'blue' },
  { label: 'Active', value: 'active', color: 'success' },
  { label: 'Archived', value: 'archived', color: 'neutral' },
]

const handleDelete = async (item) => {
  if (!confirm(`Are you sure you want to delete this academic term?`)) return
  try {
    await termService.deleteTerm(item.id)
    fetchData()
  } catch (err) {
    console.error('Failed to delete term', err)
  }
}

const getTermBranches = (branchIds) => {
  if (!branchIds || branchIds.length === 0) return [{ name: 'All Branches', abbr: 'ALL', color: 'neutral' }]
  return branchIds.map(id => {
    const b = branches.value.find(b => b.id === id)
    return b ? { ...b } : { name: 'Unknown', abbr: '??', color: 'neutral' }
  })
}

const isTermReadOnly = (item) => {
  const prog = calculateClassProgress(item.startDate, item.endDate)
  return prog.status === 'Active' || prog.status === 'Ongoing' || prog.isArchived
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Term Overview">
      <template #overview>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DataMetricCard v-for="(card, index) in statsCards" :key="index" v-bind="card" />
        </div>
      </template>

      <template #table>
        <DataTable title="Term Lists" :headers="headers" :items="displayItems" :loading="loading" entityName="term"
          v-model:search="searchQuery" hasFilter v-model:currentFilter="statusFilter" :filterOptions="filterOptions"
          :rowClass="getRowClass" @action="handleTableAction">
          <template #toolbar-actions>
            <AppButton variant="primary" size="md" class="rounded-xl shadow-lg shadow-primary/20"
              @click="openModal('add')">
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
              <span class="font-black tracking-tight">Add Term</span>
            </AppButton>
          </template>

          <template #row="{ item, index, headers, toggleMenu, activeMenuId, isMenuAbove, menuStyles, closeMenu }">
            <td class="ui-cell text-center" :style="{ width: headers[0].width }">
              <span v-if="calculateClassProgress(item.startDate, item.endDate).isOngoing" class="text-xs">🔥</span>
              <span v-else>{{ index + 1 }}</span>
            </td>

            <td class="ui-cell" :style="{ width: headers[1].width }">
              <div class="flex items-center gap-4 group">
                <div
                  class="w-10 h-10 rounded-xl bg-surface-subtle border border-outline-std overflow-hidden flex items-center justify-center">
                  <img :src="getImageUrl('dashboard/card-top-program')" class="w-6 h-6" />
                </div>
                <div class="flex flex-col">
                  <span class="font-black text-content-dark tracking-tighter text-sm leading-tight">{{ item.name
                  }}</span>
                </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[2].width }">
              <div class="flex flex-wrap justify-center gap-1 max-w-[150px] mx-auto">
                <AppBadge v-for="b in getTermBranches(item.branchIds)"
                  :key="b.id || b.abbr" :status="b.abbr" :type="b.color || 'blue'" />
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[3].width }">
              <div class="flex justify-center">
                <AppBadge :status="formatDateOnly(item.startDate)" type="green" />
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[4].width }">
              <div class="flex justify-center">
                <AppBadge :status="formatDateOnly(item.endDate)" type="red" />
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[5].width }">
              <div class="flex items-center gap-xs justify-center">
                <span class="text-sm font-black text-primary">
                  {{ calculateClassProgress(item.startDate, item.endDate).remainingSessions }}
                </span>
                <span class="text-xs font-black text-content-muted uppercase">Remaining</span>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[6].width }">
              <div class="flex items-center gap-xs justify-center">
                <span class="text-xs font-black text-content-dark"
                  :class="{ 'text-error': item.totalSessions !== calculateClassProgress(item.startDate, item.endDate).totalWeeks }">
                  {{ calculateClassProgress(item.startDate, item.endDate).totalWeeks }}
                </span>
                <span class="text-xs font-black text-content-muted uppercase tracking-widest"
                  :class="{ 'text-error/60': item.totalSessions !== calculateClassProgress(item.startDate, item.endDate).totalWeeks }">
                  {{ item.totalSessions === calculateClassProgress(item.startDate, item.endDate).totalWeeks ?
                    'Weeks' : '⚠️ Misaligned' }}
                </span>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[7].width }">
              <AppBadge :status="calculateClassProgress(item.startDate, item.endDate).status" />
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[8].width }">
              <div class="ui-action-menu">
                <button
                  class="w-8 h-8 flex items-center justify-center hover:bg-surface-subtle rounded-lg transition-all text-content-muted hover:text-content-dark"
                  @click.stop="toggleMenu($event, item.id)">
                  <span class="font-black text-lg leading-none mb-1">⋮</span>
                </button>

                <Teleport to="body">
                  <transition enter-active-class="transition duration-200 ease-out"
                    enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100"
                    leave-to-class="opacity-0">
                    <div v-if="activeMenuId === item.id" class="ui-dropdown-menu"
                      :class="{ 'origin-bottom': isMenuAbove, 'origin-top': !isMenuAbove }" :style="menuStyles"
                      @click.stop>
                      <template v-if="!isTermReadOnly(item)">
                        <button class="ui-dropdown-item ui-dropdown-item-info group"
                          @click="() => { openModal('edit', item); closeMenu(); }">
                          <img :src="getActionIcon('edit')" class="w-4 h-4 opacity-40 group-hover:opacity-100" />
                          <span class="font-bold">Edit</span>
                        </button>
                        <div class="h-px bg-surface-light mx-1 my-1"></div>
                      </template>
                      <button class="ui-dropdown-item ui-dropdown-item-danger group font-black tracking-tighter"
                        @click="() => { handleTableAction({ type: 'delete', item }); closeMenu(); }">
                        <img :src="getActionIcon('delete')" class="w-4 h-4 opacity-40 group-hover:opacity-100" />
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

    <TermActionModal :isOpen="modal.isOpen" :type="modal.type" :loading="modal.submitting" :term="modal.selectedTerm"
      :branches="branches" :error="modal.error" :success="modal.success"
      @close="() => { modal.isOpen = false; modal.selectedTerm = null; }" @submit="handleActionSubmit" />
  </DashboardLayout>
</template>
