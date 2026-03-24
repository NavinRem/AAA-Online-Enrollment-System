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
import { enrollmentService } from '../services/enrollmentService'
import { useSearch, programSearchMapper } from '../composables/useSearch'
import { getProgramIcon } from '../utils/programHelper'
import { calculateProgramStats, getProgramDisplayStatus } from '../utils/programHelper'

import { getImageUrl } from '@/utils/assetHelper'

const programs = ref([])
const enrollments = ref([])
const sessions = ref([])
const loading = ref(true)
const currentFilter = ref('all')
const categoryFilter = ref('all') // New
const categories = ref([]) // New
const isCategoryFilterOpen = ref(false)
const categorySearchQuery = ref('') // New for search
const categoryMenuStyles = ref({}) // New for positioning
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
  const s = calculateProgramStats(programs.value, enrollments.value, sessions.value, now.value)
  return [
    { label: 'Total Programs', value: s.total, image: getImageUrl('programs/total-program'), color: '#e1f5fe' },
    { label: 'Active Programs', value: s.activeCount, image: getImageUrl('programs/active-program'), color: '#e1f5fe' },
    { label: 'Upcoming Programs', value: s.upcomingCount, image: getImageUrl('programs/upcoming-program'), color: '#e1f5fe' },
    { label: 'In Progress', value: s.inProgressCount, image: getImageUrl('programs/in-progress-program'), color: '#e1f5fe' },
    { label: 'Archived', value: s.archivedCount, image: getImageUrl('programs/archived-program'), color: '#e1f5fe' }
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

  // Update every minute to keep "In Progress" fresh
  intervalId.value = setInterval(() => {
    now.value = new Date()
  }, 60000)
})

const programHeaders = [
  { label: 'No', width: '60px', class: 'hide-on-mobile', align: 'center' },
  { label: 'Category', class: 'hide-on-tablet' },
  { label: 'Title', width: '200px' },
  { label: 'Teachers', class: 'hide-on-tablet', width: '150px' },
  { label: 'Term', class: 'hide-on-tablet', width: '120px' },
  { label: 'Period', class: 'hide-on-mobile' },
  { label: 'Schedule', class: 'hide-on-tablet', width: '150px' },
  { label: 'Level', class: 'hide-on-tablet', align: 'center', width: '30px' },
  { label: 'Price', class: 'hide-on-mobile', align: 'center', width: '80px' },
  { label: 'Status', align: 'center', width: '100px' },
  { label: 'Action', width: '60px', align: 'center' },
]

const { searchQuery, searchResults } = useSearch(programs, programSearchMapper)

