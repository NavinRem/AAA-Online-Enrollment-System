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
import { getImageUrl, getActionIcon, getProgramProfileURL } from '@/utils/assetHelper'
import { formatShortDate, formatPrice, calculateClassProgress } from '@/utils/formatUtils'
import { useSearch, classSearchMapper } from '@/composables/useSearch'

const dataStore = useDataStore()
const loading = ref(false)
const router = useRouter()

const classHeaders = [
  { label: 'No', width: '50px', align: 'center' },
  { label: 'Class Identity', width: '250px' },
  { label: 'Branch', width: '100px', align: 'center' },
  { label: 'Schedule', width: '180px', align: 'center' },
  { label: 'Enrolled', width: '100px', align: 'center' },
  { label: 'Status', width: '110px', align: 'center' },
  { label: 'Action', width: '80px', align: 'center' },
]

const fetchClasses = async () => {
  loading.value = true
  try {
    await dataStore.fetchAllCommonData(true, ['classes', 'programs', 'categories', 'schedules', 'terms'])
  } finally {
    loading.value = false
  }
}

onMounted(fetchClasses)

const activeOfferings = computed(() => {
  const products = dataStore.classes || []
  const terms = dataStore.terms || []
  const results = []

  products.forEach(product => {
    // Enrich program with latest category data for accurate profile URLs
    const liveProgram = dataStore.programs.find(p => p.id === product.programId || p.id === product.program?.id)
    const category = dataStore.categories.find(c => c.id === liveProgram?.categoryId)

    const program = liveProgram ? {
      ...liveProgram,
      category: {
        name: category?.name,
        profileURL: category?.profileURL
      }
    } : product.program

    // Calculate total students across all branches/terms for this product
    let globalStudentCount = 0
    const offerings = []

    terms.forEach(term => {
      if (term.isDeleted) return
      const termOfferings = term.offerings || []
      termOfferings.forEach(off => {
        if (off.classId === product.id) {
          globalStudentCount += (off.currentCount || 0)
          offerings.push({
            ...off,
            termName: term.name,
            termStartDate: term.startDate,
            termEndDate: term.endDate,
            classProduct: product,
            program // Use enriched program
          })
        }
      })
    })

    if (offerings.length === 0) {
      results.push({
        id: `catalog-${product.id}`,
        classProduct: product,
        program, // Use enriched program
        scheduleIds: product.scheduleIds,
        branch: null,
        currentCount: 0,
        status: 'upcoming',
        termName: 'In Catalog'
      })
    } else {
      offerings.forEach(off => {
        results.push({
          ...off,
          id: off.id || `offering-${off.classId}-${off.branchId}`,
          currentCount: off.currentCount || 0, // Use specific offering count
          status: getOfferingStatus(off),
          program // Use enriched program
        })
      })
    }
  })

  return results.sort((a, b) => {
    if (a.status === 'upcoming' && b.status !== 'upcoming') return 1
    if (a.status !== 'upcoming' && b.status === 'upcoming') return -1
    return (b.termStartDate || '').localeCompare(a.termStartDate || '')
  })
})

const getSchedules = (item) => {
  let list = []
  if (item.schedule) list = [item.schedule]
  else if (item.scheduleIds) {
    list = (item.scheduleIds || []).map(id => dataStore.schedules.find(s => s.id === id)).filter(Boolean)
  }

  // Calculate status for each schedule and sort
  const dayOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 }
  const capacity = item.capacity || item.program?.capacity || 20
  const isFull = (item.currentCount || 0) >= capacity

  return [...list].map(s => {
    // Save status back to the schedule object (context-aware)
    if (isFull) {
      s.status = 'full'
    } else {
      const progress = calculateClassProgress(item.termStartDate, item.termEndDate, s.day, s.time)
      s.status = progress.status
    }
    return s
  }).sort((a, b) => {
    const dayA = dayOrder[a.day] || 99
    const dayB = dayOrder[b.day] || 99
    if (dayA !== dayB) return dayA - dayB
    return (a.time || '').localeCompare(b.time || '')
  })
}

const getScheduleStatus = (sched, item) => {
  if (!item.termStartDate) return 'upcoming'
  return sched.status || 'active'
}

const { searchQuery, searchResults } = useSearch(activeOfferings, (o) => {
  const scheds = getSchedules(o).map(s => `${s.day} ${s.time}`).join(' ')
  return [
    o.program?.name,
    o.branch?.name,
    o.branch?.abbr,
    scheds,
    o.termName
  ].filter(Boolean).join(' ').toLowerCase()
})

const currentPage = ref(1)
const pageSize = 10

const totalItems = computed(() => searchResults.value.length)
const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return searchResults.value.slice(start, end)
})

watch([searchQuery], () => {
  currentPage.value = 1
})

const getOfferingStatus = (offering) => {
  if (offering.status === 'upcoming') return 'upcoming'
  const capacity = offering.capacity || offering.program?.capacity || 20
  if ((offering.currentCount || 0) >= capacity) return 'full'

  const now = new Date()
  const start = new Date(offering.termStartDate)
  const end = new Date(offering.termEndDate)
  if (now >= start && now <= end) return 'ongoing'

  return 'active'
}

