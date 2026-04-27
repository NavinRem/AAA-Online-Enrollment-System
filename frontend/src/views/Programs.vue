<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import DataMetrics from '../components/common/data/DataMetrics.vue'
import DataTable from '../components/common/data/DataTable.vue'
import AppBadge from '../components/common/ui/AppBadge.vue'
import ProgramActionModal from '../components/programs/ProgramActionModal.vue'
import DataMetricCard from '@/components/common/data/DataMetricCard.vue'
import { programService } from '../services/programService'
import { categoryService } from '../services/categoryService'
import { classService } from '../services/classService'
import { enrollmentService } from '../services/enrollmentService'
import { trialService } from '../services/trialService'
import { useSearch, programSearchMapper } from '../composables/useSearch'
import { getProgramProfileURL, getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { getProgramDisplayStatus } from '@/utils/programHelper'

const programs = ref([])
const loading = ref(true)
const currentFilter = ref('all')
const categoryFilter = ref('all')
const categories = ref([])
const isCategoryFilterOpen = ref(false)
const categorySearchQuery = ref('')
const categoryMenuStyles = ref({})
const newlyCreatedId = ref(null)
const enrollments = ref([])
const trials = ref([])

const router = useRouter()
const currentPage = ref(1)
const pageSize = 10

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
  const p = programs.value.find((p) => p.id === maxPid)
  return { name: p ? p.name : 'Unknown Program', count: maxCount }
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
  const p = programs.value.find((p) => p.id === maxPid)
  return { name: p ? p.name : 'Unknown Program', count: maxCount }
})

const topRevenueProgram = computed(() => {
  if (!enrollments.value.length || !programs.value.length) return { name: 'No Revenue', revenue: 0 }
  const revs = {}
  enrollments.value.forEach((e) => {
    if (e.programId) {
      const p = programs.value.find((prog) => prog.id === e.programId)
      revs[e.programId] = (revs[e.programId] || 0) + (p ? (p.basePrice || 0) : 0)
    }
  })
  let maxRev = 0, maxPid = null
  for (const pid in revs) {
    if (revs[pid] > maxRev) { maxRev = revs[pid]; maxPid = pid }
  }
  const p = programs.value.find((p) => p.id === maxPid)
  return { name: p ? p.name : 'Unknown Program', revenue: maxRev }
})

const statsCards = computed(() => {
  return [
    {
      label: 'Total Products',
      value: programs.value.length,
      image: getImageUrl('programs/total-program'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Top Trial Program',
      value: topTrialProgram.value.count,
      subValue: topTrialProgram.value.name,
      image: getImageUrl('programs/active-program'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Most Popular',
      value: topEnrolledProgram.value.count,
      subValue: topEnrolledProgram.value.name,
      image: getImageUrl('programs/total-program'),
      color: 'var(--color-primary-light)',
    },
    {
      label: 'Top Revenue Program',
      value: `$${topRevenueProgram.value.revenue.toLocaleString()}`,
      subValue: topRevenueProgram.value.name,
      image: getImageUrl('programs/upcoming-program'),
      color: 'var(--color-primary-light)',
    },
  ]
})

const fetchPrograms = async () => {
  loading.value = true
  try {
    const [programsData, catsData, enrollData, trialsData] = await Promise.all([
      programService.getAllPrograms().catch((e) => {
        console.error('Error fetching programs:', e)
        return []
      }),
      categoryService.getAllCategories().catch((e) => {
        console.error('Error fetching categories:', e)
        return []
      }),
      enrollmentService.getAllEnrollments().catch((e) => {
        console.error('Error fetching enrollments:', e)
        return []
      }),
      trialService.getAllTrials().catch((e) => {
        console.error('Error fetching trials:', e)
        return []
      }),
    ])
    programs.value = Array.isArray(programsData) ? programsData : []
    categories.value = Array.isArray(catsData) ? catsData : []
    enrollments.value = Array.isArray(enrollData) ? enrollData : []
    trials.value = Array.isArray(trialsData) ? trialsData : []
  } catch (error) {
    console.error('Failed to fetch programs or categories', error)
  } finally {
    loading.value = false
  }
}

const intervalId = ref(null)

const filteredCategories = computed(() => {
  if (!categorySearchQuery.value) return categories.value
  const q = categorySearchQuery.value.toLowerCase()
  return categories.value.filter((c) => c.name.toLowerCase().includes(q))
})

onMounted(() => {
  fetchPrograms()
})

const programHeaders = [
  { label: 'NO', width: '50px', class: 'hidden md:table-cell', align: 'center' },
  { label: 'PROGRAM IDENTITY' },
  { label: 'CLASSES', align: 'center', width: '120px', class: 'hidden sm:table-cell' },
  { label: 'WEEKS', align: 'center', width: '120px', class: 'hidden sm:table-cell' },
  { label: 'BASE PRICE', align: 'center', width: '120px' },
  { label: 'MAX CAPACITY', align: 'center', width: '100px', class: 'hidden lg:table-cell' },
  { label: 'TYPE', align: 'center', width: '120px' },
  { label: 'ACTION', width: '60px', align: 'center' },
]

const { searchQuery, searchResults } = useSearch(programs, programSearchMapper)

const filteredPrograms = computed(() => {
  const list = searchResults.value || []
  let result = [...list]

  if (categoryFilter.value !== 'all') {
    result = result.filter((p) => (p.category || 'General') === categoryFilter.value)
  }

  if (currentFilter.value.startsWith('status:')) {
    const filterStatus = currentFilter.value.replace('status:', '')
    result = result.filter((p) => {
      const displayStatus = getProgramDisplayStatus(p).toLowerCase()
      return displayStatus === filterStatus.toLowerCase()
    })
  }

  if (currentFilter.value === 'sort:category') {
    result.sort((a, b) => {
      const catA = (a.category || 'General').toLowerCase()
      const catB = (b.category || 'General').toLowerCase()
      if (catA !== catB) return catA.localeCompare(catB)
      return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase())
    })
  } else {
    result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  }

  return result
})

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
          timeslot: formData.schedule.timeslot,
          capacity: 20,
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

    setTimeout(() => {
      closeModal()
      fetchPrograms()
    }, 1500)
  } catch (error) {
    actionModal.value.error = error.message || 'Action failed'
  } finally {
    actionModal.value.loading = false
  }
}

