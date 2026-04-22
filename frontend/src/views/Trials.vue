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
import { classService } from '../services/classService'

import { useSearch, enrollmentSearchMapper } from '../composables/useSearch'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { formatDate } from '@/utils/formatUtils'
import { getSessionDay, getSessionTime } from '@/utils/sessionHelper'

const trials = ref([])
const parents = ref([])
const students = ref([])
const programs = ref([])
const classes = ref([])

const loading = ref(true)
const newlyCreatedId = ref(null)

const getRowClass = (item) => {
  return newlyCreatedId.value === item.id ? 'ui-row-new' : ''
}

const fetchData = async () => {
  try {
    loading.value = true
    const [tData, pData, sData, progData, cData] = await Promise.all([
      trialService.getAllTrials(),
      parentService.getAllParents(),
      studentService.getAllStudents(),
      programService.getAllPrograms(),
      classService.getAllClasses(),
    ])
    trials.value = Array.isArray(tData) ? tData : []
    parents.value = Array.isArray(pData) ? pData : []
    students.value = Array.isArray(sData) ? sData : []
    programs.value = Array.isArray(progData) ? progData : []
    classes.value = Array.isArray(cData) ? cData : []
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
  const total = trials.value.length
  const today = new Date().toISOString().split('T')[0]
  const todayCount = trials.value.filter(
    (t) => (t.createdAt || t.trialDate || '').split('T')[0] === today,
  ).length
  const attendedCount = trials.value.filter((t) => t.status === 'attended').length
  const bookedCount = trials.value.filter((t) => t.status === 'booked').length

  return [
    {
      label: 'Trial Pipeline',
      value: total,
      image: getImageUrl('enrollment/total-enrollment'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Today Active',
      value: todayCount,
      image: getImageUrl('enrollment/today-enrollment'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Confirmed Slot',
      value: bookedCount,
      image: getImageUrl('enrollment/total-unpaid-enrollment'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Yielded Assets',
      value: attendedCount,
      image: getImageUrl('enrollment/total-paid-enrollment'),
      color: 'var(--accent-light)',
    },
  ]
})

const trialHeaders = [
  { label: 'No', width: '50px', align: 'center', class: 'hidden md:table-cell' },
  { label: 'Learner Identity' },
  { label: 'Program Model' },
  { label: 'Scheduling', class: 'hidden sm:table-cell' },
  { label: 'Campus', width: '80px', align: 'center' },
  { label: 'Registry Status', width: '120px', align: 'center' },
  { label: 'Event Date', width: '120px', align: 'center' },
  { label: 'Action', width: '80px', align: 'center' },
]

const { searchQuery, searchResults: filteredTrials } = useSearch(
  trials,
  enrollmentSearchMapper,
)

const currentPage = ref(1)
const pageSize = 10
const totalItems = computed(() => filteredTrials.value.length)

const paginatedTrials = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredTrials.value.slice(start, end)
})

watch(searchQuery, () => {
  currentPage.value = 1
})

const handleTableAction = ({ type, item }) => {
  if (type === 'delete') {
    if (confirm('Are you sure you want to purge this trial record?')) {
      trialService.deleteTrial(item.id).then(() => fetchData())
    }
  }
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Trial Engagement Repository">
      <template #overview>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <DataMetricCard v-for="stat in trialStats" :key="stat.label" v-bind="stat" />
        </div>
      </template>

      <template #table>
        <DataTable
          title="Active Trial Entries"
          :headers="trialHeaders"
          :items="paginatedTrials"
          entityName="trial"
          :loading="loading"
          :flexible="true"
          v-model:searchQuery="searchQuery"
          searchPlaceholder="Search by student, program, or branch entity..."
          :rowClass="getRowClass"
          :hasPagination="true"
          :totalItems="totalItems"
          :pageSize="pageSize"
          v-model:currentPage="currentPage"
          @action="handleTableAction"
        >
          <template #row="{ item, index, headers }">
            <td class="ui-cell text-center font-bold text-content-muted/20 hidden md:table-cell" :style="{ width: headers[0].width }">
              {{ (currentPage - 1) * pageSize + index + 1 }}
            </td>

            <td class="ui-cell min-w-[200px]" :style="{ flex: '1 1 0%' }">
              <div class="flex items-center gap-4 group">
                <div class="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-primary/5 group-hover:ring-primary/20 transition-all duration-500 shadow-sm">
                  <img :src="item.student?.profileURL" class="w-full h-full object-cover" />
                </div>
                <div class="flex flex-col">
                  <span class="font-black text-content-dark group-hover:text-primary transition-colors tracking-tighter text-base leading-tight">{{ item.student?.name }}</span>
                  <span class="text-[9px] font-black text-content-muted uppercase tracking-widest mt-0.5">Primary Prospect</span>
                </div>
              </div>
            </td>

            <td class="ui-cell" :style="{ flex: '1 1 0%' }">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-white ring-1 ring-border p-1.5 shadow-sm overflow-hidden">
                  <img :src="item.program?.profileURL" class="w-full h-full object-contain" />
                </div>
                <div class="flex flex-col overflow-hidden">
                  <span class="font-black text-content-dark tracking-tighter truncate max-w-[140px] leading-tight">{{ item.program?.name }}</span>
                  <span class="text-[9px] font-black text-primary uppercase tracking-widest mt-0.5">Trial Unit</span>
                </div>
              </div>
            </td>

            <td class="ui-cell hidden sm:table-cell" :style="{ flex: '1 1 0%' }">
              <div class="flex flex-col">
                <span class="text-xs font-black text-content-dark uppercase tracking-tighter leading-none">{{ getSessionDay(item.class?.schedule) || getSessionDay(item.classSchedule, true) }}</span>
                <span class="text-[10px] font-black text-content-muted uppercase tracking-widest mt-1">{{ getSessionTime(item.class?.schedule) || getSessionTime(item.classSchedule) }}</span>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[4].width }">
              <AppBadge :status="item.branch?.abbr || 'HQ'" type="blue" />
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[5].width }">
              <AppBadge :status="item.status || 'Booked'" />
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[6].width }">
              <div class="flex flex-col items-center">
                 <span class="text-[11px] font-black text-content-dark tabular-nums tracking-tight">{{ formatDate(item.trialDate) }}</span>
                 <span class="text-[8px] font-black text-content-muted uppercase tracking-widest mt-1">Event Date</span>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[7].width }">
               <button @click.stop="handleTableAction({ type: 'delete', item })" class="p-2 hover:bg-red-50 rounded-xl transition-all group">
                 <img :src="getActionIcon('delete')" class="w-4 h-4 opacity-30 group-hover:opacity-100 group-hover:scale-110 transition-all filter-red" />
               </button>
            </td>
          </template>
        </DataTable>
      </template>
    </DataPageLayout>
  </DashboardLayout>
</template>
