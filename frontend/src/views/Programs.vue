<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import DataTable from '../components/common/data/DataTable.vue'
import AppBadge from '../components/common/ui/AppBadge.vue'
import ProgramActionModal from '../components/programs/ProgramActionModal.vue'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'
import { programService } from '../services/programService'
import { categoryService } from '../services/categoryService'
import { levelService } from '../services/levelService'
import { classService } from '../services/classService'
import { enrollmentService } from '../services/enrollmentService'
import { trialService } from '../services/trialService'
import { useSearch } from '../composables/useSearch'
import { getProgramProfileURL, getImageUrl, getActionIcon, getIconUrl } from '@/utils/assetHelper'

const programs = ref([])
const categories = ref([])
const loading = ref(true)
const newlyCreatedId = ref(null)
const enrollments = ref([])
const trials = ref([])
const currentPage = ref(1)
const pageSize = 10

const router = useRouter()

const getRowClass = (item) => {
  return newlyCreatedId.value === item.id ? 'ui-row-new' : ''
}

const actionModal = ref({
  isOpen: false,
  type: 'add',
  program: null,
  loading: false,
  error: '',
  success: '',
})

const topTrialProgram = computed(() => {
  if (!trials.value.length || !programs.value.length) return { name: 'No Trials', count: 0 }
  const counts = {}
  trials.value.forEach((t) => {
    if (t.programId) counts[t.programId] = (counts[t.programId] || 0) + 1
  })
  let maxCount = 0, maxPid = null
  for (const pid in counts) {
    if (counts[pid] > maxCount) { maxCount = counts[pid]; maxPid = pid }
  }
  if (!maxPid) return { name: 'No Trials', count: 0 }
  const p = programs.value.find((p) => (p.id) === maxPid)
  const t = trials.value.find((t) => t.programId === maxPid)
  return {
    name: p ? p.name : (t?.program?.name || 'Unknown Program'),
    count: maxCount
  }
})

const topEnrolledProgram = computed(() => {
  if (!enrollments.value.length || !programs.value.length) return { name: 'No Enrollments', count: 0 }
  const counts = {}
  enrollments.value.forEach((e) => {
    if (e.programId) counts[e.programId] = (counts[e.programId] || 0) + 1
  })
  let maxCount = 0, maxPid = null
  for (const pid in counts) {
    if (counts[pid] > maxCount) { maxCount = counts[pid]; maxPid = pid }
  }
  if (!maxPid) return { name: 'No Enrollments', count: 0 }
  const p = programs.value.find((p) => (p.id) === maxPid)
  const e = enrollments.value.find((e) => e.programId === maxPid)
  return {
    name: p ? p.name : (e?.program?.name || 'Unknown Program'),
    count: maxCount
  }
})

const topRevenueProgram = computed(() => {
  if (!enrollments.value.length || !programs.value.length) return { name: 'No Revenue', revenue: 0 }
  const revs = {}
  enrollments.value.forEach((e) => {
    if (e.programId) {
      const p = programs.value.find((prog) => (prog.id) === e.programId)
      revs[e.programId] = (revs[e.programId] || 0) + (p ? (p.basePrice || 0) : 0)
    }
  })
  let maxRev = 0, maxPid = null
  for (const pid in revs) {
    if (revs[pid] > maxRev) { maxRev = revs[pid]; maxPid = pid }
  }
  if (!maxPid) return { name: 'No Revenue', revenue: 0 }
  const p = programs.value.find((p) => (p.id) === maxPid)
  const e = enrollments.value.find((e) => e.programId === maxPid)
  return {
    name: p ? p.name : (e?.program?.name || 'Unknown Program'),
    revenue: maxRev
  }
})

