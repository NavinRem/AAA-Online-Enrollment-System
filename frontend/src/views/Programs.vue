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
import { useSearch, programSearchMapper } from '../composables/useSearch'
import { getProgramProfileURL, getImageUrl, getActionIcon } from '@/utils/assetHelper'
import { getProgramDisplayStatus } from '@/utils/programHelper'

const programs = ref([])
const classes = ref([])
const loading = ref(true)
const currentFilter = ref('all')
const categoryFilter = ref('all')
const categories = ref([])
const isCategoryFilterOpen = ref(false)
const categorySearchQuery = ref('')
const categoryMenuStyles = ref({})
const now = ref(new Date())
const newlyCreatedId = ref(null)

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

const statsCards = computed(() => {
  return [
    {
      label: 'Total Products',
      value: programs.value.length,
      image: getImageUrl('programs/total-program'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Group Programs',
      value: programs.value.filter((p) => p.type === 'group').length,
      image: getImageUrl('programs/active-program'),
      color: 'var(--accent-light)',
    },
    {
      label: 'Private Programs',
      value: programs.value.filter((p) => p.type === 'private').length,
      image: getImageUrl('programs/upcoming-program'),
      color: 'var(--accent-light)',
    },
  ]
})

const fetchPrograms = async () => {
  loading.value = true
  try {
    const [programsData, catsData] = await Promise.all([
      programService.getAllPrograms().catch((e) => {
        console.error('Error fetching programs:', e)
        return []
      }),
      categoryService.getAllCategories().catch((e) => {
        console.error('Error fetching categories:', e)
        return []
      }),
    ])
    programs.value = Array.isArray(programsData) ? programsData : []
    categories.value = Array.isArray(catsData) ? catsData : []
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
  intervalId.value = setInterval(() => {
    now.value = new Date()
  }, 60000)
})

const programHeaders = [
  { label: 'No', width: '50px', class: 'hidden md:table-cell', align: 'center' },
  { label: 'Category' },
  { label: 'Program Model' },
  { label: 'Sessions', align: 'center', width: '80px', class: 'hidden sm:table-cell' },
  { label: 'Weeks', align: 'center', width: '80px', class: 'hidden sm:table-cell' },
  { label: 'Base Price', align: 'center', width: '100px' },
  { label: 'Cap', align: 'center', width: '50px', class: 'hidden lg:table-cell' },
  { label: 'Type', align: 'center', width: '100px' },
  { label: 'Action', width: '60px', align: 'center' },
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
    <DataPageLayout overviewTitle="Academic Program Repository">
      <template #overview>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <DataMetricCard v-for="stat in statsCards" :key="stat.label" v-bind="stat" />
        </div>
      </template>

      <template #table>
        <DataTable
          title="Active Programs"
          :headers="programHeaders"
          :items="filteredPrograms"
          :loading="loading"
          entityName="program"
          :flexible="true"
          v-model:searchQuery="searchQuery"
          searchPlaceholder="Search programs by title or model..."
          :hasFilter="true"
          v-model:currentFilter="currentFilter"
          :filterOptions="[
            { label: 'All Status', value: 'all' },
            { label: 'Group Models', value: 'status:group' },
            { label: 'Private Models', value: 'status:private' },
            { label: 'Active Programs', value: 'status:active' },
            { label: 'Upcoming Terms', value: 'status:upcoming' },
            { label: 'Closed/Archive', value: 'status:closed' },
          ]"
          :rowClass="getRowClass"
          @row-click="onRowClick"
          @action="({ type, item }) => handleAction(type, item)"
        >
          <template #toolbar-actions>
            <div class="relative group">
              <button
                @click="toggleCategoryFilter"
                @blur="closeCategoryFilter"
                class="flex items-center gap-3 px-6 py-2.5 rounded-xl bg-white border border-outline-std hover:border-primary/30 hover:shadow-md transition-all group"
                :class="{ 'ring-2 ring-primary/10 border-primary/40 bg-primary/5': categoryFilter !== 'all' }"
              >
                <span class="text-[10px] font-black uppercase tracking-widest text-content-muted group-hover:text-primary transition-colors">
                  {{ categoryFilter === 'all' ? 'All Categories' : categoryFilter }}
                </span>
                <span class="w-1.5 h-1.5 rounded-full bg-content-muted/30 group-hover:bg-primary/50"></span>
              </button>
              
              <Teleport to="body">
                <transition
                  enter-active-class="transition duration-200 ease-out"
                  enter-from-class="transform scale-95 opacity-0"
                  enter-to-class="transform scale-100 opacity-100"
                  leave-active-class="transition duration-150 ease-in"
                  leave-from-class="opacity-100"
                  leave-to-class="opacity-0"
                >
                  <div
                    v-if="isCategoryFilterOpen"
                    class="ui-dropdown-menu !p-2 !rounded-2xl shadow-2xl ring-1 ring-black/5"
                    :style="categoryMenuStyles"
                    @mousedown.stop
                  >
                    <div class="mb-2 p-1">
                      <input
                        type="text"
                        v-model="categorySearchQuery"
                        placeholder="Quick search..."
                        class="w-full text-xs font-bold px-4 py-2.5 bg-surface-subtle rounded-xl border-none focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-content-muted/40"
                        @mousedown.stop
                      />
                    </div>
                    <div class="max-h-[220px] overflow-y-auto scrollable-v px-1 pb-1">
                      <button
                        class="w-full text-left px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all mb-1"
                        :class="categoryFilter === 'all' ? 'bg-primary text-white shadow-lg' : 'text-content-muted hover:bg-primary/5 hover:text-primary'"
                        @click.stop="selectCategory('all')"
                      >
                        Global View
                      </button>
                      <button
                        v-for="cat in filteredCategories"
                        :key="cat.id"
                        class="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all mb-1 truncate"
                        :class="categoryFilter === cat.name ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'text-content-muted hover:bg-surface-subtle hover:text-content-dark'"
                        @click.stop="selectCategory(cat.name)"
                      >
                        {{ cat.name }}
                      </button>
                    </div>
                  </div>
                </transition>
              </Teleport>
            </div>

            <AppButton variant="primary" size="md" class="rounded-xl shadow-lg shadow-primary/20" @click="openModal('add')">
              <img :src="getActionIcon('plus')" class="w-4 h-4 brightness-0 invert" />
              <span class="font-black tracking-tight">Launch Program</span>
            </AppButton>
          </template>

          <template
            #row="{
              item,
              index,
              toggleMenu,
              activeMenuId,
              isMenuAbove,
              menuStyles,
              handleAction,
              headers,
            }"
          >
            <!-- No -->
            <td class="ui-cell text-center font-bold text-content-muted/20 hidden md:table-cell">
              {{ (currentPage - 1) * pageSize + index + 1 }}
            </td>

            <!-- Category & Program -->
            <td class="ui-cell min-w-[200px]" @click="onRowClick(item)">
               <div class="flex items-center gap-4 group cursor-pointer">
                  <div class="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-primary/5 group-hover:ring-primary/20 transition-all duration-500 shadow-sm">
                    <img :src="getProgramProfileURL(item.profileURL, item.category)" alt="program" class="w-full h-full object-cover" />
                  </div>
                  <div class="flex flex-col">
                    <span class="text-[10px] font-black text-primary uppercase tracking-widest leading-tight mb-0.5">{{ item.category || 'Standard' }}</span>
                    <span class="font-black text-content-dark group-hover:text-primary transition-colors tracking-tighter text-base leading-tight">{{ item.name }}</span>
                  </div>
               </div>
            </td>

            <!-- Academic Stats -->
            <td class="ui-cell text-center hidden sm:table-cell">
              <div class="flex flex-col items-center">
                 <span class="text-sm font-black text-content-dark tabular-nums">{{ item.totalClasses || 0 }}</span>
                 <span class="text-[9px] font-black text-content-muted uppercase tracking-tighter">Classes</span>
              </div>
            </td>

            <td class="ui-cell text-center hidden sm:table-cell">
               <div class="flex flex-col items-center">
                  <span class="text-sm font-black text-content-dark tabular-nums">{{ item.weeksNumber || 0 }}</span>
                  <span class="text-[9px] font-black text-content-muted uppercase tracking-tighter">Duration</span>
               </div>
            </td>

            <!-- Financials -->
            <td class="ui-cell text-center">
               <div class="inline-flex flex-col items-center px-4 py-1.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                  <span class="text-sm font-black text-emerald-700 tabular-nums">${{ item.basePrice || 0 }}</span>
                  <span class="text-[8px] font-black text-emerald-600/60 uppercase tracking-widest">Base Rate</span>
               </div>
            </td>

            <!-- Capacity -->
            <td class="ui-cell text-center hidden lg:table-cell">
              <div class="flex flex-col items-center">
                 <span class="text-xs font-black text-content-dark uppercase tracking-widest tabular-nums">{{ item.maxCapacity || '∞' }}</span>
                 <span class="text-[9px] font-black text-content-muted uppercase tracking-tighter">Limit</span>
              </div>
            </td>

            <!-- Type -->
            <td class="ui-cell text-center">
              <AppBadge
                :status="item.type || 'group'"
                :type="item.type === 'private' ? 'purple' : 'blue'"
              />
            </td>

            <!-- Actions -->
            <td class="ui-cell text-center">
              <div class="relative">
                <button @click.stop="toggleMenu($event, item.id)" class="p-2 hover:bg-surface-subtle rounded-lg transition-colors group">
                  <span class="font-black text-content-muted group-hover:text-primary">⋮</span>
                </button>
                <Teleport to="body">
                  <transition
                    enter-active-class="transition duration-200 ease-out"
                    enter-from-class="transform scale-95 opacity-0"
                    enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-150 ease-in"
                    leave-from-class="opacity-100"
                    leave-to-class="opacity-0"
                  >
                    <div
                      v-if="activeMenuId === item.id"
                      class="ui-dropdown-menu"
                      :class="{ 'origin-bottom': isMenuAbove, 'origin-top': !isMenuAbove }"
                      :style="menuStyles"
                      @click.stop
                    >
                      <button
                        class="ui-dropdown-item group"
                        @click="handleAction('edit', item); closeMenu()"
                      >
                        <img :src="getActionIcon('edit')" class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                        <span class="font-bold text-sm">Modify Data</span>
                      </button>
                      
                      <div class="h-px bg-surface-subtle mx-2 my-1"></div>
                      
                      <button
                        class="ui-dropdown-item group text-error"
                        @click="handleAction('delete', item); closeMenu()"
                      >
                        <img :src="getActionIcon('delete')" class="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity invert" />
                        <span class="font-black text-sm">Remove Program</span>
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

    <ProgramActionModal
      :isOpen="actionModal.isOpen"
      :type="actionModal.type"
      :program="actionModal.program"
      :loading="actionModal.loading"
      :error="actionModal.error"
      :success="actionModal.success"
      @close="closeModal"
      @submit="handleActionSubmit"
    />
  </DashboardLayout>
</template>
