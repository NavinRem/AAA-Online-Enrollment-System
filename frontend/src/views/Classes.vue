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
import { getImageUrl, getActionIcon, getIconUrl, getProgramProfileURL } from '@/utils/assetHelper'
import { useSearch, classSearchMapper } from '@/composables/useSearch'
import { calculateClassProgress } from '@/utils/formatUtils'

const dataStore = useDataStore()
const loading = ref(false)
const currentPage = ref(1)
const pageSize = 10

const router = useRouter()

const classHeaders = [
  { label: 'NO', width: '60px', align: 'center' },
  { label: 'CLASS IDENTITY' },
  { label: 'BRANCH', width: '100px', align: 'center' },
  { label: 'TERM', width: '200px' },
  { label: 'PROGRESS', width: '200px' },
  { label: 'SCHEDULE', width: '200px' },
  { label: 'CAPACITY', width: '200px', align: 'center' },
  { label: 'STATUS', width: '100px', align: 'center' },
  { label: 'ACTION', width: '60px', align: 'center' },
]

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

    // Status Synchronization
    const syncTasks = []
    dataStore.classes.forEach(cls => {
      if (cls.term) {
        const cap = cls.capacity || cls.maxCapacity || 0
        const count = cls.currentCount || cls.enrolledCount || 0
        const prog = calculateClassProgress(cls.term.startDate, cls.term.endDate, null, null, count, cap)
        const calculatedStatus = prog.status.toLowerCase()

        if (cls.status !== calculatedStatus) {
          syncTasks.push(classService.updateClass(cls.id, { status: calculatedStatus }))
          cls.status = calculatedStatus
        }
      }
    })

    if (syncTasks.length > 0) {
      await Promise.all(syncTasks)
    }
  } catch (err) {
    console.error('Failed to fetch classes:', err)
  } finally {
    loading.value = false
  }
}

const { searchQuery, searchResults } = useSearch(computed(() => dataStore.classes), classSearchMapper)

const currentFilter = ref('all')

const filterOptions = computed(() => {
  const options = [
    { label: 'All Classes', value: 'all', profileURL: getActionIcon('filter'), color: 'blue' }
  ]

  options.push(
    { isDivider: true },
    { isHeader: true, label: 'Operational Status' },
    { label: 'Upcoming', value: 'status:upcoming', profileURL: getIconUrl('filter/upcoming.svg'), color: 'purple' },
    { label: 'Active', value: 'status:active', profileURL: getIconUrl('filter/active.svg'), color: 'green' },
    { label: 'Archived', value: 'status:archived', profileURL: getIconUrl('filter/archived.svg'), color: 'magenta' },
  )

  options.push(
    { isDivider: true },
    { isHeader: true, label: 'Availability' },
    { label: 'Available Slots', value: 'avail:available', profileURL: getIconUrl('filter/available.svg'), color: 'green' },
    { label: 'Full Capacity', value: 'avail:full', profileURL: getIconUrl('filter/full.svg'), color: 'red' },
    { label: 'Ongoing Session', value: 'avail:ongoing', profileURL: getIconUrl('filter/ongoing.svg'), color: 'purple' },
  )

  const categoriesMap = new Map()
  dataStore.classes.forEach(c => {
    const cat = c.program?.category
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
  })

  if (categoriesMap.size > 0) {
    options.push({ isDivider: true }, { isHeader: true, label: 'Categories' }, ...categoriesMap.values())
  }

  const branchesMap = new Map()
  dataStore.classes.forEach(c => {
    const branch = c.branch
    if (branch && branch.name && !branchesMap.has(branch.name)) {
      branchesMap.set(branch.name, {
        label: `${branch.name}`,
        value: `branch:${branch.name}`,
        badge: { status: branch.abbr, type: branch.color },
        color: `${branch.color}`
      })
    }
  })

  if (branchesMap.size > 0) {
    options.push({ isDivider: true }, { isHeader: true, label: 'Branches' }, ...branchesMap.values())
  }

  return options
})

