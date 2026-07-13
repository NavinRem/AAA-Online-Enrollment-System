<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useDataStore } from '../stores/dataStore'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import DataMetricCard from '../components/common/data/DataMetricCard.vue'
import DataTable from '../components/common/data/DataTable.vue'
import AppBadge from '../components/common/ui/AppBadge.vue'
import AuditBadge from '../components/common/ui/AuditBadge.vue'
import TrialActionModal from '../components/trials/TrialActionModal.vue'

import { trialService } from '@/services/trialService'
import { useSearch, trialSearchMapper } from '../composables/useSearch'
import {
  getImageUrl,
  getActionIcon,
  getProgramProfileURL,
  getParentProfileURL,
  getStudentProfileURL,
} from '@/utils/assetHelper'
import { formatDateOnly } from '@/utils/formatUtils'

const dataStore = useDataStore()

const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const newlyCreatedId = ref(null)
const currentFilter = ref('all')
const timelineFilter = ref('all') // 'all' | 'today' | 'week' | 'month'
const branchFilter = ref('all')

// Filter dropdown state
const dropdowns = ref({ timeline: false, branch: false })
const filterMenuStyles = ref({})

const toggleDropdown = (type, event) => {
  event.stopPropagation()
  const isOpening = !dropdowns.value[type]
  Object.keys(dropdowns.value).forEach((k) => (dropdowns.value[k] = false))
  dropdowns.value[type] = isOpening
  if (isOpening) {
    const rect = event.currentTarget.getBoundingClientRect()
    filterMenuStyles.value = {
      top: `${rect.bottom + window.scrollY + 8}px`,
      left: `${Math.min(rect.left + window.scrollX, window.innerWidth - 250)}px`,
      minWidth: '210px',
    }
  }
}

const selectFilter = (type, value) => {
  if (type === 'timeline') timelineFilter.value = value
  if (type === 'branch') branchFilter.value = value
  dropdowns.value[type] = false
}

const handleFilterClickOutside = (e) => {
  const ids = ['trial-timeline-btn', 'trial-branch-btn']
  if (ids.every((id) => !document.getElementById(id)?.contains(e.target))) {
    dropdowns.value.timeline = false
    dropdowns.value.branch = false
  }
}

const branchOptions = computed(() =>
  dataStore.branches
    .filter((b) => !b.isDeleted)
    .map((b) => ({ label: b.name, value: b.id, color: b.color, abbr: b.abbr }))
    .sort((a, b) => a.label.localeCompare(b.label)),
)

const timelineOptions = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
]

const getTimelineLabel = () =>
  timelineOptions.find((o) => o.value === timelineFilter.value)?.label ?? 'All Time'
const getBranchLabel = () => {
  if (branchFilter.value === 'all') return { label: 'All Branches', color: 'purple' }
  const opt = branchOptions.value.find((o) => String(o.value) === String(branchFilter.value))
  return { label: opt?.label ?? 'Branch', color: opt?.color ?? 'purple' }
}

const getRowClass = (item) => {
  return newlyCreatedId.value === item.id ? 'ui-row-new' : ''
}

