<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import DataMetricCard from '../components/common/data/DataMetricCard.vue'
import DataTable from '../components/common/data/DataTable.vue'
import AppBadge from '../components/common/ui/AppBadge.vue'

import { trialService } from '@/services/trialService'
import { parentService } from '../services/parentService'
import { studentService } from '../services/studentService'
import { programService } from '../services/programService'
import { branchService } from '../services/branchService'
import TrialFormModal from '../components/trials/TrialFormModal.vue'

import { useSearch, trialSearchMapper } from '../composables/useSearch'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { formatDate } from '@/utils/formatUtils'

const trials = ref([])
const parents = ref([])
const students = ref([])
const programs = ref([])
const branches = ref([])

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
  try {
    loading.value = true
    const [tData, pData, sData, progData, bData] = await Promise.all([
      trialService.getAllTrials(),
      parentService.getAllParents(),
      studentService.getAllStudents(),
      programService.getAllPrograms(),
      branchService.getAllBranches(),
    ])
    trials.value = Array.isArray(tData) ? tData : []
    parents.value = Array.isArray(pData) ? pData : []
    students.value = Array.isArray(sData) ? sData : []
    programs.value = Array.isArray(progData) ? progData : []
    branches.value = Array.isArray(bData) ? bData : []
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
  const totalcount = trials.value.length

  // Booked: From trialType field
  const bookedCount = trials.value.filter(t => t.trialType === 'booked').length

  // Walk-in: From trialType field
  const walkinCount = trials.value.filter(t => t.trialType === 'walk-in').length

  // Success: From isSuccessful field
  const successCount = trials.value.filter(t => t.isSuccessful).length

  return [
    {
      label: 'Total Trials',
      value: totalcount,
      image: getImageUrl('enrollment/total-enrollment'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Booked Trials',
      value: bookedCount,
      image: getImageUrl('enrollment/today-enrollment'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Walk-in Trials',
      value: walkinCount,
      image: getImageUrl('enrollment/total-unpaid-enrollment'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Successful Trials',
      value: successCount,
      image: getImageUrl('enrollment/total-paid-enrollment'),
      color: 'var(--color-primary-light)',
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
  let filtered = [...trials.value]

  if (currentFilter.value === 'booked') filtered = filtered.filter(t => t.trialType === 'booked')
  else if (currentFilter.value === 'walk-in') filtered = filtered.filter(t => t.trialType === 'walk-in')
  else if (currentFilter.value === 'successful') filtered = filtered.filter(t => t.isSuccessful)

  // Default Sort by Trial Type and then by Date
  return filtered.sort((a, b) => {
    const typeA = a.trialType || (a.isGuest ? 'walk-in' : 'booked')
    const typeB = b.trialType || (b.isGuest ? 'walk-in' : 'booked')
    if (typeA !== typeB) return typeA.localeCompare(typeB)
    return new Date(b.trialDate || 0) - new Date(a.trialDate || 0)
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

const handleTableAction = ({ type, item }) => {
  if (type === 'edit') {
    selectedTrial.value = item
    showModal.value = true
    return
  }

  if (type === 'delete') {
    if (confirm('Are you sure you want to delete this trial record?')) {
      trialService.deleteTrial(item.id).then(() => fetchData())
    }
  }
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
        <DataTable title="Trial Lists" :headers="trialHeaders" :items="paginatedTrials" entityName="trial"
          :loading="loading" :flexible="true" v-model:searchQuery="searchQuery" searchPlaceholder="Search something..."
          :rowClass="getRowClass" :hasPagination="true" :totalItems="totalItems" :pageSize="pageSize"
          v-model:currentPage="currentPage" :hasFilter="true" v-model:currentFilter="currentFilter" :filterOptions="[
            { label: 'All Trials', value: 'all' },
            { label: 'Booked', value: 'booked' },
            { label: 'Walk-in', value: 'walk-in' },
            { label: 'Successful', value: 'successful' },
          ]" @action="handleTableAction">

          <template #toolbar-actions>
            <AppButton variant="primary" size="md" class="rounded-xl shadow-lg shadow-primary/20"
              @click="showModal = true">
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
              <span class="font-black tracking-tight">New Trial</span>
            </AppButton>
          </template>

          <template
            #row="{ item, index, toggleMenu, activeMenuId, isMenuAbove, menuStyles, handleAction, closeMenu, headers }">
            <td class="ui-cell text-center font-bold text-content-muted/20 hidden md:table-cell"
              :style="{ width: headers[0].width }">
              {{ (currentPage - 1) * pageSize + index + 1 }}
            </td>

            <!-- Parent Column -->
            <td class="ui-cell">
              <div class="ui-identity-cell">
                <div class="ui-avatar">
                  <img :src="item.parent?.profileURL || getImageUrl('avatar-parent')" alt="parent" />
                </div>
                <div class="ui-identity-info">
                  <span class="text-sm font-bold text-content-dark truncate block">{{ item.parent?.name ||
                    item.guestParentName || 'Guest Parent' }}</span>
                </div>
              </div>
            </td>

            <!-- Student Column -->
            <td class="ui-cell">
              <div class="ui-identity-cell">
                <div class="ui-avatar">
                  <img :src="item.student?.profileURL || getImageUrl('avatar-student')" alt="student" />
                </div>
                <div class="ui-identity-info">
                  <span class="text-sm font-bold text-content-dark truncate block">{{ item.student?.name ||
                    item.guestStudentName }}</span>
                  <span class="text-[10px] font-black text-primary uppercase tracking-widest">{{ item.isGuest ?
                    'Guest Prospect' : 'Registered Student' }}</span>
                </div>
              </div>
            </td>

            <!-- Program Column -->
            <td class="ui-cell">
              <div class="ui-identity-cell">
                <div class="ui-avatar bg-white p-1">
                  <img :src="item.program?.profileURL || getImageUrl('program-default')" alt="program"
                    class="object-contain" />
                </div>
                <div class="ui-identity-info">
                  <span class="text-sm font-bold text-content-dark truncate block">{{ item.program?.name }}</span>
                  <span class="text-[10px] font-black text-primary uppercase tracking-widest">Trial Unit</span>
                </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[4].width }">
              <AppBadge :status="item.branch?.abbr || 'HQ'" type="blue" />
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[5].width }">
              <div class="flex flex-col items-center gap-1">
                <AppBadge :status="item.trialType || (item.isGuest ? 'walk-in' : 'booked')" />
                <AppBadge v-if="item.isSuccessful" status="Successful" />
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[6].width }">
              <div class="flex flex-col items-center">
                <span class="text-[11px] font-black text-content-dark tabular-nums tracking-tight">{{
                  formatDate(item.trialDate) }}</span>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[7].width }">
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
                      <button class="ui-dropdown-item ui-dropdown-item-info group"
                        @click="() => { handleAction('edit', item); closeMenu(); }">
                        <img :src="getActionIcon('edit')" class="w-4 h-4 opacity-40 group-hover:opacity-100" />
                        <span class="font-bold">Edit</span>
                      </button>
                      <div class="h-px bg-surface-light mx-1 my-1"></div>
                      <button class="ui-dropdown-item ui-dropdown-item-danger group font-black tracking-tighter"
                        @click="() => { handleAction('delete', item); closeMenu(); }">
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

    <TrialFormModal :isOpen="showModal" :loading="submitting" :trial="selectedTrial" :parents="parents"
      :students="students" :programs="programs" :branches="branches" :error="errorMessage" :success="successMessage"
      @close="() => { showModal = false; selectedTrial = null; errorMessage = ''; successMessage = ''; }"
      @submit="handleSaveTrial" />
  </DashboardLayout>
</template>