const displayClasses = computed(() => {
  let result = [...searchResults.value]
  const filter = currentFilter.value
  if (filter !== 'all') {
    if (filter.startsWith('status:')) {
      const status = filter.replace('status:', '')
      result = result.filter(c => c.status?.toLowerCase() === (status === 'archived' ? 'archived' : status))
    } else if (filter.startsWith('avail:')) {
      const avail = filter.replace('avail:', '')
      if (avail === 'available') result = result.filter(c => (c.capacity || 0) === 0 || (c.currentCount || 0) < (c.capacity || 0))
      else if (avail === 'full') result = result.filter(c => (c.capacity || 0) > 0 && (c.currentCount || 0) >= (c.capacity || 0))
      else if (avail === 'ongoing') result = result.filter(isOngoing)
    } else if (filter.startsWith('branch:')) {
      result = result.filter(c => c.branch?.name === filter.replace('branch:', ''))
    } else if (filter.startsWith('cat:')) {
      const catVal = filter.replace('cat:', '')
      result = result.filter(c => {
        const catName = typeof c.program?.category === 'object' ? c.program.category.name : c.program?.category
        return catName === catVal
      })
    }
  }

  return result.sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime()
    const timeB = new Date(b.createdAt || 0).getTime()
    if (timeA !== timeB) return timeB - timeA
    return (a.program?.name || '').localeCompare(b.program?.name || '')
  })
})

const paginatedClasses = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return displayClasses.value.slice(start, start + pageSize)
})

watch([searchQuery, currentFilter], () => { currentPage.value = 1 })

const modal = ref({
  isOpen: false,
  type: 'add',
  classItem: null,
  loading: false,
  error: '',
  success: '',
})

const openAddModal = () => {
  modal.value = { isOpen: true, type: 'add', classItem: null, loading: false, error: '', success: '' }
}

const closeModal = () => {
  modal.value.isOpen = false
  modal.value.error = ''
  modal.value.success = ''
}

const selectedIds = ref([])
const toggleAllSelection = () => {
  if (selectedIds.value.length === displayClasses.value.length) selectedIds.value = []
  else selectedIds.value = displayClasses.value.map(c => c.id)
}

const toggleSelection = (id) => {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) selectedIds.value.splice(index, 1)
  else selectedIds.value.push(id)
}

const openBulkDuplicateModal = () => {
  if (selectedIds.value.length === 0) return
  modal.value = { isOpen: true, type: 'duplicateSelected', classItem: { selectedIds: [...selectedIds.value] }, loading: false, error: '', success: '' }
}

const handleAction = (type, item) => {
  if (type === 'delete') {
    const msg = item.currentCount > 0 
      ? `Cannot delete class "${item.program?.name}" as it has ${item.currentCount} active enrollments.`
      : `Are you sure you want to delete the class instance for "${item.program?.name}"? This action cannot be undone.`
    
    if (item.currentCount > 0) {
      alert(msg)
      return
    }
    
    if (!confirm(msg)) return
  }
  modal.value = { isOpen: true, type, classItem: item, loading: false, error: '', success: '' }
}

const handleModalSubmit = async (payload) => {
  modal.value.loading = true
  modal.value.error = ''
  modal.value.success = ''
  try {
    if (modal.value.type === 'add') await classService.createClass(payload)
    else if (modal.value.type === 'edit') await classService.updateClass(modal.value.classItem.id, payload)
    else if (modal.value.type === 'duplicateSelected') {
      await classService.duplicateSpecificClasses(payload.selectedIds, payload.targetTermId)
      selectedIds.value = []
    } else if (modal.value.type === 'delete') await classService.deleteClass(modal.value.classItem.id)
    
    modal.value.success = 'Operation successful'
    await fetchClasses()
    setTimeout(() => { if (modal.value.isOpen) closeModal() }, 1500)
  } catch (err) {
    modal.value.error = err.message || 'Action failed'
  } finally {
    modal.value.loading = false
  }
}

const navigateToDetail = (item) => { router.push(`/classes/${item.id}`) }