const fetchData = async () => {
  loading.value = true
  try {
    await dataStore.fetchAllCommonData(true)
  } catch (error) {
    console.error('Failed to fetch trials data', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  window.addEventListener('mousedown', handleFilterClickOutside)
  fetchData()
})

onUnmounted(() => {
  window.removeEventListener('mousedown', handleFilterClickOutside)
})

const trialStats = computed(() => {
  const totalcount = dataStore.trials.length

  // Booked: From trialType field
  const bookedCount = dataStore.trials.filter((t) => t.trialType === 'booked').length

  // Walk-in: From trialType field
  const walkinCount = dataStore.trials.filter((t) => t.trialType === 'walk-in').length

  // Success: From isSuccessful field
  const successCount = dataStore.trials.filter((t) => t.isSuccessful).length

  return [
    {
      label: 'Total Trials',
      value: totalcount,
      image: getImageUrl('enrollment/total-enrollment'),
    },
    {
      label: 'Booked Trials',
      value: bookedCount,
      image: getImageUrl('enrollment/today-enrollment'),
    },
    {
      label: 'Walk-in Trials',
      value: walkinCount,
      image: getImageUrl('enrollment/total-unpaid-enrollment'),
    },
    {
      label: 'Successful Trials',
      value: successCount,
      image: getImageUrl('enrollment/total-paid-enrollment'),
    },
  ]
})

const trialHeaders = [
  { label: 'No', width: '50px', align: 'center', class: 'hidden md:table-cell' },
  { label: 'Parent' },
  { label: 'Student' },
  { label: 'Program' },
  { label: 'Branch', width: '120px', align: 'center' },
  { label: 'Status', width: '120px', align: 'center' },
  { label: 'Type', width: '120px', align: 'center' },
  { label: 'Trial Date', width: '200px', align: 'center' },
  { label: 'Modified By', width: '140px', align: 'left' },
  { label: 'Action', width: '60px', align: 'center' },
]

const statusFilteredTrials = computed(() => {
  // Enrich trials with full program details from the store
  const trials = dataStore.trials.map((trial) => {
    const programId = trial.programId || trial.program?.id
    const program = dataStore.programs.find((p) => String(p.id) === String(programId))
    const category = program
      ? dataStore.categories.find(
          (c) => String(c.id) === String(program.categoryId) || c.name === program.category,
        )
      : null

    const branchId = trial.branchId || trial.branch?.id
    const branch = dataStore.branches.find((b) => String(b.id) === String(branchId))

    return {
      ...trial,
      program: {
        ...trial.program,
        ...(program || {}),
        category: category?.name || program?.category || trial.program?.category,
        categoryProfileURL: category?.profileURL || '',
      },
      branch: branch || trial.branch,
    }
  })

  let filtered = [...trials]

  if (currentFilter.value === 'booked') filtered = filtered.filter((t) => t.trialType === 'booked')
  else if (currentFilter.value === 'walk-in')
    filtered = filtered.filter((t) => t.trialType === 'walk-in')
  else if (currentFilter.value === 'successful') filtered = filtered.filter((t) => t.isSuccessful)

  // Default Sort: Newest first (by createdAt or trialDate)
  return filtered.sort((a, b) => {
    const dateA = new Date(a.createdAt || a.trialDate || 0)
    const dateB = new Date(b.createdAt || b.trialDate || 0)
    return dateB - dateA
  })
})

// Timeline + Branch filter applied after status filter
const timelineBranchFiltered = computed(() => {
  let list = statusFilteredTrials.value

  if (timelineFilter.value !== 'all') {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    const weekStartStr = weekStart.toISOString().split('T')[0]
    const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

    list = list.filter((t) => {
      const rawDate = t.trialDate || t.createdAt
      if (!rawDate) return false
      const dateStr = String(rawDate).split('T')[0]
      if (timelineFilter.value === 'today') return dateStr === todayStr
      if (timelineFilter.value === 'week') return dateStr >= weekStartStr && dateStr <= todayStr
      if (timelineFilter.value === 'month') return dateStr.startsWith(monthStr)
      return true
    })
  }

  if (branchFilter.value !== 'all') {
    list = list.filter((t) => String(t.branch?.id || t.branchId) === String(branchFilter.value))
  }

  return list
})

const { searchQuery, searchResults: filteredTrials } = useSearch(
  timelineBranchFiltered,
  trialSearchMapper,
)

const currentPage = ref(1)
const pageSize = 10
const totalItems = computed(() => filteredTrials.value.length)

const paginatedTrials = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredTrials.value.slice(start, end)
})

watch([currentFilter, searchQuery, timelineFilter, branchFilter], () => {
  currentPage.value = 1
})

