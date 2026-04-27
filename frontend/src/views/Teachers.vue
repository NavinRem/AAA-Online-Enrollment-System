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
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Active Deployment',
      value: active.length,
      image: getImageUrl('dashboard/active-now'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Academic Diversity',
      value: new Set(all.map(t => t.specialization).filter(Boolean)).size,
      image: getImageUrl('dashboard/card-top-program'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Capacity Utilization',
      value: all.length > 0 ? Math.round((active.length / all.length) * 100) + '%' : '0%',
      image: getImageUrl('dashboard/card-available-program'),
      color: 'var(--color-primary-light)',
    },
  ]
})

const headers = [
  { label: 'NO', width: '50px', align: 'center', class: 'hidden md:table-cell' },
  { label: 'TEACHER IDENTITY' },
  { label: 'SPECIALIZATION', class: 'hidden sm:table-cell' },
  { label: 'CONTACT DETAILS', class: 'hidden md:table-cell' },
  { label: 'STATUS', width: '120px', align: 'center' },
  { label: 'ACTION', width: '80px', align: 'center' },
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
    <DataPageLayout overviewTitle="Teacher Overview">
      <template #overview>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DataMetricCard v-for="stat in stats" :key="stat.label" v-bind="stat" />
        </div>
      </template>

      <template #table>
        <DataTable title="Teacher Lists" :headers="headers" :items="filteredTeachers" :loading="loading"
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
              <span class="font-black tracking-tight">New Teacher</span>
            </AppButton>
          </template>

          <template #row="{ item, index, headers, toggleMenu, activeMenuId, isMenuAbove, menuStyles, closeMenu }">
            <td class="ui-cell text-center font-bold text-content-muted/20 hidden md:table-cell"
              :style="{ width: headers[0].width }">
              {{ index + 1 }}
            </td>

            <td class="ui-cell" :style="{ width: headers[1].width }">
              <div class="ui-identity-cell">
                <div class="ui-avatar bg-surface-subtle border border-outline-std flex items-center justify-center">
                  <span class="text-lg font-black text-primary opacity-40">{{ item.name.charAt(0) }}</span>
                </div>
                <div class="ui-identity-info">
                  <span class="text-sm font-bold text-content-dark truncate block">{{ item.name }}</span>
                  <span class="text-[10px] font-black text-primary uppercase tracking-widest">{{
                    item.id.slice(-6).toUpperCase() }}</span>
                </div>
              </div>
            </td>

            <td class="ui-cell hidden sm:table-cell" :style="{ width: headers[2].width }">
              <div class="inline-flex px-3 py-1 rounded-lg bg-primary/5 border border-primary/10">
                <span class="text-xs font-black text-primary tracking-tight uppercase">{{ item.specialization ||
                  'Generalist' }}</span>
              </div>
            </td>

            <td class="ui-cell hidden md:table-cell" :style="{ width: headers[3].width }">
              <div class="flex flex-col">
                <span class="text-xs font-bold text-content-dark">{{ item.email }}</span>
                <span class="text-[9px] font-black text-content-muted uppercase tracking-tighter mt-1">{{ item.phone ||
                  'No Contact' }}</span>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[4].width }">
              <AppBadge :status="item.status || 'active'" />
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[5].width }">
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
                        @click="openModal('edit', item); closeMenu()">
                        <img :src="getActionIcon('edit')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                        <span class="font-bold text-sm">Edit Data</span>
                      </button>

                      <div class="h-px bg-surface-light mx-1 my-1"></div>

                      <button class="ui-dropdown-item ui-dropdown-item-danger group font-black tracking-tighter"
                        @click="handleDelete(item); closeMenu()">
                        <img :src="getActionIcon('delete')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                        Remove Record
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

    <TeacherActionModal :isOpen="isModalOpen" :type="modalType" :teacher="selectedTeacher" :loading="submitting"
      @close="isModalOpen = false" @submit="handleSubmit" />
  </DashboardLayout>
</template>