const statsCards = computed(() => [
  {
    label: 'Total Classes',
    value: activeOfferings.value.length,
    image: getImageUrl('programs/total-program'),
  },
  {
    label: 'Available Classes',
    value: activeOfferings.value.filter(o => getOfferingStatus(o) === 'active').length,
    image: getImageUrl('dashboard/card-available-program'),
  },
  {
    label: 'Full Classes',
    value: activeOfferings.value.filter(o => getOfferingStatus(o) === 'full').length,
    image: getImageUrl('programs/archived-program'),
  },
  {
    label: 'Ongoing Classes',
    value: activeOfferings.value.filter(o => getOfferingStatus(o) === 'ongoing').length,
    image: getImageUrl('programs/active-program'),
  },
])

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

const handleAction = (type, item) => {
  modal.value = { isOpen: true, type, classItem: item, loading: false, error: '', success: '' }
}

const handleModalSubmit = async (payload) => {
  modal.value.loading = true
  modal.value.error = ''
  try {
    if (modal.value.type === 'add') await classService.createClass(payload)
    else if (modal.value.type === 'edit') await classService.updateClass(modal.value.classItem.id, payload)
    else if (modal.value.type === 'delete') await classService.deleteClass(modal.value.classItem.id)

    modal.value.success = 'Operation successful'
    await fetchClasses()
    setTimeout(closeModal, 1000)
  } catch (error) {
    modal.value.error = error.message || 'Class action failed'
  } finally {
    modal.value.loading = false
  }
}

const navigateToDetail = (item) => {
  const classId = item.classProduct?.id || item.classId
  if (classId) router.push(`/classes/${classId}`)
}
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
        <DataTable title="Class List" :headers="classHeaders" :items="paginatedResults" :loading="loading"
          entityName="class" :flexible="true" v-model:searchQuery="searchQuery" searchPlaceholder="Search class..."
          :hasPagination="true" :currentPage="currentPage" :pageSize="pageSize" :totalItems="totalItems"
          @update:currentPage="currentPage = $event" @row-click="navigateToDetail">
          <template #toolbar-actions>
            <AppButton variant="primary" size="md" class="rounded-xl shadow-lg shadow-primary/20" @click="openAddModal">
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
              <span class="font-bold tracking-tight">Add Class</span>
            </AppButton>
          </template>

          <template #row="{ item, index, headers, toggleMenu, activeMenuId, isMenuAbove, menuStyles, closeMenu }">
            <td class="ui-cell text-center" :style="{ width: headers[0].width }">
              {{ index + 1 }}
            </td>

            <td class="ui-cell" :style="{ width: headers[1].width }">
              <div class="flex items-center gap-4">
                <div
                  class="w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/80 shadow-sm bg-surface-subtle p-1.5">
                  <img
                    :src="getProgramProfileURL(item.program?.profileURL, item.program?.category?.name || item.program?.category, item.program?.category?.profileURL)"
                    class="w-full h-full object-contain" />
                </div>
                <div class="flex flex-col">
                  <span class="leading-tight">{{ item.program?.name }}</span>
                  <span class="mt-0.5">
                    {{ item.termName }}
                  </span>
                </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[2].width }">
              <div class="flex flex-col items-center justify-center gap-4 py-6">
                <div class="flex flex-col items-center justify-center h-8">
                  <span class="">{{ item.branch?.abbr || 'N/A' }}</span>
                </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[3].width }">
              <div class="flex flex-col items-center justify-center gap-4 py-6">
                <div v-for="(sched, idx) in getSchedules(item)" :key="idx"
                  class="flex flex-col items-center justify-center h-8">
                  <div class="flex flex-col items-center">
                    <span class="text-xs font-bold leading-none">{{ sched.day }}</span>
                    <span class="text-3xs font-semibold text-content-muted mt-1 leading-none tabular-nums">{{ sched.time }}</span>
                  </div>
                </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[4].width }">
              <div class="flex flex-col items-center justify-center gap-4 py-6">
                <div v-for="(sched, idx) in getSchedules(item)" :key="idx"
                  class="flex flex-col items-center justify-center h-8">
                  <AppBadge :status="item.currentCount || 0" type="blue" />
                </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[5].width }">
              <div class="flex flex-col items-center justify-center gap-4 py-6">
                <div v-for="(sched, idx) in getSchedules(item)" :key="idx"
                  class="flex items-center justify-center h-8">
                  <AppBadge :status="getScheduleStatus(sched, item)" />
                </div>
              </div>
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[6].width }">
              <div class="ui-action-menu">
                <button
                  class="w-8 h-8 flex items-center justify-center hover:bg-surface-subtle rounded-lg transition-all text-content-muted hover:text-content-dark"
                  @click.stop="toggleMenu($event, item.id)">
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
                      <button class="ui-dropdown-item ui-dropdown-item-info group"
                        @click="() => { handleAction('edit', item.classProduct); closeMenu(); }">
                        <img :src="getActionIcon('edit')" class="w-4 h-4 opacity-40 group-hover:opacity-100" />
                        <span class="font-bold">Edit</span>
                      </button>
                      <div class="h-px bg-surface-light mx-1 my-1"></div>
                      <button class="ui-dropdown-item ui-dropdown-item-danger group font-bold tracking-tighter"
                        @click="() => { handleAction('delete', item.classProduct); closeMenu(); }">
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
  </DashboardLayout>

  <ClassActionModal :isOpen="modal.isOpen" :type="modal.type" :classInstance="modal.classItem" :loading="modal.loading"
    :error="modal.error" :success="modal.success" @close="closeModal" @submit="handleModalSubmit"
    @clear-error="modal.error = ''" @clear-success="modal.success = ''" />
</template>