const filteredPrograms = computed(() => {
  const list = searchResults.value || []
  let result = [...list]

  // 1. Filtering by Category (Separate Filter)
  if (categoryFilter.value !== 'all') {
    result = result.filter(p => (p.category || 'General') === categoryFilter.value)
  }

  // 2. Filtering by Status (Main Filter)
  if (currentFilter.value.startsWith('status:')) {
    const filterStatus = currentFilter.value.replace('status:', '')
    result = result.filter((p) => {
      const displayStatus = getProgramDisplayStatus(p, sessions.value, now.value).toLowerCase()
      return displayStatus === filterStatus.toLowerCase()
    })
  }

  // 3. Sorting
  if (currentFilter.value === 'sort:category') {
    result.sort((a, b) => {
      const catA = (a.category || 'General').toLowerCase()
      const catB = (b.category || 'General').toLowerCase()
      if (catA !== catB) return catA.localeCompare(catB)
      return (a.title || '').toLowerCase().localeCompare((b.title || '').toLowerCase())
    })
  } else {
    // Default Sort: Created Date Descending
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
      
      // Auto-create initial session if schedule exists
      if (formData.schedule) {
        await programService.createSession({
          program_id: result.id,
          schedule: {
            day: formData.schedule.day,
            timeslot: formData.schedule.timeslot
          },
          capacity: 20 // Default capacity
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
  // Use a slight delay to allow click events on the menu to register
  setTimeout(() => {
    // Check if the relatedTarget is inside the menu to prevent accidental closing
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
        <DataTable
          title="Program List"
          :headers="programHeaders"
          :items="filteredPrograms"
          :loading="loading"
          v-model:searchQuery="searchQuery"
          searchPlaceholder="Search programs..."
          :hasFilter="true"
          v-model:currentFilter="currentFilter"
          :filterOptions="[
            { label: 'All Programs', value: 'all' },
            { label: 'Sort: Category', value: 'sort:category' },
            { label: 'Status: Active', value: 'status:active' },
            { label: 'Status: Upcoming', value: 'status:upcoming' },
            { label: 'Status: In Progress', value: 'status:in progress' },
            { label: 'Status: Closed', value: 'status:closed' },
            { label: 'Status: Archived', value: 'status:archived' },
          ]"
          :rowClass="getRowClass"
          @row-click="onRowClick"
          @action="({ type, item }) => handleAction(type, item)"
        >
          <template #toolbar-actions>
            <!-- Unified Category Filter Dropdown -->
            <div class="filter-dropdown-container">
              <AppButton
                variant="secondary"
                :class="{ active: categoryFilter !== 'all' }"
                @click="toggleCategoryFilter"
                @blur="closeCategoryFilter"
              >
                <span v-if="categoryFilter === 'all'">All Categories</span>
                <span v-else>{{ categoryFilter }}</span>
              </AppButton>
              <Teleport to="body">
                <transition name="toast-fade">
                  <div v-if="isCategoryFilterOpen" class="filter-dropdown-menu scrollable-menu category-filter-menu" :style="categoryMenuStyles" @mousedown.stop>
                    <div class="dropdown-search" style="padding: 8px; border-bottom: 1px solid #f1f5f9;">
                      <input
                        type="text"
                        v-model="categorySearchQuery"
                        placeholder="Search category..."
                        style="width: 100%; padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.85rem;"
                        @mousedown.stop
                      />
                    </div>
                    <div
                      class="filter-option"
                      :class="{ active: categoryFilter === 'all' }"
                      @click.stop="selectCategory('all')"
                    >
                      All Categories
                    </div>
                    <div
                      v-for="cat in filteredCategories"
                      :key="cat.id"
                      class="filter-option"
                      :class="{ active: categoryFilter === cat.name }"
                      @click.stop="selectCategory(cat.name)"
                    >
                      {{ cat.name }}
                    </div>
                    <div v-if="filteredCategories.length === 0" class="filter-option no-results" style="color: #94a3b8; font-style: italic;">
                      No matches found
                    </div>
                  </div>
                </transition>
              </Teleport>
            </div>
            <AppButton variant="primary" @click="openModal('add')">+ Add Program</AppButton>
          </template>

          <template #row="{ item, index, toggleMenu, activeMenuId, isMenuAbove, menuStyles, handleAction }">
            <td class="hide-on-mobile text-center">
              {{ index + 1 }}
            </td>
            <td class="hide-on-tablet">
              <div class="user-info">
                <div class="program-icon-mini">
                  <img :src="getProgramIcon(item.category || item.title)" alt="program" />
                </div>
                {{ item.category || 'General' }}
              </div>
            </td>
            <td class="bold">{{ item.title }}</td>
            <td class="hide-on-tablet">
              <div v-if="item.teachers && item.teachers.length > 0" class="teacher-stack-container">
                <div class="teacher-avatar-stack">
                  <div
                    v-for="(t, i) in item.teachers"
                    :key="t.id || t.uid || i"
                    class="teacher-avatar-mini"
                    :title="t.name || 'Teacher'"
                    :style="{ zIndex: item.teachers.length - i }"
                  >
                    <img :src="t.profileURL || getImageUrl('profiles/avatar-parent')" alt="teacher" />
                  </div>
                </div>
              </div>
              <span v-else class="help-text-small">None assigned</span>
            </td>
            <td class="hide-on-tablet">
              <StatusBadge :status="item.termName || item.term || 'No Term'" type="blue" />
            </td>
            <td class="hide-on-mobile">
              <div class="period-info" v-if="item.startDate">
                <span>{{ item.startDate }}</span>
                <span class="to-label">to</span>
                <span>{{ item.endDate }}</span>
              </div>
              <StatusBadge v-else :status="item.termName || 'No Dates'" type="blue" />
            </td>
            <td class="hide-on-tablet">
              <div class="schedule-info" v-if="item.schedule">
                <span class="day">{{ item.schedule.day }}</span>
                <span class="time">{{ item.schedule.timeslot }}</span>
              </div>
              <span v-else class="help-text-small">Not scheduled</span>
            </td>
            <td class="hide-on-tablet text-center"><StatusBadge :status="item.levelName || item.level || 'Beginner'" type="purple" /></td>
            <td class="hide-on-mobile text-center"><StatusBadge :status="'$' + (item.price || 0)" /></td>
            <td class="text-center"><StatusBadge :status="getProgramDisplayStatus(item, sessions, now)" /></td>
            <td class="action-cell text-center">
              <div class="menu-container">
                <button class="btn-dots" @click.stop="toggleMenu($event, item.id)">
                  <span class="dots-icon">⋮</span>
                </button>
                <Teleport to="body">
                  <transition name="fade">
                    <div v-if="activeMenuId === item.id" class="action-dropdown" :class="{ 'open-up': isMenuAbove }" :style="menuStyles" @click.stop>
                      <button @click="handleAction('edit', item)">✏️ Edit</button>
                      <div class="menu-divider"></div>
                      <button class="delete-btn" @click="handleAction('delete', item)">🗑️ Delete</button>
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

<style scoped>
.schedule-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.825rem;
}

.schedule-info .day {
  font-weight: 700;
  color: #1e293b;
}

.schedule-info .time {
  color: #64748b;
}

.schedule-info .duration {
  color: #94a3b8;
  font-style: italic;
  font-size: 0.75rem;
}

.help-text-small {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 4px;
}
.user-info {
  cursor: pointer;
  gap: 10px;
}

.filter-dropdown-container {
  position: relative;
}

.filter-dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  border: 1px solid #e0e0e0;
  z-index: 100;
  overflow: hidden;
  min-width: 180px;
}

.scrollable-menu {
  max-height: 200px;
  overflow-y: auto !important;
}

.filter-option {
  padding: 12px 18px;
  font-size: 0.9rem;
  color: #444;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.filter-option:hover {
  background: #f4fafe;
}

.filter-option.active {
  background: #e1f5fe;
  color: #00aeef;
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
  border: 2px solid white;
  border-radius: 50%;
  overflow: hidden;
  transition: transform 0.2s;
}

.teacher-avatar-mini:first-child {
  margin-left: 0;
}

.teacher-avatar-mini:hover {
  transform: translateY(-3px) scale(1.1);
  z-index: 50 !important;
}

.teacher-avatar-mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.teacher-name-solo {
  font-size: 0.85rem;
  color: #1e293b;
  font-weight: 500;
}

.teacher-count-tag {
  font-size: 0.75rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 12px;
  white-space: nowrap;
}

.period-info {
  display: flex;
  flex-direction: column;
  font-size: 0.75rem;
  color: #475569;
}

.to-label {
  font-size: 0.65rem;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
}
</style>