const statsCards = computed(() => {
  return [
    {
      label: 'Total Programs',
      value: programs.value.length,
      image: getImageUrl('programs/total-program'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Top Trial Program',
      value: topTrialProgram.value.name,
      subValue: `${topTrialProgram.value.count} Trials`,
      image: getImageUrl('programs/active-program'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Most Popular',
      value: topEnrolledProgram.value.name,
      subValue: `${topEnrolledProgram.value.count} Enrollments`,
      image: getImageUrl('programs/total-program'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Top Revenue Program',
      value: topRevenueProgram.value.name,
      subValue: `$${topRevenueProgram.value.revenue.toLocaleString()} Total`,
      image: getImageUrl('programs/upcoming-program'),
      color: 'var(--color-primary-light)',
    },
  ]
})

const fetchPrograms = async () => {
  loading.value = true
  try {
    const [programsData, catsData, levelsData, enrollData, trialsData] = await Promise.all([
      programService.getAllPrograms().catch(() => []),
      categoryService.getAllCategories().catch(() => []),
      levelService.getAllLevels().catch(() => []),
      enrollmentService.getAllEnrollments().catch(() => []),
      trialService.getAllTrials().catch(() => []),
    ])

    const cats = Array.isArray(catsData) ? catsData : (catsData?.data || [])
    const lvls = Array.isArray(levelsData) ? levelsData : (levelsData?.data || [])

    programs.value = (Array.isArray(programsData) ? programsData : []).map((p) => {
      const cat = cats.find((c) => (c.id) === p.categoryId || c.name === p.category)
      const lvl = lvls.find((l) => (l.id) === p.levelId)
      return {
        ...p,
        categoryId: p.categoryId || cat?.id || cat?.id,
        category: cat?.name || p.category || 'Uncategorized',
        categoryProfileURL: cat?.profileURL || '',
        levelId: p.levelId || lvl?.id,
        level: lvl?.name,
      }
    })

    categories.value = cats
    enrollments.value = Array.isArray(enrollData) ? enrollData : []
    trials.value = Array.isArray(trialsData) ? trialsData : []
  } catch (error) {
    console.error('Failed to fetch programs', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPrograms()
})

const programHeaders = [
  { label: 'NO', width: '50px', class: 'hidden md:table-cell', align: 'center' },
  { label: 'PROGRAM IDENTITY' },
  { label: 'DESCRIPTION', class: 'hidden xl:table-cell', width: '400px' },
  { label: 'LEVEL', class: 'hidden lg:table-cell', align: 'center', width: '120px' },
  { label: 'SESSIONS', align: 'center', width: '100px', class: 'hidden sm:table-cell' },
  { label: 'BASE PRICE', align: 'center', width: '120px' },
  { label: 'MAX CAPACITY', align: 'center', width: '100px', class: 'hidden lg:table-cell' },
  { label: 'TYPE', align: 'center', width: '120px' },
  { label: 'ACTION', width: '60px', align: 'center' },
]

const currentFilter = ref('all')

const filterOptions = computed(() => {
  const types = [
    { label: 'All Programs', value: 'all', profileURL: getActionIcon('filter'), color: 'blue' },
    { label: 'Group Programs', value: 'type:Group', profileURL: getIconUrl('navigation/parent.svg'), color: 'purple' },
    { label: 'Private Programs', value: 'type:Private', profileURL: getIconUrl('navigation/class.svg'), color: 'magenta' },
  ]

  const COLORS = ['teal', 'orange', 'green', 'blue', 'purple']

  const cats = categories.value.map((c, index) => ({
    label: c.name,
    value: `cat:${c.id}`,
    profileURL: c.profileURL,
    color: COLORS[index % COLORS.length],
  }))

  return [...types, ...cats]
})

const { searchQuery, searchResults } = useSearch(programs, (p) => {
  return `${p.name} ${p.category} ${p.categoryId} ${p.level} ${p.type}`
})

const displayPrograms = computed(() => {
  let result = [...searchResults.value]

  const filter = currentFilter.value
  if (filter !== 'all') {
    if (filter.startsWith('type:')) {
      const type = filter.replace('type:', '')
      result = result.filter((p) => p.type === type)
    } else if (filter.startsWith('cat:')) {
      const catId = filter.replace('cat:', '')
      result = result.filter((p) => p.categoryId === catId)
    }
  }

  result.sort((a, b) => {
    if (filter === 'type:Group' || filter === 'type:Private') {
      return (a.name || '').localeCompare(b.name || '')
    }
    if (filter.startsWith('cat:')) {
      return (a.level || '').localeCompare(b.level || '')
    }
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  })

  return result
})

const totalProgramsCount = computed(() => displayPrograms.value.length)

const paginatedPrograms = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return displayPrograms.value.slice(start, end)
})

// Watch for search/filter changes to reset pagination
watch([searchQuery, currentFilter], () => {
  currentPage.value = 1
})

const navigateToDetail = (item) => {
  if (item.id === newlyCreatedId.value) {
    newlyCreatedId.value = null
  }
  if (item.id) {
    router.push(`/programs/${item.id}`)
  }
}

const handleAction = (type, program) => {
  openModal(type, program)
}

const openModal = (type, program = null) => {
  actionModal.value = {
    isOpen: true,
    type,
    program,
    loading: false,
    error: '',
    success: '',
  }
}

const closeModal = () => {
  actionModal.value.isOpen = false
  actionModal.value.error = ''
  actionModal.value.success = ''
}

const handleActionSubmit = async (formData) => {
  actionModal.value.loading = true
  actionModal.value.error = ''
  try {
    if (actionModal.value.type === 'add') {
      const result = await programService.createProgram(formData)
      newlyCreatedId.value = result.id

      if (formData.schedule) {
        await classService.createClass({
          programId: result.id,
          branchId: 'FM',
          day: formData.schedule.day,
          time: formData.schedule.time,
          maxCapacity: 20,
        })
      }

      actionModal.value.success = 'Program & Initial Class created successfully!'
    } else if (actionModal.value.type === 'edit') {
      await programService.updateProgram(actionModal.value.program.id, formData)
      newlyCreatedId.value = actionModal.value.program.id
      actionModal.value.success = 'Program updated successfully!'
    } else if (actionModal.value.type === 'delete') {
      await programService.deleteProgram(actionModal.value.program.id)
      actionModal.value.success = 'Program deleted successfully!'
    }

    setTimeout(async () => {
      await fetchPrograms()
      closeModal()
    }, 1500)
  } catch (error) {
    actionModal.value.error = error.message || 'Failed to process request'
  } finally {
    actionModal.value.loading = false
  }
}
</script>

<template>
  <DashboardLayout>
    <DataPageLayout overviewTitle="Program Overview">
      <template #overview>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <DataMetricCard v-for="stat in statsCards" :key="stat.label" v-bind="stat" />
        </div>
      </template>

      <template #table>
        <DataTable title="Program Lists" :headers="programHeaders" :items="paginatedPrograms" :loading="loading"
          entityName="program" :flexible="true" v-model:searchQuery="searchQuery" searchPlaceholder="Search programs..."
          :hasFilter="true" :currentFilter="currentFilter" :filterOptions="filterOptions"
          @update:currentFilter="currentFilter = $event" :hasSort="false" :rowClass="getRowClass" :hasPagination="true"
          :currentPage="currentPage" :pageSize="pageSize" :totalItems="totalProgramsCount"
          @update:currentPage="currentPage = $event" @action="({ type, item }) => handleAction(type, item)"
          @row-click="navigateToDetail">
          <template #toolbar-actions>
            <AppButton variant="primary" size="md" class="rounded-xl shadow-lg shadow-primary/20"
              @click="openModal('add')">
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
              <span class="font-bold tracking-tight">New Program</span>
            </AppButton>
          </template>

          <template #row="{
            item,
            index,
            toggleMenu,
            activeMenuId,
            isMenuAbove,
            menuStyles,
            handleAction,
            closeMenu,
            headers,
          }">
            <td class="ui-cell text-center font-bold text-content-muted/20 hidden md:table-cell" style="width: 50px">
              {{ index + 1 }}
            </td>

            <td class="ui-cell min-w-[200px]" @click="navigateToDetail(item)">
              <div class="ui-identity-cell">
                <div class="ui-avatar bg-surface-subtle border border-outline-std flex items-center justify-center">
                  <img :src="getProgramProfileURL(item.profileURL, item.category, item.categoryProfileURL)"
                    alt="program" class="w-full h-full object-cover" />
                </div>
                <div class="ui-identity-info">
                  <span class="text-sm font-semibold text-content-dark truncate block">{{ item.name }}</span>
                  <span class="text-[10px] font-semibold text-primary uppercase tracking-widest">{{ item.category ||
                    'Standard' }}</span>
                </div>
              </div>
            </td>

            <td class="ui-cell hidden xl:table-cell">
              <span class="text-xs font-medium text-content-muted line-clamp-2" :title="item.description">{{
                item.description || 'No description provided' }}</span>
            </td>

            <td class="ui-cell text-center hidden lg:table-cell">
              <AppBadge :status="item.level" :type="'magenta'" />
            </td>

            <td class="ui-cell text-center hidden sm:table-cell">
              <div class="flex flex-col items-center">
                <span class="text-sm font-semibold text-content-dark tabular-nums">{{ item.totalSessions || 0 }}</span>
              </div>
            </td>

            <td class="ui-cell text-center">
              <AppBadge :status="'$' + item.basePrice" type="blue" />
            </td>

            <td class="ui-cell text-center hidden lg:table-cell">
              <div class="flex flex-col items-center">
                <span class="text-xs font-semibold text-content-dark uppercase tracking-widest tabular-nums">{{
                  item.maxCapacity || '∞' }}</span>
              </div>
            </td>

            <td class="ui-cell text-center">
              <AppBadge :status="item.type || 'Group'" />
            </td>

            <td class="ui-cell text-center" :style="{ width: headers[7].width }">
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
                        @click="() => { handleAction('edit', item); closeMenu(); }">
                        <img :src="getActionIcon('edit')" class="w-4 h-4 opacity-40 group-hover:opacity-100" />
                        <span class="font-bold">Edit</span>
                      </button>
                      <div class="h-px bg-surface-light mx-1 my-1"></div>
                      <button class="ui-dropdown-item ui-dropdown-item-danger group font-bold tracking-tighter"
                        @click="() => { handleAction('delete', item); closeMenu(); }">
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

    <ProgramActionModal :isOpen="actionModal.isOpen" :type="actionModal.type" :program="actionModal.program"
      :loading="actionModal.loading" :error="actionModal.error" :success="actionModal.success" @close="closeModal"
      @submit="handleActionSubmit" @lookup-deleted="fetchPrograms" />
  </DashboardLayout>
</template>
