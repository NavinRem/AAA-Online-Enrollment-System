<script setup>
import { ref, computed, onMounted } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DataPageLayout from '@/components/layout/DataPageLayout.vue'
import DataTable from '@/components/common/data/DataTable.vue'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import ClassActionModal from '@/components/classes/ClassActionModal.vue'
import { classService } from '@/services/classService'
import { getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { getProgramProfileURL } from '@/utils/assetHelper'

const loading = ref(false)
const classes = ref([])

const classHeaders = [
  { label: 'No', width: '50px', class: 'hidden md:table-cell', align: 'center' },
  { label: 'Program Model' },
  { label: 'Term Identity', width: '120px' },
  { label: 'Campus', width: '100px', align: 'center' },
  { label: 'Instructor', class: 'hidden sm:table-cell' },
  { label: 'Schedule', width: '150px' },
  { label: 'Utilization', width: '120px', align: 'center' },
  { label: 'Status', width: '100px', align: 'center' },
  { label: 'Action', width: '80px', align: 'center' },
]

const statsCards = computed(() => [
  {
    label: 'Live Inventory',
    value: classes.value.length,
    image: getImageUrl('programs/total-program'),
    color: 'var(--color-primary-light)',
  },
  {
    label: 'Open Registry',
    value: classes.value.filter((c) => c.status === 'open').length,
    image: getImageUrl('programs/active-program'),
    color: 'var(--color-primary-light)',
  },
  {
    label: 'Peak Load',
    value: classes.value.filter((c) => c.currentCount >= c.capacity).length,
    image: getImageUrl('programs/archived-program'),
    color: 'var(--danger-light)',
  },
  {
    label: 'Total Learners',
    value: classes.value.reduce((sum, c) => sum + (c.currentCount || 0), 0),
    image: getImageUrl('dashboard/card-available-program'),
    color: 'var(--color-primary-light)',
  },
])

const fetchClasses = async () => {
  loading.value = true
  try {
    const data = await classService.getAllClasses()
    classes.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Failed to fetch classes:', err)
  } finally {
    loading.value = false
  }
}

const filteredClasses = computed(() => classes.value)

// Modal State
const modal = ref({
  isOpen: false,
  type: 'add',
  classItem: null,
  loading: false,
})

const openAddModal = () => {
  modal.value = { isOpen: true, type: 'add', classItem: null, loading: false }
}

const openEditModal = (item) => {
  modal.value = { isOpen: true, type: 'edit', classItem: item, loading: false }
}

const closeModal = () => {
  modal.value.isOpen = false
}

const handleModalSubmit = async (formData) => {
  modal.value.loading = true
  try {
    if (modal.value.type === 'add') {
      await classService.createClass(formData)
    } else if (modal.value.type === 'edit') {
      await classService.updateClass(modal.value.classItem.id, formData)
    }
    await fetchClasses()
    closeModal()
  } catch (err) {
    console.error('Modal action failed:', err)
  } finally {
    modal.value.loading = false
  }
}

onMounted(fetchClasses)
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Academic Class Repository">
      <template #overview>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DataMetricCard v-for="stat in statsCards" :key="stat.label" v-bind="stat" />
        </div>
      </template>

      <template #table>
        <DataTable title="Active Schedules" :headers="classHeaders" :items="filteredClasses" :loading="loading"
          :flexible="true" searchPlaceholder="Search by program, teacher, or campus entity...">
          <template #toolbar-actions>
            <AppButton variant="primary" size="md" class="rounded-xl shadow-lg shadow-primary/20" @click="openAddModal">
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
              <span class="font-black tracking-tight text-sm">Deploy Class</span>
            </AppButton>
          </template>

          <template #row="{ item, index, headers }">
            <td class="ui-cell text-center font-bold text-content-muted/20 hidden md:table-cell"
              :style="{ width: headers[0].width }">
              {{ index + 1 }}
            </td>

            <td class="ui-cell min-w-[200px]" :style="{ flex: '1 1 0%' }">
              <div class="flex items-center gap-4 group">
                <div
                  class="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-primary/5 group-hover:ring-primary/20 transition-all duration-500 shadow-sm bg-white p-2">
                  <img :src="getProgramProfileURL(item.program?.profileURL, item.program?.category)"
                    class="w-full h-full object-contain" />
                </div>
                <div class="flex flex-col">
                  <span
                    class="font-black text-content-dark group-hover:text-primary transition-colors tracking-tighter text-base leading-tight">{{
                      item.program?.name || 'Academic Course' }}</span>
                  <span class="text-[9px] font-black text-content-muted uppercase tracking-widest mt-0.5">{{
                    item.program?.category || 'General' }}</span>
                </div>
              </div>
            </td>

            <td class="ui-cell" :style="{ width: headers[2].width }">
              <div class="flex flex-col">
                <span class="text-xs font-black text-content-dark tracking-tight">{{ item.term?.name || 'Active Term'
                }}</span>
                <span
                  class="text-[8px] font-black text-content-muted uppercase tracking-widest leading-none mt-1">Registry
                  Period</span>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[3].width }">
              <AppBadge :status="item.branch?.abbr || item.branch?.name" type="blue" />
            </td>

            <td class="ui-cell hidden sm:table-cell" :style="{ flex: '1 1 0%' }">
              <div v-if="item.teacher" class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl overflow-hidden ring-1 ring-border shadow-sm">
                  <img :src="item.teacher.profileURL || getImageUrl('profiles/avatar-student')"
                    class="w-full h-full object-cover" />
                </div>
                <span class="font-bold text-xs text-content-dark tracking-tight">{{ item.teacher.name }}</span>
              </div>
              <span v-else class="text-[10px] font-black uppercase text-content-muted/30 tracking-widest italic">Staff
                Pending</span>
            </td>

            <td class="ui-cell" :style="{ width: headers[5].width }">
              <div class="flex flex-col">
                <span class="text-xs font-black text-content-dark uppercase tracking-tighter leading-none">{{ item.day
                }}</span>
                <span class="text-[9px] font-black text-primary uppercase tracking-widest mt-1">{{ item.timeslot
                }}</span>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[6].width }">
              <div class="flex flex-col items-center gap-2 w-full px-4">
                <div
                  class="w-full h-1.5 bg-surface-subtle rounded-full overflow-hidden shadow-inner ring-1 ring-black/5">
                  <div class="h-full transition-all duration-700 ease-out rounded-full"
                    :style="{ width: (item.currentCount / item.capacity) * 100 + '%' }"
                    :class="(item.currentCount / item.capacity) >= 1 ? 'bg-error' : (item.currentCount / item.capacity) >= 0.8 ? 'bg-warning' : 'bg-emerald-500'">
                  </div>
                </div>
                <span class="text-[10px] font-black text-content-muted tabular-nums tracking-widest uppercase">{{
                  item.currentCount }}/{{ item.capacity }}</span>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[7].width }">
              <AppBadge :status="item.status" :type="item.status === 'open' ? 'success' : 'neutral'" />
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[8].width }">
              <button @click.stop="openEditModal(item)"
                class="p-2 hover:bg-surface-subtle rounded-xl transition-all group">
                <img :src="getActionIcon('edit')"
                  class="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" />
              </button>
            </td>
          </template>
        </DataTable>
      </template>
    </DataPageLayout>
  </DashboardLayout>

  <ClassActionModal :isOpen="modal.isOpen" :type="modal.type" :classItem="modal.classItem" :loading="modal.loading"
    @close="closeModal" @submit="handleModalSubmit" />
</template>
