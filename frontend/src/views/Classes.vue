<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/dataStore'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DataPageLayout from '@/components/layout/DataPageLayout.vue'
import DataTable from '@/components/common/data/DataTable.vue'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'
import AppBadge from '@/components/common/ui/AppBadge.vue'
import AppButton from '@/components/common/ui/AppButton.vue'
import ClassActionModal from '@/components/classes/ClassActionModal.vue'
import { classService } from '@/services/classService'
import { getImageUrl, getActionIcon, getIconUrl } from '@/utils/assetHelper'
import { useSearch } from '@/composables/useSearch'
import { calculateClassProgress } from '@/utils/formatUtils'

const dataStore = useDataStore()
const loading = ref(false)
const currentPage = ref(1)
const pageSize = 10

const router = useRouter()

const classHeaders = [
  { label: 'NO', width: '50px', align: 'center' },
  { label: 'CLASS IDENTITY' },
  { label: 'BRANCH', width: '100px', align: 'center' },
  { label: 'TERM', width: '200px' },
  { label: 'PROGRESS', width: '200px' },
  { label: 'SCHEDULE', width: '200px' },
  { label: 'CAPACITY', width: '200px', align: 'center' },
  { label: 'STATUS', width: '100px', align: 'center' },
  { label: 'ACTION', width: '60px', align: 'center' },
]

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const getExtendedStatus = (cls) => {
  return calculateClassProgress(
    cls.term?.startDate,
    cls.term?.endDate,
    cls.schedule?.day,
    cls.schedule?.time,
    cls.currentCount || cls.enrolledCount || 0,
    cls.capacity || cls.maxCapacity || 0
  )
}

const isOngoing = (cls) => getExtendedStatus(cls).status === 'ongoing'
const isFull = (cls) => {
  const cap = cls.capacity || cls.maxCapacity || 0
  const count = cls.currentCount || cls.enrolledCount || 0
  return cap > 0 && count >= cap
}
const isAvailable = (cls) => !isFull(cls) && cls.status !== 'archived'

const statsCards = computed(() => [
  {
    label: 'Total Classes',
    value: dataStore.classes.length,
    image: getImageUrl('programs/total-program'),
    color: 'var(--color-primary-soft)',
  },
  {
    label: 'Available Classes',
    value: dataStore.classes.filter(isAvailable).length,
    image: getImageUrl('dashboard/card-available-program'),
    color: 'var(--color-success-soft)',
  },
  {
    label: 'Full Classes',
    value: dataStore.classes.filter(isFull).length,
    image: getImageUrl('programs/archived-program'),
    color: 'var(--color-error-soft)',
  },
  {
    label: 'Ongoing Classes',
    value: dataStore.classes.filter(isOngoing).length,
    image: getImageUrl('programs/active-program'),
    color: 'var(--color-warning-soft)',
  },
])

const fetchClasses = async () => {
  loading.value = true
  try {
    await dataStore.fetchAllCommonData(true)
    
    // Status Synchronization: Ensure stored status matches term and capacity logic
    const syncTasks = []
    dataStore.classes.forEach(cls => {
      if (cls.term) {
        const cap = cls.capacity || cls.maxCapacity || 0
        const count = cls.currentCount || cls.enrolledCount || 0
        
        // Calculate status without Ongoing (for persistence)
        const prog = calculateClassProgress(cls.term.startDate, cls.term.endDate, null, null, count, cap)
        const calculatedStatus = prog.status.toLowerCase()

        if (cls.status !== calculatedStatus) {
          syncTasks.push(classService.updateClass(cls.id, { status: calculatedStatus }))
          cls.status = calculatedStatus 
        }
      }
    })

    if (syncTasks.length > 0) {
      console.log(`[ClassSync] Updating ${syncTasks.length} class statuses to maintain data integrity.`)
      await Promise.all(syncTasks)
    }
  } catch (err) {
    console.error('Failed to fetch classes:', err)
  } finally {
    loading.value = false
  }
}