const selectCategory = (name) => {
  categoryFilter.value = name
  isCategoryFilterOpen.value = false
}

const toggleCategoryFilter = (event) => {
  isCategoryFilterOpen.value = !isCategoryFilterOpen.value
  if (isCategoryFilterOpen.value) {
    categorySearchQuery.value = ''
    const rect = event.currentTarget.getBoundingClientRect()
    categoryMenuStyles.value = {
      top: `${rect.bottom + 8}px`,
      left: `${rect.left}px`,
      minWidth: '200px',
    }
  }
}

const closeCategoryFilter = (event) => {
  setTimeout(() => {
    const menu = document.querySelector('.category-filter-menu')
    if (menu && menu.contains(event.relatedTarget)) return
    isCategoryFilterOpen.value = false
  }, 200)
}

const onRowClick = (item) => {
  if (item.id === newlyCreatedId.value) {
    newlyCreatedId.value = null
  }
  router.push(`/programs/${item.id}`)
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
        <DataTable title="Program Lists" :headers="programHeaders" :items="filteredPrograms" :loading="loading"
          entityName="program" :flexible="true" v-model:searchQuery="searchQuery"
          searchPlaceholder="Search programs by title or model..." :hasFilter="true"
          v-model:currentFilter="currentFilter" :filterOptions="[
            { label: 'All Status', value: 'all' },
            { label: 'Group Models', value: 'status:group' },
            { label: 'Private Models', value: 'status:private' },
            { label: 'Active Programs', value: 'status:active' },
            { label: 'Upcoming Terms', value: 'status:upcoming' },
            { label: 'Closed/Archive', value: 'status:closed' },
          ]" :rowClass="getRowClass" @row-click="onRowClick" @action="({ type, item }) => handleAction(type, item)">
          <template #toolbar-actions>
            <AppButton variant="primary" size="md" class="rounded-xl shadow-lg shadow-primary/20"
              @click="openModal('add')">
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
              <span class="font-black tracking-tight">New Program</span>
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
            headers,
          }">
            <!-- No -->
            <td class="ui-cell text-center font-bold text-content-muted/20 hidden md:table-cell">
              {{ (currentPage - 1) * pageSize + index + 1 }}
            </td>

            <!-- Category & Program -->
            <td class="ui-cell min-w-[200px]" @click="onRowClick(item)">
              <div class="ui-identity-cell">
                <div class="ui-avatar bg-surface-subtle border border-outline-std flex items-center justify-center">
                  <img :src="getProgramProfileURL(item.profileURL, item.category)" alt="program"
                    class="w-full h-full object-cover" />
                </div>
                <div class="ui-identity-info">
                  <span class="text-sm font-bold text-content-dark truncate block">{{ item.name }}</span>
                  <span class="text-[10px] font-black text-primary uppercase tracking-widest">{{ item.category ||
                    'Standard' }}</span>
                </div>
              </div>
            </td>

            <!-- Academic Stats -->
            <td class="ui-cell text-center hidden sm:table-cell">
              <div class="flex flex-col items-center">
                <span class="text-sm font-black text-content-dark tabular-nums">{{ item.totalClasses || 0 }}</span>
              </div>
            </td>

            <td class="ui-cell text-center hidden sm:table-cell">
              <div class="flex flex-col items-center">
                <span class="text-sm font-black text-content-dark tabular-nums">{{ item.weeksNumber || 0 }}</span>
              </div>
            </td>

            <!-- Financials -->
            <td class="ui-cell text-center">
              <AppBadge :status="'$' + item.basePrice" type="blue" />
            </td>

            <!-- Capacity -->
            <td class="ui-cell text-center hidden lg:table-cell">
              <div class="flex flex-col items-center">
                <span class="text-xs font-black text-content-dark uppercase tracking-widest tabular-nums">{{
                  item.maxCapacity || '∞' }}</span>
              </div>
            </td>

            <!-- Type -->
            <td class="ui-cell text-center">
              <AppBadge :status="item.type || 'group'" :type="item.type === 'private' ? 'purple' : 'blue'" />
            </td>

            <!-- Actions -->
            <td class="ui-cell text-center">
              <div class="ui-action-menu flex items-center justify-center">
                <button
                  class="w-8 h-8 flex items-center justify-center hover:bg-surface-subtle rounded-lg transition-all text-content-muted hover:text-content-dark"
                  @click.stop="toggleMenu($event, item.id)">
                  <span class="font-black text-lg">⋮</span>
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
                        @click="handleAction('edit', item); closeMenu()">
                        <img :src="getActionIcon('edit')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                        <span class="font-bold text-sm">Modify Data</span>
                      </button>

                      <div class="h-px bg-surface-light mx-1 my-1"></div>

                      <button class="ui-dropdown-item ui-dropdown-item-danger group font-black tracking-tighter"
                        @click="handleAction('delete', item); closeMenu()">
                        <img :src="getActionIcon('delete')"
                          class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                        Remove Program
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
      @submit="handleActionSubmit" />
  </DashboardLayout>
</template>
