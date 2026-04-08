<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../components/layout/DashboardLayout.vue'
import DataPageLayout from '../components/layout/DataPageLayout.vue'
import AppButton from '../components/common/ui/AppButton.vue'
import DataMetrics from '../components/common/data/DataMetrics.vue'
import DataTable from '../components/common/data/DataTable.vue'
import StatusBadge from '../components/common/ui/StatusBadge.vue'
import ProgramActionModal from '../components/programs/ProgramActionModal.vue'
import { programService } from '../services/programService'
import { useSearch, programSearchMapper } from '../composables/useSearch'
import {
  getImageUrl,
  getActionIcon
} from '@/utils/assetHelper'
import { getProgramDisplayStatus } from '@/utils/programHelper'

const programs = ref([])
const sessions = ref([])
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

const getRowClass = (item) => {
  return newlyCreatedId.value === item.id ? 'new-row-highlight' : ''
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
    { label: 'Total Products', value: programs.value.length, image: getImageUrl('programs/total-program'), color: 'var(--accent-light)' },
    { label: 'Group Programs', value: programs.value.filter(p => p.type === 'group').length, image: getImageUrl('programs/active-program'), color: 'var(--accent-light)' },
    { label: 'Private Programs', value: programs.value.filter(p => p.type === 'private').length, image: getImageUrl('programs/upcoming-program'), color: 'var(--accent-light)' },
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
      programService.getAllCategories().catch((e) => {
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
  return categories.value.filter(c => c.name.toLowerCase().includes(q))
})

onMounted(() => {
  fetchPrograms()
  intervalId.value = setInterval(() => {
    now.value = new Date()
  }, 60000)
})

const programHeaders = [
  { label: 'No', width: '50px', class: 'hide-on-mobile', align: 'center' },
  { label: 'Category', width: '150px' },
  { label: 'Program Model', width: '250px' },
  { label: 'Sessions', align: 'center', width: '80px' },
  { label: 'Weeks', align: 'center', width: '80px' },
  { label: 'Base Price', align: 'center', width: '100px' },
  { label: 'Cap', align: 'center', width: '50px' },
  { label: 'Type', align: 'center', width: '100px' },
  { label: 'Action', width: '60px', align: 'center' },
]


const { searchQuery, searchResults } = useSearch(programs, programSearchMapper)

const filteredPrograms = computed(() => {
  const list = searchResults.value || []
  let result = [...list]

  if (categoryFilter.value !== 'all') {
    result = result.filter(p => (p.category || 'General') === categoryFilter.value)
  }

  if (currentFilter.value.startsWith('status:')) {
    const filterStatus = currentFilter.value.replace('status:', '')
    result = result.filter((p) => {
      const displayStatus = getProgramDisplayStatus(p, sessions.value, now.value).toLowerCase()
      return displayStatus === filterStatus.toLowerCase()
    })
  }

  if (currentFilter.value === 'sort:category') {
    result.sort((a, b) => {
      const catA = (a.category || 'General').toLowerCase()
      const catB = (b.category || 'General').toLowerCase()
      if (catA !== catB) return catA.localeCompare(catB)
      return (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase())
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
        await programService.createSession({
          programId: result.id,
          branch: { id: 'FM', name: 'Funmall', abbr: 'FM' },
          schedule: {
            day: formData.schedule.day,
            timeslot: formData.schedule.timeslot
          },
          capacity: 20
        })
      }

      actionModal.value.success = 'Program & Initial Session created successfully!'
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
      maxWidth: '100px'
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
        <DataMetrics :stats="statsCards" />
      </template>

      <template #table>
        <DataTable title="Program List" :headers="programHeaders" :items="filteredPrograms" :loading="loading"
          v-model:searchQuery="searchQuery" searchPlaceholder="Search programs..." :hasFilter="true"
          v-model:currentFilter="currentFilter" :filterOptions="[
            { label: 'All Programs', value: 'all' },
            { label: 'Sort: Category', value: 'sort:category' },
            { label: 'Status: Active', value: 'status:active' },
            { label: 'Status: Upcoming', value: 'status:upcoming' },
            { label: 'Status: In Progress', value: 'status:in progress' },
            { label: 'Status: Closed', value: 'status:closed' },
            { label: 'Status: Archived', value: 'status:archived' },
          ]" :rowClass="getRowClass" @row-click="onRowClick" @action="({ type, item }) => handleAction(type, item)">
          <template #toolbar-actions>
            <div class="filter-dropdown-container">
              <AppButton variant="secondary" :class="{ active: categoryFilter !== 'all' }" @click="toggleCategoryFilter"
                @blur="closeCategoryFilter">
                <span v-if="categoryFilter === 'all'">All Categories</span>
                <span v-else>{{ categoryFilter }}</span>
              </AppButton>
              <Teleport to="body">
                <transition name="toast-fade">
                  <div v-if="isCategoryFilterOpen" class="filter-dropdown-menu scrollable-menu category-filter-menu"
                    :style="categoryMenuStyles" @mousedown.stop>
                    <div class="dropdown-search-wrapper">
                      <input type="text" v-model="categorySearchQuery" placeholder="Search category..."
                        class="search-input-mini"
                        @mousedown.stop />
                    </div>
                    <div class="filter-option" :class="{ active: categoryFilter === 'all' }"
                      @click.stop="selectCategory('all')">
                      All Categories
                    </div>
                    <div v-for="cat in filteredCategories" :key="cat.id" class="filter-option"
                      :class="{ active: categoryFilter === cat.name }" @click.stop="selectCategory(cat.name)">
                      {{ cat.name }}
                    </div>
                    <div v-if="filteredCategories.length === 0" class="filter-option no-results text-muted italic">
                      No matches found
                    </div>
                  </div>
                </transition>
              </Teleport>
            </div>
            <AppButton variant="primary" @click="openModal('add')">
              <img :src="getActionIcon('plus')" class="btn-icon-mini reverse-icon" /> Add Program
            </AppButton>
          </template>

          <template #row="{ item, index, toggleMenu, activeMenuId, isMenuAbove, menuStyles, handleAction }">
            <td class="hide-on-mobile text-center">
              {{ index + 1 }}
            </td>
            <td>
              <div class="user-info">
                <div class="program-icon-mini">
                  <img :src="getProgramProfileURL(item.profileURL || item.imageURL, item.category)" alt="program" />
                </div>
                {{ item.category || 'General' }}
              </div>
            </td>
            <td class="bold">{{ item.name || item.title }}</td>
            <td class="text-center">{{ item.sessionNumber || '-' }}</td>
            <td class="text-center">{{ item.weeksNumber || '-' }}</td>
            <td class="text-center bold">
              <StatusBadge :status="'$' + (item.basePrice || 0)" />
            </td>
            <td class="text-center">{{ item.maxCapacity || '-' }}</td>
            <td class="text-center">
              <StatusBadge :status="item.type || 'group'" :type="item.type === 'private' ? 'purple' : 'blue'" />
            </td>

            <td class="action-cell text-center">
              <div class="menu-container">
                <button class="btn-dots" @click.stop="toggleMenu($event, item.id)">
                  <span class="dots-icon">⋮</span>
                </button>
                <Teleport to="body">
                  <transition name="fade">
                    <div v-if="activeMenuId === item.id" class="action-dropdown" :class="{ 'open-up': isMenuAbove }"
                      :style="menuStyles" @click.stop>
                      <button class="btn-edit" @click="handleAction('edit', item)">
                        <img :src="getActionIcon('edit')" class="action-icon-mini" /> Edit
                      </button>
                      <div class="menu-divider"></div>
                      <button class="delete-btn" @click="handleAction('delete', item)">
                        <img :src="getActionIcon('delete')" class="action-icon-mini" /> Delete
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

<style scoped>
.schedule-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: var(--text-xs);
}

.schedule-info .day {
  font-weight: 700;
  color: var(--text-dark);
}

.schedule-info .time {
  color: var(--text-muted);
}

.schedule-info .duration {
  color: var(--text-light);
  font-style: italic;
  font-size: var(--text-xs);
}

.help-text-small {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: var(--space-2xs);
}

.user-info {
  cursor: pointer;
  gap: var(--space-sm);
}

.filter-dropdown-container {
  position: relative;
}

.filter-dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: var(--white);
  border-radius: var(--border-radius-sm);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--border-color);
  z-index: 100;
  overflow: hidden;
  min-width: 180px;
}

.scrollable-menu {
  max-height: 200px;
  overflow-y: auto;
}

.filter-option {
  padding: var(--space-sm) var(--space-md);
  font-size: var(--text-sm);
  color: var(--text-dark);
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.filter-option:hover {
  background: var(--primary-soft);
}

.filter-option.active {
  background: var(--accent-light);
  color: var(--primary-color);
  font-weight: 700;
}

.teacher-stack-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.teacher-avatar-stack {
  display: flex;
  align-items: center;
}

.teacher-avatar-mini {
  margin-left: -12px;
  width: 28px;
  height: 28px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border: 2px solid var(--white);
  border-radius: 50%;
  overflow: hidden;
  transition: transform 0.2s;
}

.teacher-avatar-mini:first-child {
  margin-left: 0;
}

.teacher-avatar-mini:hover {
  transform: translateY(-3px) scale(1.1);
  z-index: 50;
}

.teacher-avatar-mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.teacher-name-solo {
  font-size: var(--text-sm);
  color: var(--text-dark);
  font-weight: 500;
}

.teacher-count-tag {
  font-size: var(--text-xs);
  color: var(--text-muted);
  background: var(--bg-light);
  padding: 2px 8px;
  border-radius: var(--border-radius-lg);
  white-space: nowrap;
}

.period-info {
  display: flex;
  flex-direction: column;
  font-size: var(--text-xs);
  color: var(--text-dark);
}

.to-label {
  font-size: var(--text-3xs);
  color: var(--text-light);
  font-weight: 600;
  text-transform: uppercase;
}
</style>