const { searchQuery, searchResults } = useSearch(computed(() => dataStore.classes), (c) => {
  return `${c.program?.name} ${c.program?.category} ${c.teacher?.name} ${c.branch?.name} ${c.schedule?.day} ${c.schedule?.time}`
})

const currentFilter = ref('all')

const filterOptions = computed(() => {
  const options = [
    { label: 'All Classes', value: 'all', profileURL: getActionIcon('filter'), color: 'blue' }
  ]

  // Statuses
  options.push(
    { isDivider: true },
    { isHeader: true, label: 'Operational Status' },
    { label: 'Upcoming', value: 'status:upcoming', profileURL: getIconUrl('filter/upcoming.svg'), color: 'purple' },
    { label: 'Active', value: 'status:active', profileURL: getIconUrl('filter/active.svg'), color: 'green' },
    { label: 'Archived', value: 'status:archived', profileURL: getIconUrl('filter/archived.svg'), color: 'magenta' },
  )

  // Availability
  options.push(
    { isDivider: true },
    { isHeader: true, label: 'Availability' },
    { label: 'Available Slots', value: 'avail:available', profileURL: getIconUrl('filter/available.svg'), color: 'green' },
    { label: 'Full Capacity', value: 'avail:full', profileURL: getIconUrl('filter/full.svg'), color: 'red' },
    { label: 'Ongoing Session', value: 'avail:ongoing', profileURL: getIconUrl('filter/ongoing.svg'), color: 'purple' },
  )

  // Categories
  const categoriesMap = new Map()
  dataStore.classes.forEach(c => {
    const cat = c.program?.category
    if (cat) {
      const catName = typeof cat === 'object' ? cat.name : cat
      const profileURL = typeof cat === 'object' ? cat.profileURL : (c.program?.categorySnapshot?.profileURL)

      if (catName && !categoriesMap.has(catName)) {
        categoriesMap.set(catName, {
          label: `${catName}`,
          value: `cat:${catName}`,
          profileURL: profileURL || getIconUrl('navigation/class.svg'),
          color: 'pink'
        })
      }
    }
  })

  if (categoriesMap.size > 0) {
    options.push(
      { isDivider: true },
      { isHeader: true, label: 'Categories' },
      ...categoriesMap.values()
    )
  }

  // Branches
  const branchesMap = new Map()
  dataStore.classes.forEach(c => {
    const branch = c.branch
    if (branch && branch.name) {
      if (!branchesMap.has(branch.name)) {
        branchesMap.set(branch.name, {
          label: `${branch.name}`,
          value: `branch:${branch.name}`,
          badge: {
            status: branch.abbr,
            type: branch.color
          },
          color: `${branch.color}`
        })
      }
    }
  })

  if (branchesMap.size > 0) {
    options.push(
      { isDivider: true },
      { isHeader: true, label: 'Branches' },
      ...branchesMap.values()
    )
  }

  return options
})

const displayClasses = computed(() => {
  let result = [...searchResults.value]

  const filter = currentFilter.value
  if (filter !== 'all') {
    if (filter.startsWith('status:')) {
      const status = filter.replace('status:', '')
      if (status === 'archived') {
        result = result.filter(c => ['completed', 'archived'].includes(c.status?.toLowerCase()))
      } else {
        result = result.filter(c => c.status?.toLowerCase() === status)
      }
    } else if (filter.startsWith('avail:')) {
      const avail = filter.replace('avail:', '')
      if (avail === 'available') {
        result = result.filter(c => {
          const cap = c.capacity || c.maxCapacity || 0
          return cap === 0 || (c.currentCount || 0) < cap
        })
      } else if (avail === 'full') {
        result = result.filter(c => {
          const cap = c.capacity || c.maxCapacity || 0
          return cap > 0 && (c.currentCount || 0) >= cap
        })
      } else if (avail === 'ongoing') {
        result = result.filter(isOngoing)
      }
    } else if (filter.startsWith('branch:')) {
      const branch = filter.replace('branch:', '')
      result = result.filter(c => c.branch?.name === branch)
    } else if (filter.startsWith('cat:')) {
      const catVal = filter.replace('cat:', '')
      result = result.filter(c => {
        const catName = typeof c.program?.category === 'object' ? c.program.category.name : c.program?.category
        return catName === catVal
      })
    }
  }

  return result.sort((a, b) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const dayDiff = days.indexOf(a.schedule?.day) - days.indexOf(b.schedule?.day)
    if (dayDiff !== 0) return dayDiff
    return (a.schedule?.time || '').localeCompare(b.schedule?.time || '')
  })
})