const isClassReadOnly = (item) => {
  if (!item.term) return false
  return getExtendedStatus(item).status !== 'upcoming'
}

onMounted(fetchClasses)
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Class Overview">
      <template #overview>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DataMetricCard v-for="stat in statsCards" :key="stat.label" v-bind="stat" :loading="loading" />
        </div>
      </template>

      <template #table>
        <DataTable title="Class Lists" :headers="[{ label: '', width: '40px', align: 'center' }, ...classHeaders]" 
          :items="paginatedClasses" :loading="loading" entityName="class" :flexible="true"
          v-model:searchQuery="searchQuery" searchPlaceholder="Search classes..." :hasFilter="true"
          :currentFilter="currentFilter" :filterOptions="filterOptions" @update:currentFilter="currentFilter = $event"
          :hasSort="false" :hasPagination="true" :currentPage="currentPage" :pageSize="pageSize"
          :totalItems="displayClasses.length" @update:currentPage="currentPage = $event"
          @action="({ type, item }) => handleAction(type, item)" @row-click="navigateToDetail">
          
          <template #header-index-0>
            <input type="checkbox" :checked="selectedIds.length === displayClasses.length && displayClasses.length > 0"
              @change="toggleAllSelection" class="w-4 h-4 rounded border-outline-std text-primary focus:ring-primary/20 cursor-pointer" />
          </template>

          <template #toolbar-actions>
            <transition enter-active-class="transition duration-300 ease-out" enter-from-class="transform -translate-y-4 opacity-0" enter-to-class="transform translate-y-0 opacity-100">
              <div v-if="selectedIds.length > 0" class="flex items-center gap-2">
                <AppButton variant="secondary" size="md" @click="openBulkDuplicateModal">
                  <img :src="getActionIcon('edit')" class="w-4 h-4 opacity-70" />
                  <span class="font-bold tracking-tight">Migrate ({{ selectedIds.length }})</span>
                </AppButton>
              </div>
            </transition>
            <AppButton variant="secondary" size="md" :loading="loading" @click="fetchClasses">
              <img :src="getActionIcon('refresh')" class="w-4 h-4 opacity-70" />
              <span class="font-bold tracking-tight">Refresh</span>
            </AppButton>
            <AppButton variant="primary" size="md" class="rounded-xl shadow-lg shadow-primary/20" @click="openAddModal">
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
              <span class="font-bold tracking-tight">Add Class</span>
            </AppButton>
          </template>

          <template #row="{ item, index, headers, toggleMenu, activeMenuId, isMenuAbove, menuStyles }">
            <td class="ui-cell text-center" :style="{ width: '40px' }">
              <input type="checkbox" :checked="selectedIds.includes(item.id)" @click.stop="toggleSelection(item.id)"
                class="w-4 h-4 rounded border-outline-std text-primary focus:ring-primary/20 cursor-pointer" />
            </td>

            <td class="ui-cell text-center font-bold text-content-muted/30 tabular-nums" :style="{ width: headers[1].width }">
              {{ (currentPage - 1) * pageSize + index + 1 }}
            </td>

            <td class="ui-cell" :style="{ flex: '1.5 1 0%' }">
              <div class="flex items-center gap-4 group">
                <div class="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/80 shadow-sm bg-surface-subtle p-1.5 transition-all duration-500 group-hover:scale-110">
                  <img :src="getProgramProfileURL(item.program?.profileURL, item.program?.category?.name || item.program?.category, item.program?.category?.profileURL)" 
                    class="w-full h-full object-contain" />
                </div>
                <div class="flex flex-col">
                  <span class="font-bold text-content-dark group-hover:text-primary transition-colors tracking-tighter text-base leading-tight">
                    {{ item.program?.name || 'Academic Course' }}
                  </span>
                  <span class="text-[9px] font-semibold text-content-muted uppercase tracking-widest mt-0.5">
                    {{ item.program?.category?.name || item.program?.category || 'General' }}
                  </span>
                </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[3].width }">
              <AppBadge :status="item.branch?.abbr || item.branch?.name" :type="item.branch?.color || 'blue'" />
            </td>

            <td class="ui-cell" :style="{ width: headers[4].width }">
              <span class="text-sm font-semibold text-content-dark tracking-tight">{{ item.term?.name || 'Active Term' }}</span>
            </td>

            <td class="ui-cell" :style="{ width: headers[5].width }">
              <span v-if="item.term && item.schedule" class="text-[10px] font-semibold text-content-muted tabular-nums tracking-widest uppercase">
                {{ calculateClassProgress(item.term.startDate, item.term.endDate, item.schedule.day, item.schedule.time).week }}/{{ calculateClassProgress(item.term.startDate, item.term.endDate, item.schedule.day, item.schedule.time).totalWeeks }} Sessions
              </span>
              <span v-else class="text-[10px] font-semibold uppercase text-content-muted/30 tracking-widest italic">TBD</span>
            </td>

            <td class="ui-cell" :style="{ width: headers[6].width }">
              <div class="flex flex-col gap-1 items-start">
                <AppBadge :status="item.schedule?.day" :type="['Saturday', 'Sunday'].includes(item.schedule?.day) ? 'blue' : 'gray'" size="sm" />
                <span class="text-sm font-semibold text-content-dark tracking-tight leading-none">{{ item.schedule?.time }}</span>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[7].width }">
              <div class="flex flex-col items-center gap-2 w-full px-4">
                <div class="w-full h-1.5 bg-surface-subtle rounded-full overflow-hidden shadow-inner ring-1 ring-black/5">
                  <div class="h-full transition-all duration-700 ease-out rounded-full"
                    :style="{ width: ((item.capacity || item.maxCapacity) ? (item.currentCount / (item.capacity || item.maxCapacity)) * 100 : 0) + '%' }"
                    :class="((item.capacity || item.maxCapacity) && (item.currentCount / (item.capacity || item.maxCapacity)) >= 1) ? 'bg-error' : 'bg-emerald-500'">
                  </div>
                </div>
                <span class="text-[10px] font-semibold text-content-muted tabular-nums tracking-widest uppercase">
                  {{ item.currentCount || 0 }}/{{ (item.capacity || item.maxCapacity) || '∞' }}
                </span>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[8].width }">
              <AppBadge :status="getExtendedStatus(item).status" :type="{ 'upcoming': 'blue', 'archived': 'neutral', 'ongoing': 'purple', 'full': 'red', 'active': 'success' }[getExtendedStatus(item).status.toLowerCase()] || 'success'" />
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[9].width }">
              <div class="ui-action-menu">
                <button @click.stop="toggleMenu($event, item.id)" class="w-8 h-8 flex items-center justify-center hover:bg-surface-subtle rounded-lg transition-all text-content-muted hover:text-content-dark group">
                  <span class="font-bold text-lg leading-none mb-1">⋮</span>
                </button>

                <Teleport to="body">
                  <transition enter-active-class="transition duration-200 ease-out" enter-from-class="transform scale-95 opacity-0" enter-to-class="transform scale-100 opacity-100" leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
                    <div v-if="activeMenuId === item.id" class="ui-dropdown-menu" :class="{ 'origin-bottom': isMenuAbove, 'origin-top': !isMenuAbove }" :style="menuStyles" @click.stop>
                      <template v-if="!isClassReadOnly(item)">
                        <button class="ui-dropdown-item ui-dropdown-item-info group" @click.stop="(e) => { handleAction('edit', item); toggleMenu(e, item.id); }">
                          <img :src="getActionIcon('edit')" class="w-4 h-4 opacity-40 group-hover:opacity-100" />
                          <span class="font-bold">Edit Detail</span>
                        </button>
                        <div class="h-px bg-surface-light mx-1 my-1"></div>
                      </template>
                      <button class="ui-dropdown-item ui-dropdown-item-danger group font-bold tracking-tighter" @click.stop="(e) => { handleAction('delete', item); toggleMenu(e, item.id); }">
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
