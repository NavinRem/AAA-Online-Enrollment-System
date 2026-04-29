<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
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
import { useSearch } from '@/composables/useSearch'
import { calculateClassProgress } from '@/utils/formatUtils'

const loading = ref(false)
const classes = ref([])
const currentPage = ref(1)
const pageSize = 10

const router = useRouter()

const classHeaders = [
  { label: 'NO', width: '50px', align: 'center' },
  { label: 'CLASS IDENTITY' },
  { label: 'CAMPUS', width: '100px', align: 'center' },
  { label: 'TERM', width: '120px' },
  { label: 'PROGRESS', width: '140px' },
  { label: 'TEACHERS', width: '180px' },
  { label: 'SCHEDULE', width: '160px' },
  { label: 'CAPACITY', width: '120px', align: 'center' },
  { label: 'STATUS', width: '100px', align: 'center' },
  { label: 'ACTION', width: '60px', align: 'center' },
]

const isOngoing = (c) => {
  if (c.status !== 'active') return false
  const now = new Date()
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' })
  if (c.day !== dayName) return false

  const [startStr, endStr] = (c.timeslot || '').split(' - ')
  if (!startStr || !endStr) return false

  const parseTime = (str) => {
    const [time, period] = str.split(' ')
    let [h, m] = time.split(':').map(Number)
    if (period === 'PM' && h < 12) h += 12
    if (period === 'AM' && h === 12) h = 0
    return h * 60 + m
  }

  const currentMins = now.getHours() * 60 + now.getMinutes()
  return currentMins >= parseTime(startStr) && currentMins <= parseTime(endStr)
}

const statsCards = computed(() => [
  {
    label: 'Total Classes',
    value: classes.value.length,
    image: getImageUrl('programs/total-program'),
    color: 'var(--color-primary-light)',
  },
  {
    label: 'Available Classes',
    value: classes.value.filter((c) => (c.currentCount || 0) < (c.capacity || 0)).length,
    image: getImageUrl('dashboard/card-available-program'),
    color: 'var(--color-primary-light)',
  },
  {
    label: 'Full Classes',
    value: classes.value.filter((c) => (c.currentCount || 0) >= (c.capacity || 0)).length,
    image: getImageUrl('programs/archived-program'),
    color: 'var(--color-primary-light)',
  },
  {
    label: 'Ongoing Classes',
    value: classes.value.filter(isOngoing).length,
    image: getImageUrl('programs/active-program'),
    color: 'var(--color-primary-light)',
  },
])

const fetchClasses = async () => {
  loading.value = true
  try {
    const data = await classService.getAllClasses()
    const classList = Array.isArray(data) ? data : []

    // Status Synchronization: Ensure stored status matches term-based logic
    const syncTasks = []
    classList.forEach(cls => {
      if (cls.term) {
        const prog = calculateClassProgress(cls.term.startDate, cls.term.endDate, cls.day, cls.timeslot)
        const calculatedStatus = prog.status.toLowerCase()
        
        if (cls.status !== calculatedStatus) {
          syncTasks.push(classService.updateClass(cls.id, { status: calculatedStatus }))
          cls.status = calculatedStatus // Update local state for immediate feedback
        }
      }
    })

    if (syncTasks.length > 0) {
      console.log(`[ClassSync] Updating ${syncTasks.length} class statuses to maintain data integrity.`)
      await Promise.all(syncTasks)
    }

    classes.value = classList
  } catch (err) {
    console.error('Failed to fetch classes:', err)
  } finally {
    loading.value = false
  }
}

const { searchQuery, searchResults } = useSearch(classes, (c) => {
  return `${c.program?.name} ${c.program?.category} ${c.teacher?.name} ${c.branch?.name} ${c.day} ${c.timeslot}`
})

const displayClasses = computed(() => {
  let result = [...searchResults.value]
  // Default sort by day and then timeslot
  return result.sort((a, b) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const dayDiff = days.indexOf(a.day) - days.indexOf(b.day)
    if (dayDiff !== 0) return dayDiff
    return (a.timeslot || '').localeCompare(b.timeslot || '')
  })
})

const paginatedClasses = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return displayClasses.value.slice(start, start + pageSize)
})