const paginatedClasses = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return displayClasses.value.slice(start, start + pageSize)
})

watch([searchQuery, currentFilter], () => {
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

const getRowClass = () => ''

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
    <DataPageLayout overviewTitle="Class Overview">
      <template #overview>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DataMetricCard v-for="stat in statsCards" :key="stat.label" v-bind="stat" />
        </div>
      </template>

      <template #table>
        <DataTable title="Class Lists" :headers="classHeaders" :items="paginatedClasses" :loading="loading"
          entityName="class" :flexible="true" v-model:searchQuery="searchQuery" searchPlaceholder="Search classes..."
          :hasFilter="true" :currentFilter="currentFilter" :filterOptions="filterOptions"
          @update:currentFilter="currentFilter = $event" :hasSort="false" :hasPagination="true"
          :currentPage="currentPage" :pageSize="pageSize" :totalItems="displayClasses.length"
          @update:currentPage="currentPage = $event" @action="({ type, item }) => handleAction(type, item)"
          @row-click="navigateToDetail">
          <template #toolbar-actions>
            <AppButton variant="primary" size="md" class="rounded-xl shadow-lg shadow-primary/20" @click="openAddModal">
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
              <span class="font-semibold tracking-tight text-sm">Add Class</span>
            </AppButton>
          </template>

          <template #row="{ item, index, headers, toggleMenu, activeMenuId, isMenuAbove, menuStyles, handleAction }">
            <td class="ui-cell text-center font-bold text-content-muted/20" :style="{ width: headers[0].width }">
              {{ (currentPage - 1) * pageSize + index + 1 }}
            </td>

            <td class="ui-cell" :style="{ flex: '1.5 1 0%' }">
              <div class="flex items-center gap-4 group">
                <div class="flex items-center -space-x-4">
                  <div
                    class="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/80 shadow-sm bg-surface-subtle p-1.5 transition-all duration-500">
                    <img :src="item.program?.category?.profileURL || getImageUrl('common/logo-main')"
                      class="w-full h-full object-contain" />
                  </div>
                </div>
                <div class="flex flex-col">
                  <span
                    class="font-bold text-content-dark group-hover:text-primary transition-colors tracking-tighter text-base leading-tight">{{
                      item.program?.name || 'Academic Course' }}</span>
                  <span class="text-[9px] font-semibold text-content-muted uppercase tracking-widest mt-0.5">{{
                    item.program?.category?.name || item.program?.category || 'General' }}</span>
                </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[2].width }">
              <AppBadge :status="item.branch?.abbr || item.branch?.name" :type="item.branch?.color || 'blue'" />
            </td>

            <td class="ui-cell" :style="{ width: headers[3].width }">
              <span class="text-sm font-semibold text-content-dark tracking-tight">{{ item.term?.name || 'Active Term'
                }}</span>
            </td>

            <td class="ui-cell" :style="{ width: headers[4].width }">
              <span v-if="item.term && item.schedule"
                class="text-[10px] font-semibold text-content-muted tabular-nums tracking-widest uppercase">
                {{ calculateClassProgress(item.term.startDate, item.term.endDate, item.schedule.day,
                  item.schedule.time).week }}/{{ calculateClassProgress(item.term.startDate, item.term.endDate,
                    item.schedule.day, item.schedule.time).totalWeeks }} Sessions
              </span>
              <span v-else class="text-[10px] font-semibold uppercase text-content-muted/30 tracking-widest italic">TBD</span>
            </td>

            <td class="ui-cell" :style="{ width: headers[5].width }">
              <div class="flex flex-col gap-1 items-start">
                <AppBadge :status="item.schedule.day"
                  :type="['Saturday', 'Sunday'].includes(item.schedule.day) ? 'blue' : 'gray'" size="sm" />
                <span class="text-sm font-semibold text-content-dark tracking-tight leading-none">{{ item.schedule.time
                }}</span>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[6].width }">
              <div class="flex flex-col items-center gap-2 w-full px-4">
                <div
                  class="w-full h-1.5 bg-surface-subtle rounded-full overflow-hidden shadow-inner ring-1 ring-black/5">
                  <div class="h-full transition-all duration-700 ease-out rounded-full"
                    :style="{ width: ((item.capacity || item.maxCapacity) ? (item.currentCount / (item.capacity || item.maxCapacity)) * 100 : 0) + '%' }"
                    :class="((item.capacity || item.maxCapacity) && (item.currentCount / (item.capacity || item.maxCapacity)) >= 1) ? 'bg-error' : ((item.capacity || item.maxCapacity) && (item.currentCount / (item.capacity || item.maxCapacity)) >= 0.8) ? 'bg-warning' : 'bg-emerald-500'">
                  </div>
                </div>
                <span class="text-[10px] font-semibold text-content-muted tabular-nums tracking-widest uppercase">
                  {{ item.currentCount || 0 }}/{{ (item.capacity || item.maxCapacity) || '∞' }}
                </span>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[7].width }">
              <AppBadge
                :status="getExtendedStatus(item).status"
                :type="{
                  'upcoming': 'blue',
                  'archived': 'neutral',
                  'ongoing': 'purple',
                  'full': 'red',
                  'active': 'success'
                }[getExtendedStatus(item).status] || 'success'" />
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[8].width }">
              <div class="ui-action-menu">
                <button @click.stop="toggleMenu($event, item.id)"
                  class="w-8 h-8 flex items-center justify-center hover:bg-surface-subtle rounded-lg transition-all text-content-muted hover:text-content-dark group">
                  <span class="font-bold text-lg leading-none mb-1">⋮</span>
                </button>

                <Teleport to="body">
                  <transition enter-active-class="transition duration-200 ease-out"
                    enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100"
                    leave-to-class="opacity-0">
                    <div v-if="activeMenuId === item.id" class="ui-dropdown-menu"
                      :class="{ 'origin-bottom': isMenuAbove, 'origin-top': !isMenuAbove }" :style="menuStyles"
                      @click.stop>
                      <template v-if="!isClassReadOnly(item)">
                        <button class="ui-dropdown-item ui-dropdown-item-info group"
                          @click.stop="(e) => { handleAction('edit', item); toggleMenu(e, item.id); }">
                          <img :src="getActionIcon('edit')" class="w-4 h-4 opacity-40 group-hover:opacity-100" />
                          <span class="font-bold">Edit Detail</span>
                        </button>
                        <div class="h-px bg-surface-light mx-1 my-1"></div>
                      </template>
                      <button class="ui-dropdown-item ui-dropdown-item-danger group font-bold tracking-tighter"
                        @click.stop="(e) => { handleAction('delete', item); toggleMenu(e, item.id); }">
                        <img :src="getActionIcon('delete')" class="w-4 h-4 opacity-40 group-hover:opacity-100" />
                        Delete Class
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
  </DashboardLayout>

  <ClassActionModal :isOpen="modal.isOpen" :type="modal.type" :classInstance="modal.classItem" :loading="modal.loading"
    :error="modal.error" :success="modal.success" @close="closeModal" @submit="handleModalSubmit" />
</template>
