<script setup>
import { ref, computed, onMounted } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DataPageLayout from '@/components/layout/DataPageLayout.vue'
import DataTable from '@/components/common/data/DataTable.vue'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import ScheduleActionModal from '@/components/schedules/ScheduleActionModal.vue'
import { scheduleService } from '@/services/scheduleService'
import { getActionIcon, getImageUrl } from '@/utils/assetHelper'
import { useSearch } from '@/composables/useSearch'

const schedules = ref([])
const loading = ref(false)
const modal = ref({
  isOpen: false,
  type: 'add',
  item: null,
  loading: false,
  error: '',
  success: '',
})

const headers = [
  { label: 'No', width: '70px', align: 'center' },
  { label: 'Day' },
  { label: 'Time' },
  { label: 'Status', width: '120px', align: 'center' },
  { label: 'Action', width: '100px', align: 'center' },
]

const fetchSchedules = async () => {
  loading.value = true
  try {
    schedules.value = await scheduleService.getAllSchedules()
  } finally {
    loading.value = false
  }
}

onMounted(fetchSchedules)

const { searchQuery, searchResults } = useSearch(schedules, (schedule) =>
  [schedule.day, schedule.time, schedule.status].filter(Boolean).join(' '),
)

const statsCards = computed(() => [
  {
    label: 'Total Schedules',
    value: schedules.value.length,
    image: getImageUrl('programs/total-program'),
  },
  {
    label: 'Weekend Slots',
    value: schedules.value.filter((s) => ['Saturday', 'Sunday'].includes(s.day)).length,
    image: getImageUrl('programs/upcoming-program'),
  },
])

const openModal = (type = 'add', item = null) => {
  modal.value = { isOpen: true, type, item, loading: false, error: '', success: '' }
}

const closeModal = () => {
  modal.value.isOpen = false
}

const handleSubmit = async (payload) => {
  modal.value.loading = true
  modal.value.error = ''
  try {
    if (modal.value.type === 'add') await scheduleService.createSchedule(payload)
    else if (modal.value.type === 'edit') await scheduleService.updateSchedule(modal.value.item.id, payload)
    else if (modal.value.type === 'delete') await scheduleService.deleteSchedule(payload.id)
    modal.value.success = 'Schedule saved successfully'
    await fetchSchedules()
    setTimeout(closeModal, 1000)
  } catch (error) {
    modal.value.error = error.message || 'Schedule action failed'
  } finally {
    modal.value.loading = false
  }
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Schedule Management">
      <template #overview>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DataMetricCard v-for="stat in statsCards" :key="stat.label" v-bind="stat" :loading="loading" />
        </div>
      </template>

      <template #table>
        <DataTable title="Schedule Configuration" :headers="headers" :items="searchResults" :loading="loading"
          entityName="schedule" v-model:searchQuery="searchQuery" searchPlaceholder="Search schedules...">
          <template #toolbar-actions>
            <AppButton variant="primary" @click="openModal('add')">
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
              <span>New Schedule</span>
            </AppButton>
          </template>

          <template #row="{ item, index }">
            <td class="ui-cell text-center">{{ index + 1 }}</td>
            <td class="ui-cell">
              <span class="">{{ item.day }}</span>
            </td>
            <td class="ui-cell">
              <AppBadge :status="item.time" type="blue" />
            </td>
            <td class="ui-cell text-center">
              <AppBadge :status="item.status || 'active'" />
            </td>
            <td class="ui-cell text-center">
              <div class="flex justify-center gap-2">
                <button class="p-2 hover:bg-surface-subtle rounded-lg" @click="openModal('edit', item)">
                  <img :src="getActionIcon('edit')" class="w-4 h-4 opacity-60" />
                </button>
                <button class="p-2 hover:bg-error-soft rounded-lg" @click="openModal('delete', item)">
                  <img :src="getActionIcon('delete')" class="w-4 h-4 opacity-60" />
                </button>
              </div>
            </td>
          </template>
        </DataTable>
      </template>
    </DataPageLayout>

    <ScheduleActionModal :isOpen="modal.isOpen" :type="modal.type" :schedule="modal.item" :loading="modal.loading"
      :error="modal.error" :success="modal.success" @close="closeModal" @submit="handleSubmit" />
  </DashboardLayout>
</template>