watch([searchQuery], () => {
  currentPage.value = 1
})

// Modal State
const modal = ref({
  isOpen: false,
  type: 'add',
  classItem: null,
  loading: false,
  error: '',
  success: '',
})

const openAddModal = () => {
  modal.value = {
    isOpen: true,
    type: 'add',
    classItem: null,
    loading: false,
    error: '',
    success: '',
  }
}

const openEditModal = (item) => {
  modal.value = {
    isOpen: true,
    type: 'edit',
    classItem: item,
    loading: false,
    error: '',
    success: '',
  }
}

const closeModal = () => {
  modal.value.isOpen = false
  modal.value.error = ''
  modal.value.success = ''
}

const getRowClass = (item) => {
  // Add logic for highlighting newly created or active classes if needed
  return ''
}

const handleAction = (type, item) => {
  modal.value = {
    isOpen: true,
    type,
    classItem: item,
    loading: false,
    error: '',
    success: '',
  }
}

const handleModalSubmit = async (payload) => {
  modal.value.loading = true
  modal.value.error = ''
  modal.value.success = ''
  try {
    if (modal.value.type === 'add') {
      await classService.createClass(payload)
      modal.value.success = 'Class established successfully'
    } else if (modal.value.type === 'edit') {
      await classService.updateClass(modal.value.classItem.id, payload)
      modal.value.success = 'Class updated successfully'
    } else if (modal.value.type === 'delete') {
      await classService.deleteClass(modal.value.classItem.id)
      modal.value.success = 'Class deleted successfully'
    }
    await fetchClasses()

    // Auto close after 1.5s on success
    setTimeout(() => {
      if (modal.value.isOpen) {
        closeModal()
      }
    }, 1500)
  } catch (err) {
    modal.value.error = err.message || 'Action failed'
    console.error('Action failed:', err)
  } finally {
    modal.value.loading = false
  }
}

const navigateToDetail = (item) => {
  router.push(`/classes/${item.id}`)
}