const submitActionModal = async (payload) => {
  const { type, trial } = actionState.value
  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (type === 'delete') {
      await trialService.deleteTrial(trial.id)
      successMessage.value = 'Trial permanently deleted.'
    } else {
      if (type === 'edit') {
        await trialService.updateTrial(trial.id, payload)
        successMessage.value = 'Trial engagement successfully updated.'
      } else {
        const res = await trialService.createTrial(payload)
        newlyCreatedId.value = res.id
        successMessage.value = 'New trial session successfully booked.'
      }
    }

    // Refresh immediately to update dropdowns and tables
    fetchData()

    setTimeout(() => {
      closeActionModal()
    }, 1500)
  } catch (err) {
    errorMessage.value = err.message || 'Failed to complete action.'
    console.error(err)
  } finally {
    submitting.value = false
  }
}

const closeActionModal = () => {
  actionState.value.isOpen = false
  errorMessage.value = ''
  successMessage.value = ''
}

const actionState = ref({
  isOpen: false,
  type: '',
  trial: null,
})

const handleTableAction = ({ type, item }) => {
  actionState.value = { isOpen: true, type, trial: item }
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Trial Overview">
      <template #overview>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DataMetricCard v-for="stat in trialStats" :key="stat.label" v-bind="stat" />
        </div>
      </template>

      <template #table>
        <DataTable
          title="Trial Lists"
          :headers="trialHeaders"
          :items="paginatedTrials"
          entityName="trial"
          :loading="loading"
          :hasPagination="true"
          :flexible="true"
          :pageSize="pageSize"
          :totalItems="totalItems"
          v-model:currentPage="currentPage"
          v-model:searchQuery="searchQuery"
          searchPlaceholder="Search by name, program or guest..."
          :hasFilter="true"
          v-model:currentFilter="currentFilter"
          :filterOptions="[
            { label: 'All Trials', value: 'all' },
            { label: 'Booked', value: 'booked' },
            { label: 'Walk-in', value: 'walk-in' },
            { label: 'Successful', value: 'successful' },
          ]"
          :rowClass="getRowClass"
          @action="handleTableAction"
        >
          <template #toolbar-actions>
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Timeline Filter -->
              <div class="relative" id="trial-timeline-btn">
                <AppButton
                  :variant="timelineFilter === 'all' ? 'secondary' : 'primary'"
                  size="md"
                  @click="toggleDropdown('timeline', $event)"
                >
                  <img
                    :src="getActionIcon('time')"
                    class="w-4 h-4 brightness-0 opacity-80"
                    :class="{ invert: timelineFilter !== 'all' }"
                  />
                  <span class="font-bold tracking-tight">{{ getTimelineLabel() }}</span>
                  <span class="ml-1 text-xs opacity-60">▼</span>
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
                      v-if="dropdowns.timeline"
                      class="toolbar-filter-menu"
                      :style="filterMenuStyles"
                      @mousedown.stop
                    >
                      <div
                        v-for="opt in timelineOptions"
                        :key="opt.value"
                        class="toolbar-filter-option flex items-center justify-between gap-3"
                        :class="{ 'active-filter-item': timelineFilter === opt.value }"
                        @click="selectFilter('timeline', opt.value)"
                      >
                        <span>{{ opt.label }}</span>
                        <span v-if="timelineFilter === opt.value" class="text-xs">✓</span>
                      </div>
                    </div>
                  </transition>
                </Teleport>
              </div>

              <!-- Branch Filter -->
              <div class="relative" id="trial-branch-btn">
                <AppButton
                  :variant="branchFilter === 'all' ? 'secondary' : 'ghost'"
                  size="md"
                  @click="toggleDropdown('branch', $event)"
                  :style="
                    branchFilter !== 'all'
                      ? { backgroundColor: `var(--color-${getBranchLabel().color})` }
                      : {}
                  "
                  :class="{
                    '!text-white shadow-md': branchFilter !== 'all',
                    'shadow-sm': branchFilter === 'all',
                  }"
                >
                  <img
                    :src="getActionIcon('branch')"
                    class="w-4 h-4 brightness-0 opacity-80"
                    :class="{ invert: branchFilter !== 'all' }"
                  />
                  <span
                    class="font-bold tracking-tight"
                    :class="{ 'text-white': branchFilter !== 'all' }"
                    >{{ getBranchLabel().label }}</span
                  >
                  <span
                    class="ml-1 text-xs opacity-60"
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

              <!-- New Trial -->
              <AppButton
                variant="primary"
                size="md"
                @click="actionState = { isOpen: true, type: 'add', trial: null }"
              >
                <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
                <span class="font-bold tracking-tight">New Trial</span>
              </AppButton>
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
            <td
              class="ui-cell text-center hidden md:table-cell"
              :style="{ width: headers[0].width }"
            >
              {{ (currentPage - 1) * pageSize + index + 1 }}
            </td>

            <!-- Parent Column -->
            <td class="ui-cell">
              <div class="ui-identity-cell">
                <div class="ui-avatar">
                  <img :src="getParentProfileURL(item.parent?.profileURL)" alt="parent" />
                </div>
                <div class="ui-identity-info">
                  <span class="truncate block">{{
                    item.parent?.name || item.guestParentName || 'Guest Parent'
                  }}</span>
                </div>
              </div>
            </td>

            <!-- Student Column -->
            <td class="ui-cell">
              <div class="ui-identity-cell">
                <div class="ui-avatar">
                  <img :src="getStudentProfileURL(item.student?.profileURL)" alt="student" />
                </div>
                <div class="ui-identity-info">
                  <span class="truncate block">{{
                    item.student?.name || item.guestStudentName
                  }}</span>
                </div>
              </div>
            </td>

            <!-- Program Column -->
            <td class="ui-cell">
              <div class="ui-identity-cell">
                <div class="ui-avatar bg-white p-1">
                  <img
                    :src="
                      getProgramProfileURL(
                        item.program?.profileURL,
                        item.program?.category,
                        item.program?.categoryProfileURL,
                      )
                    "
                    alt="program"
                    class="object-contain"
                  />
                </div>
                <div class="ui-identity-info">
                  <span class="truncate block">{{ item.program?.name }}</span>
                </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[4].width }">
              <AppBadge :status="item.branch?.abbr" :type="item.branch?.color" />
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[5].width }">
              <div class="flex flex-col items-center gap-1">
                <AppBadge
                  :status="item.isSuccessful ? 'Successful' : item.status || 'confirmed'"
                  type="trial"
                />
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[6].width }">
              <div class="flex flex-col items-center gap-1">
                <AppBadge
                  :status="item.trialType || (item.isGuest ? 'Walk-in' : 'Booked')"
                  :type="
                    String(item.trialType || '').toLowerCase() === 'walk-in' || item.isGuest
                      ? 'magenta'
                      : 'purple'
                  "
                />
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[7].width }">
              <div class="flex flex-col items-center">
                <span class="ui-cell-muted"
                  >{{ formatDateOnly(item.trialDate) }}
                  <span v-if="item.trialTime">at {{ item.trialTime }}</span></span
                >
              </div>
            </td>

            <td class="ui-cell text-left" :style="{ width: headers[8].width }">
              <AuditBadge :meta="item.modifiedBy || item.createdBy" :item="item" />
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[9].width }">
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
                        class="ui-dropdown-item ui-dropdown-item-danger group font-bold"
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

    <TrialActionModal
      :isOpen="actionState.isOpen"
      :type="actionState.type"
      :trial="actionState.trial"
      :loading="submitting"
      :parents="dataStore.parents"
      :students="dataStore.students"
      :programs="dataStore.getProgramWithCategory"
      :branches="dataStore.branches"
      :error="errorMessage"
      :success="successMessage"
      @close="closeActionModal"
      @submit="submitActionModal"
      @update:error="errorMessage = $event"
      @update:success="successMessage = $event"
    />
  </DashboardLayout>
</template>
