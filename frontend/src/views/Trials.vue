<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useDataStore } from '../stores/dataStore'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import DataMetricCard from '../components/common/data/DataMetricCard.vue'
import DataTable from '../components/common/data/DataTable.vue'
import AppBadge from '../components/common/ui/AppBadge.vue'
import AppConfirmOverlay from '../components/common/ui/AppConfirmOverlay.vue'
import TrialFormModal from '../components/trials/TrialFormModal.vue'

import { trialService } from '@/services/trialService'
import { useSearch, trialSearchMapper } from '../composables/useSearch'
import {
  getImageUrl,
  getActionIcon,
  getProgramProfileURL,
  getParentProfileURL,
  getStudentProfileURL,
} from '@/utils/assetHelper'
import { formatDate } from '@/utils/formatUtils'

const dataStore = useDataStore()

const loading = ref(false)
const showModal = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const newlyCreatedId = ref(null)
const selectedTrial = ref(null)
const currentFilter = ref('all')

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
  fetchData()
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
  { label: 'Status', width: '200px', align: 'center' },
  { label: 'Trial Date', width: '200px', align: 'center' },
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

    return {
      ...trial,
      program: {
        ...trial.program,
        ...(program || {}),
        category: category?.name || program?.category || trial.program?.category,
        categoryProfileURL: category?.profileURL || '',
      },
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

const { searchQuery, searchResults: filteredTrials } = useSearch(
  statusFilteredTrials,
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

watch([currentFilter, searchQuery], () => {
  currentPage.value = 1
})

const handleSaveTrial = async (formData) => {
  submitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    if (selectedTrial.value) {
      await trialService.updateTrial(selectedTrial.value.id, formData)
      successMessage.value = 'Trial engagement successfully updated.'
    } else {
      const res = await trialService.createTrial(formData)
      newlyCreatedId.value = res.id
      successMessage.value = 'New trial session successfully booked.'
    }

    setTimeout(() => {
      showModal.value = false
      selectedTrial.value = null
      successMessage.value = ''
      fetchData()
    }, 1500)
  } catch (err) {
    errorMessage.value = err.message || 'Failed to save trial record.'
    console.error(err)
  } finally {
    submitting.value = false
  }
}

const actionState = ref({
  isOpen: false,
  type: '',
  trial: null,
})

const handleTableAction = ({ type, item }) => {
  if (type === 'edit') {
    selectedTrial.value = item
    showModal.value = true
    return
  }

  if (type === 'delete') {
    actionState.value = { isOpen: true, type: 'delete', trial: item }
  }
}

const confirmDeleteTrial = async () => {
  const trial = actionState.value.trial
  if (!trial) return
  submitting.value = true
  try {
    await trialService.deleteTrial(trial.id)
    actionState.value.isOpen = false
    await fetchData()
  } catch (err) {
    console.error('Failed to delete trial:', err)
  } finally {
    submitting.value = false
  }
}

const confirmRows = computed(() => {
  const item = actionState.value.trial
  if (!item) return []
  return [
    { key: 'Student', value: item.student?.name || item.guestStudentName },
    { key: 'Parent', value: item.parent?.name || item.guestParentName || 'Guest' },
    { key: 'Program', value: item.program?.name },
    { key: 'Date', value: formatDate(item.trialDate) },
  ]
})
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
            <AppButton
              variant="primary"
              size="md"
             
              @click="showModal = true"
            >
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
              <span class="font-bold tracking-tight">New Trial</span>
            </AppButton>
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
                <AppBadge :status="item.trialType || (item.isGuest ? 'walk-in' : 'booked')" />
                <AppBadge v-if="item.isSuccessful" status="Successful" />
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[6].width }">
              <div class="flex flex-col text-content-muted items-center">
                <span class="tabular-nums tracking-tight">{{ formatDate(item.trialDate) }}</span>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[7].width }">
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

    <TrialFormModal
      v-if="showModal"
      :isOpen="showModal"
      :loading="submitting"
      :trial="selectedTrial"
      :parents="dataStore.parents"
      :students="dataStore.students"
      :programs="dataStore.getProgramWithCategory"
      :branches="dataStore.branches"
      :error="errorMessage"
      :success="successMessage"
      @close="
        () => {
          showModal = false
          selectedTrial = null
          errorMessage = ''
          successMessage = ''
        }
      "
      @submit="handleSaveTrial"
    />

    <AppConfirmOverlay
      :show="actionState.isOpen && actionState.type === 'delete'"
      title="Delete Trial Record"
      subtitle="Are you sure you want to permanently delete this trial engagement? This action will remove the record from all dashboard metrics."
      :icon="getImageUrl('enrollment/total-enrollment')"
      :rows="confirmRows"
      confirmLabel="Delete Record"
      :loading="submitting"
      @back="actionState.isOpen = false"
      @confirm="confirmDeleteTrial"
    />
  </DashboardLayout>
</template>