const isClassReadOnly = (item) => {
  if (!item.term) return false
  const prog = calculateClassProgress(item.term.startDate, item.term.endDate, item.day, item.timeslot)
  return prog.status !== 'Upcoming'
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
        <DataTable title="Class Lists" :headers="classHeaders" :items="paginatedClasses" :loading="loading"
          entityName="class" :flexible="true" v-model:searchQuery="searchQuery" searchPlaceholder="Search something..."
          :hasPagination="true" :currentPage="currentPage" :pageSize="pageSize" :totalItems="displayClasses.length"
          @update:currentPage="currentPage = $event" @action="({ type, item }) => handleAction(type, item)"
          @row-click="navigateToDetail">
          <template #toolbar-actions>
            <AppButton variant="primary" size="md" class="rounded-xl shadow-lg shadow-primary/20" @click="openAddModal">
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
              <span class="font-black tracking-tight text-sm">Add Class</span>
            </AppButton>
          </template>

          <template #row="{ item, index, headers, toggleMenu, activeMenuId, isMenuAbove, menuStyles, handleAction }">
            <td class="ui-cell text-center font-bold text-content-muted/20" :style="{ width: headers[0].width }">
              {{ (currentPage - 1) * pageSize + index + 1 }}
            </td>

            <td class="ui-cell" :style="{ flex: '1.5 1 0%' }">
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

            <td class="ui-cell text-center" :style="{ width: headers[2].width }">
              <AppBadge :status="item.branch?.abbr || item.branch?.name || 'FM'" type="blue" />
            </td>

            <td class="ui-cell" :style="{ width: headers[3].width }">
              <div class="flex flex-col">
                <span class="text-xs font-black text-content-dark tracking-tight">{{ item.term?.name || 'Active Term'
                  }}</span>
                <span class="text-[8px] font-black text-content-muted uppercase tracking-widest mt-0.5 italic">Term
                  Identity</span>
              </div>
            </td>

            <td class="ui-cell" :style="{ width: headers[4].width }">
              <div v-if="item.term" class="flex flex-col gap-1.5 w-full pr-4">
                <div class="flex items-center justify-between">
                  <span class="text-[9px] font-black text-content-muted uppercase tracking-widest">{{
                    calculateClassProgress(item.term.startDate, item.term.endDate, item.day, item.timeslot).weekInfo
                    }}</span>
                  <span class="text-[9px] font-black text-primary uppercase tracking-widest">{{
                    calculateClassProgress(item.term.startDate, item.term.endDate, item.day, item.timeslot).percentage
                    }}%</span>
                </div>
                <div class="h-1.5 w-full bg-surface-subtle border border-outline-std/50 rounded-full overflow-hidden">
                  <div class="h-full bg-primary transition-all duration-1000"
                    :style="{ width: `${calculateClassProgress(item.term.startDate, item.term.endDate, item.day, item.timeslot).percentage}%` }">
                  </div>
                </div>
              </div>
              <span v-else
                class="text-[10px] font-black uppercase text-content-muted/30 tracking-widest italic">TBD</span>
            </td>

            <td class="ui-cell" :style="{ width: headers[5].width }">
              <div v-if="item.teachers && item.teachers.length > 0" class="flex items-center">
                <div class="flex -space-x-3 hover:space-x-1 transition-all duration-300">
                  <div v-for="teacher in item.teachers" :key="teacher.id"
                    class="w-8 h-8 rounded-xl overflow-hidden ring-2 ring-white shadow-sm group/avatar relative"
                    :title="teacher.name">
                    <img :src="teacher.profileURL || getImageUrl('profiles/avatar-teacher-woman')"
                      class="w-full h-full object-cover" />
                  </div>
                </div>
                <div class="flex flex-col ml-3">
                  <span class="font-bold text-[10px] text-content-dark tracking-tight leading-none">{{
                    item.teachers.length === 1 ? item.teachers[0].name : `${item.teachers.length} Teachers` }}</span>
                  <span class="text-[8px] font-black text-content-muted uppercase tracking-widest mt-1">Personnel</span>
                </div>
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
                  item.currentCount || 0 }}/{{ item.capacity || 20 }}</span>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[7].width }">
              <AppBadge
                :status="calculateClassProgress(item.term?.startDate, item.term?.endDate, item.day, item.timeslot).status"
                :type="{
                  'Upcoming': 'blue',
                  'Archived': 'neutral',
                  'Ongoing': 'success',
                  'Active': 'success'
                }[calculateClassProgress(item.term?.startDate, item.term?.endDate, item.day, item.timeslot).status] || 'success'" />
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[8].width }">
              <div class="relative flex justify-center">
                <button @click.stop="toggleMenu($event, item.id)"
                  class="p-2 hover:bg-surface-subtle rounded-xl transition-all group">
                  <img :src="getActionIcon('more')"
                    class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                </button>

                <Teleport to="body" v-if="activeMenuId === item.id">
                  <div v-if="activeMenuId === item.id" class="ui-dropdown-menu"
                    :class="{ 'origin-bottom': isMenuAbove, 'origin-top': !isMenuAbove }" :style="menuStyles"
                    @click.stop>
                    <template v-if="!isClassReadOnly(item)">
                      <button @click.stop="handleAction('edit', item)"
                        class="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-subtle transition-colors group">
                        <img :src="getActionIcon('edit')" class="w-4 h-4 opacity-50 group-hover:opacity-100" />
                        <span class="text-sm font-bold text-content-dark">Edit Detail</span>
                      </button>
                      <div class="h-[1px] bg-outline-std/50 mx-2"></div>
                    </template>
                    <button @click.stop="handleAction('delete', item)"
                      class="w-full flex items-center gap-3 px-4 py-3 hover:bg-error-soft transition-colors group">
                      <img :src="getActionIcon('trash')" class="w-4 h-4 opacity-50 group-hover:opacity-100" />
                      <span class="text-sm font-bold text-error">Delete Class</span>
                    </button>
                  </div>
                </Teleport>
              </div>
            </td>
          </template>
        </DataTable>
      </template>
    </DataPageLayout>
  </DashboardLayout>

  <ClassActionModal :isOpen="modal.isOpen" :type="modal.type" :classInstance="modal.classItem" :loading="modal.loading"
    :error="modal.error" :success="modal.success" @close="closeModal" @submit="handleModalSubmit" />
</template>
