<script setup>
import { ref, onMounted, computed } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DataPageLayout from '@/components/layout/DataPageLayout.vue'
import DataTable from '@/components/common/data/DataTable.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import TeacherActionModal from '@/components/teachers/TeacherActionModal.vue'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'

import { teacherService } from '@/services/teacherService'
import { getActionIcon, getImageUrl } from '@/utils/assetHelper'
import { useSearch } from '@/composables/useSearch'

const teachers = ref([])
const loading = ref(true)
const currentFilter = ref('all')

const fetchData = async () => {
  loading.value = true
  try {
    const data = await teacherService.getAllTeachers()
    teachers.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Failed to fetch teachers', error)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

const statusFilteredTeachers = computed(() => {
  if (currentFilter.value === 'all') return teachers.value
  return teachers.value.filter(t => (t.status || 'active').toLowerCase() === currentFilter.value)
})

const { searchQuery, searchResults: filteredTeachers } = useSearch(
  statusFilteredTeachers,
  (item) => ({
    ...item,
    searchString: `${item.name} ${item.email} ${item.specialization}`.toLowerCase()
  })
)

const stats = computed(() => {
  const all = teachers.value
  const active = all.filter(t => (t.status || 'active').toLowerCase() === 'active')

  return [
    {
      label: 'Faculty Strength',
      value: all.length,
      image: getImageUrl('teacher/total-teacher'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Active Deployment',
      value: active.length,
      image: getImageUrl('dashboard/active-now'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Academic Diversity',
      value: new Set(all.map(t => t.specialization).filter(Boolean)).size,
      image: getImageUrl('dashboard/card-top-program'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Capacity Utilization',
      value: all.length > 0 ? Math.round((active.length / all.length) * 100) + '%' : '0%',
      image: getImageUrl('dashboard/card-available-program'),
      color: 'var(--accent-light)',
    },
  ]
})

const headers = [
  { label: 'Faculty Identity' },
  { label: 'Specialization', class: 'hidden sm:table-cell' },
  { label: 'Contact Details', class: 'hidden md:table-cell' },
  { label: 'Status', width: '120px', align: 'center' },
  { label: 'Action', width: '100px', align: 'center' },
]

// Modal Logic
const isModalOpen = ref(false)
const modalType = ref('add')
const selectedTeacher = ref(null)
const submitting = ref(false)

const openModal = (type, teacher = null) => {
  modalType.value = type
  selectedTeacher.value = teacher
  isModalOpen.value = true
}

const handleSubmit = async (formData) => {
  submitting.value = true
  try {
    if (modalType.value === 'add') {
      await teacherService.createTeacher(formData)
    } else {
      await teacherService.updateTeacher(selectedTeacher.value.id, formData)
    }
    fetchData()
    isModalOpen.value = false
  } catch (err) {
    console.error('Failed to save teacher', err)
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (teacher) => {
  if (!confirm(`Are you sure you want to purge faculty record for ${teacher.name}?`)) return
  try {
    await teacherService.deleteTeacher(teacher.id)
    fetchData()
  } catch (err) {
    console.error('Failed to delete teacher', err)
  }
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Faculty & Personnel Management">
      <template #overview>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DataMetricCard v-for="stat in stats" :key="stat.label" v-bind="stat" />
        </div>
      </template>

      <template #table>
        <DataTable title="Academic Faculty Registry" :headers="headers" :items="filteredTeachers" :loading="loading"
          searchPlaceholder="Search by name, email or specialization..." :hasFilter="true"
          v-model:searchQuery="searchQuery" v-model:currentFilter="currentFilter" :filterOptions="[
            { label: 'All Faculty', value: 'all' },
            { label: 'Active Duty', value: 'active' },
            { label: 'Inactive / Leave', value: 'inactive' },
          ]">
          <template #toolbar-actions>
            <AppButton variant="primary" size="md" class="rounded-xl shadow-lg shadow-primary/20"
              @click="openModal('add')">
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
              <span class="font-black tracking-tight">Onboard Faculty</span>
            </AppButton>
          </template>

          <template #row="{ item, headers }">
            <td class="ui-cell">
              <div class="flex items-center gap-4 group cursor-pointer">
                <div
                  class="w-12 h-12 rounded-2xl bg-surface-subtle border border-outline-std overflow-hidden flex items-center justify-center">
                  <span class="text-lg font-black text-primary opacity-40">{{ item.name.charAt(0) }}</span>
                </div>
                <div class="flex flex-col">
                  <span
                    class="font-black text-content-dark group-hover:text-primary transition-colors tracking-tight text-base leading-tight">{{
                    item.name }}</span>
                  <span class="text-[10px] font-black text-content-muted uppercase tracking-widest mt-0.5">Faculty
                    Member</span>
                </div>
              </div>
            </td>

            <td class="ui-cell hidden sm:table-cell">
              <div class="inline-flex px-3 py-1 rounded-lg bg-primary/5 border border-primary/10">
                <span class="text-xs font-black text-primary tracking-tight uppercase">{{ item.specialization ||
                  'Generalist' }}</span>
              </div>
            </td>

            <td class="ui-cell hidden md:table-cell">
              <div class="flex flex-col">
                <span class="text-xs font-bold text-content-dark">{{ item.email }}</span>
                <span class="text-[9px] font-black text-content-muted uppercase tracking-tighter mt-1">{{ item.phone ||
                  'No Contact' }}</span>
              </div>
            </td>

            <td class="ui-cell text-center">
              <AppBadge :status="item.status || 'active'" />
            </td>

            <td class="ui-cell text-center">
              <div class="flex items-center justify-center gap-2">
                <button @click="openModal('edit', item)"
                  class="p-2 hover:bg-surface-subtle rounded-xl transition-all group">
                  <img :src="getActionIcon('edit')"
                    class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                </button>
                <button @click="handleDelete(item)" class="p-2 hover:bg-red-50 rounded-xl transition-all group">
                  <img :src="getActionIcon('delete')"
                    class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity filter-red" />
                </button>
              </div>
            </td>
          </template>
        </DataTable>
      </template>
    </DataPageLayout>

    <TeacherActionModal :isOpen="isModalOpen" :type="modalType" :teacher="selectedTeacher" :loading="submitting"
      @close="isModalOpen = false" @submit="handleSubmit" />
  </DashboardLayout>
</template>
