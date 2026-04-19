<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import DataMetrics from '../components/common/data/DataMetrics.vue'
import DataTable from '../components/common/data/DataTable.vue'
import AppBadge from '../components/common/ui/AppBadge.vue'
import { trialService } from '@/services/trialService'
import { parentService } from '../services/parentService'
import { studentService } from '../services/studentService'
import { programService } from '../services/programService'
import { useSearch, enrollmentSearchMapper } from '../composables/useSearch'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { formatPrice, formatDate } from '@/utils/formatUtils'
import { getSessionDay, getSessionTime } from '@/utils/sessionHelper'

const trials = ref([])
const parents = ref([])
const students = ref([])
const programs = ref([])
const classes = ref([])

const loading = ref(true)
const showModal = ref(false)
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
      programService.getAllClasses(),
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
      label: 'Total Trials',
      value: total,
      image: getImageUrl('enrollment/total-enrollment'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Trials Today',
      value: todayCount,
      image: getImageUrl('enrollment/today-enrollment'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Booked Status',
      value: bookedCount,
      image: getImageUrl('enrollment/total-unpaid-enrollment'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Attended Status',
      value: attendedCount,
      image: getImageUrl('enrollment/total-paid-enrollment'),
      color: 'var(--accent-light)',
    },
  ]
})

const trialHeaders = [
  { label: 'No', width: '40px', align: 'center', class: 'hidden md:table-cell' },
  { label: 'Student' },
  { label: 'Program' },
  { label: 'Schedule', class: 'hidden sm:table-cell' },
  { label: 'Branch', width: '70px', align: 'center', class: 'hidden md:table-cell' },
  { label: 'Status', width: '90px', align: 'center' },
  { label: 'Trial Date', width: '120px', align: 'center' },
  { label: 'Date Created', width: '120px', align: 'center', class: 'hidden lg:table-cell' },
]

const { searchQuery, searchResults: filteredTrials } = useSearch(
  trials,
  enrollmentSearchMapper, // Reusing enrollment mapper as structure is similar
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
    if (confirm('Are you sure you want to delete this trial record?')) {
      trialService.deleteTrial(item.id).then(() => fetchData())
    }
  }
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Trial Class Overview">
      <template #overview>
        <DataMetrics :stats="trialStats" />
      </template>

      <template #table>
        <DataTable
          title="Trial Records"
          :headers="trialHeaders"
          :items="paginatedTrials"
          entityName="trial"
          :loading="loading"
          :flexible="true"
          v-model:searchQuery="searchQuery"
          searchPlaceholder="Search Trials..."
          :rowClass="getRowClass"
          :hasPagination="true"
          :totalItems="totalItems"
          :pageSize="pageSize"
          v-model:currentPage="currentPage"
          @action="handleTableAction"
        >
          <template #row="{ item, index, headers }">
            <td
              class="ui-cell text-center font-bold text-content-muted/50 hidden md:table-cell"
              :style="{ width: headers[0].width }"
            >
              {{ index + 1 }}
            </td>
            <td class="ui-cell" :style="{ flex: '1 1 0%', minWidth: 0 }">
              <div class="ui-identity-cell">
                <div class="ui-avatar">
                  <img :src="item.student?.profileURL" alt="student" />
                </div>
                <div class="ui-identity-info">
                  <span class="font-bold text-content-dark">{{ item.student?.name }}</span>
                  <span class="text-3xs text-content-muted uppercase font-semibold">Student</span>
                </div>
              </div>
            </td>
            <td class="ui-cell" :style="{ flex: '1 1 0%', minWidth: 0 }">
              <div class="ui-identity-cell">
                <div class="ui-avatar-sm bg-white ring-1 ring-border">
                  <img :src="item.program?.profileURL" alt="program" />
                </div>
                <div class="ui-identity-info overflow-hidden">
                  <span
                    class="font-bold text-xs text-content-dark truncate max-w-[140px] block"
                    :title="item.program?.name"
                  >
                    {{ item.program?.name }}
                  </span>
                  <span class="text-3xs text-primary uppercase font-black tracking-widest"
                    >Program</span
                  >
                </div>
              </div>
            </td>
            <td class="ui-cell hidden sm:table-cell" :style="{ flex: '1 1 0%', minWidth: 0 }">
              <div class="flex flex-col gap-0.5">
                <span class="text-xs font-black text-content-dark uppercase tracking-tighter">{{
                  getSessionDay(item.class?.schedule) || getSessionDay(item.classSchedule)
                }}</span>
                <span class="text-3xs font-semibold text-content-muted uppercase">{{
                  getSessionTime(item.class?.schedule) || getSessionTime(item.classSchedule)
                }}</span>
              </div>
            </td>
            <td
              class="ui-cell text-center hidden md:table-cell"
              :style="{ width: headers[4].width }"
            >
              <AppBadge :status="item.branch?.abbr || 'N/A'" type="blue" />
            </td>
            <td class="ui-cell text-center" :style="{ width: headers[5].width }">
              <AppBadge :status="item.status || 'Booked'" />
            </td>
            <td class="ui-cell text-center" :style="{ width: headers[6].width }">
              <span class="text-xs font-bold text-content-dark tracking-tight">{{
                formatDate(item.trialDate)
              }}</span>
            </td>
            <td
              class="ui-cell text-center hidden lg:table-cell"
              :style="{ width: headers[7].width }"
            >
              <span class="text-xs font-bold text-content-muted/70 tracking-tight">{{
                formatDate(item.createdAt)
              }}</span>
            </td>
          </template>
        </DataTable>
      </template>
    </DataPageLayout>
  </DashboardLayout>
</template>
